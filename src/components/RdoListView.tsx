/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  FileText, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { RdoRecord, Company, Contract, User, RdoStatus } from '../types';

interface RdoListViewProps {
  rdos: RdoRecord[];
  companies: Company[];
  contracts: Contract[];
  currentUser: User;
  onViewRdo: (rdoId: string) => void;
  onEditRdo: (rdoId: string) => void;
  onDeleteRdo: (rdoId: string) => void;
  onNewRdo: () => void;
}

export function RdoListView({
  rdos,
  companies,
  contracts,
  currentUser,
  onViewRdo,
  onEditRdo,
  onDeleteRdo,
  onNewRdo
}: RdoListViewProps) {
  // Filters state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedContractId, setSelectedContractId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Status mapping to color utilities
  const getStatusColor = (status: RdoStatus) => {
    switch (status) {
      case 'Rascunho':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Enviado':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Em análise':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Correção solicitada':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Corrigido':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Aprovado':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Reprovado':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Bloqueado para medição':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'Medido':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: RdoStatus) => {
    switch (status) {
      case 'Rascunho': return <FileText className="w-3 h-3" />;
      case 'Enviado': return <Clock className="w-3 h-3" />;
      case 'Em análise': return <Clock className="w-3 h-3" />;
      case 'Correção solicitada': return <AlertTriangle className="w-3 h-3" />;
      case 'Corrigido': return <CheckCircle2 className="w-3 h-3" />;
      case 'Aprovado': return <CheckCircle2 className="w-3 h-3" />;
      case 'Reprovado': return <XCircle className="w-3 h-3" />;
      case 'Bloqueado para medição': return <CheckCircle2 className="w-3 h-3" />;
      case 'Medido': return <CheckCircle2 className="w-3 h-3" />;
    }
  };

  // Determine which RDOs to show depending on current User Role & Filter states
  const filteredRdos = rdos.filter(r => {
    // 1. Role boundaries: If contractor, only show their own company
    if (currentUser.role === 'contractor' && currentUser.companyId !== r.companyId) {
      return false;
    }

    // 2. Filter company
    if (selectedCompanyId !== 'all' && r.companyId !== selectedCompanyId) {
      return false;
    }

    // 3. Filter contract
    if (selectedContractId !== 'all' && r.contractId !== selectedContractId) {
      return false;
    }

    // 4. Filter status
    if (selectedStatus !== 'all' && r.status !== selectedStatus) {
      return false;
    }

    // 5. Date boundaries
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;

    // 6. Search query (activities, location, or contractor name)
    if (searchQuery) {
      const companyName = companies.find(c => c.id === r.companyId)?.name || '';
      const contractNum = contracts.find(c => c.id === r.contractId)?.contractNumber || '';
      const normQuery = searchQuery.toLowerCase();
      
      return (
        r.activities.toLowerCase().includes(normQuery) ||
        r.siteLocation.toLowerCase().includes(normQuery) ||
        r.responsibleName.toLowerCase().includes(normQuery) ||
        companyName.toLowerCase().includes(normQuery) ||
        contractNum.toLowerCase().includes(normQuery)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6" id="rdo-list-view">
      {/* Search Header Container */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-sans font-bold text-gray-900 tracking-tight">Diários de Obra / Operação (RDO)</h2>
          <p className="text-xs text-gray-500 mt-1">Lançados e processados para verificação e fechamento periódico.</p>
        </div>
        
        {/* Enable "Novo RDO" button. Fiscais should view, Contractors or admin register */}
        {(currentUser.role === 'contractor' || currentUser.role === 'admin') && (
          <button
            onClick={onNewRdo}
            id="btn-create-rdo"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar RDO Diário</span>
          </button>
        )}
      </div>

      {/* FILTER CONTROL PAD */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs transition-all">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-gray-400" />
          <span>Filtros de Busca</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* Company select */}
          {currentUser.role !== 'contractor' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Empresa Contratada</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
              >
                <option value="all">S- Todas as Empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Empresa Ativa</label>
              <div className="bg-gray-50 border border-gray-100 text-xs text-gray-500 rounded-lg p-2.5 font-medium truncate">
                {companies.find(c => c.id === currentUser.companyId)?.name || 'Sua Empresa'}
              </div>
            </div>
          )}

          {/* Contract Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500">Contrato Vinculado</label>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
            >
              <option value="all">S- Todos os Contratos</option>
              {contracts
                .filter(c => currentUser.role !== 'contractor' || c.companyId === currentUser.companyId)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.contractNumber} ({c.client})</option>
                ))
              }
            </select>
          </div>

          {/* Status Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500">Status do RDO</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg p-2.5 outline-hidden focus:border-blue-500"
            >
              <option value="all">S- Todos os Status</option>
              <option value="Rascunho">Rascunho</option>
              <option value="Enviado">Enviado</option>
              <option value="Em análise">Em Análise</option>
              <option value="Correção solicitada">Correção Solicitada</option>
              <option value="Corrigido">Corrigido</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
              <option value="Bloqueado para medição">Bloqueado para medição</option>
              <option value="Medido">Medido</option>
            </select>
          </div>

          {/* Date Pickers */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500">De (Início)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg p-2 outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500">Até (Fim)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg p-2 outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Search bar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500">Busca Rápida</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: soldagem, trecho..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg pl-8 pr-2.5 p-2.5 outline-hidden focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
            </div>
          </div>

        </div>
      </div>

      {/* RDO RECORDS TABLE / BOARD */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <th className="p-4" id="th-date">Data / Turno</th>
                <th className="p-4" id="th-company">Empresa / Contrato</th>
                <th className="p-4" id="th-location">Local / Frente</th>
                <th className="p-4" id="th-workers">Efetivo de Campo</th>
                <th className="p-4" id="th-hours">Horas (N / E)</th>
                <th className="p-4" id="th-status">Situação/Status</th>
                <th className="p-4 text-right" id="th-actions">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredRdos.map((rdo) => {
                const compName = companies.find(c => c.id === rdo.companyId)?.name || 'Desconhecida';
                const contract = contracts.find(c => c.id === rdo.contractId);
                const hrsNormal = rdo.workers.reduce((s, w) => s + w.normalHours, 0);
                const hrsExtra = rdo.workers.reduce((s, w) => s + w.extraHours, 0);
                const hrsNight = rdo.workers.reduce((s, w) => s + w.nightHours, 0);
                const totHrs = hrsNormal + hrsExtra + hrsNight;

                return (
                  <tr key={rdo.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Date / Shift */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div>
                          <span className="font-bold text-gray-900 block font-mono">
                            {new Date(rdo.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-gray-400 mt-0.5 block">
                            T: {rdo.shift}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Company / Contract */}
                    <td className="p-4 max-w-xs">
                      <span className="font-semibold text-gray-800 truncate block text-xs">{compName}</span>
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm inline-block mt-1">
                        {contract?.contractNumber || 'Sem contrato'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="p-4 max-w-xxs">
                      <span className="text-gray-600 block line-clamp-1 font-medium">{rdo.siteLocation}</span>
                      <span className="text-[10px] text-gray-400 truncate block mt-0.5">Resp: {rdo.responsibleName}</span>
                    </td>

                    {/* Workers qty */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-950 font-mono">{rdo.workers.length}</span>
                        <span className="text-gray-400">profissional(is)</span>
                      </div>
                      {rdo.hasHseIncident && (
                        <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-sm inline-block mt-1">
                          Incidente SSMA
                        </span>
                      )}
                    </td>

                    {/* Hours (Normal / Extra) */}
                    <td className="p-4">
                      <div className="font-mono">
                        <span className="font-bold text-gray-900 block">{totHrs} hrs</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {hrsNormal}N / {hrsExtra}E {hrsNight > 0 ? `/ ${hrsNight}Not` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(rdo.status)}`}>
                        {getStatusIcon(rdo.status)}
                        <span>{rdo.status}</span>
                      </span>
                    </td>

                    {/* Dynamic Action triggers depending on user and status */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Always allow viewing */}
                        <button
                          onClick={() => onViewRdo(rdo.id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-lg transition-colors"
                          title="Visualizar Diário"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Allow direct editing if in Rascunho, or Correção solicitada. Only for owner or Admin */}
                        {(rdo.status === 'Rascunho' || rdo.status === 'Correção solicitada') && 
                         (currentUser.role === 'admin' || (currentUser.role === 'contractor' && currentUser.companyId === rdo.companyId)) && (
                          <button
                            onClick={() => onEditRdo(rdo.id)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 bg-gray-50 hover:bg-amber-50 border border-gray-100 rounded-lg transition-colors"
                            title="Editar Formulário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete: if Rascunho or Correção solicitada. Only owner or Admin */}
                        {(rdo.status === 'Rascunho' || rdo.status === 'Correção solicitada') && 
                         (currentUser.role === 'admin' || (currentUser.role === 'contractor' && currentUser.companyId === rdo.companyId)) && (
                          <button
                            onClick={() => onDeleteRdo(rdo.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-100 rounded-lg transition-colors"
                            title="Excluir Rascunho"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredRdos.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <p className="font-semibold text-sm">Nenhum Relatório Diário de Obra encontrado.</p>
                    <p className="text-xs text-gray-400 mt-1">Ajuste os filtros de busca ou crie um novo registro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
