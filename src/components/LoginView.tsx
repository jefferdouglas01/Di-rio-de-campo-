/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, HardHat } from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  usersList: User[];
  onLoginSuccess: (user: User) => void;
}

export function LoginView({ usersList, onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const matchedUser = usersList.find(u => u.email.trim().toLowerCase() === trimmedEmail);

    if (!matchedUser) {
      setError('Credenciais incorretas ou usuário inexistente.');
      return;
    }

    // Default password 'admin' for usr-admin, or '123456' as fallback, or custom saved passwords
    const userPassword = matchedUser.password || (matchedUser.role === 'admin' ? 'admin' : '123456');

    if (password !== userPassword) {
      setError('Senha incorreta. Verifique os dados digitados.');
      return;
    }

    if (!matchedUser.active) {
      setError('Esta conta foi desativada. Entre em contato com o administrador.');
      return;
    }

    // Login successful
    onLoginSuccess(matchedUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-gray-100 font-sans" id="login-frame">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full" />

        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl items-center justify-center ring-1 ring-blue-500/20 mx-auto">
            <HardHat className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-sans font-extrabold tracking-tight text-white block">
            RDO & Medições
          </h1>
          <p className="text-xs text-slate-400">
            Relatório Diário de Obra & Operações Integrado
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: admin@rdo.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-bold text-xs shadow-lg shadow-blue-500/10 cursor-pointer transition-all duration-150 active:scale-[0.98]"
          >
            Acessar Sistema
          </button>
        </form>

        {/* Demo Accounts Callout Section */}
        <div className="border-t border-slate-900 pt-5 space-y-3">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
              Acesso Inicial Administrador
            </span>
            <div className="mt-2 space-y-1 text-slate-350">
              <p className="text-xs flex justify-between">
                <span className="font-medium text-slate-400">Usuário:</span>
                <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[11px] select-all border border-slate-800">admin@rdo.com</span>
              </p>
              <p className="text-xs flex justify-between">
                <span className="font-medium text-slate-400">Senha:</span>
                <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[11px] select-all border border-slate-800">admin</span>
              </p>
            </div>
            <span className="text-[10px] text-indigo-400 mt-2.5 block leading-relaxed">
              * Nota: Use esta conta para criar contratos, empresas e novos usuários autenticados.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
