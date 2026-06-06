/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  CloudSun, 
  CloudRain, 
  Cloud, 
  Sun,
  HardHat, 
  Cpu, 
  ShieldAlert, 
  Paperclip,
  AlertCircle,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { RdoRecord, Company, Contract, User, WorkerEntry, EquipmentEntry, RdoStatus } from '../types';

interface RdoFormViewProps {
  rdoToEdit?: RdoRecord | null;
  companies: Company[];
  contracts: Contract[];
  currentUser: User;
  onSave: (record: RdoRecord, isCommit: boolean) => void;
  onCancel: () => void;
}

export function RdoFormView({
  rdoToEdit,
  companies,
  contracts,
  currentUser,
  onSave,
  onCancel
}: RdoFormViewProps) {
  // Determine if editing or creating
  const isEditing = !!rdoToEdit;

  // Root state values
  const [date, setDate] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [contractId, setContractId] = useState<string>('');
  const [siteLocation, setSiteLocation] = useState<string>('');
  const [responsibleName, setResponsibleName] = useState<string>('');
  const [weather, setWeather] = useState<'sol' | 'chuva_parcial' | 'chuva_total' | 'nublado'>('sol');
  const [shift, setShift] = useState<'diurno' | 'noturno'>('diurno');
  const [activities, setActivities] = useState<string>('');
  
  // Lists
  const [workers, setWorkers] = useState<WorkerEntry[]>([]);
  const [equipments, setEquipments] = useState<EquipmentEntry[]>([]);
  
  // Additional safety / blockages
  const [hasHseIncident, setHasHseIncident] = useState<boolean>(false);
  const [hseDetails, setHseDetails] = useState<string>('');
  const [interferences, setInterferences] = useState<string>('');
  const [stoppages, setStoppages] = useState<string>('');
  const [additionalRemarks, setAdditionalRemarks] = useState<string>('');
  
  // Attachments
  const [attachments, setAttachments] = useState<string[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState<string>('');

  // Pre-seed inputs when component mounts or edits
  useEffect(() => {
    if (isEditing && rdoToEdit) {
      setDate(rdoToEdit.date);
      setCompanyId(rdoToEdit.companyId);
      setContractId(rdoToEdit.contractId);
      setSiteLocation(rdoToEdit.siteLocation);
      setResponsibleName(rdoToEdit.responsibleName);
      setWeather(rdoToEdit.weather);
      setShift(rdoToEdit.shift);
      setActivities(rdoToEdit.activities);
      setWorkers([...rdoToEdit.workers]);
      setEquipments([...rdoToEdit.equipments]);
      setHasHseIncident(rdoToEdit.hasHseIncident);
      setHseDetails(rdoToEdit.hseDetails || '');
      setInterferences(rdoToEdit.interferences || '');
      setStoppages(rdoToEdit.stoppages || '');
      setAdditionalRemarks(rdoToEdit.additionalRemarks || '');
      setAttachments([...rdoToEdit.attachments]);
    } else {
      // Inception defaults
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      
      // If user is contractor, preset companyId
      if (currentUser.role === 'contractor') {
        const cId = currentUser.companyId || '';
        setCompanyId(cId);
        // Find first contract of this company in list
        const cList = contracts.filter(c => c.companyId === cId);
        if (cList.length > 0) {
          setContractId(cList[0].id);
          setSiteLocation(cList[0].siteLocation);
        }
      } else {
        // Administrative defaults
        if (companies.length > 0) {
          setCompanyId(companies[0].id);
          const cList = contracts.filter(c => c.companyId === companies[0].id);
          if (cList.length > 0) {
            setContractId(cList[0].id);
            setSiteLocation(cList[0].siteLocation);
          }
        }
      }

      setResponsibleName(currentUser.name);
      setWeather('sol');
      setShift('diurno');
      setActivities('');
      setWorkers([]);
      setEquipments([]);
      setHasHseIncident(false);
      setHseDetails('');
      setInterferences('');
      setStoppages('');
      setAdditionalRemarks('');
      setAttachments([]);
    }
  }, [rdoToEdit, isEditing, currentUser, companies, contracts]);

  // When company ID changes, filter the contracts list
  const handleCompanyChange = (id: string) => {
    setCompanyId(id);
    const subContracts = contracts.filter(c => c.companyId === id);
    if (subContracts.length > 0) {
      setContractId(subContracts[0].id);
      setSiteLocation(subContracts[0].siteLocation);
    } else {
      setContractId('');
      setSiteLocation('');
    }
  };

  const handleContractChange = (id: string) => {
    setContractId(id);
    const target = contracts.find(c => c.id === id);
    if (target) {
      setSiteLocation(target.siteLocation);
    }
  };

  // Add standard teams utility (extremely nice for fast customer testing!)
  const handleLoadStandardTeam = () => {
    const isAlfa = companyId === 'comp-alfa';
    let defaultTeam: WorkerEntry[] = [];
    
    if (isAlfa) {
      defaultTeam = [
        { id: `w-${Date.now()}-1`, name: 'Paulo Silva', role: 'Encarregado de Tubulação', normalHours: 8, extraHours: 0, nightHours: 0 },
        { id: `w-${Date.now()}-2`, name: 'Lucas Mendes', role: 'Soldador Especialista TIG', normalHours: 8, extraHours: 0, nightHours: 0 },
        { id: `w-${Date.now()}-3`, name: 'Julio Amorim', role: 'Caldeireiro Industrial', normalHours: 8, extraHours: 0, nightHours: 0 },
        { id: `w-${Date.now()}-4`, name: 'Wellington Gomes', role: 'Ajudante Geral', normalHours: 8, extraHours: 0, nightHours: 0 }
      ];
    } else {
      defaultTeam = [
        { id: `w-${Date.now()}-1`, name: 'Rodrigo Almeida', role: 'Eletricista de Força', normalHours: 8, extraHours: 0, nightHours: 0 },
        { id: `w-${Date.now()}-2`, name: 'Renato Sales', role: 'Eletricista Montador', normalHours: 8, extraHours: 0, nightHours: 0 },
        { id: `w-${Date.now()}-3`, name: 'Ana Paula Santos', role: 'Técnica de Comissionamento', normalHours: 8, extraHours: 0, nightHours: 0 }
      ];
    }
    setWorkers([...workers, ...defaultTeam]);
  };

  // Team Member Crud operations
  const handleAddWorker = () => {
    const newWorker: WorkerEntry = {
      id: `w-${Date.now()}`,
      name: '',
      role: '',
      normalHours: 8,
      extraHours: 0,
      nightHours: 0
    };
    setWorkers([...workers, newWorker]);
  };

  const handleUpdateWorker = (id: string, field: keyof WorkerEntry, value: string | number) => {
    setWorkers(workers.map(w => {
      if (w.id === id) {
        return { ...w, [field]: value };
      }
      return w;
    }));
  };

  const handleRemoveWorker = (id: string) => {
    setWorkers(workers.filter(w => w.id !== id));
  };

  // Equipments Operations
  const handleAddEquipment = () => {
    const newEq: EquipmentEntry = {
      id: `eq-${Date.now()}`,
      name: '',
      quantity: 1,
      status: 'operando'
    };
    setEquipments([...equipments, newEq]);
  };

  const handleUpdateEquipment = (id: string, field: keyof EquipmentEntry, value: string | number) => {
    setEquipments(equipments.map(eq => {
      if (eq.id === id) {
        return { ...eq, [field]: value };
      }
      return eq;
    }));
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipments(equipments.filter(e => e.id !== id));
  };

  // Document attachment action
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim()) return;
    setAttachments([...attachments, newAttachmentName.trim()]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  // Save implementation
  const handleSubmit = (isCommit: boolean) => {
    // Basic verification criteria
    if (!date) {
      alert('Por favor, informe a data do RDO.');
      return;
    }
    if (!companyId) {
      alert('Por favor, selecione a empresa.');
      return;
    }
    if (!contractId) {
      alert('Por favor, vincule um contrato.');
      return;
    }
    if (!activities.trim()) {
      alert('Inscreva o resumo de atividades executadas no dia.');
      return;
    }
    if (workers.length === 0) {
      alert('Adicione pelo menos um profissional na equipe para o cálculo do faturamento.');
      return;
    }
    const emptyWorkers = workers.some(w => !w.name.trim() || !w.role.trim());
    if (emptyWorkers) {
      alert('Preencha os nomes e funções de todos os profissionais cadastrados na equipe.');
      return;
    }

    // Determine status depending on whether we click "Salvar Rascunho" or "Enviar para Validação"
    let targetStatus: RdoStatus = 'Rascunho';
    if (isCommit) {
      // If was previously corrections requested, mark as 'Corrigido', else 'Enviado'
      if (rdoToEdit && rdoToEdit.status === 'Correção solicitada') {
        targetStatus = 'Corrigido';
      } else {
        targetStatus = 'Enviado';
      }
    }

    const payload: RdoRecord = {
      id: isEditing && rdoToEdit ? rdoToEdit.id : `rdo-${Date.now()}`,
      date,
      companyId,
      contractId,
      siteLocation,
      responsibleName,
      weather,
      shift,
      activities,
      workers,
      equipments,
      hasHseIncident,
      hseDetails: hasHseIncident ? hseDetails : '',
      interferences,
      stoppages,
      additionalRemarks,
      attachments,
      status: targetStatus
    };

    onSave(payload, isCommit);
  };

  // Real-time quick math sums
  const sumNormal = workers.reduce((sum, w) => sum + Number(w.normalHours || 0), 0);
  const sumExtra = workers.reduce((sum, w) => sum + Number(w.extraHours || 0), 0);
  const sumNight = workers.reduce((sum, w) => sum + Number(w.nightHours || 0), 0);
  const totalRdoHours = sumNormal + sumExtra + sumNight;

  return (
    <div className="space-y-8" id="rdo-form-container">
      {/* Form Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-sans font-bold text-gray-900 tracking-tight">
              {isEditing ? `Editar RDO: ${rdoToEdit?.date}` : 'Novo Relatório Diário de Obra (RDO)'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isEditing ? 'Atualize as informações solicitadas para reenvio à auditoria fiscal.' : 'Preencha o boletim diário com informações de efetivo, maquinário e ocorrências.'}
            </p>
          </div>
        </div>

        {/* Action Pad top level */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors outline-hidden cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Rascunho</span>
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-xs outline-hidden cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Enviar para Validação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column - main fields: 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* General info block */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-50 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <span>Identificação & Localização</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Date selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Data do Relatório *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-800 outline-hidden focus:border-blue-500 font-semibold"
                  id="form-input-date"
                />
              </div>

              {/* Responsible user input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Responsável pelo Lançamento</label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder="Nome do preenchedor"
                  className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-800 outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Company Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Empresa Contratada</label>
                {currentUser.role !== 'contractor' ? (
                  <select
                    value={companyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-800 outline-hidden focus:border-blue-500"
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-gray-100 border border-gray-200 text-xs text-gray-600 rounded-lg p-2.5 font-medium truncate">
                    {companies.find(c => c.id === companyId)?.name || 'Sua Empresa'}
                  </div>
                )}
              </div>

              {/* Contract Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Contrato Vinculado *</label>
                <select
                  value={contractId}
                  onChange={(e) => handleContractChange(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-800 outline-hidden focus:border-blue-500 font-semibold"
                >
                  <option value="">Selecione o contrato</option>
                  {contracts
                    .filter(c => c.companyId === companyId)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.contractNumber} ({c.client})</option>
                    ))
                  }
                </select>
              </div>

              {/* Location site */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">Frente de Serviço / Local de Execução *</label>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  placeholder="Ex: Trecho Tubulações Leste, Casa de Geradores, etc."
                  className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-800 outline-hidden focus:border-blue-500 font-semibold"
                />
              </div>

            </div>

            {/* Climate & Shift Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              
              {/* Climate Weather conditions */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-600">Condições de Clima / Tempo</span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setWeather('sol')}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col items-center gap-1.5 transition-all text-center ${
                      weather === 'sol' 
                        ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Sol</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeather('nublado')}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col items-center gap-1.5 transition-all text-center ${
                      weather === 'nublado' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Nublado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeather('chuva_parcial')}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col items-center gap-1.5 transition-all text-center ${
                      weather === 'chuva_parcial' 
                        ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <CloudSun className="w-4 h-4" />
                    <span className="truncate">Chuva P.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeather('chuva_total')}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col items-center gap-1.5 transition-all text-center ${
                      weather === 'chuva_total' 
                        ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <CloudRain className="w-4 h-4" />
                    <span className="truncate">Chuva T.</span>
                  </button>
                </div>
              </div>

              {/* Shift choosing */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-600">Turno de Trabalho</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShift('diurno')}
                    className={`p-3 rounded-lg border text-xs text-center font-semibold transition-all ${
                      shift === 'diurno' 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    Diurno (Comercial)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift('noturno')}
                    className={`p-3 rounded-lg border text-xs text-center font-semibold transition-all ${
                      shift === 'noturno' 
                        ? 'bg-indigo-950 border-indigo-950 text-white' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    Noturno
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Activities executed */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-50 mb-4">
              Descrição de Atividades Executadas *
            </h3>
            <textarea
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              placeholder="Descreva as atividades executadas detalhadamente, os trechos avançados, frentes atacadas, etc..."
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-800 outline-hidden focus:border-blue-500 font-medium leading-relaxed"
            />
          </div>

          {/* TEAM MEMBERS DYNAMIC LIST */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <HardHat className="w-4 h-4 text-gray-400" />
                <span>Efetivo de Campo (Profissionais & Horas Trabalhadas) *</span>
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Fast standard team fill */}
                <button
                  type="button"
                  onClick={handleLoadStandardTeam}
                  className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  + Carregar Equipe Padrão
                </button>
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="flex items-center gap-1 text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer animate-pulse"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Integrante</span>
                </button>
              </div>
            </div>

            {/* Field Headers for Table */}
            {workers.length > 0 ? (
              <div className="space-y-3">
                <div className="hidden md:grid md:grid-cols-12 gap-3 text-[10px] font-bold text-gray-400 uppercase px-2">
                  <div className="col-span-5">Nome do Colaborador</div>
                  <div className="col-span-3">Função / Cargo</div>
                  <div className="col-span-1.5 text-center">H. Normais</div>
                  <div className="col-span-1.5 text-center">H. Extras</div>
                  <div className="col-span-1 text-center font-bold text-gray-900">Noturnas</div>
                </div>

                <div className="space-y-2.5">
                  {workers.map((w, idx) => (
                    <div 
                      key={w.id} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg p-3 relative"
                    >
                      {/* Name input */}
                      <div className="col-span-1 md:col-span-5">
                        <input
                          type="text"
                          value={w.name}
                          placeholder="Ex: Carlos Albuquerque"
                          onChange={(e) => handleUpdateWorker(w.id, 'name', e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-md px-2.5 py-1.5 outline-hidden focus:border-blue-500 font-semibold"
                        />
                      </div>

                      {/* Cargo input */}
                      <div className="col-span-1 md:col-span-3">
                        <input
                          type="text"
                          value={w.role}
                          placeholder="Ex: Soldador TIG"
                          onChange={(e) => handleUpdateWorker(w.id, 'role', e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs text-gray-700 rounded-md px-2.5 py-1.5 outline-hidden focus:border-blue-500"
                        />
                      </div>

                      {/* Normal Hours input */}
                      <div className="col-span-1 md:col-span-1.5 flex items-center md:justify-center gap-1">
                        <span className="text-[10px] font-medium text-gray-400 md:hidden w-16">Horas Norm:</span>
                        <input
                          type="number"
                          min={0}
                          max={24}
                          value={w.normalHours}
                          onChange={(e) => handleUpdateWorker(w.id, 'normalHours', Number(e.target.value))}
                          className="w-16 md:w-full bg-white border border-gray-200 text-xs font-semibold text-center rounded-md px-1 py-1 text-gray-800"
                        />
                      </div>

                      {/* Extra Hours Input */}
                      <div className="col-span-1 md:col-span-1.5 flex items-center md:justify-center gap-1">
                        <span className="text-[10px] font-medium text-gray-400 md:hidden w-16">Horas Ex:</span>
                        <input
                          type="number"
                          min={0}
                          max={24}
                          value={w.extraHours}
                          onChange={(e) => handleUpdateWorker(w.id, 'extraHours', Number(e.target.value))}
                          className={`w-16 md:w-full bg-white border border-gray-200 text-xs font-semibold text-center rounded-md px-1 py-1 ${
                            w.extraHours > 2 ? 'border-amber-400 bg-amber-50 text-amber-800' : 'text-gray-800'
                          }`}
                        />
                      </div>

                      {/* Night Hours input */}
                      <div className="col-span-1 md:col-span-1 flex items-center justify-between md:justify-center gap-1">
                        <div className="flex items-center gap-1 md:w-full md:justify-center">
                          <span className="text-[10px] font-medium text-gray-400 md:hidden w-16">Ad. Noturno:</span>
                          <input
                            type="number"
                            min={0}
                            max={24}
                            value={w.nightHours}
                            onChange={(e) => handleUpdateWorker(w.id, 'nightHours', Number(e.target.value))}
                            className="w-14 md:w-full bg-white border border-gray-200 text-xs text-center rounded-md px-1 py-1 text-indigo-700 font-bold"
                          />
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveWorker(w.id)}
                          className="p-1 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors md:absolute md:right-[-32px] md:top-3.5"
                          title="Remover Colaborador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Sub calculations bar */}
                <div className="flex flex-wrap justify-between items-center bg-blue-50/50 border border-blue-50 rounded-lg p-3 text-xs mt-3">
                  <div className="text-blue-800 font-semibold space-x-1">
                    <span>Total da equipe:</span>
                    <span className="font-bold underline">{workers.length} colaborador(es)</span>
                  </div>
                  <div className="flex gap-4 font-mono text-[11px] text-gray-600 font-semibold">
                    <span>Normais: <span className="font-bold text-gray-900">{sumNormal}h</span></span>
                    <span>Extras: <span className="font-bold text-amber-700">{sumExtra}h</span></span>
                    <span>Noturnas: <span className="font-bold text-purple-700">{sumNight}h</span></span>
                    <span className="border-l border-gray-200 pl-4 font-bold text-blue-700">Total RDO: {totalRdoHours}h</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={handleAddWorker}
                className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 text-xs font-semibold cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                Nenhum colaborador adicionado ao faturamento ainda do dia.
                <p className="text-[10px] text-gray-400 font-normal mt-1">Clique para inserir colaboradores ou carregue a equipe de apoio padrão.</p>
              </div>
            )}
          </div>

          {/* DYNAMIC MACHINERY LIST */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-gray-400" />
                <span>Maquinários e Equipamentos Utilizados</span>
              </h3>
              <button
                type="button"
                onClick={handleAddEquipment}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Equipamento</span>
              </button>
            </div>

            {equipments.length > 0 ? (
              <div className="space-y-2">
                {equipments.map((eq) => (
                  <div key={eq.id} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-gray-50/50 p-2 border border-gray-100 rounded-lg">
                    <input
                      type="text"
                      value={eq.name}
                      placeholder="Ex: Caminhão Munck 12t"
                      onChange={(e) => handleUpdateEquipment(eq.id, 'name', e.target.value)}
                      className="bg-white border border-gray-200 text-xs text-gray-800 px-2.5 py-1.5 rounded-md outline-hidden grow"
                    />

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400 font-semibold">Qtd:</span>
                      <input
                        type="number"
                        min={1}
                        value={eq.quantity}
                        onChange={(e) => handleUpdateEquipment(eq.id, 'quantity', Number(e.target.value))}
                        className="w-12 bg-white border border-gray-200 text-xs text-center font-bold p-1 rounded-md text-gray-800"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={eq.status}
                        onChange={(e) => handleUpdateEquipment(eq.id, 'status', e.target.value as any)}
                        className="bg-white border border-gray-200 text-xs p-1.5 rounded-md text-gray-700"
                      >
                        <option value="operando">Operando (Ativo)</option>
                        <option value="parado">Parado (Manut.)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(eq.id)}
                      className="p-1 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-4 bg-gray-50/30 rounded-lg border border-dashed border-gray-100">
                Opcional. Clique para adicionar maquinários utilizados na jornada de hoje.
              </p>
            )}
          </div>

        </div>

        {/* Right column - Side modules: 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Real-time Math Recap Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Resumo de Horas do Boletim</h4>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-[10px] text-gray-400 block font-medium">Normais</span>
                <span className="text-lg font-mono font-bold block mt-1 text-blue-400">{sumNormal}h</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-[10px] text-gray-400 block font-medium">Extras</span>
                <span className="text-lg font-mono font-bold block mt-1 text-amber-400">{sumExtra}h</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-[10px] text-gray-400 block font-medium">Noturnas</span>
                <span className="text-lg font-mono font-bold block mt-1 text-purple-400">{sumNight}h</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-slate-300">Horas Totais de Hoje</span>
              <span className="text-xl font-sans font-black text-white">{totalRdoHours} H</span>
            </div>

            {sumExtra > 0 && sumExtra > (workers.length * 2) && (
              <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded p-2.5 text-[11px] text-amber-200 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Horas extras excedem limite legal regular de 2h diárias por trabalhador. RDO gerará alerta no painel fiscal.</span>
              </div>
            )}
          </div>

          {/* SSMA Occurrences Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 text-red-600">
              <ShieldAlert className="w-4 h-4" />
              <span>Controle de Segurança (SSMA)</span>
            </h3>

            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
              <label htmlFor="hse-switch" className="text-xs text-gray-700 font-semibold cursor-pointer">
                Houve Incidente ou Acidente hoje?
              </label>
              <input
                id="hse-switch"
                type="checkbox"
                checked={hasHseIncident}
                onChange={(e) => setHasHseIncident(e.target.checked)}
                className="w-4.5 h-4.5 text-red-600 accent-red-600 rounded cursor-pointer"
              />
            </div>

            {hasHseIncident && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-red-700">Relato Detalhado do Ocorrido *</label>
                <textarea
                  value={hseDetails}
                  onChange={(e) => setHseDetails(e.target.value)}
                  placeholder="Informar hora do incidente, equipamentos médicos envolvidos, triagem e estado geral do profissional."
                  rows={3}
                  className="w-full bg-red-50/35 border border-red-100 rounded-lg p-2.5 text-xs text-red-950 font-medium leading-relaxed outline-hidden focus:border-red-400"
                />
              </div>
            )}
          </div>

          {/* Interferences & Impedimentos Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Interferências & Paralisações
            </h3>

            <div className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500">Impedimentos / Paralisações temporárias</label>
                <textarea
                  value={stoppages}
                  onChange={(e) => setStoppages(e.target.value)}
                  placeholder="Ex: chuva por 2 horas fora do galpão principal..."
                  rows={2}
                  className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-700 leading-relaxed outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500">Interferências externas</label>
                <textarea
                  value={interferences}
                  onChange={(e) => setInterferences(e.target.value)}
                  placeholder="Ex: atraso de entrega técnica pela contratante..."
                  rows={2}
                  className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-700 leading-relaxed outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500">Observações Gerais</label>
                <textarea
                  value={additionalRemarks}
                  onChange={(e) => setAdditionalRemarks(e.target.value)}
                  placeholder="Qualquer outro detalhe técnico relevante..."
                  rows={2}
                  className="bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 text-gray-700 leading-relaxed outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Attachments / Upload Box */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span>Anexos do Diário (Relatório Fotográfico / PT)</span>
            </h3>

            <form onSubmit={handleAddAttachment} className="flex gap-2">
              <input
                type="text"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                placeholder="Ex: foto_solda_elevada_05.jpg"
                className="bg-gray-50 border border-gray-200 rounded-md p-1.5 grow text-xs outline-hidden focus:border-blue-500"
              />
              <button 
                type="submit"
                className="bg-slate-900 text-white rounded-md px-3 text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
              >
                Anexar
              </button>
            </form>

            {attachments.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded-md">
                    <span className="font-mono text-gray-600 truncate max-w-[200px]">{att}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-red-500 font-bold hover:bg-red-55 px-1.5 py-0.5 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-2">Sem anexos por enquanto. Anexar evidência fotográfica é extremamente recomendado para agilizar aprovação.</p>
            )}
          </div>

        </div>

      </div>

      {/* Action Pad Bottom */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 text-gray-600 transition-colors"
        >
          Cancelar Lançamento
        </button>
        <button
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
        >
          Salvar como Rascunho
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          Enviar para Validação Fiscal
        </button>
      </div>

    </div>
  );
}
