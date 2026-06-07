/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Users, 
  HardHat, 
  Calendar, 
  ArrowUpRight,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { RdoRecord, Company, Contract, User } from '../types';

interface DashboardProps {
  rdos: RdoRecord[];
  companies: Company[];
  contracts: Contract[];
  onSelectTab: (tab: string) => void;
  onViewRdo: (rdoId: string) => void;
  usersList?: User[];
  currentUser?: User;
}

export function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function DashboardView({ rdos, companies, contracts, onSelectTab, onViewRdo, usersList = [], currentUser }: DashboardProps) {
  // Metrics calculated dynamically
  const totalRdos = rdos.length;
  const pendingApproval = rdos.filter(r => r.status === 'Enviado' || r.status === 'Corrigido').length;
  const correctionRequested = rdos.filter(r => r.status === 'Correção solicitada').length;
  const approvedCount = rdos.filter(r => r.status === 'Aprovado' || r.status === 'Bloqueado para medição' || r.status === 'Medido').length;

  // Calculo de inadimplência baseado na data dinâmica corrente do dia (coerente com a data real)
  const defaultToday = new Date().toISOString().split('T')[0];
  const companiesLinked = companies.filter(c => contracts.some(con => con.companyId === c.id));
  const missingToday = companiesLinked.filter(comp => {
    // Check if this company has an RDO for 2026-06-05
    return !rdos.some(r => r.companyId === comp.id && r.date === defaultToday);
  });

  // Calculate total hours by company
  const hoursByCompany = companies.map(comp => {
    const companyRdos = rdos.filter(r => r.companyId === comp.id);
    let normal = 0;
    let extra = 0;
    let night = 0;
    companyRdos.forEach(r => {
      r.workers.forEach(w => {
        normal += w.normalHours;
        extra += w.extraHours;
        night += w.nightHours;
      });
    });
    return {
      name: comp.name,
      normal,
      extra,
      night,
      total: normal + extra + night
    };
  }).filter(c => c.total > 0);

  // Consistency checks / alerts list
  const alerts: { id: string; type: 'warning' | 'danger' | 'info'; title: string; desc: string; linkId?: string }[] = [];

  rdos.forEach(r => {
    // 1. If extra hours exceed 2 hours for any professional
    r.workers.forEach(w => {
      if (w.extraHours > 2) {
        alerts.push({
          id: `alt-he-${r.id}-${w.id}`,
          type: 'warning',
          title: 'Hora Extra Excedida',
          desc: `${w.name} (${w.role}) trabalhou ${w.extraHours}h extras em ${r.date} (Empresa: ${companies.find(c => c.id === r.companyId)?.name}). Limite recomendado de CLT é de 2h.`,
          linkId: r.id
        });
      }
    });

    // 2. RDO is without compulsory attachment
    if (r.attachments.length === 0 && r.status === 'Enviado') {
      alerts.push({
        id: `alt-att-${r.id}`,
        type: 'info',
        title: 'Ausência de Evidências',
        desc: `RDO de ${r.date} enviado por ${companies.find(c => c.id === r.companyId)?.name} não possui anexos/evidências de campo cadastrados.`,
        linkId: r.id
      });
    }

    // 3. RDO has HSE Incident
    if (r.hasHseIncident) {
      alerts.push({
        id: `alt-hse-${r.id}`,
        type: 'danger',
        title: 'Ocorrência de SSMA',
        desc: `Registro de incidente de Segurança em RDO ${r.date} da ${companies.find(c => c.id === r.companyId)?.name}. Verifique os detalhes técnicos do atendimento.`,
        linkId: r.id
      });
    }
  });

  // 4. Inadimplência alert
  missingToday.forEach(comp => {
    alerts.push({
      id: `alt-inad-${comp.id}`,
      type: 'danger',
      title: 'RDO Ausente Hoje',
      desc: `A empresa "${comp.name}" ainda não lançou o Relatório Diário de Obra para a data limite de hoje (${formatDateBR(defaultToday)}).`,
    });
  });

  // Sum total hours for active counts
  let grandTotalHours = 0;
  let grandTotalNormal = 0;
  let grandTotalExtra = 0;
  let grandTotalNight = 0;
  rdos.forEach(r => {
    r.workers.forEach(w => {
      grandTotalNormal += w.normalHours;
      grandTotalExtra += w.extraHours;
      grandTotalNight += w.nightHours;
      grandTotalHours += w.normalHours + w.extraHours + w.nightHours;
    });
  });

  return (
    <div className="space-y-8" id="dashboard-main-view">
      {/* Pending users alert for Administrator in Dashboard */}
      {currentUser?.role === 'admin' && usersList.some(u => u.role === 'pending') && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase block tracking-wider leading-none">Novos Cadastros Pendentes</span>
              <span className="text-sm font-semibold text-gray-950 mt-1 block">
                Existem <strong>{usersList.filter(u => u.role === 'pending').length} solicitações</strong> de acesso aguardando sua liberação operacional.
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('cadastros')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-440 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Liberar Acessos Agora 🔑
          </button>
        </div>
      )}

      {/* Welcome & Overview Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-sans font-bold tracking-tight text-gray-900" id="dash-welcome">
            Painel Geral de Controle de Serviços
          </h1>
          <p className="text-sm text-gray-500 mt-1" id="dash-desc">
            Acompanhe o andamento dos lançamentos, horas de efetivo, aprovações de RDO e medição contratual de {companiesLinked.length} empresas.
          </p>
        </div>
        {/* Removido indicador estático de Data Limite conforme solicitado */}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dash-kpi-cards">
        {/* Total RDOs */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Total de Relatórios</span>
              <span className="text-3xl font-sans font-extrabold text-gray-900 block mt-2">{totalRdos}</span>
            </div>
            <span className="p-2.5 bg-gray-50 text-gray-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-sm">{approvedCount} aprovados</span>
            <span>no acumulado</span>
          </div>
        </div>

        {/* Pending approvals */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Pendentes de Validação</span>
              <span className="text-3xl font-sans font-extrabold text-amber-600 block mt-2">{pendingApproval}</span>
            </div>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Aguardando fiscal</span>
            <span>conferir horas</span>
          </div>
        </div>

        {/* Correções Solicitadas */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Para Correção</span>
              <span className="text-3xl font-sans font-extrabold text-red-600 block mt-2">{correctionRequested}</span>
            </div>
            <span className="p-2.5 bg-red-50 text-red-600 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="text-red-700 font-semibold">Devolvido ao terceiro</span>
            <span>ajustar dados</span>
          </div>
        </div>

        {/* Efetivo Total Horas */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Efetivo Acumulado</span>
              <span className="text-3xl font-sans font-extrabold text-blue-600 block mt-2">{(grandTotalHours).toLocaleString('pt-BR')} H</span>
            </div>
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <HardHat className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="text-gray-900 font-bold">{(grandTotalExtra).toLocaleString('pt-BR')} H Extras</span>
            <span className="text-gray-400">|</span>
            <span className="text-indigo-600 font-semibold">{(grandTotalNight).toLocaleString('pt-BR')} H Noturnas</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Incoherences split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Hours analysis by company and beautiful native Visual representation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-sans font-semibold text-gray-900 text-base">Efetivo Mensal por Empresa Contratada</h3>
                <p className="text-xs text-gray-400 mt-1">Total de horas apontadas nos relatórios aprovados e enviados.</p>
              </div>
              <button 
                onClick={() => onSelectTab('medição')}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 hover:underline"
              >
                Ver Detalhes da Medição <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Custom SVG/Tailwind Bar Chart */}
            <div className="space-y-6 mt-4">
              {hoursByCompany.map((hc, idx) => {
                const maxHours = Math.max(...hoursByCompany.map(c => c.total), 1);
                const pctTotal = (hc.total / maxHours) * 100;
                const pctNormal = (hc.normal / hc.total) * 100;
                const pctExtra = (hc.extra / hc.total) * 100;
                const pctNight = (hc.night / hc.total) * 100;

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-800">{hc.name}</span>
                      </div>
                      <div className="font-mono font-medium text-gray-500">
                        <span className="font-bold text-gray-900">{hc.total} hrs</span> ({hc.normal}N, {hc.extra}E, {hc.night}Not.)
                      </div>
                    </div>
                    
                    {/* The Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex shadow-inner">
                      <div 
                        style={{ width: `${pctTotal}%` }} 
                        className="h-full flex rounded-full overflow-hidden"
                      >
                        {/* Normal Hours */}
                        <div 
                          style={{ width: `${pctNormal}%` }} 
                          className="bg-blue-500 h-full transition-all duration-300"
                          title={`Horas Normais: ${hc.normal}`}
                        />
                        {/* Extra Hours */}
                        <div 
                          style={{ width: `${pctExtra}%` }} 
                          className="bg-amber-500 h-full transition-all duration-300"
                          title={`Horas Extras: ${hc.extra}`}
                        />
                        {/* Night Hours */}
                        <div 
                          style={{ width: `${pctNight}%` }} 
                          className="bg-purple-600 h-full transition-all duration-300"
                          title={`Adicional Noturno: ${hc.night}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {hoursByCompany.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Sem dados faturados disponíveis. Lance um RDO para calcular.
                </div>
              )}

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-gray-50 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-gray-500">Horas Normais</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-500"></div>
                  <span className="text-gray-500">Horas Extras</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-purple-600"></div>
                  <span className="text-gray-500">Adicional Noturno</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats on Active Contracts */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans font-semibold text-gray-900 text-base">Contratos em Vigência</h3>
              <span className="text-xs text-gray-500 font-mono">{contracts.length} Ativos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contracts.slice(0, 2).map((con, idx) => {
                const companyName = companies.find(c => c.id === con.companyId)?.name || 'Empresa Geral';
                return (
                  <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-sm">
                        {con.contractNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">Resp: {con.client}</span>
                    </div>
                    <span className="block mt-2.5 text-xs text-gray-900 font-bold truncate">{con.scope}</span>
                    <span className="block text-[11px] text-gray-500 mt-1 truncate">{companyName}</span>
                    <div className="flex justify-between mt-3 text-[10px] text-gray-400 border-t border-gray-100 pt-20.5">
                      <span>Início: 06/06/2026</span>
                      <span>Modo: {con.measurementRegime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Alerts & Missing RDO report */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Missing Checklist Card */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-xs">
            <h3 className="font-sans font-semibold text-gray-900 text-base mb-4 flex items-center justify-between">
              <span>Status de Lançamento Diário</span>
              <span className="text-[10px] font-semibold text-red-650 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                Hoje: {formatDateBR(defaultToday)}
              </span>
            </h3>

            <div className="space-y-3">
              {companiesLinked.map(comp => {
                const launched = rdos.some(r => r.companyId === comp.id && r.date === defaultToday);
                const launchedRdo = rdos.find(r => r.companyId === comp.id && r.date === defaultToday);
                
                return (
                  <div key={comp.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                    <div className="min-w-0 pr-2">
                      <span className="block text-xs font-semibold text-gray-800 truncate">{comp.name}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">CNPJ: {comp.cnpj}</span>
                    </div>
                    {launched ? (
                      <button 
                        onClick={() => launchedRdo && onViewRdo(launchedRdo.id)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 hover:bg-green-100"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ver RDO</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Inadimplente</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compliance Alerts Drawer / Log */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-xs">
            <h3 className="font-sans font-semibold text-gray-900 text-base mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Inconsistências & Alertas</span>
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {alerts.map((alt) => (
                <div 
                  key={alt.id} 
                  onClick={() => alt.linkId && onViewRdo(alt.linkId)}
                  className={`p-3 rounded-lg border flex gap-3 text-xs text-left ${
                    alt.type === 'danger' 
                      ? 'bg-rose-50 border-rose-100 text-rose-800' 
                      : alt.type === 'warning'
                      ? 'bg-amber-50/70 border-amber-100 text-amber-800'
                      : 'bg-blue-50 border-blue-100 text-blue-800'
                  } ${alt.linkId ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {alt.type === 'danger' && <XCircle className="w-4 h-4 text-rose-600" />}
                    {alt.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {alt.type === 'info' && <Clock className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold block">{alt.title}</span>
                    <span className="mt-0.5 text-gray-600 leading-relaxed block">{alt.desc}</span>
                    {alt.linkId && (
                      <span className="text-[10px] underline font-semibold mt-1.5 block hover:text-gray-900">
                        Clique para conferir RDO vinculada →
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {alerts.length === 0 && (
                <p className="text-gray-400 text-xs text-center py-6">Nenhuma inconsistência de SSMA ou horas extras registrada.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
