/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  History, 
  CornerDownRight, 
  FileCheck, 
  Users, 
  Cpu, 
  ShieldAlert,
  Paperclip,
  TrendingDown,
  Edit2,
  FileText,
  UserCheck
} from 'lucide-react';
import { RdoRecord, Company, Contract, User, AuditLog, WorkerEntry, ChangeLogItem, RdoStatus } from '../types';

interface RdoDetailViewProps {
  rdo: RdoRecord;
  companies: Company[];
  contracts: Contract[];
  currentUser: User;
  auditLogs: AuditLog[];
  onBack: () => void;
  onUpdateStatus: (
    rdoId: string, 
    newStatus: RdoStatus, 
    justification: string, 
    changes?: ChangeLogItem[],
    signatures?: {
      approverSignature?: string;
      executantSignature?: string;
      approvalDate?: string;
      executantDate?: string;
    }
  ) => void;
  onAdjustWorkerHours: (rdoId: string, workerId: string, field: 'normalHours' | 'extraHours' | 'nightHours', newValue: number, justification: string) => void;
}

export function RdoDetailView({
  rdo,
  companies,
  contracts,
  currentUser,
  auditLogs,
  onBack,
  onUpdateStatus,
  onAdjustWorkerHours
}: RdoDetailViewProps) {
  const company = companies.find(c => c.id === rdo.companyId);
  const contract = contracts.find(c => c.id === rdo.contractId);
  
  // Local modal/workflow states
  const [showApprovalBox, setShowApprovalBox] = useState<boolean>(false);
  const [approvalType, setApprovalType] = useState<'Aprovar' | 'Correcao' | 'Reprovar'>('Aprovar');
  const [justificationInput, setJustificationInput] = useState<string>('');

  // Local signature inputs state
  const [inpExecutant, setInpExecutant] = useState<string>(rdo.executantSignature || '');
  const [inpApprover, setInpApprover] = useState<string>(rdo.approverSignature || '');

  React.useEffect(() => {
    setInpExecutant(rdo.executantSignature || '');
    setInpApprover(rdo.approverSignature || '');
  }, [rdo.id, rdo.executantSignature, rdo.approverSignature]);

  // Local state for field adjustments (authorized edits)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [adjNormal, setAdjNormal] = useState<number>(0);
  const [adjExtra, setAdjExtra] = useState<number>(0);
  const [adjNight, setAdjNight] = useState<number>(0);
  const [adjustmentJustification, setAdjustmentJustification] = useState<string>('');

  // Filter logs for this specific RDO
  const fileLogs = auditLogs
    .filter(log => log.rdoId === rdo.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Hours stats
  const hrsNormal = rdo.workers.reduce((s, w) => s + w.normalHours, 0);
  const hrsExtra = rdo.workers.reduce((s, w) => s + w.extraHours, 0);
  const hrsNight = rdo.workers.reduce((s, w) => s + w.nightHours, 0);
  const totalRdoHours = hrsNormal + hrsExtra + hrsNight;

  // Process workflow changes
  const handleWorkflowSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificationInput.trim()) {
      alert('Por favor, descreva uma justificativa para esta ação de aprovação/correção.');
      return;
    }

    let targetStatus: RdoStatus = rdo.status;
    let signatures: any = {};

    if (approvalType === 'Aprovar') {
      targetStatus = 'Aprovado';
      signatures = {
        approverSignature: rdo.approverSignature || currentUser.name,
        executantSignature: rdo.executantSignature || currentUser.name,
        approvalDate: rdo.approvalDate || new Date().toLocaleDateString('pt-BR'),
        executantDate: rdo.executantDate || new Date().toLocaleDateString('pt-BR')
      };
    } else if (approvalType === 'Correcao') {
      targetStatus = 'Correção solicitada';
    } else if (approvalType === 'Reprovar') {
      targetStatus = 'Reprovado';
    }

    onUpdateStatus(rdo.id, targetStatus, justificationInput.trim(), [
      { field: 'status', oldValue: rdo.status, newValue: targetStatus }
    ], signatures);

    // reset states
    setShowApprovalBox(false);
    setJustificationInput('');
  };

  // Launch worker hour adjustment form
  const handleInitAdjustWorker = (w: WorkerEntry) => {
    setEditingWorkerId(w.id);
    setAdjNormal(w.normalHours);
    setAdjExtra(w.extraHours);
    setAdjNight(w.nightHours);
    setAdjustmentJustification('');
  };

  // Submit hours adjustment and trigger logging
  const handleSaveHoursAdjustment = (workerId: string) => {
    if (!adjustmentJustification.trim()) {
      alert('Por favor, informe a justificativa técnica para ajustar estas horas já consolidadas.');
      return;
    }

    const worker = rdo.workers.find(wk => wk.id === workerId);
    if (!worker) return;

    // Trigger updates for fields changed
    if (worker.normalHours !== adjNormal) {
      onAdjustWorkerHours(rdo.id, workerId, 'normalHours', adjNormal, adjustmentJustification);
    }
    if (worker.extraHours !== adjExtra) {
      onAdjustWorkerHours(rdo.id, workerId, 'extraHours', adjExtra, adjustmentJustification);
    }
    if (worker.nightHours !== adjNight) {
      onAdjustWorkerHours(rdo.id, workerId, 'nightHours', adjNight, adjustmentJustification);
    }

    // Reset edits
    setEditingWorkerId(null);
    setAdjustmentJustification('');
  };

  const statusTags: Record<RdoStatus, { label: string; bg: string; text: string; border: string }> = {
    'Rascunho': { label: 'Rascunho', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    'Enviado': { label: 'Enviado', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    'Em análise': { label: 'Em Análise', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
    'Correção solicitada': { label: 'Correção Solicitada', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
    'Corrigido': { label: 'Corrigido', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    'Aprovado': { label: 'Aprovado', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    'Reprovado': { label: 'Reprovado', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    'Bloqueado para medição': { label: 'Bloq. p/ Medição', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-150' },
    'Medido': { label: 'Medido / Pago', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  };

  const activeTag = statusTags[rdo.status] || { label: rdo.status, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };

  return (
    <div className="space-y-6" id="rdo-detail-container">
      {/* Detail bar header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-gray-900 text-lg">
                Ficha RDO: {new Date(rdo.date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
              <span className={`text-[10px] uppercase font-bold border rounded-sm px-2 py-0.5 ${rdo.shift === 'diurno' ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-indigo-950 text-white border-indigo-950'}`}>
                {rdo.shift}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Empresa: {company?.name} | Contrato: {contract?.contractNumber}</p>
          </div>
        </div>

        {/* Outer summary info */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border ${activeTag.bg} ${activeTag.text} ${activeTag.border}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>RDO {activeTag.label}</span>
          </span>

          {/* Quick measurement restriction indicators */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-all cursor-pointer print:hidden"
            title="Exportar diário em PDF corporativo de alta definição"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>Imprimir RDO (PDF)</span>
          </button>

          {rdo.status === 'Medido' && (
            <span className="text-[10px] font-bold px-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
              Fechado em Medição Externa
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left main sheet - 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5">
            <h3 className="font-sans font-semibold text-gray-900 text-base border-b border-gray-50 pb-3 flex items-center justify-between">
              <span>Boletim Técnico Operacional</span>
              <span className="text-xs font-mono text-gray-400">{rdo.id}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">Cliente Requerente</span>
                <span className="font-bold text-gray-800 mt-0.5 block">{contract?.client}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Responsável em Campo</span>
                <span className="font-bold text-gray-800 mt-0.5 block">{rdo.responsibleName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Condições Climáticas</span>
                <span className="font-bold text-amber-700 mt-0.5 block capitalize">
                  {rdo.weather === 'sol' && '☀️ Sol sem nuvens'}
                  {rdo.weather === 'nublado' && '☁️ Tempo nublado'}
                  {rdo.weather === 'chuva_parcial' && '🌦️ Chuva intermitente'}
                  {rdo.weather === 'chuva_total' && '🌧️ Chuva torrencial'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider block mb-2 text-[10px]">Atividades Executadas</span>
              <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100 leading-relaxed font-sans text-gray-800 whitespace-pre-line text-xs font-medium">
                {rdo.activities}
              </div>
            </div>
          </div>

          {/* Dynamic staffing and worker times: core feature */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-50 flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-450" />
                <span>Efetivo de Campo e Horas Consolidadas</span>
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                Total: {totalRdoHours} H/H
              </span>
            </h3>

            {/* In-place auditing tool for approved/enviado records */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase">
                    <th className="p-3">Nome Profissional</th>
                    <th className="p-3">Função / Cargo</th>
                    <th className="p-3 text-center">Horas Normais</th>
                    <th className="p-3 text-center">Horas Extras</th>
                    <th className="p-3 text-center">Adic. Noturno</th>
                    <th className="p-3 text-center">Total H/H</th>
                    {(currentUser.role === 'manager' || currentUser.role === 'admin') && rdo.status !== 'Medido' && (
                      <th className="p-3 text-right">Ajuste</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {rdo.workers.map(w => {
                    const rowTotal = w.normalHours + w.extraHours + w.nightHours;
                    const isUnderCorrection = editingWorkerId === w.id;

                    return (
                      <tr key={w.id} className="hover:bg-gray-50/40">
                        {/* Name */}
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{w.name}</span>
                        </td>

                        {/* Title Role */}
                        <td className="p-3">
                          <span className="text-gray-500 block">{w.role}</span>
                        </td>

                        {/* Normal Hrs */}
                        <td className="p-3 text-center">
                          {isUnderCorrection ? (
                            <input
                              type="number"
                              value={adjNormal}
                              onChange={(e) => setAdjNormal(Number(e.target.value))}
                              className="w-12 border rounded px-1.5 py-0.5 text-center font-bold"
                            />
                          ) : (
                            <span className="font-mono text-gray-700">{w.normalHours}h</span>
                          )}
                        </td>

                        {/* Extra Hrs */}
                        <td className="p-3 text-center">
                          {isUnderCorrection ? (
                            <input
                              type="number"
                              value={adjExtra}
                              onChange={(e) => setAdjExtra(Number(e.target.value))}
                              className="w-12 border rounded px-1.5 py-0.5 text-center font-bold"
                            />
                          ) : (
                            <span className={`font-mono ${w.extraHours > 0 ? 'text-amber-600 font-bold' : 'text-gray-500'}`}>
                              {w.extraHours}h
                            </span>
                          )}
                        </td>

                        {/* Night Shift */}
                        <td className="p-3 text-center">
                          {isUnderCorrection ? (
                            <input
                              type="number"
                              value={adjNight}
                              onChange={(e) => setAdjNight(Number(e.target.value))}
                              className="w-12 border rounded px-1.5 py-0.5 text-center font-bold text-indigo-700"
                            />
                          ) : (
                            <span className={`font-mono ${w.nightHours > 0 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                              {w.nightHours}h
                            </span>
                          )}
                        </td>

                        {/* Sum of H/H */}
                        <td className="p-3 text-center font-mono font-bold text-gray-900 bg-gray-50/50">
                          {rowTotal}h
                        </td>

                        {/* Adjustment logs trigger */}
                        {(currentUser.role === 'manager' || currentUser.role === 'admin') && rdo.status !== 'Medido' && (
                          <td className="p-3 text-right">
                            {isUnderCorrection ? (
                              <div className="flex flex-col gap-2 mt-1 bg-amber-50 p-3 rounded-lg border border-amber-100 max-w-sm ml-auto text-left">
                                <label className="text-[10px] font-bold text-amber-800">
                                  Justificar alteração oficial de faturamento *
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Glosa aplicada por falta de entrada..."
                                  value={adjustmentJustification}
                                  onChange={(e) => setAdjustmentJustification(e.target.value)}
                                  className="bg-white border border-amber-200 text-[11px] p-1.5 rounded focus:outline-hidden"
                                />
                                <div className="flex gap-2.5 justify-end">
                                  <button
                                    onClick={() => setEditingWorkerId(null)}
                                    className="text-[10px] text-gray-500 hover:underline"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleSaveHoursAdjustment(w.id)}
                                    className="text-[10px] font-bold text-amber-700 hover:underline"
                                  >
                                    Salvar Ajuste
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleInitAdjustWorker(w)}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Glosar/Ajustar</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Recap */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50 p-4 rounded-xl">
              <div>
                <span className="text-[11px] text-gray-400 block font-bold uppercase tracking-wider">Efetivo de Campo</span>
                <span className="font-bold text-gray-800 text-sm">{rdo.workers.length} Colaboradores Ativos</span>
              </div>
              <div className="flex gap-6 text-xs text-gray-600 font-mono font-semibold">
                <span>Normais: <span className="font-bold text-gray-900">{hrsNormal}h</span></span>
                <span>Extras: <span className="font-bold text-amber-600">{hrsExtra}h</span></span>
                <span>Noturnas: <span className="font-bold text-purple-600">{hrsNight}h</span></span>
                <span className="border-l border-gray-200 pl-4 font-bold text-blue-700">Total RDO: {totalRdoHours} H/H</span>
              </div>
            </div>
          </div>

          {/* Machinery and Equipments */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-50 flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-gray-450" />
              <span>Maquinários e Equipamentos de Apoio</span>
            </h3>
            {rdo.equipments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {rdo.equipments.map((eq) => (
                  <div key={eq.id} className="p-3 border border-gray-100 rounded-lg flex justify-between items-center bg-gray-50/50">
                    <div>
                      <span className="font-bold text-gray-800 block">{eq.name}</span>
                      <span className="text-[10px] text-gray-400">Código de controle: {eq.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-gray-900 block">Qtd: {eq.quantity}</span>
                      <span className={`text-[9px] uppercase font-bold inline-block px-1.5 py-0.5 rounded-sm mt-1 ${
                        eq.status === 'operando' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {eq.status === 'operando' ? 'Operando' : 'Parado / Manut'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4 bg-gray-50/20 rounded-lg border border-dashed border-gray-100">Nenhum equipamento reportado para este dia.</p>
            )}
          </div>

          {/* Safety events and blockades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Health and safety report */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Segurança e SSMA</span>
              </h4>
              <div className="pt-2">
                {rdo.hasHseIncident ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-950 font-medium">
                    <span className="font-bold block text-red-700">🚨 Ocorrência Registrada!</span>
                    <span className="mt-2 block leading-relaxed whitespace-pre-line text-gray-700">
                      {rdo.hseDetails}
                    </span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Nenhum incidente de SSMA apontado. Equipe operando com segurança.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Impedimentos list */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Impedimentos & Observações
              </h4>
              
              <div className="space-y-3 pt-2 text-xs">
                {rdo.stoppages ? (
                  <div>
                    <span className="font-bold text-gray-500 block text-[10px] uppercase">Paralisações registradas:</span>
                    <p className="text-gray-700 mt-1 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-medium">{rdo.stoppages}</p>
                  </div>
                ) : null}

                {rdo.interferences ? (
                  <div>
                    <span className="font-bold text-gray-500 block text-[10px] uppercase">Interferências externas:</span>
                    <p className="text-gray-700 mt-1 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-medium">{rdo.interferences}</p>
                  </div>
                ) : null}

                {rdo.additionalRemarks ? (
                  <div>
                    <span className="font-bold text-gray-500 block text-[10px] uppercase">Anotações adicionais:</span>
                    <p className="text-gray-500 mt-1 leading-relaxed italic">{rdo.additionalRemarks}</p>
                  </div>
                ) : null}

                {!rdo.stoppages && !rdo.interferences && !rdo.additionalRemarks ? (
                  <p className="text-xs text-gray-405 italic py-4">Sem anotações de interferências externas ou ocorrências impeditivas.</p>
                ) : null}
              </div>
            </div>

            {/* ASSINATURAS DO RDO (CONTRATADA E CONTRATANTE) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6" id="rdo-signatures-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2 border-b border-gray-100 pb-3">
                <UserCheck className="w-4 h-4 text-blue-500 font-sans" />
                <span>Assinaturas de Validação do RDO</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                
                {/* CONTRACTED/EXECUTANT SIGNATURE BLOCK */}
                <div className="flex flex-col items-center justify-between border border-gray-100 p-4 rounded-xl bg-gray-50/30 text-center min-h-[180px] relative">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Assinatura da Contratada (Executante)</span>
                  
                  <div className="flex-1 flex flex-col justify-center my-4 w-full">
                    {rdo.executantSignature ? (
                      <div className="space-y-1">
                        {/* Elegant cursive handwriting style approximation */}
                        <p className="font-serif italic text-lg text-indigo-700 font-bold tracking-wide py-1">
                          {rdo.executantSignature}
                        </p>
                        <div className="w-48 h-[1px] bg-gray-300 mx-auto" />
                        <span className="text-xs font-bold text-gray-750 block">{rdo.executantSignature}</span>
                        {rdo.executantDate && (
                          <span className="text-[10px] text-gray-400 block">Validado no sistema em {rdo.executantDate}</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm border border-indigo-100 mt-2">
                          ✓ Validado Digitalmente
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <div className="border border-dashed border-gray-200 py-3 rounded-lg bg-white/50 text-gray-400 italic text-xs">
                          Aguardando validação/assinatura...
                        </div>
                        <div className="w-48 h-[1px] border-t border-dashed border-gray-300 mx-auto" />
                      </div>
                    )}
                  </div>

                  <div className="w-full text-[10px] text-gray-400 mt-auto">
                    Responsável Técnico / Executante da Obra
                  </div>
                </div>

                {/* CLIENT/APPROVER SIGNATURE BLOCK */}
                <div className="flex flex-col items-center justify-between border border-gray-100 p-4 rounded-xl bg-gray-50/30 text-center min-h-[180px] relative">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Assinatura da Contratante (Aprovador)</span>
                  
                  <div className="flex-1 flex flex-col justify-center my-4 w-full">
                    {rdo.approverSignature ? (
                      <div className="space-y-1">
                        {/* Elegant cursive handwriting style approximation */}
                        <p className="font-serif italic text-lg text-blue-700 font-bold tracking-wide py-1">
                          {rdo.approverSignature}
                        </p>
                        <div className="w-48 h-[1px] bg-gray-300 mx-auto" />
                        <span className="text-xs font-bold text-gray-750 block">{rdo.approverSignature}</span>
                        {rdo.approvalDate && (
                          <span className="text-[10px] text-gray-400 block">Aprovado no sistema em {rdo.approvalDate}</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-100 mt-2">
                          ✓ Deferido e Assinado
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <div className="border border-dashed border-gray-200 py-3 rounded-lg bg-white/50 text-gray-400 italic text-xs">
                          Aguardando aprovação/assinatura...
                        </div>
                        <div className="w-48 h-[1px] border-t border-dashed border-gray-300 mx-auto" />
                      </div>
                    )}
                  </div>

                  <div className="w-full text-[10px] text-gray-400 mt-auto">
                    Gestor de Contrato / Fiscal Aprovador
                  </div>
                </div>

              </div>

              {/* QUICK INLINE SIGNATURE MODIFIER FOR FISCAIS AND ADMINS */}
              {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
                <div className="print:hidden bg-blue-50/40 border border-blue-150 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-800">Assinatura Digital Rápida (Online)</span>
                    <p className="text-[10px] text-gray-400">Insira seu nome para chancelar ou assinar o diário online</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Assinar como Contratada (Executante)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nome da Contratada"
                          value={inpExecutant}
                          onChange={(e) => setInpExecutant(e.target.value)}
                          className="bg-white border border-gray-200 text-xs px-2.5 py-1.5 rounded-lg w-full outline-hidden text-gray-800 font-semibold"
                        />
                        <button
                          onClick={() => {
                            if (!inpExecutant.trim()) { alert('Informe o nome da contratada para assinar.'); return; }
                            onUpdateStatus(rdo.id, rdo.status, 'Validação e assinatura da contratada via painel de assinatura rápida.', [], {
                              executantSignature: inpExecutant.trim(),
                              executantDate: new Date().toLocaleDateString('pt-BR')
                            });
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 rounded-lg cursor-pointer"
                        >
                          Assinar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Assinar como Contratante (Aprovador)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nome do Aprovador"
                          value={inpApprover}
                          onChange={(e) => setInpApprover(e.target.value)}
                          className="bg-white border border-gray-200 text-xs px-2.5 py-1.5 rounded-lg w-full outline-hidden text-gray-800 font-semibold"
                        />
                        <button
                          onClick={() => {
                            if (!inpApprover.trim()) { alert('Informe o nome do aprovador para assinar.'); return; }
                            onUpdateStatus(rdo.id, rdo.status, 'Aprovação e assinatura da contratante via painel de assinatura rápida.', [], {
                              approverSignature: inpApprover.trim(),
                              approvalDate: new Date().toLocaleDateString('pt-BR')
                            });
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-3 rounded-lg cursor-pointer"
                        >
                          Assinar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clean signature button if they want to clear signatures */}
                  {(rdo.approverSignature || rdo.executantSignature) && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          onUpdateStatus(rdo.id, rdo.status, 'Assinaturas removidas via painel de gerenciamento.', [], {
                            approverSignature: '',
                            executantSignature: '',
                            approvalDate: '',
                            executantDate: ''
                          });
                          setInpExecutant('');
                          setInpApprover('');
                        }}
                        className="text-[10px] text-red-500 hover:underline font-bold"
                      >
                        Limpar chancelas / assinaturas atuais
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right side panel workflow timeline / audits - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Workflows controllers */}
          {(currentUser.role === 'manager' || currentUser.role === 'admin') && rdo.status !== 'Medido' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-sans font-semibold text-gray-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Avaliação e Auditoria Fiscal</span>
              </h3>
              
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                Análise de conformidade do faturamento de h/h de hoje. Como fiscal gerenciador, você pode deferir, indeferir ou remeter para readequação no quadro correspondente.
              </p>

              {!showApprovalBox ? (
                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  <button
                    onClick={() => { setApprovalType('Aprovar'); setShowApprovalBox(true); }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar RDO</span>
                  </button>
                  <button
                    onClick={() => { setApprovalType('Correcao'); setShowApprovalBox(true); }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Solicitar Ajustes / Correção</span>
                  </button>
                  <button
                    onClick={() => { setApprovalType('Reprovar'); setShowApprovalBox(true); }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 border border-red-100"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reprovar RDO</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWorkflowSubmission} className="space-y-3.5 bg-gray-50 p-4 rounded-xl border border-gray-150 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-gray-700">
                      Ação: <span className={
                        approvalType === 'Aprovar' ? 'text-green-600' : approvalType === 'Correcao' ? 'text-amber-600' : 'text-red-600'
                      }>{approvalType === 'Aprovar' ? 'Deferimento / Aprovação' : approvalType === 'Correcao' ? 'Solicitar Ajustes' : 'Reprovação Definitiva'}</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowApprovalBox(false)}
                      className="text-gray-400 hover:bg-gray-200 px-1.5 rounded"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 block">Justificativa de despacho *</label>
                    <textarea
                      value={justificationInput}
                      onChange={(e) => setJustificationInput(e.target.value)}
                      placeholder={
                        approvalType === 'Aprovar' 
                        ? 'Explique os motivos da aprovação oficial do faturamento...'
                        : approvalType === 'Correcao' 
                        ? 'Indique quais campos, profissionais ou horas extras o contratado deve retificar...'
                        : 'Descreva detalhadamente o porquê da rejeição do apontamento...'
                      }
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-800 leading-relaxed outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full text-white text-xs font-bold py-2.5 rounded-lg transition-colors ${
                      approvalType === 'Aprovar' ? 'bg-green-600 hover:bg-green-700' : approvalType === 'Correcao' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Confirmar Despacho Oficial
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Evidence and File downloads */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-gray-450" />
              <span>Anexos Técnico-Fotográficos ({rdo.attachments.length})</span>
            </h3>

            {rdo.attachments.length > 0 ? (
              <div className="space-y-2 pt-1 text-xs">
                {rdo.attachments.map((file, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-mono text-gray-700 font-semibold truncate block max-w-[180px]">{file}</span>
                    </div>
                    {/* Simulated download */}
                    <a
                      href="#"
                      type="button"
                      onClick={(e) => { e.preventDefault(); alert(`Download simulado de arquivo técnico: ${file}`); }}
                      className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                    >
                      Ver DOC
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/20 rounded-lg border border-dashed">Sem arquivos anexados pelo contratado para este dia.</p>
            )}
          </div>

          {/* Audit Logs Trail & Changes history - dynamic */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-gray-450" />
              <span>Histórico de Alterações / Auditoria</span>
            </h3>

            <div className="relative border-l-2 border-gray-100 pl-4 space-y-5 max-h-[350px] overflow-y-auto pr-1">
              {fileLogs.map((log) => (
                <div key={log.id} className="relative text-xs text-left">
                  
                  {/* Absolute Timeline Dot */}
                  <span className="absolute -left-[23px] top-1 p-1 bg-white rounded-full border border-gray-200">
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                  </span>

                  <div>
                    {/* Log details */}
                    <span className="font-bold text-gray-800 block">{log.userName}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      {new Date(log.timestamp).toLocaleString('pt-BR')} | Perfil: {log.userRole}
                    </span>
                    
                    {log.previousStatus !== log.newStatus && (
                      <span className="mt-1 inline-block text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded-sm">
                        Status: <span className="text-gray-500">{log.previousStatus}</span> → <span className="text-blue-700">{log.newStatus}</span>
                      </span>
                    )}

                    {/* Change fields detail list */}
                    {log.changes.length > 0 && (
                      <div className="mt-1.5 space-y-0.5 bg-gray-50 p-2 rounded border border-gray-100 font-mono text-[10px] text-gray-600">
                        {log.changes.map((chg, idx) => (
                          <div key={idx} className="flex gap-1 items-start">
                            <CornerDownRight className="w-2.5 h-2.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>{chg.field}:</strong> "{chg.oldValue}" alterado para "{chg.newValue}"
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rationale justification text info */}
                    <p className="mt-2 text-gray-600 font-medium bg-slate-50 border border-slate-100/50 p-2.5 rounded-lg border-l-2 border-l-blue-400 leading-relaxed text-[11px]">
                      "{log.justification}"
                    </p>
                  </div>
                </div>
              ))}

              {fileLogs.length === 0 && (
                <p className="text-gray-405 italic text-center py-4 bg-gray-50/30 rounded-lg">Ainda sem histórico registrado para este documento.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
