/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Landmark, 
  Users, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Briefcase,
  Layers,
  KeyRound,
  Check,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Company, Contract, User, UserRole } from '../types';

interface RegistrationViewProps {
  companies: Company[];
  contracts: Contract[];
  usersList: User[];
  currentUser: User;
  onAddCompany: (comp: Company) => void;
  onAddContract: (cnt: Contract) => void;
  onUpdateContract: (cnt: Contract) => void;
  onAddUser: (usr: User) => void;
  onUpdateUser: (usr: User) => void;
  onDeleteCompany: (id: string) => void;
  onDeleteContract: (id: string) => void;
  onDeleteUser: (id: string) => void;
}

export function RegistrationView({
  companies,
  contracts,
  usersList,
  currentUser,
  onAddCompany,
  onAddContract,
  onUpdateContract,
  onAddUser,
  onUpdateUser,
  onDeleteCompany,
  onDeleteContract,
  onDeleteUser
}: RegistrationViewProps) {
  
  const [activeRegTab, setActiveRegTab] = useState<'empresas' | 'contratos' | 'usuarios'>('empresas');

  // Form inputs states: Company
  const [compName, setCompName] = useState<string>('');
  const [compCnpj, setCompCnpj] = useState<string>('');
  const [compResp, setCompResp] = useState<string>('');
  const [compEmail, setCompEmail] = useState<string>('');
  const [compPhone, setCompPhone] = useState<string>('');

  // Form inputs states: Contract
  const [cntNum, setCntNum] = useState<string>('');
  const [cntClient, setCntClient] = useState<string>('');
  const [cntCompId, setCntCompId] = useState<string>('');
  const [cntScope, setCntScope] = useState<string>('');
  const [cntRegime, setCntRegime] = useState<string>('Horas Homem (H/H)');
  const [cntRate, setCntRate] = useState<string>('');
  const [cntCc, setCntCc] = useState<string>('');
  const [cntLoc, setCntLoc] = useState<string>('');

  // Form inputs states: User
  const [usrName, setUsrName] = useState<string>('');
  const [usrEmail, setUsrEmail] = useState<string>('');
  const [usrPassword, setUsrPassword] = useState<string>('123456');
  const [usrRole, setUsrRole] = useState<UserRole>('contractor');
  const [usrCompId, setUsrCompId] = useState<string>('');

  // Editing User States for administrators to approve/assign roles/companies
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState<string>('');
  const [editingUserRole, setEditingUserRole] = useState<UserRole>('pending');
  const [editingUserCompanyId, setEditingUserCompanyId] = useState<string | undefined>('');
  const [editingUserPassword, setEditingUserPassword] = useState<string>('');

  const handleStartUserEdit = (usr: User) => {
    setEditingUserId(usr.id);
    setEditingUserName(usr.name);
    setEditingUserRole(usr.role);
    setEditingUserCompanyId(usr.companyId || '');
    setEditingUserPassword(usr.password || '123456');
  };

  const handleSaveUserEdit = () => {
    if (!editingUserId || !editingUserName.trim()) {
      alert('Por favor, informe o nome do colaborador corporativo.');
      return;
    }
    const originalUser = usersList.find(u => u.id === editingUserId);
    if (!originalUser) return;

    const updatedUser: User = {
      ...originalUser,
      name: editingUserName.trim(),
      role: editingUserRole,
      companyId: editingUserRole === 'contractor' ? (editingUserCompanyId || undefined) : undefined,
      password: editingUserPassword || '123456'
    };

    onUpdateUser(updatedUser);
    setEditingUserId(null);
    alert('Cadastro do colaborador e permissões de acesso atualizados com sucesso!');
  };

  // Editing Contract States for administrators
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editingContractNumber, setEditingContractNumber] = useState<string>('');
  const [editingContractClient, setEditingContractClient] = useState<string>('');
  const [editingContractCompanyId, setEditingContractCompanyId] = useState<string>('');
  const [editingContractScope, setEditingContractScope] = useState<string>('');
  const [editingContractRegime, setEditingContractRegime] = useState<string>('');
  const [editingContractRateRule, setEditingContractRateRule] = useState<string>('');
  const [editingContractCostCenter, setEditingContractCostCenter] = useState<string>('');
  const [editingContractSiteLocation, setEditingContractSiteLocation] = useState<string>('');

  const handleStartContractEdit = (cnt: Contract) => {
    setEditingContractId(cnt.id);
    setEditingContractNumber(cnt.contractNumber);
    setEditingContractClient(cnt.client);
    setEditingContractCompanyId(cnt.companyId);
    setEditingContractScope(cnt.scope);
    setEditingContractRegime(cnt.measurementRegime);
    setEditingContractRateRule(cnt.rateRule);
    setEditingContractCostCenter(cnt.costCenter);
    setEditingContractSiteLocation(cnt.siteLocation);
  };

  const handleSaveContractEdit = () => {
    if (!editingContractId || !editingContractNumber.trim() || !editingContractClient.trim() || !editingContractCompanyId) {
      alert('Por favor, informe o número do contrato, cliente e empresa terceirizada vinculada.');
      return;
    }
    const originalContract = contracts.find(c => c.id === editingContractId);
    if (!originalContract) return;

    const updatedContract: Contract = {
      ...originalContract,
      contractNumber: editingContractNumber.trim(),
      client: editingContractClient.trim(),
      companyId: editingContractCompanyId,
      scope: editingContractScope.trim(),
      measurementRegime: editingContractRegime,
      rateRule: editingContractRateRule.trim(),
      costCenter: editingContractCostCenter.trim(),
      siteLocation: editingContractSiteLocation.trim()
    };

    onUpdateContract(updatedContract);
    setEditingContractId(null);
    alert('Contrato atualizado com sucesso!');
  };

  // Creation dispatches
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compCnpj || !compResp) {
      alert('Preencha os campos obrigatórios da empresa.');
      return;
    }
    const payload: Company = {
      id: `comp-${Date.now()}`,
      name: compName,
      cnpj: compCnpj,
      responsibleName: compResp,
      email: compEmail || 'contato@empresa.com',
      phone: compPhone || '(11) 99999-8888',
      active: true
    };
    onAddCompany(payload);

    // Reset fields
    setCompName('');
    setCompCnpj('');
    setCompResp('');
    setCompEmail('');
    setCompPhone('');
    alert('Empresa cadastrada com sucesso!');
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cntNum || !cntClient || !cntCompId || !cntScope) {
      alert('Preencha os campos obrigatórios do contrato.');
      return;
    }
    const payload: Contract = {
      id: `cnt-${Date.now()}`,
      contractNumber: cntNum,
      client: cntClient,
      companyId: cntCompId,
      scope: cntScope,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months end
      measurementRegime: cntRegime,
      rateRule: cntRate || 'Faturamento por H/H aprovado sob diário',
      costCenter: cntCc || 'CC-OBRA-GERAL',
      siteLocation: cntLoc || 'Canteiro Principal'
    };
    onAddContract(payload);

    // Reset fields
    setCntNum('');
    setCntClient('');
    setCntScope('');
    setCntRate('');
    setCntCc('');
    setCntLoc('');
    alert('Contrato vinculado com sucesso!');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usrName || !usrEmail) {
      alert('Preencha o nome e e-mail do colaborador.');
      return;
    }
    const payload: User = {
      id: `usr-${Date.now()}`,
      name: usrName,
      email: usrEmail,
      role: usrRole,
      companyId: usrRole === 'contractor' ? usrCompId : undefined,
      active: true,
      password: usrPassword || '123456'
    };
    onAddUser(payload);

    // Reset user form
    setUsrName('');
    setUsrEmail('');
    setUsrPassword('123456');
    alert('Usuário cadastrado com sucesso!');
  };

  // Only Admin has permissions to create and manage setups
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6 animate-fadeIn" id="registration-main-view">
      
      {/* Tab select and instructions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-bold text-gray-900 tracking-tight">Parametrização e Cadastros Corporativos</h2>
          <p className="text-xs text-gray-500 mt-1">Configure empresas, insira novos contratos de terceiros e cadastre usuários com controle rígido de escopo.</p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveRegTab('empresas')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeRegTab === 'empresas' ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresas ({companies.length})</span>
          </button>
          <button
            onClick={() => setActiveRegTab('contratos')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeRegTab === 'contratos' ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Contratos ({contracts.length})</span>
          </button>
          <button
            onClick={() => setActiveRegTab('usuarios')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeRegTab === 'usuarios' ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários ({usersList.length})</span>
          </button>
        </div>
      </div>

      {/* Permissions notification if not admin */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex gap-2 mb-4 font-semibold">
          <span>Apenas perfis administradores detêm autorização para inserir novos registros ou excluir vinculados. Apenas consulta disponível.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create Forms (Active under Admin check) */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            
            {/* 1. Empresa creator form */}
            {activeRegTab === 'empresas' && (
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-50 flex items-center gap-1">
                  <Plus className="w-4 h-4 text-emerald-650" />
                  <span>Cadastrar Nova Empresa</span>
                </h3>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Razão Social / Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="Ex: Delta Engenharia S.A."
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-800 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">CNPJ Corporativo *</label>
                  <input
                    type="text"
                    required
                    value={compCnpj}
                    onChange={(e) => setCompCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Engenheiro / Responsável Técnico *</label>
                  <input
                    type="text"
                    required
                    value={compResp}
                    onChange={(e) => setCompResp(e.target.value)}
                    placeholder="Ex: Eng. Ronaldo Mendes"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-800"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-400">E-mail Técnico Operacional</label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder="tecnico@delta.com.br"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-700"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-400">Telefone / Canal Comercial</label>
                  <input
                    type="text"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Confirmar Cadastro
                </button>
              </form>
            )}

            {/* 2. Contrato Creator form */}
            {activeRegTab === 'contratos' && (
              <form onSubmit={handleCreateContract} className="space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-50 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  <span>Configurar Novo Contrato</span>
                </h3>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Número do Contrato *</label>
                  <input
                    type="text"
                    required
                    value={cntNum}
                    onChange={(e) => setCntNum(e.target.value)}
                    placeholder="Ex: CT-2026-DELTA404"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-800 font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Cliente Principal (Emissor) *</label>
                  <input
                    type="text"
                    required
                    value={cntClient}
                    onChange={(e) => setCntClient(e.target.value)}
                    placeholder="Ex: Petrobras S.A."
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-800"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Empresa Remetente Terceira *</label>
                  <select
                    required
                    value={cntCompId}
                    onChange={(e) => setCntCompId(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-700 font-semibold"
                  >
                    <option value="">Selecione parceiro comercial</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Escopo do Serviço *</label>
                  <textarea
                    required
                    value={cntScope}
                    onChange={(e) => setCntScope(e.target.value)}
                    placeholder="Resumo do escopo da empreitada..."
                    rows={2}
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-700 leading-relaxed font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Regime de Medição</label>
                  <select
                    value={cntRegime}
                    onChange={(e) => setCntRegime(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-700"
                  >
                    <option value="Horas Homem (H/H)">Horas Homem (H/H)</option>
                    <option value="Preço Unitário (M2, M, Unid)">Preço Unitário</option>
                    <option value="Preço Fixo Global">Preço Fixo Global</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-400">Centro de Custo (CC)</label>
                  <input
                    type="text"
                    value={cntCc}
                    onChange={(e) => setCntCc(e.target.value)}
                    placeholder="CC-MAND-LOTE-20"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-400">Regra de Medição / Valor por Hora</label>
                  <input
                    type="text"
                    value={cntRate}
                    onChange={(e) => setCntRate(e.target.value)}
                    placeholder="Ex: R$ 98,00 / hora técnico"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs font-semibold text-gray-700"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-400">Local Primário de Execução</label>
                  <input
                    type="text"
                    value={cntLoc}
                    onChange={(e) => setCntLoc(e.target.value)}
                    placeholder="Pátio Leste, Galpão A, etc."
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Vincular Novo Contrato
                </button>
              </form>
            )}

            {/* 3. Colaboradores / Users Creator Form */}
            {activeRegTab === 'usuarios' && (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-50 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  <span>Registrar Novo Usuário</span>
                </h3>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Nome do Usuário *</label>
                  <input
                    type="text"
                    required
                    value={usrName}
                    onChange={(e) => setUsrName(e.target.value)}
                    placeholder="Ex: Ricardo Albuquerque"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs font-semibold text-gray-800"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">E-mail de Login *</label>
                  <input
                    type="email"
                    required
                    value={usrEmail}
                    onChange={(e) => setUsrEmail(e.target.value)}
                    placeholder="ricardo@empresa.com"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Senha de Acesso *</label>
                  <input
                    type="text"
                    required
                    value={usrPassword}
                    onChange={(e) => setUsrPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs text-gray-800"
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-gray-600">Perfil de Acesso / Atribuição *</label>
                  <select
                    value={usrRole}
                    onChange={(e) => setUsrRole(e.target.value as any)}
                    className="border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white outline-hidden focus:border-blue-500 text-xs"
                  >
                    <option value="contractor">Empresa Terceirizada (Contratada)</option>
                    <option value="manager">Fiscal / Gerenciadora Contratante</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>

                {usrRole === 'contractor' && (
                  <div className="flex flex-col gap-1 text-xs animate-fadeIn">
                    <label className="font-bold text-slate-800">Selecione Empresa Cedente *</label>
                    <select
                      required
                      value={usrCompId}
                      onChange={(e) => setUsrCompId(e.target.value)}
                      className="border border-blue-200 rounded-lg p-2 bg-blue-50 focus:bg-white outline-hidden focus:border-blue-550 text-xs font-semibold"
                    >
                      <option value="">Escolha dadores da empresa</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Cadastrar Novo Usuário
                </button>
              </form>
            )}

          </div>
        )}

        {/* Right Side: Data grid tables for registries -- takes remaining space */}
        <div className={isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            
            {/* 1. Empresas registered grid */}
            {activeRegTab === 'empresas' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <th className="p-4" id="reg-comp-name">Empresa Parceira</th>
                      <th className="p-4" id="reg-comp-cnpj">CNPJ Oficial</th>
                      <th className="p-4" id="reg-comp-resp">Responsável Técnico</th>
                      <th className="p-4" id="reg-comp-con">Contatos Gerais</th>
                      {isAdmin && <th className="p-4 text-right" id="reg-comp-act">Excluir</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companies.map((c) => {
                      const linked = contracts.filter(cn => cn.companyId === c.id);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-gray-900">
                            <div>
                              <span className="font-bold text-gray-900 block text-xs">{c.name}</span>
                              <span className="text-[10px] text-gray-400 mt-1 block font-mono">
                                ID: {c.id} | {linked.length} contratos vinculados
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-gray-700">{c.cnpj}</td>
                          <td className="p-4 font-medium text-gray-650">{c.responsibleName}</td>
                          <td className="p-4">
                            <span className="block text-gray-600">{c.email}</span>
                            <span className="block text-gray-400 mt-0.5">{c.phone}</span>
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-right">
                              <button
                                onClick={() => onDeleteCompany(c.id)}
                                className="p-1 px-2 hover:bg-red-50 text-gray-450 hover:text-red-600 rounded transition-colors"
                                title="Deletar Empresa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Contratos registered grid */}
            {activeRegTab === 'contratos' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <th className="p-4">Contrato / CC</th>
                      <th className="p-4">Cliente Tomador</th>
                      <th className="p-4">Empresa Fornecedora</th>
                      <th className="p-4 max-w-xs">Escopo do Contrato</th>
                      <th className="p-4">Regra de Medição</th>
                      {isAdmin && <th className="p-4 text-right">Ação</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                     {contracts.map((cnt) => {
                       const comp = companies.find(c => c.id === cnt.companyId);

                       if (editingContractId === cnt.id) {
                         return (
                           <tr key={cnt.id} className="bg-blue-50/60 hover:bg-blue-50">
                             <td className="p-3">
                               <div className="space-y-1">
                                 <span className="text-[9px] text-gray-500 uppercase font-sans">Nº Contrato:</span>
                                 <input
                                   type="text"
                                   value={editingContractNumber}
                                   onChange={(e) => setEditingContractNumber(e.target.value)}
                                   className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 outline-hidden focus:border-blue-550 focus:ring-1 focus:ring-blue-500/20"
                                 />
                                 <span className="text-[9px] text-gray-500 uppercase font-sans block mt-1">CC:</span>
                                 <input
                                   type="text"
                                   value={editingContractCostCenter}
                                   onChange={(e) => setEditingContractCostCenter(e.target.value)}
                                   className="w-full bg-white border border-gray-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-gray-800 outline-hidden focus:border-blue-550"
                                 />
                               </div>
                             </td>
                             <td className="p-3">
                               <span className="text-[9px] text-gray-500 uppercase font-sans block">Cliente:</span>
                               <input
                                 type="text"
                                 value={editingContractClient}
                                 onChange={(e) => setEditingContractClient(e.target.value)}
                                 className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 outline-hidden"
                               />
                             </td>
                             <td className="p-3">
                               <span className="text-[9px] text-gray-500 uppercase font-sans block">Fornecedora:</span>
                               <select
                                 value={editingContractCompanyId}
                                 onChange={(e) => setEditingContractCompanyId(e.target.value)}
                                 className="w-full bg-white border border-gray-300 rounded-lg p-1 text-xs font-bold text-gray-800"
                               >
                                 <option value="">-- Escolha --</option>
                                 {companies.map(c => (
                                   <option key={c.id} value={c.id}>{c.name}</option>
                                 ))}
                               </select>
                             </td>
                             <td className="p-3">
                               <span className="text-[9px] text-gray-500 uppercase font-sans block">Escopo:</span>
                               <textarea
                                 value={editingContractScope}
                                 onChange={(e) => setEditingContractScope(e.target.value)}
                                 rows={2}
                                 className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs text-gray-800 leading-relaxed outline-hidden font-normal"
                               />
                             </td>
                             <td className="p-3">
                               <span className="text-[9px] text-gray-500 uppercase font-sans block">Regime / Regra:</span>
                               <select
                                 value={editingContractRegime}
                                 onChange={(e) => setEditingContractRegime(e.target.value)}
                                 className="w-full bg-white border border-gray-300 rounded-lg p-0.5 text-[11px] font-bold text-gray-800 mb-1"
                               >
                                 <option value="Horas Homem (H/H)">Horas Homem (H/H)</option>
                                 <option value="Preço Unitário (M2, M, Unid)">Preço Unitário</option>
                                 <option value="Preço Fixo Global">Preço Fixo Global</option>
                               </select>
                               <input
                                 type="text"
                                 value={editingContractRateRule}
                                 onChange={(e) => setEditingContractRateRule(e.target.value)}
                                 className="w-full bg-white border border-gray-300 rounded-lg px-1.5 py-0.5 text-[10px] text-gray-750 font-sans outline-hidden"
                                 placeholder="Regra de tarifa"
                               />
                             </td>
                             <td className="p-3 text-right space-y-1.5 whitespace-nowrap align-middle">
                               <button
                                 onClick={handleSaveContractEdit}
                                 className="w-full block px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold cursor-pointer transition-all"
                               >
                                 Salvar
                               </button>
                               <button
                                 onClick={() => setEditingContractId(null)}
                                 className="w-full block px-2.5 py-1.5 bg-gray-250 hover:bg-gray-300 text-gray-700 rounded-md text-[10px] font-bold cursor-pointer transition-all border border-gray-200"
                               >
                                 Cancelar
                               </button>
                             </td>
                           </tr>
                         );
                       }

                       return (
                         <tr key={cnt.id} className="hover:bg-slate-50/50">
                           <td className="p-4">
                             <span className="font-bold text-blue-700 block font-mono bg-blue-50 px-2 py-0.5 rounded-sm w-fit truncate">{cnt.contractNumber}</span>
                             <span className="text-[10px] text-gray-450 font-mono mt-1 block">CC: {cnt.costCenter}</span>
                           </td>
                           <td className="p-4 text-gray-800 font-bold">{cnt.client}</td>
                           <td className="p-4 text-gray-500 font-medium truncate max-w-[150px]">{comp?.name || 'Não cadastrada'}</td>
                           <td className="p-4 text-gray-600 max-w-xs leading-relaxed font-normal whitespace-pre-wrap">{cnt.scope}</td>
                           <td className="p-4">
                             <span className="block text-gray-700 font-bold">{cnt.measurementRegime}</span>
                             <span className="text-[10px] text-gray-400 block mt-0.5">{cnt.rateRule}</span>
                           </td>
                           {isAdmin && (
                             <td className="p-4 text-right space-x-2 whitespace-nowrap">
                               <button
                                 onClick={() => handleStartContractEdit(cnt)}
                                 className="p-1 px-2.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer inline-block"
                                 title="Editar este contrato"
                               >
                                 Editar
                               </button>
                               <button
                                 onClick={() => onDeleteContract(cnt.id)}
                                 className="p-1 px-2 hover:bg-red-50 text-gray-450 hover:text-red-700 rounded transition-colors cursor-pointer inline-block"
                                 title="Excluir este contrato"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </td>
                           )}
                         </tr>
                       );
                     })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Users list with switcher simulation */}
            {activeRegTab === 'usuarios' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <th className="p-4">Nome Completo</th>
                      <th className="p-4">E-mail Operacional</th>
                      <th className="p-4">Perfil / Atribuição</th>
                      <th className="p-4">Empresa Vinculada</th>
                      {isAdmin && <th className="p-4 text-right">Gerenciar / Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                    {usersList.map((usr) => {
                      const linkedComp = companies.find(c => c.id === usr.companyId);
                      const isSelf = usr.id === currentUser.id;
                      const isPending = usr.role === 'pending';

                      if (editingUserId === usr.id) {
                        return (
                          <tr key={usr.id} className="bg-blue-50/60 hover:bg-blue-50">
                            <td className="p-3">
                              <input
                                type="text"
                                value={editingUserName}
                                onChange={(e) => setEditingUserName(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-2 text-xs font-bold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-hidden py-1"
                                placeholder="Nome do usuário"
                              />
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-gray-500 block text-xs">{usr.email}</span>
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[9px] text-gray-450 uppercase tracking-wider font-sans shrink-0">Senha:</span>
                                <input
                                  type="text"
                                  value={editingUserPassword}
                                  onChange={(e) => setEditingUserPassword(e.target.value)}
                                  className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] text-gray-700 w-24 font-mono outline-hidden"
                                  placeholder="Nova Senha"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <select
                                value={editingUserRole}
                                onChange={(e) => setEditingUserRole(e.target.value as UserRole)}
                                className="bg-white border border-gray-300 rounded-lg px-1 py-1 text-xs font-bold text-gray-800 focus:border-blue-550 focus:ring-1 focus:ring-blue-500/20"
                              >
                                <option value="pending">Pendente (Inativo)</option>
                                <option value="admin">Administrador Geral</option>
                                <option value="manager">Fiscal da Contratante</option>
                                <option value="contractor">Empresa Contratada</option>
                              </select>
                            </td>
                            <td className="p-3">
                              {editingUserRole === 'contractor' ? (
                                <select
                                  value={editingUserCompanyId || ''}
                                  onChange={(e) => setEditingUserCompanyId(e.target.value)}
                                  className="bg-white border border-gray-300 rounded-lg px-1 py-1 text-xs font-bold text-gray-800 max-w-[150px]"
                                >
                                  <option value="">-- Escolha a Empresa --</option>
                                  {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-gray-400 font-normal text-[11px]">- Exclusivo para Contratadas</span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={handleSaveUserEdit}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 text-white rounded-md text-[10px] font-bold cursor-pointer transition-all"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-2.5 py-1.5 bg-gray-250 hover:bg-gray-300 text-gray-700 rounded-md text-[10px] font-bold cursor-pointer transition-all border border-gray-200"
                              >
                                Cancelar
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={usr.id} className={`hover:bg-slate-50/50 transition-colors ${isPending ? 'bg-amber-50/20 hover:bg-amber-50/40' : ''}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 flex items-center justify-center font-bold text-xs rounded-full ${
                                isPending ? 'bg-amber-100 text-amber-850 ring-2 ring-amber-200 animate-pulse' : 'bg-slate-100 text-slate-805'
                              }`}>
                                {usr.name[0]}
                              </div>
                              <div>
                                <span className="font-bold text-gray-800 block text-xs">{usr.name}</span>
                                {isPending && (
                                  <span className="text-[9px] font-bold text-amber-600 block mt-0.5 uppercase tracking-wide">
                                    Aguardando Liberação
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-gray-500">{usr.email}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-sm font-bold text-[10px] uppercase ${
                              usr.role === 'admin' 
                                ? 'bg-rose-100 text-rose-800 border border-slate-200' 
                                : usr.role === 'manager' 
                                ? 'bg-indigo-105 text-indigo-800 bg-indigo-50/70' 
                                : usr.role === 'contractor'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {usr.role === 'admin' && 'Administrador'}
                              {usr.role === 'manager' && 'Gerenciador/Fiscal'}
                              {usr.role === 'contractor' && 'Empresa Contratada'}
                              {usr.role === 'pending' && 'Pendente'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500">
                            {usr.role === 'contractor' ? (
                              <span className="font-bold text-blue-700">{linkedComp?.name || 'Não vinculada'}</span>
                            ) : usr.role === 'pending' ? (
                              <span className="text-amber-500 italic text-[11px] font-sans">Sem permissões atribuídas</span>
                            ) : (
                              <span className="text-gray-405 font-normal">- Gerenciadora Contratante</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleStartUserEdit(usr)}
                                className={`p-1 px-2.5 rounded-md text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
                                  isPending 
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/10' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                }`}
                                title="Editar configurações de login"
                              >
                                {isPending ? '🔒 Liberar Acesso' : 'Editar'}
                              </button>
                              
                              {!isSelf ? (
                                <button
                                  onClick={() => onDeleteUser(usr.id)}
                                  className="p-1 px-2 hover:bg-red-50 text-gray-400 hover:text-red-700 rounded transition-colors inline-block"
                                  title="Remover Usuário"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 px-1 border border-slate-100 bg-slate-50 rounded">Logado</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
