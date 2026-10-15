import React, { useState } from "react";
import { AuthUser } from "../types";
import { safeFetchJson } from "../lib/api";

interface ConsoleLoginProps {
  onLoginSuccess: (token: string, user: AuthUser) => void;
  onCancel?: () => void;
}

export const ConsoleLogin: React.FC<ConsoleLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await safeFetchJson<{
        success: boolean;
        token?: string;
        user?: AuthUser;
        error?: string;
        message?: string;
      }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (res.ok && res.data?.success && res.data.token && res.data.user) {
        onLoginSuccess(res.data.token, res.data.user);
      } else {
        setErrorMsg(res.data?.error || res.error || "Credenciais inválidas. Verifique seu usuário e senha.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão com o servidor de autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 max-w-md mx-auto w-full">
      {/* Brand Icon */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-lg shadow-sky-500/10">
          <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
        </div>
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0e18]" title="Acesso protegido" />
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
          <span>Acesso Protegido</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-[#dfe2f1]">Console de Gerenciamento</h3>
        <p className="text-xs text-slate-500 dark:text-[#87929a] mt-1 max-w-xs">
          Autentique-se com seu usuário e senha cadastrados para acessar o console da estação.
        </p>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="w-full mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-base text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5">error</span>
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-700 dark:text-[#bdc8d1] mb-1.5">
            Usuário ou E-mail
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 dark:text-[#87929a] text-lg pointer-events-none">
              person
            </span>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Digite seu usuário ou e-mail"
              autoComplete="username"
              required
              className="w-full bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#3e484f]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-[#dfe2f1] placeholder:text-slate-400 dark:placeholder:text-[#525a66] focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-500/50 focus:border-sky-500 transition-all font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono font-medium text-slate-700 dark:text-[#bdc8d1]">
              Senha de Acesso
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] font-mono text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors cursor-pointer"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 dark:text-[#87929a] text-lg pointer-events-none">
              lock
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              className="w-full bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#3e484f]/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-[#dfe2f1] placeholder:text-slate-400 dark:placeholder:text-[#525a66] focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-sky-500/50 focus:border-sky-500 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-[#87929a] dark:hover:text-[#dfe2f1] transition-colors cursor-pointer"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Autenticando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">login</span>
              <span>Entrar no Console</span>
            </>
          )}
        </button>
      </form>

      {/* Security note & Close */}
      <div className="mt-6 flex items-center justify-between w-full text-[11px] text-slate-500 dark:text-[#87929a]">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">shield</span>
          Sessão segura
        </span>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-800 dark:text-[#87929a] dark:hover:text-[#dfe2f1] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
