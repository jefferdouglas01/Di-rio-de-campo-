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
  onAddUser: (usr: User) => void;
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
  onAddUser,
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
  const [usrRole, setUsrRole] = useState<UserRole>('contractor');
  const [usrCompId, setUsrCompId] = useState<string>('');

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
      active: true
    };
    onAddUser(payload);

    // Reset user form
    setUsrName('');
    setUsrEmail('');
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
                            <td className="p-4 text-right">
                              <button
                                onClick={() => onDeleteContract(cnt.id)}
                                className="p-1 px-2 hover:bg-red-50 text-gray-450 hover:text-red-700 rounded transition-colors"
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
                      {isAdmin && <th className="p-4 text-right">Deletar</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                    {usersList.map((usr) => {
                      const linkedComp = companies.find(c => c.id === usr.companyId);
                      return (
                        <tr key={usr.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs rounded-full">
                                {usr.name[0]}
                              </div>
                              <span className="font-bold text-gray-800">{usr.name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-gray-500">{usr.email}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-sm font-bold text-[10px] uppercase ${
                              usr.role === 'admin' 
                                ? 'bg-rose-150 text-rose-800 border border-slate-200' 
                                : usr.role === 'manager' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {usr.role === 'admin' && 'Administrador'}
                              {usr.role === 'manager' && 'Gerenciador/Fiscal'}
                              {usr.role === 'contractor' && 'Empresa Contratada'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500">
                            {usr.role === 'contractor' ? (linkedComp?.name || 'Nenhuma Vinculada') : '- Gerenciadora Contratante'}
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-right">
                              {usr.id !== currentUser.id ? (
                                <button
                                  onClick={() => onDeleteUser(usr.id)}
                                  className="p-1 px-2 hover:bg-red-50 text-gray-400 hover:text-red-700 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 px-2">Logado atualmente</span>
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
