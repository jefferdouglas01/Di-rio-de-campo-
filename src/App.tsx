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

// Firebase Firestore Imports
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: message,
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Exibir feedback visual para o usuário sobre falhas no banco
  let userAlert = `Erro na operação de banco de dados (${operationType}).`;
  if (message.includes('permission') || message.includes('Permissions')) {
    userAlert += '\n\nPermissão insuficiente ou regras de segurança ativas impediram esta ação.';
  } else {
    userAlert += `\n\nDetalhes: ${message}`;
  }
  alert(userAlert);
}

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
  Database,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  
  // Primary Databases state backed by Firestore real-time listeners and LocalStorage cache fallback
  const [rdos, setRdos] = useState<RdoRecord[]>(() => {
    const local = localStorage.getItem('rdo_db_rdos');
    return local ? JSON.parse(local) : INITIAL_RDOS;
  });
  
  const [companies, setCompanies] = useState<Company[]>(() => {
    const local = localStorage.getItem('rdo_db_companies');
    return local ? JSON.parse(local) : INITIAL_COMPANIES;
  });
  
  const [contracts, setContracts] = useState<Contract[]>(() => {
    const local = localStorage.getItem('rdo_db_contracts');
    return local ? JSON.parse(local) : INITIAL_CONTRACTS;
  });
  
  const [usersList, setUsersList] = useState<User[]>(() => {
    const local = localStorage.getItem('rdo_db_users');
    return local ? JSON.parse(local) : INITIAL_USERS;
  });
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const local = localStorage.getItem('rdo_db_audits');
    return local ? JSON.parse(local) : INITIAL_AUDIT_LOGS;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('rdo_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const localUsers = localStorage.getItem('rdo_db_users');
    const uList = localUsers ? (JSON.parse(localUsers) as User[]) : INITIAL_USERS;
    const email = localStorage.getItem('rdo_active_user_email');
    const isLg = localStorage.getItem('rdo_is_logged_in') === 'true';
    if (isLg && email) {
      return uList.find(u => u.email === email) || null;
    }
    return null;
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewingRdoId, setViewingRdoId] = useState<string | null>(null);
  const [editingRdoId, setEditingRdoId] = useState<string | null>(null);
  const [isCreatingNewRdo, setIsCreatingNewRdo] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Real-time synchronization listeners with Firestore
  useEffect(() => {
    // 1. Sync Companies
    const unsubCompanies = onSnapshot(collection(db, 'companies'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_COMPANIES.forEach((comp) => {
          setDoc(doc(db, 'companies', comp.id), comp).catch(e => console.error(e));
        });
      } else {
        const comps: Company[] = [];
        snapshot.forEach((doc) => {
          comps.push(doc.data() as Company);
        });
        setCompanies(comps);
        localStorage.setItem('rdo_db_companies', JSON.stringify(comps));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'companies');
    });

    // 2. Sync Contracts
    const unsubContracts = onSnapshot(collection(db, 'contracts'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_CONTRACTS.forEach((cnt) => {
          setDoc(doc(db, 'contracts', cnt.id), cnt).catch(e => console.error(e));
        });
      } else {
        const cnts: Contract[] = [];
        snapshot.forEach((doc) => {
          cnts.push(doc.data() as Contract);
        });
        setContracts(cnts);
        localStorage.setItem('rdo_db_contracts', JSON.stringify(cnts));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contracts');
    });

    // 3. Sync Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_USERS.forEach((usr) => {
          setDoc(doc(db, 'users', usr.id), usr).catch(e => console.error(e));
        });
      } else {
        const usrs: User[] = [];
        snapshot.forEach((doc) => {
          usrs.push(doc.data() as User);
        });
        setUsersList(usrs);
        localStorage.setItem('rdo_db_users', JSON.stringify(usrs));

        // Automatically update current logged-in user profile if it changed on server
        const email = localStorage.getItem('rdo_active_user_email');
        const isLg = localStorage.getItem('rdo_is_logged_in') === 'true';
        if (isLg && email) {
          const matched = usrs.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
          if (matched) {
            setCurrentUser(matched);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 4. Sync RDOS
    const unsubRdos = onSnapshot(collection(db, 'rdos'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_RDOS.forEach((rdo) => {
          setDoc(doc(db, 'rdos', rdo.id), rdo).catch(e => console.error(e));
        });
      } else {
        const rList: RdoRecord[] = [];
        snapshot.forEach((doc) => {
          rList.push(doc.data() as RdoRecord);
        });
        rList.sort((a, b) => b.date.localeCompare(a.date));
        setRdos(rList);
        localStorage.setItem('rdo_db_rdos', JSON.stringify(rList));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rdos');
    });

    // 5. Sync Audits
    const unsubAudits = onSnapshot(collection(db, 'audits'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_AUDIT_LOGS.forEach((aud) => {
          setDoc(doc(db, 'audits', aud.id), aud).catch(e => console.error(e));
        });
      } else {
        const auds: AuditLog[] = [];
        snapshot.forEach((doc) => {
          auds.push(doc.data() as AuditLog);
        });
        auds.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setAuditLogs(auds);
        localStorage.setItem('rdo_db_audits', JSON.stringify(auds));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audits');
    });

    return () => {
      unsubCompanies();
      unsubContracts();
      unsubUsers();
      unsubRdos();
      unsubAudits();
    };
  }, []);

  // Central Database re-seeding mechanism (restricted to super admin only)
  const handleResetSystem = async () => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: apenas o Administrador Geral possui permissão para limpar o banco central.');
      return;
    }
    const isConfirm = window.confirm('Tem certeza de que deseja resetar os dados no Firestore? Todas as alterações de todas as empresas e dispositivos serão limpas e redefinidas para os dados iniciais.');
    if (isConfirm) {
      try {
        const collectionsToReset = ['rdos', 'companies', 'contracts', 'users', 'audits'];
        
        for (const colName of collectionsToReset) {
          const snap = await getDocs(collection(db, colName));
          for (const docItem of snap.docs) {
            await deleteDoc(doc(db, colName, docItem.id));
          }
        }

        for (const comp of INITIAL_COMPANIES) {
          await setDoc(doc(db, 'companies', comp.id), comp);
        }
        for (const cnt of INITIAL_CONTRACTS) {
          await setDoc(doc(db, 'contracts', cnt.id), cnt);
        }
        for (const usr of INITIAL_USERS) {
          await setDoc(doc(db, 'users', usr.id), usr);
        }
        for (const rdo of INITIAL_RDOS) {
          await setDoc(doc(db, 'rdos', rdo.id), rdo);
        }
        for (const aud of INITIAL_AUDIT_LOGS) {
          await setDoc(doc(db, 'audits', aud.id), aud);
        }

        localStorage.clear();
        setCurrentUser(null);
        setIsLoggedIn(false);
        setActiveTab('dashboard');
        setViewingRdoId(null);
        setEditingRdoId(null);
        setIsCreatingNewRdo(false);

        alert('Banco central de dados sincronizado e resetado com sucesso para todos os dispositivos!');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'central_reset');
        alert('Ocorreu um erro ao redefinir os dados corporativos no Firestore.');
      }
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

  // CRUD DISPATCHERS WITH REALTIME FIRESTORE UPDATE

  // 1. Save or Create RDO
  const handleSaveRdoRecord = async (record: RdoRecord, isCommit: boolean) => {
    const exists = rdos.some(r => r.id === record.id);
    try {
      await setDoc(doc(db, 'rdos', record.id), record);

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
        
        await setDoc(doc(db, 'audits', newAudit.id), newAudit);
      }

      setIsCreatingNewRdo(false);
      setEditingRdoId(null);
      setActiveTab('rdos');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `rdos/${record.id}`);
    }
  };

  const exitsPreviousStatus = (id: string): RdoStatus => {
    const orig = rdos.find(r => r.id === id);
    return orig ? orig.status : 'Rascunho';
  };

  // 2. Clear / Delete RDO
  const handleDeleteRdoRecord = async (rdoId: string) => {
    const isConfirm = window.confirm('Deseja excluir definitivamente este rascunho de RDO? Esta ação não possui retorno.');
    if (isConfirm) {
      try {
        await deleteDoc(doc(db, 'rdos', rdoId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `rdos/${rdoId}`);
      }
    }
  };

  // 3. Workflow Status update with mandatory justification
  const handleUpdateStatus = async (rdoId: string, newStatus: RdoStatus, justification: string, changes: ChangeLogItem[] = []) => {
    if (!currentUser) return;

    const originalRdo = rdos.find(r => r.id === rdoId);
    if (!originalRdo) return;

    try {
      await setDoc(doc(db, 'rdos', rdoId), { ...originalRdo, status: newStatus });

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

      await setDoc(doc(db, 'audits', audit.id), audit);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rdos/${rdoId}`);
    }
  };

  // 4. Glosa worker faturamento hours adjustment
  const handleAdjustWorkerHours = async (rdoId: string, workerId: string, field: 'normalHours' | 'extraHours' | 'nightHours', newValue: number, justification: string) => {
    if (!currentUser) return;

    const originalRdo = rdos.find(r => r.id === rdoId);
    if (!originalRdo) return;

    const worker = originalRdo.workers.find(w => w.id === workerId);
    if (!worker) return;

    const oldValue = worker[field];

    try {
      const revisedWorkers = originalRdo.workers.map(w => {
        if (w.id === workerId) {
          return { ...w, [field]: newValue };
        }
        return w;
      });

      await setDoc(doc(db, 'rdos', rdoId), { ...originalRdo, workers: revisedWorkers });

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
        newStatus: originalRdo.status
      };

      renderAdjustmentLogStateChange(rdoId);
      await setDoc(doc(db, 'audits', audit.id), audit);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rdos/${rdoId}`);
    }
  };

  const renderAdjustmentLogStateChange = (rdoId: string) => {
    // Just an internal reload cue
  };

  // Registers state helpers backed by Firestore
  const handleAddCompany = async (comp: Company) => {
    try {
      await setDoc(doc(db, 'companies', comp.id), comp);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `companies/${comp.id}`);
    }
  };

  const handleUpdateCompany = async (updatedCompany: Company) => {
    try {
      await setDoc(doc(db, 'companies', updatedCompany.id), updatedCompany);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `companies/${updatedCompany.id}`);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    const linked = contracts.some(c => c.companyId === id);
    if (linked) {
      alert('Erro: Esta empresa possui contratos ativos vinculados e não pode ser removida antes de desvincular o contrato.');
      return;
    }
    const isConfirm = window.confirm('Deseja realmente excluir esta empresa cadastrada? Esta ação é irreversível.');
    if (!isConfirm) return;
    try {
      await deleteDoc(doc(db, 'companies', id));
      alert('Empresa removida com sucesso!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `companies/${id}`);
    }
  };

  const handleAddContract = async (cnt: Contract) => {
    try {
      await setDoc(doc(db, 'contracts', cnt.id), cnt);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `contracts/${cnt.id}`);
    }
  };

  const handleUpdateContract = async (updatedContract: Contract) => {
    try {
      await setDoc(doc(db, 'contracts', updatedContract.id), updatedContract);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `contracts/${updatedContract.id}`);
    }
  };

  const handleDeleteContract = async (id: string) => {
    const linkedRdo = rdos.some(r => r.contractId === id);
    if (linkedRdo) {
      alert('Erro: Este contrato possui boletins RDO de campo já cadastrados e históricos arquivados e não pode ser excluído.');
      return;
    }
    const isConfirm = window.confirm('Deseja realmente excluir este contrato cadastrado? Esta ação é irreversível.');
    if (!isConfirm) return;
    try {
      await deleteDoc(doc(db, 'contracts', id));
      alert('Contrato excluído com sucesso!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `contracts/${id}`);
    }
  };

  const handleAddUser = async (usr: User) => {
    try {
      await setDoc(doc(db, 'users', usr.id), usr);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${usr.id}`);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await setDoc(doc(db, 'users', updatedUser.id), updatedUser);
      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${updatedUser.id}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const isConfirm = window.confirm('Deseja realmente remover o acesso de usuário deste profissional?');
    if (!isConfirm) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      alert('Usuário removido do sistema!');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
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
        onRegisterUser={async (user) => {
          try {
            await setDoc(doc(db, 'users', user.id), user);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `users/${user.id}`);
          }
        }}
      />
    );
  }

  // Intercept pending user roles to show waiting/approval instructions page
  if (currentUser.role === 'pending') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 text-gray-100 font-sans">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-yellow-500" />
          
          <div className="mx-auto w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center ring-1 ring-amber-500/20 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-xl font-bold text-white">Solicitação Pendente</h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              Olá, <strong className="text-white">{currentUser.name}</strong>! Seu login corporativo foi criado com sucesso.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Por razões de segurança e integridade operacional, novos acessos requerem a atribuição de permissões pelo <strong>Administrador Geral</strong> do sistema.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sua conta com o e-mail <span className="font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-200 select-all">{currentUser.email}</span> está registrada.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-left text-xs space-y-2 mb-6 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passos para Aprovação:</span>
            <p className="text-[11px] text-slate-350 leading-relaxed">
              1. Entre em contato com seu gestor ou <strong>Administrador do Sistema</strong>.
            </p>
            <p className="text-[11px] text-slate-350 leading-relaxed">
              2. O administrador acessará o menu de <strong>Cadastros de Usuários</strong>, localizará sua conta pendente, ativará seu perfil (Administrador, Fiscal ou Contratada) e vinculará sua empresa correspondente.
            </p>
            <p className="text-[11px] text-slate-350 leading-relaxed font-semibold text-amber-400">
              3. Com a permissão concedida, basta recarregar a ferramenta ou fazer login novamente.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-705 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white rounded-xl py-2.5 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-gray-800" id="app-root-frame">
      
      {/* 1. SUPERIOR TOP BANNER (CLEAN & PROFESSIONAL) */}
      <div className="bg-slate-900 border-b border-slate-950 px-4 py-2 flex justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Hamburger button to trigger sidebar drawer on mobile/tablet */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer border border-slate-700/80 shrink-0"
            title="Navegação do Painel"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-slate-355 truncate">
            Painel RDO - Base Operacional Integrada
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick local database reset visible only for Administrator */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={handleResetSystem}
              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
              title="Deseja limpar todos os dados registrados?"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Limpar Banco Central</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MIDDLE VIEWPORT LAYOUT */}
      <div className="flex flex-col lg:flex-row grow relative">
        
        {/* Backdrop overlay for mobile drawer */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          />
        )}

        {/* SIDE BAR / LEFT NAVIGATOR */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-950 flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          {/* Logo brand */}
          <div className="p-6 border-b border-slate-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 shadow-lg text-white flex items-center justify-center font-bold text-lg rounded-xl">
                R
              </div>
              <div>
                <span className="font-extrabold text-white text-sm tracking-tight block">RDO & Medição</span>
                <span className="text-[10px] text-slate-450 block font-mono mt-0.5">Versão MVP 1.0</span>
              </div>
            </div>

            {/* Close sidebar button on mobile view */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md cursor-pointer transition-colors"
              title="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav groups */}
          <nav className="p-4 grow space-y-1.5 text-xs font-semibold">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-3 pb-2">Principal</span>
            
            <button
              onClick={() => { setActiveTab('dashboard'); setViewingRdoId(null); handleCancelRdoForm(); setIsSidebarOpen(false); }}
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
              onClick={() => { setActiveTab('rdos'); setViewingRdoId(null); handleCancelRdoForm(); setIsSidebarOpen(false); }}
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
              onClick={() => { setActiveTab('medição'); setViewingRdoId(null); handleCancelRdoForm(); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === 'medição' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>Fechamento & Medição</span>
            </button>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-3 pt-5 pb-2">Configurações</span>

            {currentUser && currentUser.role !== 'contractor' && (() => {
              const pendingUsersCount = usersList.filter(u => u.role === 'pending').length;
              return (
                <button
                  onClick={() => { setActiveTab('cadastros'); setViewingRdoId(null); handleCancelRdoForm(); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                    activeTab === 'cadastros' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="grow">Parâmetros & Cadastros</span>
                  {currentUser.role === 'admin' && pendingUsersCount > 0 && (
                    <span className="bg-amber-500 text-[10px] font-bold text-slate-950 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                      {pendingUsersCount}
                    </span>
                  )}
                </button>
              );
            })()}

            <button
              onClick={() => { setActiveTab('relatórios'); setViewingRdoId(null); handleCancelRdoForm(); setIsSidebarOpen(false); }}
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
                className="p-1.5 bg-slate-850 hover:bg-rose-955 hover:text-rose-350 text-slate-450 rounded-lg transition-colors cursor-pointer font-sans"
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
                  usersList={usersList}
                  currentUser={currentUser!}
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
                  onUpdateCompany={handleUpdateCompany}
                  onAddContract={handleAddContract}
                  onUpdateContract={handleUpdateContract}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
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
