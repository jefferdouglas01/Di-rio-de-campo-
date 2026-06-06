/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Company, Contract, RdoRecord, AuditLog } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Carlos Abreu (Admin)',
    email: 'carlos.abreu@geral.com',
    role: 'admin',
    active: true
  },
  {
    id: 'usr-fiscal',
    name: 'Marcos Souza (Fiscal/Gerenciador)',
    email: 'marcos.souza@gerenciadora.com',
    role: 'manager',
    active: true
  },
  {
    id: 'usr-alfa',
    name: 'João Silva (Alfa Construções)',
    email: 'joao.silva@alfaconstrucoes.com.br',
    role: 'contractor',
    companyId: 'comp-alfa',
    active: true
  },
  {
    id: 'usr-beta',
    name: 'Mariana Costa (Beta Elétrica)',
    email: 'mariana.costa@betaeletrica.com.br',
    role: 'contractor',
    companyId: 'comp-beta',
    active: true
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-alfa',
    name: 'Alfa Construções e Montagens Ltda',
    cnpj: '12.345.678/0001-90',
    responsibleName: 'João Silva',
    email: 'contato@alfaconstrucoes.com.br',
    phone: '(11) 98765-4321',
    active: true
  },
  {
    id: 'comp-beta',
    name: 'Beta Serviços de Infraestrutura Elétrica',
    cnpj: '98.765.432/0001-21',
    responsibleName: 'Mariana Costa',
    email: 'contato@betaeletrica.com.br',
    phone: '(21) 99888-7766',
    active: true
  },
  {
    id: 'comp-gama',
    name: 'Gama Estruturas Caldeiraria e Pintura',
    cnpj: '54.321.098/0001-50',
    responsibleName: 'Carlos Pinheiro',
    email: 'contato@gamacalderaria.com.br',
    phone: '(31) 94444-5555',
    active: true
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'cnt-alfa-101',
    contractNumber: 'CT-2026-ALFA101',
    client: 'PetroRio S.A.',
    companyId: 'comp-alfa',
    scope: 'Montagem de estruturas de aço e tubulação de utilidades do Novo Bloco C.',
    startDate: '2026-03-01',
    endDate: '2026-09-01',
    measurementRegime: 'Horas Homem (H/H)',
    rateRule: 'R$ 95,00/hora-homem normal (Adicional H/E de 50%, Noturno 20%)',
    costCenter: 'CC-PETRO-204',
    siteLocation: 'Canteiro Leste - Refinaria Metropolitana'
  },
  {
    id: 'cnt-beta-202',
    contractNumber: 'CT-2026-BETA202',
    client: 'Vale S.A.',
    companyId: 'comp-beta',
    scope: 'Comissionamento e manutenção de painéis e subestações de média tensão.',
    startDate: '2026-04-15',
    endDate: '2026-10-15',
    measurementRegime: 'Horas Homem (H/H)',
    rateRule: 'R$ 115,00/hora-homem de engenharia elétrica (H/E de 100%, Noturno 20%)',
    costCenter: 'CC-VALE-MINA-77',
    siteLocation: 'Mina Norte - Complexo Carajás'
  },
  {
    id: 'cnt-gama-303',
    contractNumber: 'CT-2026-GAMA303',
    client: 'Usiminas',
    companyId: 'comp-gama',
    scope: 'Pintura anticorrosiva industrial das caçambas de resfriamento.',
    startDate: '2026-05-01',
    endDate: '2026-11-01',
    measurementRegime: 'Empreitada Por Preço Unitário',
    rateRule: 'Cálculo por metro quadrado pintado ou hora técnica de pintura R$ 80,00',
    costCenter: 'CC-USI-ACO-09',
    siteLocation: 'Alto Forno III - Usina Governador Valadares'
  }
];

export const INITIAL_RDOS: RdoRecord[] = [
  {
    id: 'rdo-alfa-01',
    date: '2026-06-01',
    companyId: 'comp-alfa',
    contractId: 'cnt-alfa-101',
    siteLocation: 'Canteiro Leste - Trecho Tubulações',
    responsibleName: 'João Silva',
    weather: 'sol',
    shift: 'diurno',
    activities: 'Montagem de tubulações DN 150 nos suportes do trecho T-04; Realização de traçagem de soldas e acoplamento térmico.',
    workers: [
      { id: 'w-alfa-1', name: 'Paulo Silva', role: 'Encarregado', normalHours: 8, extraHours: 2, nightHours: 0 },
      { id: 'w-alfa-2', name: 'Lucas Mendes', role: 'Soldador TIG', normalHours: 8, extraHours: 2, nightHours: 0 },
      { id: 'w-alfa-3', name: 'Julio Amorim', role: 'Caldeireiro', normalHours: 8, extraHours: 1, nightHours: 0 },
      { id: 'w-alfa-4', name: 'Wellington Gomes', role: 'Ajudante', normalHours: 8, extraHours: 0, nightHours: 0 }
    ],
    equipments: [
      { id: 'eq-alfa-1', name: 'Máquina de Solda Bambozzi 400', quantity: 2, status: 'operando' },
      { id: 'eq-alfa-2', name: 'Inclinômetro Laser Bosch', quantity: 1, status: 'operando' },
      { id: 'eq-alfa-3', name: 'Caminhão Munck 12t', quantity: 1, status: 'parado' }
    ],
    hasHseIncident: false,
    interferences: 'Nenhuma interferência externa digna de nota.',
    stoppages: 'Vento forte de 15 minutos às 14h, mas sem paralisação crítica.',
    additionalRemarks: 'Equipe super produtiva e dentro do cronograma previsto.',
    attachments: ['evidencia_soldagem_0106.jpg', 'rdo_assinado_alfa_01.pdf'],
    status: 'Aprovado'
  },
  {
    id: 'rdo-alfa-02',
    date: '2026-06-02',
    companyId: 'comp-alfa',
    contractId: 'cnt-alfa-101',
    siteLocation: 'Canteiro Leste - Trecho Elevado',
    responsibleName: 'João Silva',
    weather: 'chuva_parcial',
    shift: 'diurno',
    activities: 'Conclusão das soldas do trecho T-04. Preparação do andaime principal para o trecho vertical elevado.',
    workers: [
      { id: 'w-alfa-1', name: 'Paulo Silva', role: 'Encarregado', normalHours: 8, extraHours: 0, nightHours: 0 },
      { id: 'w-alfa-2', name: 'Lucas Mendes', role: 'Soldador TIG', normalHours: 8, extraHours: 0, nightHours: 0 },
      { id: 'w-alfa-3', name: 'Julio Amorim', role: 'Caldeireiro', normalHours: 8, extraHours: 0, nightHours: 0 },
      { id: 'w-alfa-4', name: 'Wellington Gomes', role: 'Ajudante', normalHours: 8, extraHours: 0, nightHours: 0 }
    ],
    equipments: [
      { id: 'eq-alfa-1', name: 'Máquina de Solda Bambozzi 400', quantity: 2, status: 'operando' },
      { id: 'eq-alfa-3', name: 'Caminhão Munck 12t', quantity: 1, status: 'operando' }
    ],
    hasHseIncident: false,
    interferences: 'Chuva passageira entre 10h e 11h. Forçou parada preventiva da solda a céu aberto.',
    stoppages: '1 hora de paralisação preventiva devido à chuva forte, equipe realocada para lixamento na área coberta.',
    additionalRemarks: 'Paralisação de 1h de solda anotada e informada ao fiscal.',
    attachments: ['registro_chuva_0206.png'],
    status: 'Aprovado'
  },
  {
    id: 'rdo-alfa-03',
    date: '2026-06-03',
    companyId: 'comp-alfa',
    contractId: 'cnt-alfa-101',
    siteLocation: 'Canteiro Leste - Trecho Elevado',
    responsibleName: 'João Silva',
    weather: 'sol',
    shift: 'diurno',
    activities: 'Montagem de tubos verticais do trecho T-05 com auxílio químico de caminhao Munck. Soldagem iniciada.',
    workers: [
      { id: 'w-alfa-1', name: 'Paulo Silva', role: 'Encarregado', normalHours: 8, extraHours: 3, nightHours: 0 },
      { id: 'w-alfa-2', name: 'Lucas Mendes', role: 'Soldador TIG', normalHours: 8, extraHours: 2, nightHours: 0 },
      { id: 'w-alfa-3', name: 'Julio Amorim', role: 'Caldeireiro', normalHours: 8, extraHours: 2, nightHours: 0 },
      { id: 'w-alfa-4', name: 'Wellington Gomes', role: 'Ajudante', normalHours: 8, extraHours: 2, nightHours: 0 }
    ],
    equipments: [
      { id: 'eq-alfa-1', name: 'Máquina de Solda Bambozzi 400', quantity: 2, status: 'operando' },
      { id: 'eq-alfa-3', name: 'Caminhão Munck 12t', quantity: 1, status: 'operando' }
    ],
    hasHseIncident: false,
    interferences: 'Demora na liberação de PT (permissão de trabalho em altura) pela equipe de fiscalização (atraso de 40min).',
    stoppages: '40 minutos aguardando liberação formal de segurança de altura.',
    additionalRemarks: 'Solicitamos agilidade no processo de liberação para evitar perdas extras no faturamento diário.',
    attachments: ['pt_altura_0306.pdf'],
    status: 'Enviado' // Pending Manager review
  },
  {
    id: 'rdo-alfa-04',
    date: '2026-06-04',
    companyId: 'comp-alfa',
    contractId: 'cnt-alfa-101',
    siteLocation: 'Canteiro Leste - Trecho Elevado',
    responsibleName: 'João Silva',
    weather: 'nublado',
    shift: 'diurno',
    activities: 'Continuidade de lixamento térmico e ajuste de sapatas metálicas no trecho.',
    workers: [
      { id: 'w-alfa-1', name: 'Paulo Silva', role: 'Encarregado', normalHours: 8, extraHours: 0, nightHours: 0 },
      { id: 'w-alfa-2', name: 'Lucas Mendes', role: 'Soldador TIG', normalHours: 8, extraHours: 0, nightHours: 0 },
      { id: 'w-alfa-3', name: 'Julio Amorim', role: 'Caldeireiro', normalHours: 8, extraHours: 0, nightHours: 0 }
    ],
    equipments: [
      { id: 'eq-alfa-1', name: 'Máquina de Solda Bambozzi 400', quantity: 1, status: 'operando' }
    ],
    hasHseIncident: false,
    interferences: 'Divergência de desenhos técnicos disponibilizados no Drive eletrônico.',
    stoppages: 'Nossos soldadores pararam por 2 horas para esclarecer dúvidas com a engenharia de tubulações.',
    additionalRemarks: 'Necessário ajuste no número de horas executadas para não glosar.',
    attachments: [],
    status: 'Correção solicitada' // Returned to the Contractor
  },
  {
    id: 'rdo-alfa-05',
    date: '2026-06-05',
    companyId: 'comp-alfa',
    contractId: 'cnt-alfa-101',
    siteLocation: 'Canteiro Leste - Almoxarifado',
    responsibleName: 'João Silva',
    weather: 'sol',
    shift: 'diurno',
    activities: 'Recebimento de tubulares de aço carbono do lote PT-3. Pintura preliminar contra oxidação.',
    workers: [
      { id: 'w-alfa-1', name: 'Paulo Silva', role: 'Encarregado', normalHours: 8, extraHours: 0, nightHours: 0 },
      { id: 'w-alfa-3', name: 'Julio Amorim', role: 'Caldeireiro', normalHours: 8, extraHours: 0, nightHours: 0 }
    ],
    equipments: [],
    hasHseIncident: false,
    additionalRemarks: 'Digitação inicial para fins de rascunho.',
    attachments: [],
    status: 'Rascunho' // In draft, only contractor sees/edits
  },
  {
    id: 'rdo-beta-01',
    date: '2026-06-01',
    companyId: 'comp-beta',
    contractId: 'cnt-beta-202',
    siteLocation: 'Subestação Principal - SP-02',
    responsibleName: 'Mariana Costa',
    weather: 'sol',
    shift: 'diurno',
    activities: 'Montagem de canaletas de proteção elétrica subterrâneas. Lançamento de cabo grosso de cobre 240mm² para terra de sinal.',
    workers: [
      { id: 'w-beta-1', name: 'Rodrigo Almeida', role: 'Eletricista Ind.', normalHours: 8, extraHours: 2, nightHours: 0 },
      { id: 'w-beta-2', name: 'Renato Sales', role: 'Eletricista Montador', normalHours: 8, extraHours: 2, nightHours: 0 },
      { id: 'w-beta-3', name: 'Ana Paula Santos', role: 'Técnico de Elétrica', normalHours: 8, extraHours: 1, nightHours: 0 }
    ],
    equipments: [
      { id: 'eq-beta-1', name: 'Esticador Pneumático de Cabos', quantity: 1, status: 'operando' },
      { id: 'eq-beta-2', name: 'Alicate Prensa Hidráulica Burndy', quantity: 1, status: 'operando' }
    ],
    hasHseIncident: false,
    interferences: 'Nenhuma interferência.',
    stoppages: '',
    additionalRemarks: 'Serviço executado com absoluto sucesso técnico.',
    attachments: ['painel_subestacao_01.jpg'],
    status: 'Aprovado'
  },
  {
    id: 'rdo-beta-02',
    date: '2026-06-02',
    companyId: 'comp-beta',
    contractId: 'cnt-beta-202',
    siteLocation: 'Subestação Principal - Painéis BT-05',
    responsibleName: 'Mariana Costa',
    weather: 'chuva_parcial',
    shift: 'noturno', // Night shift!
    activities: 'Conexão e fixação de barramentos de cobre principais nos cubículos de proteção dos painéis BT-05.',
    workers: [
      { id: 'w-beta-1', name: 'Rodrigo Almeida', role: 'Eletricista Ind.', normalHours: 8, extraHours: 0, nightHours: 8 },
      { id: 'w-beta-2', name: 'Renato Sales', role: 'Eletricista Montador', normalHours: 8, extraHours: 0, nightHours: 8 },
      { id: 'w-beta-3', name: 'Ana Paula Santos', role: 'Técnico de Elétrica', normalHours: 8, extraHours: 0, nightHours: 8 }
    ],
    equipments: [
      { id: 'eq-beta-2', name: 'Alicate Prensa Hidráulica Burndy', quantity: 1, status: 'operando' }
    ],
    hasHseIncident: false,
    interferences: 'Espaço confinado muito quente devido a problemas no ar condicionado da subestação.',
    stoppages: 'Paradas de 10 min a cada hora para hidratação preventiva obrigatória da equipe.',
    additionalRemarks: 'Informado à fiscalização para conserto rápido do compressor térmico de ar condicionado.',
    attachments: ['evidencia_barramento_0206.png'],
    status: 'Enviado' // Sent, waiting manager review
  },
  {
    id: 'rdo-beta-03',
    date: '2026-06-03',
    companyId: 'comp-beta',
    contractId: 'cnt-beta-202',
    siteLocation: 'Subestação Principal - SP-02',
    responsibleName: 'Mariana Costa',
    weather: 'chuva_total',
    shift: 'diurno',
    activities: 'Tentativa de continuidade do lançamento de cabos externos.',
    workers: [
      { id: 'w-beta-1', name: 'Rodrigo Almeida', role: 'Eletricista Ind.', normalHours: 4, extraHours: 0, nightHours: 0 },
      { id: 'w-beta-2', name: 'Renato Sales', role: 'Eletricista Montador', normalHours: 4, extraHours: 0, nightHours: 0 },
      { id: 'w-beta-3', name: 'Ana Paula Santos', role: 'Técnico de Elétrica', normalHours: 4, extraHours: 0, nightHours: 0 }
    ],
    equipments: [],
    hasHseIncident: true, // Safety event!
    hseDetails: 'Ajudante terceirizado da contratante principal escorregou em rampa molhada devido à lama. Atendimento de ambulância de plantão para primeiros socorros por via preventiva. Colaborador liberado na sequência sem fraturas.',
    interferences: 'Chuva torrencial ao longo de todo o dia impediu o uso de eletricidade externa de força.',
    stoppages: 'Todo o serviço externo foi bloqueado pela gerência de SSMA. Forçaram paralisação total.',
    additionalRemarks: 'Relatório de SSMA enviado em separado para o setor médico.',
    attachments: ['incidente_ocorrencia_0306.pdf'],
    status: 'Reprovado' // Disapproved due to unauthorized hours on safety lockout
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-01',
    rdoId: 'rdo-alfa-01',
    userId: 'usr-fiscal',
    userName: 'Marcos Souza (Fiscal)',
    userRole: 'manager',
    timestamp: '2026-06-02T10:15:30Z',
    changes: [],
    justification: 'RDO aprovado de forma direta após conferência detalhada do efetivo de 4 profissionais e faturamento regular.',
    previousStatus: 'Enviado',
    newStatus: 'Aprovado'
  },
  {
    id: 'aud-02',
    rdoId: 'rdo-alfa-04',
    userId: 'usr-fiscal',
    userName: 'Marcos Souza (Fiscal)',
    userRole: 'manager',
    timestamp: '2026-06-05T09:00:20Z',
    changes: [
      { field: 'status', oldValue: 'Enviado', newValue: 'Correção solicitada' }
    ],
    justification: 'Solicito a correção e preenchimento dos profissionais. Você registrou apenas 3 trabalhadores no RDO de ontem, mas a lista de presença diz que eram 4. Além disso, favor detalhar melhor a paralisação de 2h comentada nas interferências.',
    previousStatus: 'Enviado',
    newStatus: 'Correção solicitada'
  },
  {
    id: 'aud-03',
    rdoId: 'rdo-beta-03',
    userId: 'usr-fiscal',
    userName: 'Marcos Souza (Fiscal)',
    userRole: 'manager',
    timestamp: '2026-06-04T16:30:11Z',
    changes: [
      { field: 'status', oldValue: 'Enviado', newValue: 'Reprovado' }
    ],
    justification: 'Reprovado devido a horas cobradas sem correspondente na catraca física de entrada do canteiro. A segurança bloqueou a entrada devido à forte chuva com raios.',
    previousStatus: 'Enviado',
    newStatus: 'Reprovado'
  }
];
