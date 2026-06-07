/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, HardHat, User as UserIcon, UserPlus, ArrowLeft, ShieldAlert } from 'lucide-react';
import { User, Company } from '../types';

interface LoginViewProps {
  usersList: User[];
  companies: Company[];
  onLoginSuccess: (user: User) => void;
  onRegisterUser: (user: User) => void;
}

export function LoginView({ usersList, onLoginSuccess, onRegisterUser }: LoginViewProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

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

    const userPassword = matchedUser.password || (matchedUser.role === 'admin' ? 'admin' : '123456');

    if (password !== userPassword) {
      setError('Senha incorreta. Verifique os dados digitados.');
      return;
    }

    if (!matchedUser.active) {
      setError('Esta conta foi desativada. Entre em contato com o administrador.');
      return;
    }

    onLoginSuccess(matchedUser);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Inputs Validation
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (regPassword.length < 4) {
      setError('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    const emailLower = regEmail.trim().toLowerCase();
    const exists = usersList.some(u => u.email.trim().toLowerCase() === emailLower);
    if (exists) {
      setError('Este endereço de e-mail já está cadastrado.');
      return;
    }

    // Assemble new user payload with pending role
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      email: emailLower,
      role: 'pending',
      active: true,
      password: regPassword
    };

    onRegisterUser(newUser);
    
    // Automatically login newly created account
    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 text-gray-100 font-sans" id="login-frame">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden my-8">
        
        {/* Decorative dynamic neon bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

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

        {!isRegistering ? (
          // ================= LOGIN SUB-FORM =================
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: admin@rdo.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold text-xs shadow-lg shadow-blue-500/10 cursor-pointer transition-all duration-150 active:scale-[0.98]"
            >
              Acessar Sistema
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError(null);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <UserPlus className="w-4 h-4" />
                Criar seu próprio login com e-mail e senha
              </button>
            </div>
          </form>
        ) : (
          // ================= REGISTRATION SUB-FORM =================
          <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError(null);
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
                title="Voltar ao Login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cadastro de Novo Usuário</span>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 leading-relaxed flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Por motivos de segurança, novos logins cadastrados entram inicialmente com nível <strong>Pendente</strong>. O administrador designado do sistema deverá conceder os papéis e permissões no painel de configurações para liberar seu acesso operacional.</span>
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo *</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail Operacional *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Ex: joao@empresa.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-semibold text-xs shadow-lg shadow-emerald-500/10 cursor-pointer transition-all duration-150 active:scale-[0.98]"
            >
              Criar Conta e Confirmar Registro
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer hover:underline"
              >
                Já possui uma conta criada? Fazer Login
              </button>
            </div>
          </form>
        )}

        {/* Demo Accounts Callout Section */}
        {!isRegistering && (
          <div className="border-t border-slate-900 pt-5 space-y-3">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
                Acesso Inicial Administrador Padrão
              </span>
              <div className="mt-2 space-y-1 text-slate-350 font-sans">
                <p className="text-xs flex justify-between">
                  <span className="font-medium text-slate-400">E-mail:</span>
                  <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[11px] select-all border border-slate-800">admin@rdo.com</span>
                </p>
                <p className="text-xs flex justify-between">
                  <span className="font-medium text-slate-400">Senha:</span>
                  <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[11px] select-all border border-slate-800">admin</span>
                </p>
              </div>
              <span className="text-[10px] text-indigo-400 mt-2.5 block leading-relaxed">
                * Nota: Para testar a funcionalidade completa de aprovação, você pode criar uma nova conta e depois entrar como Administrador Geral para conceder as devidas permissões!
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
