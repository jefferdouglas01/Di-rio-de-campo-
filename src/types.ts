/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'contractor' | 'manager' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string; // If contractor, restricted to this company
  active: boolean;
  password?: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Contract {
  id: string;
  contractNumber: string;
  client: string;
  companyId: string;
  scope: string;
  startDate: string;
  endDate: string;
  measurementRegime: string; // e.g., "Horas Homem (H/H)", "Empreitada"
  rateRule: string; // e.g., "R$ 85,00/hora", "Fixo"
  costCenter: string;
  siteLocation: string;
}

export interface WorkerEntry {
  id: string;
  name: string;
  role: string;
  normalHours: number;
  extraHours: number;
  nightHours: number;
}

export interface EquipmentEntry {
  id: string;
  name: string;
  quantity: number;
  status: 'operando' | 'parado';
}

export type RdoStatus =
  | 'Rascunho'
  | 'Enviado'
  | 'Em análise'
  | 'Correção solicitada'
  | 'Corrigido'
  | 'Aprovado'
  | 'Reprovado'
  | 'Bloqueado para medição'
  | 'Medido';

export interface RdoRecord {
  id: string;
  date: string; // YYYY-MM-DD
  companyId: string;
  contractId: string;
  siteLocation: string;
  responsibleName: string;
  weather: 'sol' | 'chuva_parcial' | 'chuva_total' | 'nublado';
  shift: 'diurno' | 'noturno';
  activities: string;
  workers: WorkerEntry[];
  equipments: EquipmentEntry[];
  hasHseIncident: boolean;
  hseDetails?: string;
  interferences?: string;
  stoppages?: string;
  additionalRemarks?: string;
  attachments: string[]; // List of mock file names
  status: RdoStatus;
}

export interface ChangeLogItem {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface AuditLog {
  id: string;
  rdoId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string; // ISO string
  changes: ChangeLogItem[];
  justification: string;
  previousStatus: RdoStatus;
  newStatus: RdoStatus;
}

export interface MeasurementAdjustment {
  id: string;
  description: string;
  valueEffect: number; // e.g., positive or negative adjustments
  justification: string;
}

export interface MeasurementCycle {
  id: string;
  contractId: string;
  companyId: string;
  startDate: string;
  endDate: string;
  status: 'Aberta' | 'Fechada';
  rdoIds: string[];
  adjustments: MeasurementAdjustment[];
  closedAt?: string;
  closedBy?: string;
}
