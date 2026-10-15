import React, { useState } from "react";
import { AuthUser } from "../types";
import { EmaLogo } from "./EmaLogo";
import { formatTimeAgo } from "../lib/syncScheduler";

interface HeaderProps {
  onToggleTheme: () => void;
  isDark: boolean;
  onOpenBackendModal: () => void;
  onOpenAboutModal?: () => void;
  onOpenMonthlyMetricsModal?: () => void;
  onOpenYearlyMetricsModal?: () => void;
  onOpenHistoricalMetricsModal?: () => void;
  user: AuthUser | null;
  cacheHitRate: number;
  isPainelRoute?: boolean;
  onNavigateHome?: () => void;
  onNavigatePainel?: () => void;
  lastSyncTime?: Date | null;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleTheme,
  isDark,
  onOpenBackendModal,
  onOpenAboutModal,
  onOpenMonthlyMetricsModal,
  onOpenYearlyMetricsModal,
  onOpenHistoricalMetricsModal,
  user,
  cacheHitRate,
  isPainelRoute = false,
  onNavigateHome,
  onNavigatePainel,
  lastSyncTime,
  isSyncing = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a0e18]/95 backdrop-blur-xl border-b border-theme shadow-sm dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)] transition-colors">
      <div className="h-16 w-full max-w-full px-2.5 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Station Status */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigateHome) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
            title="Estação Meteorológica Agudos"
          >
            <EmaLogo isDark={isDark} className="h-7 sm:h-8.5 w-auto flex-shrink-0" />
            <span className="font-mono text-[13px] sm:text-[14px] font-medium tracking-tight text-slate-800 dark:text-[#dfe2f1] group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors truncate hidden min-[540px]:inline">
              Estação Automática
            </span>
          </a>

          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#262a35]/60 border border-theme flex-shrink-0"
            title="Sincronização configurada a cada 5 minutos (:20s após envio dos sensores ao banco de dados)"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isSyncing ? "bg-sky-500 opacity-90" : "bg-[#059669] dark:bg-[#45dfa4] opacity-75"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isSyncing ? "bg-sky-500" : "bg-[#059669] dark:bg-[#45dfa4]"
                }`}
              />
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-[#45dfa4] font-medium tracking-wide">
              {isSyncing ? "ATUALIZANDO..." : "ONLINE - EST-04"}
            </span>
            <span className="text-theme-muted font-mono text-[11px] ml-0.5">
              {formatTimeAgo(lastSyncTime ?? null)}
            </span>
          </div>

          {/* If on /painel, show Painel identifier and Redis stats */}
          {isPainelRoute && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[10px] sm:text-[11px] font-bold">
                /PAINEL
              </span>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30">
                <span className="w-2 h-2 rounded-full bg-[#0284c7] dark:bg-[#38bdf8] animate-pulse" />
                <span className="font-mono text-[11px] text-[#0284c7] dark:text-[#8ed5ff] font-medium">Redis: {cacheHitRate}% Hit</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Nav Bar with Consultas Dropdown */}
        <nav className="hidden lg:flex items-center gap-1">
          <a
            className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-[#262a35] text-[13px] font-medium transition-colors"
            href="#main-telemetry"
          >
            Início
          </a>

          {/* Dropdown Consultas */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0284c7] dark:bg-[#262a35] dark:hover:bg-[#313540] dark:text-[#8ed5ff] text-[13px] font-medium border border-slate-200/80 dark:border-transparent transition-all cursor-pointer"
              type="button"
            >
              <span>Consultas</span>
              <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 min-w-[680px]">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#171b26] border border-slate-200 dark:border-[#2e3440] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
                  <div className="grid grid-cols-3 gap-3">
                    {/* 1. Métricas Mês (Modal Exclusivo) */}
                    <button
                      type="button"
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all group cursor-pointer text-left w-full bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-500/30"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (onOpenMonthlyMetricsModal) {
                          onOpenMonthlyMetricsModal();
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center flex-shrink-0 text-[#0284c7] dark:text-[#38bdf8] border border-sky-200 dark:border-sky-500/40">
                        <span className="material-symbols-outlined text-xl text-[#0284c7] dark:text-[#38bdf8]">calendar_month</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0284c7] dark:group-hover:text-[#8ed5ff] transition-colors">Métricas Mês</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-500/30">MODAL</span>
                        </div>
                        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-tight mt-0.5">Todos os dias do mês, acumulado de chuva e extremos.</p>
                      </div>
                    </button>

                    {/* 2. Métricas Ano (Modal) */}
                    <button
                      type="button"
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-all group cursor-pointer text-left w-full bg-slate-50/70 dark:bg-amber-950/15 border border-slate-200/80 dark:border-amber-500/20"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (onOpenYearlyMetricsModal) {
                          onOpenYearlyMetricsModal();
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                        <span className="material-symbols-outlined text-xl text-amber-600 dark:text-amber-400">event</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Métricas Ano</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-500/30">MODAL</span>
                        </div>
                        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-tight mt-0.5">Consolidado anual, acumulados e balanço pluviométrico.</p>
                      </div>
                    </button>

                    {/* 3. Dados Históricos (Modal) */}
                    <button
                      type="button"
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 transition-all group cursor-pointer text-left w-full bg-slate-50/70 dark:bg-emerald-950/15 border border-slate-200/80 dark:border-emerald-500/20"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (onOpenHistoricalMetricsModal) {
                          onOpenHistoricalMetricsModal();
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-[#45dfa4] border border-emerald-200 dark:border-emerald-500/30">
                        <span className="material-symbols-outlined text-xl text-emerald-600 dark:text-[#45dfa4]">bar_chart</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-[#45dfa4] transition-colors">Dados Históricos</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30">MODAL</span>
                        </div>
                        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-tight mt-0.5">Série temporal contínua e relatórios meteorológicos.</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenAboutModal}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-[#262a35] text-[13px] font-medium transition-colors cursor-pointer"
            type="button"
          >
            Sobre nós
          </button>
        </nav>

        {/* Actions, Theme & Panel Control */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Mobile Consultas Trigger (< lg) */}
          <div className="lg:hidden relative flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-[#0284c7] dark:text-[#38bdf8] text-xs font-bold border border-sky-500/30 cursor-pointer active:scale-95 transition-transform"
              type="button"
              aria-label="Abrir menu de consultas"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span className="hidden min-[400px]:inline text-xs">Consultas</span>
            </button>

            {mobileMenuOpen && (
              <>
                {/* Backdrop to close when tapping outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="fixed inset-x-3 top-16 z-50 p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#131620] border border-slate-200 dark:border-[#2e3440] shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-theme">
                    <span className="font-bold text-xs text-theme-main">Menu de Consultas & Navegação</span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 rounded-lg text-theme-muted hover:text-theme-main cursor-pointer"
                      aria-label="Fechar menu"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {/* 1. Métricas Mês */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenMonthlyMetricsModal?.();
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-500/10 dark:bg-sky-950/40 text-left border border-sky-500/40 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8]">calendar_month</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0284c7] dark:text-[#38bdf8]">Métricas Mês</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300">MODAL</span>
                        </div>
                        <div className="text-[10px] text-theme-muted">Todos os dias e extremos do mês</div>
                      </div>
                    </button>

                    {/* 2. Métricas Ano */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenYearlyMetricsModal?.();
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1c202a] text-left border border-theme cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-amber-500">event</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-theme-main">Métricas Ano</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">MODAL</span>
                        </div>
                        <div className="text-[10px] text-theme-muted">Consolidado e acumulados anuais</div>
                      </div>
                    </button>

                    {/* 3. Dados Históricos */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenHistoricalMetricsModal?.();
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1c202a] text-left border border-theme cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-emerald-500">bar_chart</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-theme-main">Dados Históricos</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">MODAL</span>
                        </div>
                        <div className="text-[10px] text-theme-muted">Série temporal e relatórios meteorológicos</div>
                      </div>
                    </button>

                    {/* 4. Sobre nós (Mobile) */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAboutModal?.();
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1c202a] text-left border border-theme cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">info</span>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-theme-main">Sobre nós</span>
                        <div className="text-[10px] text-theme-muted">Informações da estação e especificações</div>
                      </div>
                    </button>

                    {/* 5. Console da Estação (Mobile) */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenBackendModal();
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-left border border-sky-300 dark:border-sky-500/30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8]">
                        {user ? "admin_panel_settings" : "account_circle"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0284c7] dark:text-[#38bdf8]">
                            {user ? `Console Logado (@${user.username || user.email})` : "Acessar Console da Estação"}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300">
                            {user ? user.role.toUpperCase() : "LOGIN"}
                          </span>
                        </div>
                        <div className="text-[10px] text-theme-muted">Painel de controle e configurações</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {isPainelRoute ? (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs dark:bg-[#171b26] dark:hover:bg-[#262a35] dark:text-slate-200 dark:border-[#2e3440] text-[11px] sm:text-[12px] font-medium transition-all cursor-pointer flex-shrink-0"
              title="Voltar ao monitoramento da estação"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">Voltar</span>
            </button>
          ) : null}

          {/* Theme Switcher Toggle - Mobile compact button (< sm) */}
          <button
            className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-[#171b26] border border-slate-200 dark:border-[#2e3440] text-slate-700 dark:text-[#38bdf8] shadow-xs active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            onClick={onToggleTheme}
            title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            type="button"
            aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Theme Switcher Toggle - Desktop segmented control (>= sm) */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#171b26] rounded-full p-0.5 border border-slate-200 dark:border-[#2e3440] shadow-xs flex-shrink-0">
            <button
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold transition-all cursor-pointer ${
                !isDark
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => isDark && onToggleTheme()}
              title="Ativar modo claro"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">light_mode</span>
              <span>CLARO</span>
            </button>
            <button
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold transition-all cursor-pointer ${
                isDark
                  ? "bg-[#262a35] text-[#38bdf8] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => !isDark && onToggleTheme()}
              title="Ativar modo escuro"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">dark_mode</span>
              <span>ESCURO</span>
            </button>
          </div>

          {/* User Profile / Status (People Button) */}
          <button
            onClick={onOpenBackendModal}
            className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center flex-shrink-0 shrink-0 transition-all cursor-pointer active:scale-95 shadow-sm ${
              user
                ? "bg-emerald-600 text-white ring-2 ring-emerald-500/30"
                : "bg-[#0284c7] hover:bg-[#0369a1] text-white dark:bg-[#38bdf8] dark:text-[#00354a] ring-2 ring-sky-500/20"
            }`}
            title={user ? `Usuário autenticado: @${user.username || user.email} (${user.role})` : "Login no Console da Estação"}
            aria-label={user ? `Console do Administrador (${user.username || user.email})` : "Login no Console da Estação"}
          >
            {user ? (
              <span className="font-mono text-xs font-bold uppercase">
                {user.username ? user.username.slice(0, 2) : "AD"}
              </span>
            ) : (
              <span className="material-symbols-outlined text-[19px]">person</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
