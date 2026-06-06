/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Company, Contract, RdoRecord, AuditLog } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Administrador Geral',
    email: 'admin@rdo.com',
    role: 'admin',
    active: true,
    password: 'admin' // Senha padrão para login inicial
  }
];

export const INITIAL_COMPANIES: Company[] = [];

export const INITIAL_CONTRACTS: Contract[] = [];

export const INITIAL_RDOS: RdoRecord[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
