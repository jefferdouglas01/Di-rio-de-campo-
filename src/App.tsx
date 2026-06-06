/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_RDOS, 
  INITIAL_COMPANIES, 
  INITIAL_CONTRACTS, 
  INITIAL_USERS, 
  INITIAL_AUDIT_LOGS 
} from './data';
import { Company, Contract, User, RdoRecord, AuditLog, RdoStatus, ChangeLogItem, MeasurementAdjustment } from './types';

// Component imports
import { DashboardView } from './components/DashboardView';
import { RdoListView } from './components/RdoListView';
import { RdoFormView } from './components/RdoFormView';
import { RdoDetailView } from './components/RdoDetailView';
import { MeasurementView } from './components/MeasurementView';
import { RegistrationView } from './components/RegistrationView';
import { ReportsView } from './components/ReportsView';
import { LoginView } from './components/LoginView';

// Icons
import { 
  Building2, 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Users, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  RefreshCw,
  LogOut,
  HardHat,
  Database
} from 'lucide-react';

export default function App() {
  
  // Primary Databases state
  const [rdos, setRdos] = useState<RdoRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewingRdoId, setViewingRdoId] = useState<string | null>(null);
  const [editingRdoId, setEditingRdoId] = useState<string | null>(null);
  const [isCreatingNewRdo, setIsCreatingNewRdo] = useState<boolean>(false);

  // 1. Initial State bootstrapping from local storage or Seeds
  useEffect(() => {
    // Rdos
    const localRdos = localStorage.getItem('rdo_db_rdos');
    if (localRdos) {
      setRdos(JSON.parse(localRdos));
    } else {
      setRdos(INITIAL_RDOS);
      localStorage.setItem('rdo_db_rdos', JSON.stringify(INITIAL_RDOS));
    }

    // Companies
    const localCompanies = localStorage.getItem('rdo_db_companies');
    if (localCompanies) {
      setCompanies(JSON.parse(localCompanies));
    } else {
      setCompanies(INITIAL_COMPANIES);
      localStorage.setItem('rdo_db_companies', JSON.stringify(INITIAL_COMPANIES));
    }

    // Contracts
    const localContracts = localStorage.getItem('rdo_db_contracts');
    if (localContracts) {
      setContracts(JSON.parse(localContracts));
    } else {
      setContracts(INITIAL_CONTRACTS);
      localStorage.setItem('rdo_db_contracts', JSON.stringify(INITIAL_CONTRACTS));
    }

    // Users
    const localUsers = localStorage.getItem('rdo_db_users');
    let dbUsers: User[] = [];
    if (localUsers) {
      dbUsers = JSON.parse(localUsers) as User[];
      setUsersList(dbUsers);
    } else {
      dbUsers = INITIAL_USERS;
      setUsersList(INITIAL_USERS);
      localStorage.setItem('rdo_db_users', JSON.stringify(INITIAL_USERS));
    }

    // Check Login session
    const savedUserEmail = localStorage.getItem('rdo_active_user_email');
    const wasLoggedIn = localStorage.getItem('rdo_is_logged_in') === 'true';
    const found = dbUsers.find(u => u.email === savedUserEmail);
    if (wasLoggedIn && found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
    } else {
      setCurrentUser(null);
      setIsLoggedIn(false);
    }

    // Audit logs
    const localAudits = localStorage.getItem('rdo_db_audits');
    if (localAudits) {
      setAuditLogs(JSON.parse(localAudits));
    } else {
      setAuditLogs(INITIAL_AUDIT_LOGS);
      localStorage.setItem('rdo_db_audits', JSON.stringify(INITIAL_AUDIT_LOGS));
    }
  }, []);

  // Utility to reload default seeds to resolve testing states
  const handleResetSystem = () => {
    const isConfirm = window.confirm('Tem certeza de que deseja resetar os dados? Todas as suas alterações locais serão limpas do banco de dados.');
    if (isConfirm) {
      localStorage.clear();
      setRdos(INITIAL_RDOS);
      setCompanies(INITIAL_COMPANIES);
      setContracts(INITIAL_CONTRACTS);
      setUsersList(INITIAL_USERS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setCurrentUser(null);
      setIsLoggedIn(false);
      setActiveTab('dashboard');
      setViewingRdoId(null);
      setEditingRdoId(null);
      setIsCreatingNewRdo(false);
      localStorage.setItem('rdo_db_rdos', JSON.stringify(INITIAL_RDOS));
      localStorage.setItem('rdo_db_companies', JSON.stringify(INITIAL_COMPANIES));
      localStorage.setItem('rdo_db_contracts', JSON.stringify(INITIAL_CONTRACTS));
      localStorage.setItem('rdo_db_users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('rdo_db_audits', JSON.stringify(INITIAL_AUDIT_LOGS));
      alert('Sistema resetado com sucesso! Por favor, faça login com a conta de Administrador.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('rdo_is_logged_in');
    localStorage.removeItem('rdo_active_user_email');
    setViewingRdoId(null);
    setEditingRdoId(null);
    setIsCreatingNewRdo(false);
    setActiveTab('dashboard');
  };

  // State synchronization writer to local storage
  const syncAndSaveRdos = (updated: RdoRecord[]) => {
    setRdos(updated);
    localStorage.setItem('rdo_db_rdos', JSON.stringify(updated));
  };

  const syncAndSaveAudits = (updated: AuditLog[]) => {
    setAuditLogs(updated);
    localStorage.setItem('rdo_db_audits', JSON.stringify(updated));
  };

  // CRUD DISPATCHERS

  // 1. Save or Create RDO
  const handleSaveRdoRecord = (record: RdoRecord, isCommit: boolean) => {
    const exists = rdos.some(r => r.id === record.id);
    let updatedRdos: RdoRecord[] = [];

    if (exists) {
      updatedRdos = rdos.map(r => r.id === record.id ? record : r);
    } else {
      updatedRdos = [record, ...rdos];
    }

    syncAndSaveRdos(updatedRdos);

    // Create Audit entry if it has been committed for review
    if (currentUser) {
      const descriptionText = isCommit 
        ? (exists ? 'Boletim RDO editado e reenviado para verificação.' : 'Novo Boletim RDO lançado e enviado para validação.')
        : 'Rascunho de diário de obra atualizado localmente.';
      
      const newAudit: AuditLog = {
        id: `aud-evnt-${Date.now()}`,
        rdoId: record.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        timestamp: new Date().toISOString(),
        changes: [{ field: 'status', oldValue: exists ? 'N/A' : 'Criado', newValue: record.status }],
        justification: descriptionText,
        previousStatus: exitsPreviousStatus(record.id),
        newStatus: record.status
      };
      
      syncAndSaveAudits([newAudit, ...auditLogs]);
    }

    // Reset views
    setIsCreatingNewRdo(false);
    setEditingRdoId(null);
    setActiveTab('rdos');
  };

  const exitsPreviousStatus = (id: string): RdoStatus => {
    const orig = rdos.find(r => r.id === id);
    return orig ? orig.status : 'Rascunho';
  };

  // 2. Clear / Delete RDO
  const handleDeleteRdoRecord = (rdoId: string) => {
    const isConfirm = window.confirm('Deseja excluir definitivamente este rascunho de RDO? Esta ação não possui retorno.');
    if (isConfirm) {
      const filtered = rdos.filter(r => r.id !== rdoId);
      syncAndSaveRdos(filtered);
      
      // Clean target logs too for safety
      const filteredAuds = auditLogs.filter(a => a.rdoId !== rdoId);
      syncAndSaveAudits(filteredAuds);
    }
  };

  // 3. Workflow Status update with mandatory justification
  const handleUpdateStatus = (rdoId: string, newStatus: RdoStatus, justification: string, changes: ChangeLogItem[] = []) => {
    if (!currentUser) return;

    // Track original status
    const originalRdo = rdos.find(r => r.id === rdoId);
    if (!originalRdo) return;

    // Update state
    const modifiedRdos = rdos.map(r => {
      if (r.id === rdoId) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    syncAndSaveRdos(modifiedRdos);

    // Audit logs entry
    const audit: AuditLog = {
      id: `aud-evnt-${Date.now()}`,
      rdoId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      changes: changes,
      justification: justification,
      previousStatus: originalRdo.status,
      newStatus: newStatus
    };

    syncAndSaveAudits([audit, ...auditLogs]);
  };

  // 4. Glosa worker faturamento hours adjustment
  const handleAdjustWorkerHours = (rdoId: string, workerId: string, field: 'normalHours' | 'extraHours' | 'nightHours', newValue: number, justification: string) => {
    if (!currentUser) return;

    const originalRdo = rdos.find(r => r.id === rdoId);
    if (!originalRdo) return;

    const worker = originalRdo.workers.find(w => w.id === workerId);
    if (!worker) return;

    const oldValue = worker[field];

    // Alter hours in deep state
    const updatedRdos = rdos.map(r => {
      if (r.id === rdoId) {
        const revisedWorkers = r.workers.map(w => {
          if (w.id === workerId) {
            return { ...w, [field]: newValue };
          }
          return w;
        });
        return { ...r, workers: revisedWorkers };
      }
      return r;
    });

    syncAndSaveRdos(updatedRdos);

    // Audit changes logger
    const audit: AuditLog = {
      id: `aud-evnt-${Date.now()}`,
      rdoId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      changes: [{
        field: `Hora individual (${worker.name} - ${field})`,
        oldValue: `${oldValue}h`,
        newValue: `${newValue}h`
      }],
      justification: justification,
      previousStatus: originalRdo.status,
      newStatus: originalRdo.status // Stays approved but with glosa detail
    };

    renderAdjustmentLogStateChange(rdoId);
    syncAndSaveAudits([audit, ...auditLogs]);
  };

  // Re-render sub RDO tracking helper for adjustments
  const renderAdjustmentLogStateChange = (rdoId: string) => {
    // Just an internal reload cue
  };

  // Registers state helpers
  const handleAddCompany = (comp: Company) => {
    const updated = [...companies, comp];
    setCompanies(updated);
    localStorage.setItem('rdo_db_companies', JSON.stringify(updated));
  };

  const handleDeleteCompany = (id: string) => {
    const linked = contracts.some(c => c.companyId === id);
    if (linked) {
      alert('Erro: Esta empresa possui contratos ativos vinculados e não pode ser removida antes de desvincular o contrato.');
      return;
    }
    const filtered = companies.filter(c => c.id !== id);
    setCompanies(filtered);
    localStorage.setItem('rdo_db_companies', JSON.stringify(filtered));
  };

  const handleAddContract = (cnt: Contract) => {
    const updated = [...contracts, cnt];
    setContracts(updated);
    localStorage.setItem('rdo_db_contracts', JSON.stringify(updated));
  };

  const handleDeleteContract = (id: string) => {
    const linkedRdo = rdos.some(r => r.contractId === id);
    if (linkedRdo) {
      alert('Erro: Este contrato possui boletins RDO de campo já cadastrados e históricos arquivados e não pode ser excluído.');
      return;
    }
    const filtered = contracts.filter(c => c.id !== id);
    setContracts(filtered);
    localStorage.setItem('rdo_db_contracts', JSON.stringify(filtered));
  };

  const handleAddUser = (usr: User) => {
    const updated = [...usersList, usr];
    setUsersList(updated);
    localStorage.setItem('rdo_db_users', JSON.stringify(updated));
  };

  const handleDeleteUser = (id: string) => {
    const filtered = usersList.filter(u => u.id !== id);
    setUsersList(filtered);
    localStorage.setItem('rdo_db_users', JSON.stringify(filtered));
  };

  const handleCloseMeasurementPeriod = (contractId: string, companyId: string, startDate: string, endDate: string, adjustments: MeasurementAdjustment[]) => {
    // Measurements closed successfully dispatcher
  };

  // Quick navigation wrappers
  const handleSelectRdoView = (rdoId: string) => {
    setViewingRdoId(rdoId);
    setEditingRdoId(null);
    setIsCreatingNewRdo(false);
  };

  const handleInitRdoEdit = (rdoId: string) => {
    setEditingRdoId(rdoId);
    setViewingRdoId(null);
    setIsCreatingNewRdo(false);
  };

  const handleStartNewRdo = () => {
    setIsCreatingNewRdo(true);
    setEditingRdoId(null);
    setViewingRdoId(null);
  };

  const handleCancelRdoForm = () => {
    setIsCreatingNewRdo(false);
    setEditingRdoId(null);
  };

  // Strict Scope Isolation check
  const isContractor = currentUser?.role === 'contractor';
  const myCompanyId = currentUser?.companyId;

  const filteredRdos = isContractor 
    ? rdos.filter(r => r.companyId === myCompanyId)
    : rdos;

  const filteredCompanies = isContractor
    ? companies.filter(c => c.id === myCompanyId)
    : companies;

  const filteredContracts = isContractor
    ? contracts.filter(c => c.companyId === myCompanyId)
    : contracts;

  const filteredAuditLogs = isContractor
    ? auditLogs.filter(a => {
        const r = rdos.find(rdo => rdo.id === a.rdoId);
        return r && r.companyId === myCompanyId;
      })
    : auditLogs;

  const filteredUsersList = isContractor
    ? usersList.filter(u => u.companyId === myCompanyId)
    : usersList;

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginView
        usersList={usersList}
        companies={companies}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          localStorage.setItem('rdo_active_user_email', user.email);
          localStorage.setItem('rdo_is_logged_in', 'true');
        }}
        onRegisterUser={(user, newCompany) => {
          if (newCompany) {
            const updatedCompanies = [...companies, newCompany];
            setCompanies(updatedCompanies);
            localStorage.setItem('rdo_db_companies', JSON.stringify(updatedCompanies));
          }
          const updatedUsers = [...usersList, user];
          setUsersList(updatedUsers);
          localStorage.setItem('rdo_db_users', JSON.stringify(updatedUsers));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-gray-800" id="app-root-frame">
      
      {/* 1. SUPERIOR TOP BANNER (CLEAN & PROFESSIONAL) */}
      <div className="bg-slate-900 border-b border-slate-950 px-5 py-2.5 flex justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-355">
            Painel RDO - Base Operacional Integrada
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick local database reset */}
          <button
            onClick={handleResetSystem}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
            title="Deseja limpar todos os dados registrados?"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Limpar Banco Local</span>
          </button>
        </div>
      </div>

      {/* 2. MIDDLE VIEWPORT LAYOUT */}
      <div className="flex flex-col lg:flex-row grow">
        
        {/* SIDE BAR / LEFT NAVIGATOR */}
        <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-950 flex flex-col">
          {/* Logo brand */}
          <div className="p-6 border-b border-slate-950 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 shadow-lg text-white flex items-center justify-center font-bold text-lg rounded-xl">
              R
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">RDO & Medição</span>
              <span className="text-[10px] text-slate-450 block font-mono mt-0.5">Versão MVP 1.0</span>
            </div>
          </div>

          {/* Nav groups */}
          <nav className="p-4 grow space-y-1.5 text-xs font-semibold">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-3 pb-2">Principal</span>
            
            <button
              onClick={() => { setActiveTab('dashboard'); setViewingRdoId(null); handleCancelRdoForm(); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === 'dashboard' && !viewingRdoId && !isCreatingNewRdo && !editingRdoId
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard de Gestão</span>
            </button>

            <button
              onClick={() => { setActiveTab('rdos'); setViewingRdoId(null); handleCancelRdoForm(); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === 'rdos' || viewingRdoId || isCreatingNewRdo || editingRdoId
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Diários de Obra (RDO)</span>
            </button>

            <button
              onClick={() => { setActiveTab('medição'); setViewingRdoId(null); handleCancelRdoForm(); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === 'medição' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>Fechamento & Medição</span>
            </button>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-3 pt-5 pb-2">Configurações</span>

            {currentUser && currentUser.role !== 'contractor' && (
              <button
                onClick={() => { setActiveTab('cadastros'); setViewingRdoId(null); handleCancelRdoForm(); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                  activeTab === 'cadastros' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Parâmetros & Cadastros</span>
              </button>
            )}

            <button
              onClick={() => { setActiveTab('relatórios'); setViewingRdoId(null); handleCancelRdoForm(); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === 'relatórios' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Relatórios e Auditoria</span>
            </button>
          </nav>

          {/* Current log bottom flag */}
          {currentUser && (
            <div className="p-4 border-t border-slate-950 bg-slate-900/60 text-xs flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  {currentUser.name[0]}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate text-[11px]">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono mt-0.5">
                    {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'manager' ? 'Fiscal' : 'Contratada'}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 bg-slate-850 hover:bg-rose-950 hover:text-rose-350 text-slate-450 rounded-lg transition-colors cursor-pointer"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </aside>

        {/* WORKSPACE CENTRAL WORKPAD */}
        <main className="grow p-6 lg:p-8 overflow-y-auto max-w-full">
          
          {/* Overlay Detail View */}
          {viewingRdoId ? (() => {
            const rdoSpec = filteredRdos.find(r => r.id === viewingRdoId);
            return rdoSpec ? (
              <RdoDetailView
                rdo={rdoSpec}
                companies={filteredCompanies}
                contracts={filteredContracts}
                currentUser={currentUser!}
                auditLogs={filteredAuditLogs}
                onBack={() => setViewingRdoId(null)}
                onUpdateStatus={handleUpdateStatus}
                onAdjustWorkerHours={handleAdjustWorkerHours}
              />
            ) : (
              <div className="p-4 text-center">Ficha RDO não encontrada ou restrita.</div>
            );
          })() : editingRdoId ? (() => {
            const rdoSpecEdit = filteredRdos.find(r => r.id === editingRdoId);
            return rdoSpecEdit ? (
              <RdoFormView
                rdoToEdit={rdoSpecEdit}
                companies={filteredCompanies}
                contracts={filteredContracts}
                currentUser={currentUser!}
                onSave={handleSaveRdoRecord}
                onCancel={handleCancelRdoForm}
              />
            ) : (
              <div className="p-4 text-center">RDO não encontrado para edição ou restrito.</div>
            );
          })() : isCreatingNewRdo ? (
            <RdoFormView
              companies={filteredCompanies}
              contracts={filteredContracts}
              currentUser={currentUser!}
              onSave={handleSaveRdoRecord}
              onCancel={handleCancelRdoForm}
            />
          ) : (
            // Regular Tabs Switcher
            <div id="tabs-central-hub animate-fadeIn">
              {activeTab === 'dashboard' && (
                <DashboardView
                  rdos={filteredRdos}
                  companies={filteredCompanies}
                  contracts={filteredContracts}
                  onSelectTab={setActiveTab}
                  onViewRdo={handleSelectRdoView}
                />
              )}

              {activeTab === 'rdos' && (
                <RdoListView
                  rdos={filteredRdos}
                  companies={filteredCompanies}
                  contracts={filteredContracts}
                  currentUser={currentUser!}
                  onViewRdo={handleSelectRdoView}
                  onEditRdo={handleInitRdoEdit}
                  onDeleteRdo={handleDeleteRdoRecord}
                  onNewRdo={handleStartNewRdo}
                />
              )}

              {activeTab === 'medição' && (
                <MeasurementView
                  rdos={filteredRdos}
                  companies={filteredCompanies}
                  contracts={filteredContracts}
                  currentUser={currentUser!}
                  onCloseMeasurement={handleCloseMeasurementPeriod}
                  onUpdateRdoStatus={(id, st) => handleUpdateStatus(id, st, 'Fechamento de medição mensal automática.')}
                />
              )}

              {activeTab === 'cadastros' && (
                <RegistrationView
                  companies={filteredCompanies}
                  contracts={filteredContracts}
                  usersList={filteredUsersList}
                  currentUser={currentUser!}
                  onAddCompany={handleAddCompany}
                  onAddContract={handleAddContract}
                  onAddUser={handleAddUser}
                  onDeleteCompany={handleDeleteCompany}
                  onDeleteContract={handleDeleteContract}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === 'relatórios' && (
                <ReportsView
                  rdos={filteredRdos}
                  companies={filteredCompanies}
                  contracts={filteredContracts}
                  auditLogs={filteredAuditLogs}
                  currentUser={currentUser!}
                />
              )}
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
