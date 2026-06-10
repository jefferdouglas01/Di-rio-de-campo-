/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Building2, 
  Landmark, 
  Clock, 
  ShieldAlert, 
  History, 
  ClipboardCheck, 
  Download, 
  Search, 
  FileCheck,
  Calendar,
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { RdoRecord, Company, Contract, User, AuditLog } from '../types';
import { getRdoSequentialCode } from '../utils';

interface ReportsViewProps {
  rdos: RdoRecord[];
  companies: Company[];
  contracts: Contract[];
  auditLogs: AuditLog[];
  currentUser: User;
}

type ReportTemplate =
  | 'individual_rdo'
  | 'hours_company'
  | 'hours_contract'
  | 'pending_reports'
  | 'hse_incidents'
  | 'audit_history'
  | 'ai_consolidation';

export function ReportsView({ rdos, companies, contracts, auditLogs, currentUser }: ReportsViewProps) {
  
  const [activeTemplate, setActiveTemplate] = useState<ReportTemplate>('individual_rdo');
  
  // Specific report selection selectors
  const [selectedRdoId, setSelectedRdoId] = useState<string>(rdos[0]?.id || '');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedContractId, setSelectedContractId] = useState<string>('all');

  // AI Period Consolidation States
  const [selectedAiContractId, setSelectedAiContractId] = useState<string>('all');
  const [selectedAiCompanyId, setSelectedAiCompanyId] = useState<string>('all');
  const [consolidationStartDate, setConsolidationStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // 30 dias atrás por padrão
    return d.toISOString().split('T')[0];
  });
  const [consolidationEndDate, setConsolidationEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isConsolidating, setIsConsolidating] = useState<boolean>(false);
  const [consolidationResult, setConsolidationResult] = useState<string>('');

  // Auto-select first RDO ID if it becomes available later
  useEffect(() => {
    if (rdos.length > 0 && !selectedRdoId) {
      setSelectedRdoId(rdos[0].id);
    }
  }, [rdos, selectedRdoId]);

  // Trigger export alert with signatures metadata
  const triggerExport = (format: 'PDF' | 'Excel') => {
    let signatureDetails = "";
    if (activeTemplate === 'individual_rdo' && activeRdoSheet) {
      const executantName = activeRdoSheet.executantSignature || "Não assinado digitalmente (Linha de assinatura pontilhada impressa)";
      const approverName = activeRdoSheet.approverSignature || "Não assinado digitalmente (Linha de assinatura pontilhada impressa)";
      signatureDetails = `\n\nAssinaturas Chanceladas no Relatório:\n✍ Contratada (Executante): ${executantName}\n✍ Contratante (Aprovador): ${approverName}`;
    }
    alert(`[Módulo de Exportação RDO]\nRelatório individual exportado com sucesso em formato ${format}!${signatureDetails}\n\nO documento possui validade fiscal, de conformidade de h/h de faturamento e registro de ocorrências operacionais.`);
  };

  // 1. Calculations for Hours by Company
  const companyReportRows = companies.map(c => {
    const compRdos = rdos.filter(r => r.companyId === c.id && (r.status === 'Aprovado' || r.status === 'Medido' || r.status === 'Bloqueado para medição'));
    let normal = 0, extra = 0, night = 0, total = 0;
    compRdos.forEach(r => {
      r.workers.forEach(w => {
        normal += w.normalHours;
        extra += w.extraHours;
        night += w.nightHours;
      });
    });
    total = normal + extra + night;
    return { name: c.name, rdosCount: compRdos.length, normal, extra, night, total };
  }).filter(row => selectedCompanyId === 'all' || row.name === companies.find(c => c.id === selectedCompanyId)?.name);

  // 2. Calculations for Hours by Contract
  const contractReportRows = contracts.map(con => {
    const conRdos = rdos.filter(r => r.contractId === con.id && (r.status === 'Aprovado' || r.status === 'Medido' || r.status === 'Bloqueado para medição'));
    const compName = companies.find(c => c.id === con.companyId)?.name || 'Empresa';
    let normal = 0, extra = 0, night = 0, total = 0;
    conRdos.forEach(r => {
      r.workers.forEach(w => {
        normal += w.normalHours;
        extra += w.extraHours;
        night += w.nightHours;
      });
    });
    total = normal + extra + night;
    return {
      number: con.contractNumber,
      client: con.client,
      company: compName,
      normal,
      extra,
      night,
      total,
      rdosCount: conRdos.length
    };
  }).filter(row => selectedContractId === 'all' || row.number === contracts.find(c => c.id === selectedContractId)?.contractNumber);

  // 3. Pending logs list
  const pendingRdosList = rdos.filter(r => {
    const basicPending = r.status === 'Enviado' || r.status === 'Corrigido' || r.status === 'Rascunho' || r.status === 'Correção solicitada';
    const compMatch = selectedCompanyId === 'all' || r.companyId === selectedCompanyId;
    return basicPending && compMatch;
  });

  // 4. HSE incidents list
  const hseIncidentsRdos = rdos.filter(r => r.hasHseIncident && (selectedCompanyId === 'all' || r.companyId === selectedCompanyId));

  // Determine specific RDO for Individual Sheet rendering
  const activeRdoSheet = rdos.find(r => r.id === selectedRdoId);
  const sheetCompany = companies.find(c => c.id === activeRdoSheet?.companyId);
  const sheetContract = contracts.find(cnt => cnt.id === activeRdoSheet?.contractId);

  // Gemini consolidation backend triggers
  const handleGenerateAiConsolidation = async () => {
    const filtered = rdos.filter(r => {
      const dateInPeriod = r.date >= consolidationStartDate && r.date <= consolidationEndDate;
      const matchContract = selectedAiContractId === 'all' || r.contractId === selectedAiContractId;
      const matchCompany = selectedAiCompanyId === 'all' || r.companyId === selectedAiCompanyId;
      return dateInPeriod && matchContract && matchCompany;
    });

    if (filtered.length === 0) {
      alert("Nenhum RDO foi encontrado no período e filtros de empresa/contrato fornecidos.");
      return;
    }

    setIsConsolidating(true);
    setConsolidationResult('');

    try {
      const contractObj = contracts.find(c => c.id === selectedAiContractId) || null;
      const companyObj = companies.find(c => c.id === selectedAiCompanyId) || null;
      
      const partsStart = consolidationStartDate.split("-");
      const partsEnd = consolidationEndDate.split("-");
      const periodText = `De ${partsStart[2]}/${partsStart[1]}/${partsStart[0]} até ${partsEnd[2]}/${partsEnd[1]}/${partsEnd[0]}`;

      const response = await fetch("/api/gemini/consolidate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rdos: filtered,
          contract: contractObj,
          company: companyObj,
          periodText
        })
      });

      if (!response.ok) {
        let errMsg = "Falha ao comunicar com o processador de relatórios por IA.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = `Erro no Servidor IA: ${errData.error}`;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.report) {
        setConsolidationResult(data.report);
      } else {
        throw new Error("Não foi gerado conteúdo consolidado.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao consolidar por IA: ${err.message || 'Erro inesperado'}`);
    } finally {
      setIsConsolidating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="reports-main-view">
      
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-bold text-gray-900 tracking-tight">Centro de Inteligência e Relatórios</h2>
          <p className="text-xs text-gray-500 mt-1">Extraia relatórios individuais, consolidados de HH, checklists de pendências operacionais e histórico completo de auditorias.</p>
        </div>

        {/* Global actions */}
        <div className="flex gap-2 text-xs font-semibold">
          <button
            onClick={() => triggerExport('PDF')}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-red-650" />
            <span>Baixar em PDF</span>
          </button>
          <button
            onClick={() => triggerExport('Excel')}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-green-600" />
            <span>Planilha Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left selector rails template - 3 cols */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-2.5 pb-2 border-b border-gray-50 mb-2">
            Modelos Disponíveis
          </span>

          <button
            onClick={() => setActiveTemplate('individual_rdo')}
            className={`w-full flex items-center gap-2.5 text-xs text-left font-bold p-3 rounded-lg transition-colors cursor-pointer ${
              activeTemplate === 'individual_rdo' ? 'bg-blue-50 text-blue-800' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            <span>Ficha de RDO Individual</span>
          </button>

          <button
            onClick={() => setActiveTemplate('hours_company')}
            className={`w-full flex items-center gap-2.5 text-xs text-left font-bold p-3 rounded-lg transition-colors cursor-pointer ${
              activeTemplate === 'hours_company' ? 'bg-blue-50 text-blue-800' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-4.5 h-4.5" />
            <span>Consolidado por Empresa</span>
          </button>

          <button
            onClick={() => setActiveTemplate('hours_contract')}
            className={`w-full flex items-center gap-2.5 text-xs text-left font-bold p-3 rounded-lg transition-colors cursor-pointer ${
              activeTemplate === 'hours_contract' ? 'bg-blue-50 text-blue-800' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Landmark className="w-4.5 h-4.5" />
            <span>Consolidado por Contrato</span>
          </button>

          <button
            onClick={() => setActiveTemplate('pending_reports')}
            className={`w-full flex items-center gap-2.5 text-xs text-left font-bold p-3 rounded-lg transition-colors cursor-pointer ${
              activeTemplate === 'pending_reports' ? 'bg-blue-50 text-blue-800' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4.5 h-4.5" />
            <span>Relatório de Pendências</span>
          </button>

          <button
            onClick={() => setActiveTemplate('hse_incidents')}
            className={`w-full flex items-center gap-2.5 text-xs text-left font-bold p-3 rounded-lg transition-colors cursor-pointer ${
              activeTemplate === 'hse_incidents' ? 'bg-blue-50 text-blue-800' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <ShieldAlert className="w-4.5 h-4.5 text-red-650" />
            <span>Histórico Ocorrências SSMA</span>
          </button>

          <button
            onClick={() => setActiveTemplate('audit_history')}
            className={`w-full flex items-center gap-2.5 text-xs text-left font-bold p-3 rounded-lg transition-colors cursor-pointer ${
              activeTemplate === 'audit_history' ? 'bg-blue-50 text-blue-800' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <History className="w-4.5 h-4.5" />
            <span>Histórico de Auditorias</span>
          </button>

          <button
            onClick={() => setActiveTemplate('ai_consolidation')}
            className={`w-full flex items-center gap-2.5 text-xs text-left font-bold p-3 rounded-lg transition-colors cursor-pointer ${
              activeTemplate === 'ai_consolidation' ? 'bg-indigo-100/60 text-indigo-950 border border-indigo-200' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
            <span className="font-bold">Consolidação por IA ✨</span>
          </button>
        </div>

        {/* Right Active template workspace - 9 cols */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Template 1: RDO Individual */}
          {activeTemplate === 'individual_rdo' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6">
              
              {/* Select specific sheet to inspect */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-sans font-bold text-gray-900 text-sm">Visualizador de RDO Individual</h3>
                  <p className="text-[11px] text-gray-400">Escolha a folha diária para focar impressão / leitura.</p>
                </div>
                
                <select
                  value={selectedRdoId}
                  onChange={(e) => setSelectedRdoId(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded text-xs p-2 shrink-0 font-mono font-bold"
                >
                  {rdos.map(r => {
                    const compName = companies.find(c => c.id === r.companyId)?.name || 'Empresa';
                    return (
                      <option key={r.id} value={r.id}>
                        {getRdoSequentialCode(r, rdos)} - {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')} - {compName} ({r.workers.length} colab.)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* RDO Certificate rendering */}
              {activeRdoSheet ? (
                <div className="border border-gray-200 rounded-lg p-6 bg-slate-50/20 font-sans space-y-6 relative mt-4">
                  {/* Watermark badge standard */}
                  <span className="absolute right-6 top-6 px-3 py-1 bg-green-50 border border-green-150 rounded text-[11px] font-bold uppercase text-green-700">
                    Aprovado Digitalmente
                  </span>

                  <div className="flex flex-col md:flex-row justify-between border-b pb-4 border-gray-150">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-gray-900 font-sans">REGISTRO DIÁRIO DE ATIVIDADES</h4>
                      <p className="text-[11px] font-mono text-gray-400">RDO ID ref: {getRdoSequentialCode(activeRdoSheet, rdos)}</p>
                    </div>
                    <div className="text-right text-xs mt-3 md:mt-0 font-mono text-gray-600">
                      <span>Período Ativo: {new Date(activeRdoSheet.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Identification and general */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block font-bold">Empresa Executante (Contratada)</span>
                      <span className="font-bold text-gray-800 mt-0.5 block text-xs">{sheetCompany?.name}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">CNPJ: {sheetCompany?.cnpj}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold">Contrato de Referência / Cliente</span>
                      <span className="font-bold text-slate-800 mt-0.5 block text-xs">{sheetContract?.contractNumber}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Tomador: {sheetContract?.client}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block">Frente de Serviço</span>
                      <span className="font-bold text-gray-800 mt-0.5 block">{activeRdoSheet.siteLocation}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Jornada / Turno</span>
                      <span className="font-bold text-gray-800 mt-0.5 block uppercase">{activeRdoSheet.shift}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Clima no dia</span>
                      <span className="font-bold text-amber-700 mt-0.5 block capitalize">{activeRdoSheet.weather}</span>
                    </div>
                  </div>

                  {/* Summary tasks description */}
                  <div className="border-t pt-4 border-gray-100 text-xs">
                    <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px] pb-1.5">Boletim de Atividades Executadas</span>
                    <p className="p-3 bg-white border border-gray-150 text-gray-800 font-semibold font-sans rounded-md leading-relaxed whitespace-pre-line text-xs">
                      {activeRdoSheet.activities}
                    </p>
                  </div>

                  {/* Listing staff */}
                  <div className="border-t pt-4 border-gray-100 text-xs">
                    <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px] pb-2">Relação Nominativa de Horas Apontadas</span>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-[9px] text-gray-400 font-bold uppercase">
                          <th className="py-1">Nome Completo</th>
                          <th className="py-1">Cargo / Função</th>
                          <th className="py-1 text-center">Normais</th>
                          <th className="py-1 text-center">Extras</th>
                          <th className="py-1 text-center">Noturnas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeRdoSheet.workers.map((w, idx) => (
                          <tr key={idx} className="text-gray-700">
                            <td className="py-1.5 font-bold text-xs">{w.name}</td>
                            <td className="py-1.5 text-gray-500">{w.role}</td>
                            <td className="py-1.5 text-center font-mono">{w.normalHours}h</td>
                            <td className="py-1.5 text-center font-mono font-bold text-amber-600">{w.extraHours}h</td>
                            <td className="py-1.5 text-center font-mono font-bold text-purple-600">{w.nightHours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* SSMA checks */}
                  <div className="border-t pt-3 pb-3 border-gray-150 flex flex-wrap justify-between items-center text-[11px] text-gray-600">
                    <div>
                      <span>Registros HSE / SSMA:</span>
                      <span className={`ml-1.5 px-2 py-0.5 rounded-sm font-bold text-[10px] uppercase ${activeRdoSheet.hasHseIncident ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {activeRdoSheet.hasHseIncident ? 'Ocorrência Ativa' : 'Sem Danos / Incidentes'}
                      </span>
                    </div>
                    <div>
                      <span>Responsável Lançamento: <strong>{activeRdoSheet.responsibleName}</strong></span>
                    </div>
                  </div>

                  {/* SIGNATURE FIELDS FOR PRINT AND EXPORT */}
                  <div className="border-t pt-5 mt-3 border-gray-150 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] text-gray-700 font-sans">
                    {/* Contracted/Executant block */}
                    <div className="flex flex-col justify-between border border-gray-100 bg-gray-50/40 p-3.5 rounded-lg text-center min-h-[135px]">
                      <span className="text-[9px] uppercase font-bold text-gray-405 tracking-wider">Assinatura da Contratada (Executante)</span>
                      
                      <div className="flex-1 flex flex-col justify-center my-3">
                        {activeRdoSheet.executantSignature ? (
                          <div className="space-y-0.5 animate-fadeIn">
                            <p className="font-serif italic text-sm text-indigo-700 font-bold tracking-wide">
                              {activeRdoSheet.executantSignature}
                            </p>
                            <div className="w-36 h-[1px] bg-gray-350 mx-auto" />
                            <span className="text-[10px] font-bold text-gray-650 block">{activeRdoSheet.executantSignature}</span>
                            {activeRdoSheet.executantDate && (
                              <span className="text-[9px] text-gray-400 block">Validado eletronicamente em {activeRdoSheet.executantDate}</span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1 py-1">
                            <span className="text-[10px] text-gray-400 italic">Pendente (ou Assinatura Física p/ Impresso)</span>
                            <div className="w-36 h-[1px] border-t border-dashed border-gray-300 mx-auto" />
                          </div>
                        )}
                      </div>

                      <span className="text-[9px] text-gray-400 block">Responsável Técnico / Executante</span>
                    </div>

                    {/* Client/Approver block */}
                    <div className="flex flex-col justify-between border border-gray-100 bg-gray-50/40 p-3.5 rounded-lg text-center min-h-[135px]">
                      <span className="text-[9px] uppercase font-bold text-gray-405 tracking-wider">Assinatura da Contratante (Aprovador)</span>
                      
                      <div className="flex-1 flex flex-col justify-center my-3">
                        {activeRdoSheet.approverSignature ? (
                          <div className="space-y-0.5 animate-fadeIn">
                            <p className="font-serif italic text-sm text-blue-700 font-bold tracking-wide">
                              {activeRdoSheet.approverSignature}
                            </p>
                            <div className="w-36 h-[1px] bg-gray-355 mx-auto" />
                            <span className="text-[10px] font-bold text-gray-650 block">{activeRdoSheet.approverSignature}</span>
                            {activeRdoSheet.approvalDate && (
                              <span className="text-[9px] text-gray-400 block">Aprovado eletronicamente em {activeRdoSheet.approvalDate}</span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1 py-1">
                            <span className="text-[10px] text-gray-400 italic">Pendente (ou Assinatura Física p/ Impresso)</span>
                            <div className="w-36 h-[1px] border-t border-dashed border-gray-300 mx-auto" />
                          </div>
                        )}
                      </div>

                      <span className="text-[9px] text-gray-400 block">Gestor de Contrato / Fiscal Aprovador</span>
                    </div>
                  </div>

                </div>
              ) : (
                <p className="text-center py-6 text-xs text-gray-400 italic">Crie diários de obra adicionais para verificar.</p>
              )}
            </div>
          )}

          {/* Template 2: Hours by Company */}
          {activeTemplate === 'hours_company' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-sans font-bold text-gray-900 text-sm">Faturamento de Horas Acumulado por Empresa</h3>
                <p className="text-xs text-gray-400">Relatório consolidado de horas homem aprovadas por empresa terceirizada.</p>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                      <th className="p-3">Empresa Contratada</th>
                      <th className="p-3 text-center">Fichas RDO Aprovadas</th>
                      <th className="p-3 text-center">Horas Normais</th>
                      <th className="p-3 text-center">Horas Extras</th>
                      <th className="p-3 text-center">Adic. Noturno</th>
                      <th className="p-3 text-right">Faturamento Total HH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {companyReportRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="p-3 font-bold text-gray-900">{row.name}</td>
                        <td className="p-3 text-center font-mono">{row.rdosCount} RDOs</td>
                        <td className="p-3 text-center font-mono">{row.normal}h</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600">{row.extra}h</td>
                        <td className="p-3 text-center font-mono font-bold text-purple-600">{row.night}h</td>
                        <td className="p-3 text-right font-mono font-bold text-blue-700 bg-slate-50">{row.total} H/H</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Template 3: Hours by Contract */}
          {activeTemplate === 'hours_contract' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-sans font-bold text-gray-900 text-sm">Apuração Consolidada de Horas Homem por Contrato</h3>
                <p className="text-xs text-gray-400 font-medium">Divisão analítica de efetivos aplicados por centro de custo.</p>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                      <th className="p-3">Num. Contrato / Cliente</th>
                      <th className="p-3">Empresa Responsável</th>
                      <th className="p-3 text-center">Boletins Validados</th>
                      <th className="p-3 text-center">Extras Apuradas</th>
                      <th className="p-3 text-right">Efetivo Acumulado H/H</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {contractReportRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="p-3">
                          <span className="font-bold text-gray-900 font-mono block">{row.number}</span>
                          <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Tomador: {row.client}</span>
                        </td>
                        <td className="p-3">{row.company}</td>
                        <td className="p-3 text-center font-mono">{row.rdosCount} RDOs</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600">{row.extra}h</td>
                        <td className="p-3 text-right font-mono font-black text-blue-900 bg-gray-55/40 px-2">{row.total} H/H</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Template 4: Pending reports */}
          {activeTemplate === 'pending_reports' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-sans font-bold text-gray-900 text-sm flex items-center justify-between">
                  <span>Relatório de Pendências / Inconsistências de Lançamento</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">Lista de planilhas diárias retidas em rascunho, aguardando parecer ou com correções solicitadas.</p>
              </div>

              <div className="space-y-2.5 pt-2">
                {pendingRdosList.map((r) => {
                  const comp = companies.find(c => c.id === r.companyId);
                  const isCorrectionRequested = r.status === 'Correção solicitada';
                  return (
                    <div key={r.id} className="p-3 rounded-lg border flex justify-between items-center text-xs bg-slate-50 border-slate-100 hover:border-slate-200 transition-all">
                      <div>
                        <span className="font-bold text-gray-900 block font-mono">
                          Diário: {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-gray-500 mt-0.5 block">{comp?.name}</span>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 text-[10px] font-bold rounded ${
                          isCorrectionRequested ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-1">Autor: {r.responsibleName}</span>
                      </div>
                    </div>
                  );
                })}

                {pendingRdosList.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400 italic">Nenhum RDO pendente no período. Todas as fichas encontram-se concluídas.</p>
                )}
              </div>
            </div>
          )}

          {/* Template 5: HSE / SSMA accident reviews */}
          {activeTemplate === 'hse_incidents' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-sans font-bold text-gray-900 text-sm flex items-center gap-1.5 text-red-600">
                  <ShieldAlert className="w-5 h-5 text-red-650" />
                  <span>Histórico Consolidado de Ocorrências de Segurança (SSMA)</span>
                </h3>
                <p className="text-xs text-gray-400">Linha do tempo consolidada isolando todos os incidentes/acidentes registrados pelas contratadas.</p>
              </div>

              <div className="space-y-4.5 pt-2">
                {hseIncidentsRdos.map((r, i) => {
                  const comp = companies.find(c => c.id === r.companyId);
                  return (
                    <div key={i} className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-xs">
                      <div className="flex justify-between items-start border-b pb-2 border-red-100/50 mb-2 font-semibold">
                        <div>
                          <span className="font-bold text-red-800 font-mono block">
                            Data Ocorrência: {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-gray-500 block text-[11px] mt-0.5">{comp?.name}</span>
                        </div>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full uppercase font-bold">
                          SSMA Crítico
                        </span>
                      </div>

                      <p className="text-gray-700 whitespace-pre-line leading-relaxed font-medium">
                        "{r.hseDetails || 'Relato de segurança incompleto ou omitido.'}"
                      </p>

                      <div className="mt-3 text-[10px] text-gray-400 flex justify-between items-center">
                        <span>Reportado por: {r.responsibleName}</span>
                        <span className="font-mono">RDO ID: {getRdoSequentialCode(r, rdos)}</span>
                      </div>
                    </div>
                  );
                })}

                {hseIncidentsRdos.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400 italic">Parabéns. Nenhuma ocorrência de SSMA registrada em nenhum diário até o momento.</p>
                )}
              </div>
            </div>
          )}

          {/* Template 6: Audit justifications trail journal */}
          {activeTemplate === 'audit_history' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-sans font-bold text-gray-900 text-sm">Histórico e Diário Geral de Auditorias</h3>
                <p className="text-xs text-gray-400">Rastreabilidade completa de todas as alterações, justificativas, glosas e pareceres emitidos pela fiscalização.</p>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {auditLogs.sort((a,b)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
                  <div key={log.id} className="border border-gray-100 p-3.5 rounded-lg bg-gray-50/50 text-xs">
                    <div className="flex justify-between items-center border-b pb-2 border-gray-150 mb-2 font-semibold">
                      <div>
                        <span className="font-bold text-gray-900 block">{log.userName}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-mono px-2 py-0.5 rounded">
                        {log.userRole.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1.5 leading-relaxed text-gray-600 font-medium">
                      <div>
                        <span>Despacho RDO Ref: </span>
                        <strong className="text-gray-800 font-mono">{log.rdoId}</strong>
                      </div>
                      {log.previousStatus !== log.newStatus && (
                        <div>
                          <span>Mudança Status: </span>
                          <span className="text-gray-400 mt-0.5 font-bold">{log.previousStatus} → {log.newStatus}</span>
                        </div>
                      )}
                      
                      {log.changes.length > 0 && (
                        <div className="mt-1 bg-white p-2 rounded border border-gray-100 text-[10px] font-mono leading-normal text-gray-500">
                          {log.changes.map((chg, idx) => (
                            <div key={idx}>• Campo {chg.field}: "{chg.oldValue}" foi para "{chg.newValue}"</div>
                          ))}
                        </div>
                      )}

                      <p className="mt-2.5 bg-blue-50/50 text-blue-900 border-l-2 border-blue-400 p-2 rounded text-[11px] italic font-semibold">
                        Justificativa: "{log.justification}"
                      </p>
                    </div>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400 italic">Nenhum evento de auditoria cadastrado.</p>
                )}
              </div>
            </div>
          )}

          {/* Template 7: Consolidação por IA */}
          {activeTemplate === 'ai_consolidation' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6 animate-fadeIn" id="reports-ai-consolidation">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-sans font-bold text-gray-950 text-sm">Consolidação e Relatórios Periódicos por IA</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Filtre o período e contratos para condensar todos os diários de obra (RDOs) em um relatório executivo de alto padrão gerado pelo Gemini.</p>
              </div>

              {/* Filtering block inside tab */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 border border-gray-200/60 p-4 rounded-xl text-xs">
                {/* Contract Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-650">Filtrar por Contrato</label>
                  <select
                    value={selectedAiContractId}
                    onChange={(e) => setSelectedAiContractId(e.target.value)}
                    className="bg-white border border-gray-200 p-2 rounded-lg font-semibold text-gray-800 shadow-xs"
                  >
                    <option value="all">Todos os Contratos</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>{c.contractNumber} ({c.client})</option>
                    ))}
                  </select>
                </div>

                {/* Company Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-650">Filtrar por Contratada</label>
                  <select
                    value={selectedAiCompanyId}
                    onChange={(e) => setSelectedAiCompanyId(e.target.value)}
                    className="bg-white border border-gray-200 p-2 rounded-lg font-semibold text-gray-800 shadow-xs"
                  >
                    <option value="all">Todas as Empresas</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-650 font-sans">Data Início</label>
                  <input
                    type="date"
                    value={consolidationStartDate}
                    onChange={(e) => setConsolidationStartDate(e.target.value)}
                    className="bg-white border border-gray-200 p-2 rounded-lg font-semibold text-center text-gray-850 shadow-xs"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-650 font-sans">Data Fim</label>
                  <input
                    type="date"
                    value={consolidationEndDate}
                    onChange={(e) => setConsolidationEndDate(e.target.value)}
                    className="bg-white border border-gray-200 p-2 rounded-lg font-semibold text-center text-gray-850 shadow-xs"
                  />
                </div>
              </div>

              {/* Status information and trigger action */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-xs">
                <div className="text-blue-900/90 font-semibold leading-relaxed">
                  <span>RDOs Selecionados no Período: </span>
                  <strong className="underline text-blue-950 font-bold">
                    {rdos.filter(r => {
                      const dateInPeriod = r.date >= consolidationStartDate && r.date <= consolidationEndDate;
                      const matchContract = selectedAiContractId === 'all' || r.contractId === selectedAiContractId;
                      const matchCompany = selectedAiCompanyId === 'all' || r.companyId === selectedAiCompanyId;
                      return dateInPeriod && matchContract && matchCompany;
                    }).length} RDOs encontrados.
                  </strong>
                  <p className="text-[10px] text-blue-700/80 font-normal mt-0.5">O Gemini analisará as frentes de trabalho, horas acumuladas, clima e segurança ocupacional.</p>
                </div>

                <button
                  onClick={handleGenerateAiConsolidation}
                  disabled={isConsolidating}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs ${
                    isConsolidating 
                      ? 'bg-blue-600/50 text-white cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isConsolidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Consolidando RDOs...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Gerar Consolidação por IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loading active skeletons */}
              {isConsolidating && (
                <div className="border border-gray-200 rounded-xl p-6 bg-slate-50/30 space-y-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded-md w-1/3" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                  <div className="space-y-2 pt-4">
                    <div className="h-3 bg-gray-200 rounded-md w-full" />
                    <div className="h-3 bg-gray-200 rounded-md w-11/12" />
                    <div className="h-3 bg-gray-200 rounded-md w-10/12" />
                  </div>
                  <div className="h-20 bg-gray-100 rounded-md w-full border border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-[11px] text-gray-500 font-bold tracking-tight">O Gemini está condensando o progresso de faturamento (Pode levar até 12 segundos)...</span>
                  </div>
                </div>
              )}

              {/* Display Result Document Sheet */}
              {consolidationResult && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-xs space-y-6 relative border-t-4 border-t-blue-600">
                  <span className="absolute right-6 top-6 px-2.5 py-1 bg-indigo-50 border border-indigo-150 rounded text-[10px] font-bold uppercase text-indigo-700">
                    Relatório Corporativo IA
                  </span>

                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <div>
                      <h4 className="font-sans font-black text-slate-900 text-sm">RELATÓRIO CONSOLIDADO PERIÓDICO</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Período: {consolidationStartDate.split('-').reverse().join('/')} a {consolidationEndDate.split('-').reverse().join('/')}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(consolidationResult);
                          alert("Sucesso! Relatório copiado para a área de transferência.");
                        }}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-xs"
                      >
                        Copiar Relatório
                      </button>
                    </div>
                  </div>

                  {/* Render content */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-100">
                    <AIMarkdownViewer markdown={consolidationResult} />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function AIMarkdownViewer({ markdown }: { markdown: string }) {
  if (!markdown) return null;

  const lines = markdown.split('\n');
  return (
    <div className="space-y-4 text-xs font-sans text-gray-800 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
          return (
            <h5 key={idx} className="text-xs font-bold text-slate-800 mt-4 border-l-2 border-slate-400 pl-2">
              {trimmed.replace('###', '').trim()}
            </h5>
          );
        }
        if (trimmed.startsWith('##')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-slate-900 mt-6 border-b pb-1 border-gray-100 flex items-center gap-1.5">
              {trimmed.replace('##', '').trim()}
            </h4>
          );
        }
        if (trimmed.startsWith('#')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-950 mt-8 border-b-2 pb-2 border-gray-200 uppercase tracking-tight">
              {trimmed.replace('#', '').trim()}
            </h3>
          );
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return (
            <div key={idx} className="flex gap-2 pl-4">
              <span className="text-blue-500 shrink-0">•</span>
              <span className="text-xs text-gray-700 font-semibold">{trimmed.slice(1).trim()}</span>
            </div>
          );
        }
        // Check if table row:
        if (trimmed.startsWith('|')) {
          const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
          // Skip divider rows e.g. |---|---|
          if (cells.some(c => c.includes('---'))) return null;
          return (
            <div key={idx} className="grid grid-cols-4 gap-4 p-2.5 bg-white border border-gray-155 rounded-md text-[11px] font-mono leading-none font-semibold text-gray-700">
              {cells.map((cell, cidx) => (
                <span key={cidx} className="truncate">{cell}</span>
              ))}
            </div>
          );
        }
        if (trimmed === '') return <div key={idx} className="h-2" />;
        
        return (
          <p key={idx} className="text-xs text-gray-600 font-medium">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
