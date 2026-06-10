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
  onResetPassword?: (email: string, password: string) => Promise<boolean>;
}

export function LoginView({ usersList, onLoginSuccess, onRegisterUser, onResetPassword }: LoginViewProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Password reset states
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(null);

    const emailLower = resetEmail.trim().toLowerCase();
    if (!emailLower || !resetNewPassword || !resetConfirmPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (resetNewPassword.length < 4) {
      setError('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    const matchedUser = usersList.find(u => u.email.trim().toLowerCase() === emailLower);
    if (!matchedUser) {
      setError('Este endereço de e-mail não foi encontrado no sistema.');
      return;
    }

    if (onResetPassword) {
      const success = await onResetPassword(emailLower, resetNewPassword);
      if (success) {
        setResetSuccess('Sua senha foi redefinida com sucesso! Prossiga para realizar o login.');
        setResetEmail('');
        setResetNewPassword('');
        setResetConfirmPassword('');
      } else {
        setError('Ocorreu um erro ao atualizar a senha no banco de dados. Tente novamente.');
      }
    } else {
      matchedUser.password = resetNewPassword;
      setResetSuccess('Sua senha foi redefinida localmente com sucesso! Prossiga para realizar o login.');
      setResetEmail('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    }
  };

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
          <h1 className="text-2xl font-sans font-extrabold tracking-tight text-white block font-sans">
            RDO APP
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

        {isResettingPassword ? (
          // ================= FORGOT PASSWORD SUB-FORM =================
          <form onSubmit={handleResetPassword} className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  setIsResettingPassword(false);
                  setError(null);
                  setResetSuccess(null);
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                title="Voltar ao Login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Redefinir Senha de Acesso</span>
            </div>

            {resetSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seu E-mail Cadastrado *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Ex: seu-email@empresa.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nova Senha de Acesso *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmar Nova Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold text-xs shadow-lg shadow-blue-500/10 cursor-pointer transition-all duration-150 active:scale-[0.98]"
            >
              Gravar Nova Senha
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResettingPassword(false);
                  setError(null);
                  setResetSuccess(null);
                }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer hover:underline"
              >
                Voltar para a tela de Login
              </button>
            </div>
          </form>
        ) : !isRegistering ? (
          // ================= LOGIN SUB-FORM =================
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Informação destacada sobre a necessidade de e-mail válido */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 leading-relaxed flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> O acesso ao sistema requer o preenchimento obrigatório do seu <strong>endereço de e-mail cadastrado</strong> e senha de acesso.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>E-mail Cadastrado</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: seu-email@empresa.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-xs text-white outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Senha de Acesso</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(true);
                    setError(null);
                    setResetSuccess(null);
                  }}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
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
      </div>
    </div>
  );
}
