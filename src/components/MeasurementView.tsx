/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  FileSpreadsheet, 
  FileCheck, 
  AlertTriangle, 
  Unlock, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Download, 
  TrendingUp, 
  ClipboardCheck, 
  Clock, 
  PiggyBank, 
  ArrowUpRight,
  HandCoins
} from 'lucide-react';
import { RdoRecord, Company, Contract, User, MeasurementCycle, MeasurementAdjustment, RdoStatus } from '../types';

interface MeasurementViewProps {
  rdos: RdoRecord[];
  companies: Company[];
  contracts: Contract[];
  currentUser: User;
  onCloseMeasurement: (contractId: string, companyId: string, startDate: string, endDate: string, adjustments: MeasurementAdjustment[]) => void;
  onUpdateRdoStatus: (rdoId: string, status: RdoStatus) => void;
}

export function MeasurementView({
  rdos,
  companies,
  contracts,
  currentUser,
  onCloseMeasurement,
  onUpdateRdoStatus
}: MeasurementViewProps) {
  
  // Selection states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-30');

  // Adjustments local state
  const [adjustments, setAdjustments] = useState<MeasurementAdjustment[]>([]);
  const [newAdjDesc, setNewAdjDesc] = useState<string>('');
  const [newAdjVal, setNewAdjVal] = useState<number>(0);
  const [newAdjJust, setNewAdjJust] = useState<string>('');
  const [showAdjForm, setShowAdjForm] = useState<boolean>(false);

  // Load defaults depending on the user role
  useEffect(() => {
    if (currentUser.role === 'contractor') {
      const cId = currentUser.companyId || '';
      setSelectedCompanyId(cId);
      const sub = contracts.filter(c => c.companyId === cId);
      if (sub.length > 0) {
        setSelectedContractId(sub[0].id);
      }
    } else {
      if (companies.length > 0) {
        setSelectedCompanyId(companies[0].id);
        const sub = contracts.filter(c => c.companyId === companies[0].id);
        if (sub.length > 0) {
          setSelectedContractId(sub[0].id);
        }
      }
    }
  }, [currentUser, companies, contracts]);

  const handleCompanyChange = (id: string) => {
    setSelectedCompanyId(id);
    const sub = contracts.filter(c => c.companyId === id);
    if (sub.length > 0) {
      setSelectedContractId(sub[0].id);
    } else {
      setSelectedContractId('');
    }
    // Also reset adjustments when settings target change
    setAdjustments([]);
  };

  // Main lists queries
  const targetContract = contracts.find(c => c.id === selectedContractId);
  const targetCompany = companies.find(c => c.id === selectedCompanyId);

  // Retrieve RDOs for selected Company + Contract + Range
  const periodRdos = rdos.filter(r => {
    return (
      r.companyId === selectedCompanyId &&
      r.contractId === selectedContractId &&
      r.date >= startDate &&
      r.date <= endDate
    );
  });

  // Category splits
  const approvedRdos = periodRdos.filter(r => r.status === 'Aprovado' || r.status === 'Bloqueado para medição' || r.status === 'Medido');
  const pendingRdos = periodRdos.filter(r => r.status === 'Enviado' || r.status === 'Em análise' || r.status === 'Correção solicitada' || r.status === 'Corrigido' || r.status === 'Rascunho');
  const rejectedRdos = periodRdos.filter(r => r.status === 'Reprovado');

  // Consolidate hours exclusively from APPROVED Rdos
  let normalHoursSum = 0;
  let extraHoursSum = 0;
  let nightHoursSum = 0;

  // Track hours by professional
  const hoursByWorker: Record<string, { name: string; role: string; normal: number; extra: number; night: number; total: number }> = {};
  // Track hours by career function
  const hoursByRole: Record<string, { role: string; normal: number; extra: number; night: number; total: number }> = {};

  approvedRdos.forEach(r => {
    r.workers.forEach(w => {
      normalHoursSum += w.normalHours;
      extraHoursSum += w.extraHours;
      nightHoursSum += w.nightHours;

      // Group Professional
      const key = `${w.name}-${w.role}`;
      if (!hoursByWorker[key]) {
        hoursByWorker[key] = { name: w.name, role: w.role, normal: 0, extra: 0, night: 0, total: 0 };
      }
      hoursByWorker[key].normal += w.normalHours;
      hoursByWorker[key].extra += w.extraHours;
      hoursByWorker[key].night += w.nightHours;
      hoursByWorker[key].total += w.normalHours + w.extraHours + w.nightHours;

      // Group Role
      if (!hoursByRole[w.role]) {
        hoursByRole[w.role] = { role: w.role, normal: 0, extra: 0, night: 0, total: 0 };
      }
      hoursByRole[w.role].normal += w.normalHours;
      hoursByRole[w.role].extra += w.extraHours;
      hoursByRole[w.role].night += w.nightHours;
      hoursByRole[w.role].total += w.normalHours + w.extraHours + w.nightHours;
    });
  });

  const totalClosedHours = normalHoursSum + extraHoursSum + nightHoursSum;

  // Pricing multiplier simulation
  // e.g. Alfa rate: 95.00/hr normal, 1.5 multiplier extra (142.5), 1.2 multiplier night (114.0)
  // e.g. Beta rate: 115.00/hr normal, 2.0 multiplier extra (230.0), 1.2 multiplier night (138.0)
  const isAlfa = selectedCompanyId === 'comp-alfa';
  const rateNormal = isAlfa ? 95 : 115;
  const rateExtra = isAlfa ? 142.50 : 230.00;
  const rateNight = isAlfa ? 114.00 : 138.00;

  const financialNormal = normalHoursSum * rateNormal;
  const financialExtra = extraHoursSum * rateExtra;
  const financialNight = nightHoursSum * rateNight;
  const financialSubtotal = financialNormal + financialExtra + financialNight;

  // Sum administrative adjustments
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.valueEffect, 0);
  const financialGrandTotal = Math.max(financialSubtotal + adjustmentTotal, 0);

  // Add an adjustment row
  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjDesc.trim() || !newAdjJust.trim()) {
      alert('Preencha a descrição, valor e justificativa técnica do ajuste fiscal.');
      return;
    }
    const payload: MeasurementAdjustment = {
      id: `adj-${Date.now()}`,
      description: newAdjDesc.trim(),
      valueEffect: Number(newAdjVal),
      justification: newAdjJust.trim()
    };
    setAdjustments([...adjustments, payload]);
    
    // Clear inputs
    setNewAdjDesc('');
    setNewAdjVal(0);
    setNewAdjJust('');
    setShowAdjForm(false);
  };

  const handleRemoveAdjustment = (id: string) => {
    setAdjustments(adjustments.filter(a => a.id !== id));
  };

  // Close period trigger
  const handlePerformClosePeriod = () => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      alert('Erro: Apenas o gestor contratante ou administrador fiscal pode assinar o fechamento periódico.');
      return;
    }

    if (approvedRdos.length === 0) {
      alert('Por favor, certifique-se de que existem relatórios aprovados no período escolhido para efetuar a medição.');
      return;
    }

    if (pendingRdos.length > 0) {
      const confirmForce = window.confirm(
        `Atenção! Existem ${pendingRdos.length} RDO(s) pendentes (em rascunho ou análise) para esta empresa no período. Elas FICARÃO FORA desta fatura. Deseja fechar e medir apenas as aprovadas?`
      );
      if (!confirmForce) return;
    } else {
      const confirmRegular = window.confirm(`Deseja carimbar o encerramento da medição de ${startDate} até ${endDate} com total líquido de R$ ${financialGrandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?`);
      if (!confirmRegular) return;
    }

    // Call state dispatcher
    onCloseMeasurement(selectedContractId, selectedCompanyId, startDate, endDate, adjustments);

    // Block to Medido status
    approvedRdos.forEach(r => {
      // Avoid modifying already marked ones
      if (r.status !== 'Medido') {
        onUpdateRdoStatus(r.id, 'Medido');
      }
    });

    alert(`Fechamento da Medição realizado com sucesso!\nTodos os diários vinculados receberam a etiqueta de 'Medido/Pago' e foram rigidamente bloqueados para qualquer alteração futura.`);
    setAdjustments([]);
  };

  // Simulated export actions
  const handleSimulatedExport = (format: 'PDF' | 'EXCEL') => {
    if (approvedRdos.length === 0) {
      alert('Sem dados consolidados para exportar no período. Verifique filiações e aprovações.');
      return;
    }
    alert(`[Módulo de Exportação]\nO Relatório Consolidado de Medição (${format}) para o contrato ${targetContract?.contractNumber} foi gerado com sucesso!\n\nPeríodo: ${startDate} a ${endDate}\nEfetivo: ${totalClosedHours} H/H total faturado\nLíquido Gerado: R$ ${financialGrandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  };

  return (
    <div className="space-y-6" id="measurement-main-view">
      
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-bold text-gray-900 tracking-tight">Medição Mensal e Apuração Consolidada</h2>
          <p className="text-xs text-gray-500 mt-1">Gere relatórios, prévias financeiras, faturamento consolidado e glosas administrativas para ciclos de 30 dias.</p>
        </div>

        {/* Excel / PDF trigger tags */}
        <div className="flex gap-2.5">
          <button
            onClick={() => handleSimulatedExport('EXCEL')}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Planilha</span>
          </button>
          <button
            onClick={() => handleSimulatedExport('PDF')}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-red-600" />
            <span>Gerar Relatório PDF</span>
          </button>
        </div>
      </div>

      {/* SELECTION CONTROL PANEL */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Company filter */}
          {currentUser.role !== 'contractor' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Selecione a Contratada</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-semibold"
              >
                <option value="">Selecione a empresa</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 font-medium text-gray-400">Sua Empresa Contratada</label>
              <div className="bg-gray-100 border border-gray-200 text-xs text-gray-600 rounded-lg p-2.5 font-bold truncate">
                {targetCompany?.name}
              </div>
            </div>
          )}

          {/* Contract Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Contrato sob Análise *</label>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 outline-hidden focus:border-blue-500 font-semibold"
            >
              <option value="">Escolha o contrato</option>
              {contracts
                .filter(c => c.companyId === selectedCompanyId)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.contractNumber} ({c.client})</option>
                ))
              }
            </select>
          </div>

          {/* Date Range picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Data de Início (Ciclo30d)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2 outline-hidden focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Data Limite (Ciclo30d)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2 outline-hidden focus:border-blue-500 font-semibold"
            />
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Summary listings and Consolidated values */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Period RDO records audit */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-50 flex justify-between items-center">
              <span>Auditoria de Fichas do Ciclo de 30 dias ({periodRdos.length})</span>
              <span className="text-[10px] text-gray-400">Total no período de buscas</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Approved Box */}
              <div className="border border-green-150 bg-green-50/20 p-3.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Aprovados (Para Faturar)</span>
                <span className="text-2xl font-sans font-extrabold text-green-700 block mt-1">{approvedRdos.length}</span>
                <span className="text-[10px] text-gray-400 mt-1 block">Incluso na consolidação</span>
              </div>

              {/* Pending Box */}
              <div className="border border-amber-150 bg-amber-50/30 p-3.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Pendentes (Excluídos)</span>
                <span className="text-2xl font-sans font-extrabold text-amber-600 block mt-1">{pendingRdos.length}</span>
                {pendingRdos.length > 0 && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-sm inline-block mt-1 animate-pulse">
                    Aguardando Validação
                  </span>
                )}
              </div>

              {/* Rejected Box */}
              <div className="border border-red-150 bg-red-50/10 p-3.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Reprovados (Indefeiridos)</span>
                <span className="text-2xl font-sans font-extrabold text-red-600 block mt-2">{rejectedRdos.length}</span>
                <span className="text-[10px] text-gray-400 mt-1 block">Glosados integralmente</span>
              </div>
            </div>

            {/* List entries for period */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {periodRdos.map((r, idx) => {
                const totalH = r.workers.reduce((s, wk) => s + wk.normalHours + wk.extraHours + wk.nightHours, 0);
                const isApproved = r.status === 'Aprovado' || r.status === 'Bloqueado para medição' || r.status === 'Medido';
                const isRejected = r.status === 'Reprovado';

                return (
                  <div key={idx} className="flex justify-between items-center p-2.5 border rounded-lg text-xs bg-gray-50/40">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-900">
                        {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-gray-400">({r.workers.length} colab., {totalH} H/H total)</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                        isApproved ? 'bg-green-150 text-green-800' : isRejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {periodRdos.length === 0 && (
                <p className="text-center py-6 text-xs text-gray-400 italic">Nenhum RDO lançado neste período para a empresa e contrato parametrizados.</p>
              )}
            </div>
          </div>

          {/* Consolidado por Funcao / Categoria Profissional */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-50 mb-3 flex justify-between items-center">
              <span>faturamento acumulado por Cargo / Categoria Profissional</span>
              <span className="text-[10px] text-gray-400">Calculado a partir de diários aprovados</span>
            </h3>

            {Object.keys(hoursByRole).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase">
                      <th className="py-2.5">Categoria / Função</th>
                      <th className="py-2.5 text-center">Horas Normais</th>
                      <th className="py-2.5 text-center">Horas Extras</th>
                      <th className="py-2.5 text-center">Adic. Noturno</th>
                      <th className="py-2.5 text-right">Acumulado H/H</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {Object.values(hoursByRole).map((hr, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-gray-900">{hr.role}</td>
                        <td className="py-2.5 text-center font-mono text-gray-500">{hr.normal}h</td>
                        <td className="py-2.5 text-center font-mono font-bold text-amber-600">{hr.extra}h</td>
                        <td className="py-2.5 text-center font-mono font-bold text-purple-600">{hr.night}h</td>
                        <td className="py-2.5 text-right font-mono font-black text-gray-950 bg-gray-50/50 px-2">{hr.total} H/H</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-6">Sem faturamentos aprovados para detalhar na tabela.</p>
            )}
          </div>

          {/* Table list by single Employee / Worker */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-50 mb-3 flex justify-between items-center">
              <span>Histórico de faturamento individual de H/H por Colaborador</span>
              <span className="text-[10px] text-gray-400">Total consolidado das sapatas do período</span>
            </h3>

            {Object.keys(hoursByWorker).length > 0 ? (
              <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[9px] font-bold uppercase">
                      <th className="py-2">Colaborador</th>
                      <th className="py-2">Cargo</th>
                      <th className="py-2 text-center">Normais</th>
                      <th className="py-2 text-center">Extras</th>
                      <th className="py-2 text-center">Noturnas</th>
                      <th className="py-2 text-right">Líquido Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {Object.values(hoursByWorker).map((hw, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-gray-900 font-bold">{hw.name}</td>
                        <td className="py-2.5 text-[11px] text-gray-400">{hw.role}</td>
                        <td className="py-2.5 text-center font-mono">{hw.normal}h</td>
                        <td className="py-2.5 text-center font-mono font-bold text-amber-600">{hw.extra}h</td>
                        <td className="py-2.5 text-center font-mono font-bold text-purple-600">{hw.night}h</td>
                        <td className="py-2.5 text-right font-mono font-black text-blue-800">{hw.total} H</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-gray-405 text-center py-6">Aguardando aprovação de boletins técnicos no período.</p>
            )}
          </div>

        </div>

        {/* Right Side: Financial Preview, Close Process, and Adjustments */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PREVIA FINANCEIRA CARD */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Demonstrativo Líquido de Medição</span>
            </h3>

            {/* Sum stats list */}
            <div className="space-y-3.5 border-b border-white/10 pb-4 text-xs">
              
              {/* Total hours normal */}
              <div className="flex justify-between items-center text-slate-300">
                <span>Horas Normais ({normalHoursSum}h × R$ {rateNormal.toFixed(2)})</span>
                <span className="font-mono font-bold text-white">R$ {financialNormal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Extras faturados */}
              <div className="flex justify-between items-center text-slate-300">
                <span>Horas Extras ({extraHoursSum}h × R$ {rateExtra.toFixed(2)})</span>
                <span className="font-mono font-bold text-amber-400">R$ {financialExtra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Night shifts */}
              <div className="flex justify-between items-center text-slate-300">
                <span>Adic. Noturno ({nightHoursSum}h × R$ {rateNight.toFixed(2)})</span>
                <span className="font-mono font-bold text-purple-400">R$ {financialNight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between items-center text-slate-400 border-t border-white/5 pt-3.5">
                <span>Subtotal de Faturamento</span>
                <span className="font-mono text-sm font-bold text-white">R$ {financialSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Adjustments sum flag */}
              {adjustments.length > 0 && (
                <div className="flex justify-between items-center text-slate-300 text-[11px]">
                  <span>Ajustes / Glosas Administrativas</span>
                  <span className={`font-mono font-bold ${adjustmentTotal < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {adjustmentTotal < 0 ? '-' : '+'} R$ {Math.abs(adjustmentTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

            </div>

            {/* Net values total */}
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total Líquido Estimado de Pagamento</span>
              <span className="text-3xl font-sans font-black text-emerald-400 block mt-1">
                R$ {financialGrandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Closure button */}
            {(currentUser.role === 'manager' || currentUser.role === 'admin') ? (
              <button
                type="button"
                onClick={handlePerformClosePeriod}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>Carimbar Fechamento Periódico</span>
              </button>
            ) : (
              <div className="text-[11px] bg-white/5 border border-white/10 p-3 rounded-lg text-slate-400 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Apenas perfis Administrativos ou Fiscais podem encerrar, glosar e medir ciclos oficialmente.</span>
              </div>
            )}
          </div>

          {/* GLOSAS E AJUSTES DE MEDIÇÃO */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <HandCoins className="w-4 h-4 text-amber-500" />
                <span>Ajustes / Glosas de Faturamento</span>
              </h4>
              
              {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
                <button
                  type="button"
                  onClick={() => setShowAdjForm(!showAdjForm)}
                  className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {showAdjForm ? '- Cancelar' : '+ Adicionar'}
                </button>
              )}
            </div>

            {/* Dynamic adjustment entry form code */}
            {showAdjForm && (
              <form onSubmit={handleAddAdjustment} className="p-3 bg-gray-50 border border-gray-150 rounded-lg text-xs space-y-2.5 animate-fadeIn">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-600">Descrição do Ajuste *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Glosa em descumprimento de EPI"
                    value={newAdjDesc}
                    onChange={(e) => setNewAdjDesc(e.target.value)}
                    className="bg-white border text-xs rounded p-1.5 focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-600">Valor em R$ * (Negativo para Glosas)</label>
                  <input
                    type="number"
                    required
                    placeholder="-1200.00"
                    value={newAdjVal}
                    onChange={(e) => setNewAdjVal(Number(e.target.value))}
                    className="bg-white border text-xs text-right font-mono rounded p-1.5 focus:outline-hidden font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-600">Justificativa e embasamento técnico *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Anotado em conformidade com o check de PT..."
                    value={newAdjJust}
                    onChange={(e) => setNewAdjJust(e.target.value)}
                    className="bg-white border text-xs rounded p-2 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 border border-slate-900 text-white rounded py-2 font-bold text-[11px] hover:bg-slate-800"
                >
                  Confirmar Inclusão
                </button>
              </form>
            )}

            {/* Total adjustments checklist */}
            <div className="space-y-2">
              {adjustments.map((adj) => (
                <div key={adj.id} className="p-2.5 rounded-lg border border-gray-100 flex justify-between items-start text-xs bg-gray-50/50">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-gray-800 block truncate">{adj.description}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 leading-relaxed block">Justif: {adj.justification}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className={`font-bold ${adj.valueEffect < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {adj.valueEffect < 0 ? '' : '+'}R$ {adj.valueEffect.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdjustment(adj.id)}
                        className="text-red-500 hover:bg-red-50 px-1 rounded hover:text-red-600 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {adjustments.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 italic">Sem nenhuma glosa administrativa financeira lançada no ciclo.</p>
              )}
            </div>

          </div>

          {/* ALERT ADVISORY COMPLIANCE BLOCK */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Avisos de Bloqueio</span>
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              O encerramento da medição efetuará o bloqueio sumário das h/h de faturamento correspondentes. Novos lançamentos de RDO para o período compreendido serão indeferidos de plano devido ao limite cadastrado.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
