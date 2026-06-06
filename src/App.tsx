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
    if (localUsers) {
      const parsedUsers = JSON.parse(localUsers) as User[];
      setUsersList(parsedUsers);
      
      // Select the first active user
      const savedUserEmail = localStorage.getItem('rdo_active_user_email');
      const found = parsedUsers.find(u => u.email === savedUserEmail) || parsedUsers[0];
      setCurrentUser(found);
    } else {
      setUsersList(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]); // Starts as Admin
      localStorage.setItem('rdo_db_users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('rdo_active_user_email', INITIAL_USERS[0].email);
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
    const isConfirm = window.confirm('Tem certeza de que deseja resetar os dados de simulação? Todas as suas alterações locais serão sobrepostas pelos dados iniciais padrão.');
    if (isConfirm) {
      localStorage.clear();
      setRdos(INITIAL_RDOS);
      setCompanies(INITIAL_COMPANIES);
      setContracts(INITIAL_CONTRACTS);
      setUsersList(INITIAL_USERS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setCurrentUser(INITIAL_USERS[0]);
      setActiveTab('dashboard');
      setViewingRdoId(null);
      setEditingRdoId(null);
      setIsCreatingNewRdo(false);
      localStorage.setItem('rdo_db_rdos', JSON.stringify(INITIAL_RDOS));
      localStorage.setItem('rdo_db_companies', JSON.stringify(INITIAL_COMPANIES));
      localStorage.setItem('rdo_db_contracts', JSON.stringify(INITIAL_CONTRACTS));
      localStorage.setItem('rdo_db_users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('rdo_db_audits', JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem('rdo_active_user_email', INITIAL_USERS[0].email);
      alert('Sistema resetado com sucesso!');
    }
  };

  // Switch Active Tester Role
  const handleRoleSwitch = (email: string) => {
    const match = usersList.find(u => u.email === email);
    if (match) {
      setCurrentUser(match);
      localStorage.setItem('rdo_active_user_email', email);
      
      // Close forms/details to avoid authorization state issues
      setViewingRdoId(null);
      setEditingRdoId(null);
      setIsCreatingNewRdo(false);
      
      // Re-route if the contractor switches
      if (match.role === 'contractor' && activeTab === 'cadastros') {
        setActiveTab('dashboard');
      }
    }
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

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-gray-800" id="app-root-frame">
      
      {/* 1. SUPERIOR TOP TESTER BANNER */}
      <div className="bg-slate-900 border-b border-slate-950 px-5 py-2 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-300">
            Ambiente Demonstrativo Multidisciplinar (Controle de Perfis)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-slate-400">Ver como usuário:</span>
          {currentUser && (
            <select
              value={currentUser.email}
              onChange={(e) => handleRoleSwitch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-[11px] text-white p-1 rounded-md outline-hidden font-bold cursor-pointer hover:bg-slate-750"
              id="role-tester-switcher"
            >
              {usersList.map((usr) => (
                <option key={usr.id} value={usr.email}>
                  {usr.name} — ({usr.role.toUpperCase()})
                </option>
              ))}
            </select>
          )}

          {/* Quick seed reinstaller */}
          <button
            onClick={handleResetSystem}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
            title="Recomeçar simulação do estado inicial"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Resetar Dados</span>
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
            <div className="p-4 border-t border-slate-950 bg-slate-950/20 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                  {currentUser.name[0]}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">{currentUser.name}</span>
                  <span className="text-[10px] text-gray-400 block uppercase font-mono mt-0.5">{currentUser.role}</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* WORKSPACE CENTRAL WORKPAD */}
        <main className="grow p-6 lg:p-8 overflow-y-auto max-w-full">
          
          {/* Overlay Detail View */}
          {viewingRdoId ? (() => {
            const rdoSpec = rdos.find(r => r.id === viewingRdoId);
            return rdoSpec ? (
              <RdoDetailView
                rdo={rdoSpec}
                companies={companies}
                contracts={contracts}
                currentUser={currentUser!}
                auditLogs={auditLogs}
                onBack={() => setViewingRdoId(null)}
                onUpdateStatus={handleUpdateStatus}
                onAdjustWorkerHours={handleAdjustWorkerHours}
              />
            ) : (
              <div className="p-4 text-center">Ficha RDO não encontrada.</div>
            );
          })() : editingRdoId ? (() => {
            const rdoSpecEdit = rdos.find(r => r.id === editingRdoId);
            return (
              <RdoFormView
                rdoToEdit={rdoSpecEdit}
                companies={companies}
                contracts={contracts}
                currentUser={currentUser!}
                onSave={handleSaveRdoRecord}
                onCancel={handleCancelRdoForm}
              />
            );
          })() : isCreatingNewRdo ? (
            <RdoFormView
              companies={companies}
              contracts={contracts}
              currentUser={currentUser!}
              onSave={handleSaveRdoRecord}
              onCancel={handleCancelRdoForm}
            />
          ) : (
            // Regular Tabs Switcher
            <div id="tabs-central-hub animate-fadeIn">
              {activeTab === 'dashboard' && (
                <DashboardView
                  rdos={rdos}
                  companies={companies}
                  contracts={contracts}
                  onSelectTab={setActiveTab}
                  onViewRdo={handleSelectRdoView}
                />
              )}

              {activeTab === 'rdos' && (
                <RdoListView
                  rdos={rdos}
                  companies={companies}
                  contracts={contracts}
                  currentUser={currentUser!}
                  onViewRdo={handleSelectRdoView}
                  onEditRdo={handleInitRdoEdit}
                  onDeleteRdo={handleDeleteRdoRecord}
                  onNewRdo={handleStartNewRdo}
                />
              )}

              {activeTab === 'medição' && (
                <MeasurementView
                  rdos={rdos}
                  companies={companies}
                  contracts={contracts}
                  currentUser={currentUser!}
                  onCloseMeasurement={handleCloseMeasurementPeriod}
                  onUpdateRdoStatus={(id, st) => handleUpdateStatus(id, st, 'Fechamento de medição mensal automática.')}
                />
              )}

              {activeTab === 'cadastros' && (
                <RegistrationView
                  companies={companies}
                  contracts={contracts}
                  usersList={usersList}
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
                  rdos={rdos}
                  companies={companies}
                  contracts={contracts}
                  auditLogs={auditLogs}
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
