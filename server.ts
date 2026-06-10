import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gemini Client safely on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timeInSec: Date.now() });
});

// API endpoint 1: RDO Intelligent Fill / parser
app.post("/api/gemini/parse-rdo", async (req, res) => {
  try {
    const { text, currentDate } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: "O texto para preenchimento inteligente é obrigatório." });
      return;
    }

    const prompt = `Você é um engenheiro de campo e auditor assistente especialista em obras civis, montagens industriais e auditoria de contratos. 
Seu trabalho é ler um relato informal (em texto corrido ou transcrito de ditado por áudio dos trabalhadores no final da jornada) e estruturar as informações para preenchimento automático de um diário oficial de obras (RDO).

Relato enviado pelo usuário:
"${text}"

Data Atual de Referência do Lançamento: ${currentDate || new Date().toISOString().split('T')[0]}

Siga estritamente as regras de conversão para os seguintes campos de dados:
- weather: Identifique o clima predominante descrito. Deve ser estritamente uma destas opções: 'sol' (tempo limpo, firme, ensolarado), 'nublado' (tempo fechado, nublado), 'chuva_parcial' (choveu mas permitiu trabalhar com cuidados), ou 'chuva_total' (impediu quase totalmente as atividades externas). Escolha o melhor palpite corporativo com base no contexto.
- shift: Deve ser 'diurno' (trabalho diurno ou horário comercial padrão) ou 'noturno' (se mencionou noite, madrugada).
- activities: Formule uma descrição técnica, formal, elegante e resumida das tarefas realizadas no dia (ex: 'Montagem de flanges na linha de água fria, soldagem estrutural e posicionamento de tubos no trecho oeste'). Evite coloquialismos do relato informal, use linguagem profissional de relatórios de engenharia em português.
- workers: Identifique as pessoas citadas e suas respectivas funções. Se o relato e cargos forem vagos, tente estruturar de maneira organizada. 
  - name: Nome do colaborador (ex: 'Paulo Silva')
  - role: Cargo/Função correspondente (ex: 'Encarregado', 'Eletricista', 'Soldador', 'Ajudante Geral')
  - normalHours: Se não houver horas explícitas, assuma 8 horas normais como valor padrão razoável de um dia útil comercial.
  - extraHours: Se mencione horas extras operadas (ex: se trabalhou a mais, dobrou turno, ficou até mais tarde), estime o valor do acréscimo de hora extra.
  - nightHours: Se operou em adicional noturno, informe o valor correspondente (se for do turno da noite, por exemplo).
- equipments: Identifique os maquinários pesados ou ferramentas específicas mencionadas (ex: 'Caminhão Munck', 'Gerador', 'Máquina de Solda', 'Escavadeira'). Atribua uma quantidade adequada e configure o status para 'operando' ou 'parado' com base no texto.
- hasHseIncident: Deve ser true se houver qualquer acidente, quase acidente, queda, machucado, incidente de segurança com trabalhadores ou equipamentos de SSMA citado no texto. Se tudo correu bem, retorne false.
- hseDetails: Explicação completa e técnica da ocorrência de segurança, caso hasHseIncident for true. Se for false, retorne vazio ou undefined.
- interferences: Qualquer interferência externa citada que impactou o andamento (atraso de liberação de área por parte do cliente, atraso na chegada de projeto de engenharia, falta de energia geral do site de incumbência da contratante, etc.).
- stoppages: Detalhes específicos de paralisações gerais de trabalho (trabalhos suspensos por chuva torrencial, máquina essencial quebrada interrompendo a frente de campo, etc.).
- additionalRemarks: Qualquer observação geral ou comentário adicional de relevância operacional anotada que não caiba nos campos anteriores.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather: {
              type: Type.STRING,
              description: "Clima predominante: 'sol', 'nublado', 'chuva_parcial' ou 'chuva_total'."
            },
            shift: {
              type: Type.STRING,
              description: "Turno de serviço: 'diurno' ou 'noturno'."
            },
            activities: {
              type: Type.STRING,
              description: "Transcrição técnica, formalizada e elegante com descrição das atividades reais em português."
            },
            workers: {
              type: Type.ARRAY,
              description: "Equipe de trabalhadores identificada no texto.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome real ou estimado do trabalhador" },
                  role: { type: Type.STRING, description: "Cargo ou especialidade técnica (ex: Caldeireiro, Eletricista, Encarregado)" },
                  normalHours: { type: Type.NUMBER, description: "Horas trabalhadas no regime normal (default 8)" },
                  extraHours: { type: Type.NUMBER, description: "Horas de acréscimo extra trabalhadas" },
                  nightHours: { type: Type.NUMBER, description: "Horas de adicional noturno trabalhadas" }
                },
                required: ["name", "role", "normalHours", "extraHours", "nightHours"]
              }
            },
            equipments: {
              type: Type.ARRAY,
              description: "Equipamentos identificados na jornada de trabalho.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome do equipamento/máquina" },
                  quantity: { type: Type.NUMBER, description: "Quantidade" },
                  status: { type: Type.STRING, description: "Status de uso: 'operando' ou 'parado'" }
                },
                required: ["name", "quantity", "status"]
              }
            },
            hasHseIncident: {
              type: Type.BOOLEAN,
              description: "Define se ocorreu incidente de segurança (SSMA/HSE) na jornada."
            },
            hseDetails: {
              type: Type.STRING,
              description: "Resumo da ocorrência de segurança, caso tenha ocorrido."
            },
            interferences: {
              type: Type.STRING,
              description: "Relato de intercorrências ou interferências externas que causaram ociosidade técnica."
            },
            stoppages: {
              type: Type.STRING,
              description: "Paralisações de frente de serviços ocorridas hoje."
            },
            additionalRemarks: {
              type: Type.STRING,
              description: "Qualquer comentário adicional relevante do diário."
            }
          },
          required: ["weather", "shift", "activities", "hasHseIncident", "workers", "equipments"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ result: parsedData });
  } catch (err: any) {
    console.error("Erro no Parse RDO por IA:", err);
    res.status(500).json({ error: err.message || "Erro interno ao processar a inteligência de campo." });
  }
});

// API endpoint 2: AI Weekly/Monthly Consolidation Generator
app.post("/api/gemini/consolidate-report", async (req, res) => {
  try {
    const { rdos, contract, company, periodText } = req.body;
    
    if (!rdos || rdos.length === 0) {
      res.status(400).json({ error: "Nenhum boletim RDO foi fornecido no período para consolidação." });
      return;
    }

    const narrativeRdos = rdos.map((r: any) => ({
      date: r.date,
      weather: r.weather,
      shift: r.shift,
      activities: r.activities,
      workersCount: r.workers?.length || 0,
      totalHours: r.workers?.reduce((acc: number, w: any) => acc + (w.normalHours||0) + (w.extraHours||0) + (w.nightHours||0), 0) || 0,
      equipments: r.equipments?.map((e: any) => `${e.name} (Qtd: ${e.quantity}, ${e.status})`).join(', ') || 'Nenhum',
      hasHseIncident: r.hasHseIncident,
      hseDetails: r.hseDetails || '',
      interferences: r.interferences || '',
      stoppages: r.stoppages || '',
      additionalRemarks: r.additionalRemarks || ''
    }));

    const prompt = `Você é um Diretor de Contratos Sênior e Auditor de Engenharia de Construção e Montagens Industriais. Você recebeu a coleção de folhas diárias de diários de obras (RDOs) para consolidá-las em um relatório técnico-executivo abrangente.

Gere um Relatório de Consolidação Executiva em formato Markdown de alto padrão visual, com redação séria, profissional e analítica em português.

Informações Contratuais:
- Número do Contrato: ${contract?.contractNumber || 'Não especificado'}
- Tomador/Cliente: ${contract?.client || 'Não especificado'}
- Empresa Contratada (Executante): ${company?.name || 'Não especificado'}
- Escopo Contratual Geral: ${contract?.scope || 'Prestação de serviços de engenharia e campo.'}
- Período de Consignação Operacional: ${periodText || 'Definido no período dos RDOs enviados.'}
- Quantidade total de RDOs computados no período: ${rdos.length}

Os boletins diários de obra (RDOs) coletados no período estão estruturados abaixo em JSON:
${JSON.stringify(narrativeRdos, null, 2)}

O relatório gerado em Markdown deve conter estritamente as seguintes seções estruturadas e preenchidas detalhadamente com dados reais somados por você:

1. **📊 SUMÁRIO EXECUTIVO DE EVOLUÇÃO OPERACIONAL**
   - Apresente uma análise corporativa e qualitativa detalhada sobre o progresso geral das frentes operacionais sob este contrato durante o período sob análise.
   - Destaque quais foram as principais frentes atacadas e os marcos significativos de progresso técnico conquistados de forma agrupada.
   - Discorra sobre a consistência diária das entregas de acordo com a sequência cronológica dos eventos reportados.

2. **👷🏼 ANÁLISE DE PRODUTIVIDADE & ACÚMULO DE HORAS HOMEM (H/H)**
   - Apresente os cálculos e as somas matemáticas das horas totais trabalhadas sob o período. Informe:
     * Total acumulado de horas normais trabalhadas.
     * Total acumulado de horas extras registradas pelos colaboradores.
     * Total acumulado de adicionais noturnos.
     * Soma geral final consolidada de Horas Homem (H/H) despendidas no período.
   - Comente sobre o ritmo operacional e o contingente consolidado (se a equipe foi mantida estável ou variou e se o número de horas extras está dentro da legalidade/normalidade de engenharia).
   - Monte uma tabela Markdown clara e formatada listando as funções mais citadas no efetivo, demonstrando a distribuição dos papéis corporativos de campo (ex: Eletricistas, Caldeireiros, Soldadores, Auxiliares) e agregando comentários de dimensionamento.

3. **🌦️ CLIMA, INTERFERÊNCIAS & IMPACTO DE OCIOSIDADE**
   - Compile as condições atmosféricas do tempo do período: informe a quantidade exata de dias computados com Clima Ensolarado ("sol"), Nublado ("nublado"), Chuva Parcial ("chuva_parcial") e Chuva Total ("chuva_total").
   - Detalhe todos os relatos de interferências reportados no período (atrasos de liberação de áreas por parte do cliente, gargalos de materiais, indefinições de projetos técnicos).
   - Analise de forma técnica todas as paralisações gerais anotadas (ex: suspenso trabalhos por chuvas intensas ou por falha de suprimento de força de inteira incumbência do cliente) e estime a relevância e o percentual estimado de ociosidade técnica gerada no cronograma físico-financeiro do período por interrupção de terceiros.

4. **🚨 SEGURANÇA, SAÚDE E MEIO AMBIENTE (SSMA / HSE)**
   - Resuma as ocorrências de segurança ou saúde ocupacional reportadas no período analisado.
   - Caso não tenham ocorrido incidentes, redija um parecer elogioso técnico de conformidade preventiva elogiando o esforço em manter as metas contratuais e saúde da força de trabalho ilesas.
   - Caso tenham ocorrido incidentes no período (baseado nos RDOs com hasHseIncident: true), agrupe-os cronologicamente, detalhando as ocorrências técnicas citadas nos diários e forneça as recomendações imediatas de segurança corporativa ou as ações corretivas tomadas.

5. **💡 DIRETRIZES TÉCNICAS E PARECER DE PLANEJAMENTO CRÍTICO**
   - Apresente recomendações formais estratégicas e operacionais de engenharia de planejamento para o próximo ciclo de trabalho.
   - Baseando-se nas falhas relatadas (por exemplo, intermitências climáticas de chuvas parciais/totais ou ociosidades por interferências materiais), forneça 3 ou mais diretrizes práticas para mitigar atrasos de cronograma, otimizar a gerência de equipes ou reprogramar tarefas do caminho crítico de execução.

Use termos puramente técnicos, objetivos, com formatação organizada baseada em títulos elegantes, espaçamento de tabelas virtuais corretas e adicione negritos em dados chaves para valorizar a apresentação do diário executivo.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ report: response.text });
  } catch (err: any) {
    console.error("Erro na Consolidação por IA:", err);
    res.status(500).json({ error: err.message || "Erro interno ao gerar o relatório consolidado de inteligência." });
  }
});

// Start dev or production client hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mode: Development. Run Express server and mount Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // Mode: Production. Serve built static assets from dist folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Static file server running pointing to dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
