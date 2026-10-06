import React, { useState, useEffect } from "react";
import { AuthUser, CacheStatsData, ApiMonitorData, ApiCallRecord } from "../types";
import { safeFetchJson } from "../lib/api";
import { ConsoleLogin } from "./ConsoleLogin";
import { UserManagement } from "./UserManagement";

interface BackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  token: string | null;
  onLogin: (token: string, user: AuthUser) => void;
  onLogout: () => void;
  onRefreshData: () => void;
}

export const BackendModal: React.FC<BackendModalProps> = ({
  isOpen,
  onClose,
  user,
  token,
  onLogin,
  onLogout,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<"users" | "apiMonitor" | "database" | "cache" | "ingest" | "docs">("users");
  const [cacheStats, setCacheStats] = useState<CacheStatsData | null>(null);
  const [configData, setConfigData] = useState<any>(null);
  const [apiMonitorData, setApiMonitorData] = useState<ApiMonitorData | null>(null);
  const [isTestingAlerts, setIsTestingAlerts] = useState(false);
  const [alertsTestResult, setAlertsTestResult] = useState<any>(null);
  const [apiHistoryFilter, setApiHistoryFilter] = useState<"ALL" | "WEATHER_FORECAST" | "INMET_ALERTS">("ALL");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<any>(null);
  const [isTestingWeather, setIsTestingWeather] = useState(false);
  const [weatherTestResult, setWeatherTestResult] = useState<any>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Manual Ingestion Form State
  const [tempInput, setTempInput] = useState("26.8");
  const [humInput, setHumInput] = useState("72");
  const [pressInput, setPressInput] = useState("952");
  const [windInput, setWindInput] = useState("16");
  const [rainInput, setRainInput] = useState("18.4");
  const [isIngesting, setIsIngesting] = useState(false);

  // Fetch cache stats
  const fetchCacheStats = async () => {
    try {
      const res = await safeFetchJson<{ success: boolean; data: CacheStatsData }>("/api/cache/stats");
      if (res.ok && res.data?.success) {
        setCacheStats(res.data.data);
      }
    } catch (err) {
      console.warn("Aviso ao buscar estatísticas do cache:", err);
    }
  };

  // Fetch runtime config (.env)
  const fetchConfig = async () => {
    try {
      const res = await safeFetchJson<{ success: boolean; data: any }>("/api/config");
      if (res.ok && res.data?.success) {
        setConfigData(res.data.data);
      }
    } catch (err) {
      console.warn("Aviso ao buscar configuração do ambiente:", err);
    }
  };

  // Fetch API monitor status and history
  const fetchApiMonitor = async () => {
    try {
      const res = await safeFetchJson<{ success: boolean; data: ApiMonitorData }>("/api/config/api-monitor");
      if (res.ok && res.data?.success) {
        setApiMonitorData(res.data.data);
      }
    } catch (err) {
      console.warn("Aviso ao buscar telemetria de APIs:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCacheStats();
      fetchConfig();
      fetchApiMonitor();
      const interval = setInterval(() => {
        fetchCacheStats();
        fetchApiMonitor();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleTestDb = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await safeFetchJson<{ success: boolean; result: any }>("/api/config/test-db", { method: "POST" });
      if (res.ok && res.data?.result) {
        setDbTestResult(res.data.result);
        if (res.data.result.connected) {
          addLog(`MySQL/MariaDB Conectado com sucesso! Latência: ${res.data.result.latencyMs}ms (${res.data.result.serverVersion})`);
        } else {
          addLog(`Falha na conexão MySQL/MariaDB: ${res.data.result.error || "Servidor inacessível"}`);
        }
      } else {
        setDbTestResult({ connected: false, error: res.error || "Erro de resposta da API" });
        addLog(`Erro ao testar MySQL: ${res.error || "Serviço indisponível"}`);
      }
    } catch (err: any) {
      setDbTestResult({ connected: false, error: err.message });
      addLog(`Erro ao testar MySQL: ${err.message}`);
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleTestWeather = async () => {
    setIsTestingWeather(true);
    setWeatherTestResult(null);
    try {
      const res = await safeFetchJson<{ success: boolean; result: any }>("/api/config/test-weather", { method: "POST" });
      if (res.ok && res.data?.result) {
        setWeatherTestResult(res.data.result);
        if (res.data.result.ok) {
          addLog(`API de Previsão (${res.data.result.provider}): Conexão estabelecida! Status HTTP ${res.data.result.status} (${res.data.result.latencyMs}ms)`);
        } else {
          addLog(`API de Previsão retornou erro: ${res.data.result.error || `Status HTTP ${res.data.result.status}`}`);
        }
      } else {
        setWeatherTestResult({ ok: false, error: res.error || "Erro de resposta da API" });
        addLog(`Erro ao testar API de Previsão: ${res.error || "Serviço indisponível"}`);
      }
    } catch (err: any) {
      setWeatherTestResult({ ok: false, error: err.message });
      addLog(`Erro ao testar API de Previsão: ${err.message}`);
    } finally {
      setIsTestingWeather(false);
      fetchApiMonitor();
    }
  };

  const handleTestAlerts = async () => {
    setIsTestingAlerts(true);
    setAlertsTestResult(null);
    try {
      const res = await safeFetchJson<{ success: boolean; result: any }>("/api/config/test-alerts", { method: "POST" });
      if (res.ok && res.data?.result) {
        setAlertsTestResult(res.data.result);
        if (res.data.result.ok) {
          addLog(`API de Alertas INMET (${res.data.result.provider}): Conectada com sucesso! ${res.data.result.alertsCount} avisos vigentes (${res.data.result.latencyMs}ms)`);
        } else {
          addLog(`API de Alertas retornou erro: ${res.data.result.error || `Status HTTP ${res.data.result.status}`}`);
        }
      } else {
        setAlertsTestResult({ ok: false, error: res.error || "Erro de resposta da API" });
        addLog(`Erro ao testar API de Alertas: ${res.error || "Serviço indisponível"}`);
      }
    } catch (err: any) {
      setAlertsTestResult({ ok: false, error: err.message });
      addLog(`Erro ao testar API de Alertas: ${err.message}`);
    } finally {
      setIsTestingAlerts(false);
      fetchApiMonitor();
    }
  };

  const handleClearApiHistory = async () => {
    try {
      const res = await safeFetchJson<{ success: boolean }>("/api/config/api-monitor/clear-history", { method: "POST" });
      if (res.ok) {
        addLog("Histórico de auditoria das APIs limpo com sucesso.");
        fetchApiMonitor();
      }
    } catch (err: any) {
      addLog(`Erro ao limpar histórico: ${err.message}`);
    }
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setActionLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Simulate EMA sensor reading
  const handleSimulatePulse = async () => {
    setIsSimulating(true);
    try {
      const res = await safeFetchJson<{ success: boolean; invalidatedKeys?: number; error?: string }>("/api/telemetry/simulate-update", { method: "POST" });
      if (res.ok && res.data?.success) {
        addLog(`Leitura registrada! Chaves Redis invalidadas: ${res.data.invalidatedKeys}. Dados atualizados no banco.`);
        fetchCacheStats();
        onRefreshData();
      } else {
        addLog(`Falha na simulação: ${res.data?.error || res.error}`);
      }
    } catch (err: any) {
      addLog(`Erro de rede: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Clear Redis Cache
  const handleFlushCache = async () => {
    setIsFlushing(true);
    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>("/api/cache/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flushAll: true }),
      });
      if (res.ok && res.data?.success) {
        addLog("FLUSHDB executado: Todo o cache Redis foi esvaziado.");
        fetchCacheStats();
      } else {
        addLog(`Falha ao limpar cache: ${res.data?.error || res.error}`);
      }
    } catch (err: any) {
      addLog(`Erro ao limpar cache: ${err.message}`);
    } finally {
      setIsFlushing(false);
    }
  };

  // Ingest manual reading (requires JWT)
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      addLog("Erro: Autenticação JWT obrigatória para envio de telemetria.");
      return;
    }
    setIsIngesting(true);
    try {
      const res = await safeFetchJson<{ success: boolean; invalidatedCacheKeys?: number; error?: string }>("/api/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tempAtual: parseFloat(tempInput),
          umiAtual: parseFloat(humInput),
          pAtm: parseFloat(pressInput),
          wind: parseFloat(windInput),
          chuvaDia: parseFloat(rainInput),
        }),
      });
      if (res.ok && res.data?.success) {
        addLog(`Nova leitura inserida via Prisma. Cache invalidado (${res.data.invalidatedCacheKeys} chaves).`);
        fetchCacheStats();
        onRefreshData();
      } else {
        addLog(`Erro no envio: ${res.data?.error || res.error}`);
      }
    } catch (err: any) {
      addLog(`Erro: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  if (!isOpen) return null;

  // Se o usuário ou token não estiverem presentes, exibe a tela de login do console
  if (!user || !token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/60 shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden text-slate-800 dark:text-[#dfe2f1] transition-colors">
          {/* Header do Modal de Login */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#3e484f]/40 bg-slate-50/90 dark:bg-[#171b26]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-bold tracking-wider uppercase">
                  Acesso Protegido
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#dfe2f1]">Console de Gerenciamento da Estação</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-[#262a35] dark:hover:bg-[#313540] dark:text-[#87929a] dark:hover:text-[#dfe2f1] transition-colors cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          {/* Formulário de Login Seguro */}
          <ConsoleLogin onLoginSuccess={onLogin} onCancel={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[97vw] 2xl:max-w-[1650px] h-[93vh] max-h-[95vh] flex flex-col rounded-2xl bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/60 shadow-[0_25px_70px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden text-slate-800 dark:text-[#dfe2f1]">
        {/* Modal Header Logado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#3e484f]/40 bg-slate-50 dark:bg-[#171b26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-[#38bdf8]/15 flex items-center justify-center text-sky-600 dark:text-[#38bdf8] border border-sky-200 dark:border-[#38bdf8]/30">
              <span className="material-symbols-outlined text-2xl">dns</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-sky-600 dark:text-[#38bdf8] font-bold tracking-wider uppercase">
                  Node.js • Prisma ORM • MariaDB (usuarios)
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4] animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-[#dfe2f1]">Console do Backend & Gerenciamento</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/40 font-mono text-xs">
              <div className="w-6 h-6 rounded-md bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 font-bold flex items-center justify-center uppercase">
                {user.username ? user.username.slice(0, 2) : user.name.slice(0, 2)}
              </div>
              <div className="text-left leading-tight">
                <div className="text-slate-900 dark:text-[#dfe2f1] font-semibold flex items-center gap-1.5">
                  <span>{user.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                    {user.role}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-[#87929a]">@{user.username || user.email}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-500/30 text-xs font-mono transition-colors cursor-pointer"
              title="Encerrar Sessão"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden md:inline">Sair</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-[#262a35] dark:hover:bg-[#313540] dark:text-[#87929a] dark:hover:text-[#dfe2f1] transition-colors cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-[#3e484f]/30 bg-slate-100/70 dark:bg-[#0f131d] overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-mono text-[12px] font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "users"
                ? "text-sky-600 border-sky-600 dark:text-[#38bdf8] dark:border-[#38bdf8]"
                : "text-slate-500 border-transparent hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
            }`}
          >
            <span className="material-symbols-outlined text-base">manage_accounts</span>
            Gestão de Usuários (MariaDB)
          </button>

          <button
            onClick={() => setActiveTab("apiMonitor")}
            className={`px-4 py-2 font-mono text-[12px] font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "apiMonitor"
                ? "text-sky-600 border-sky-600 dark:text-[#38bdf8] dark:border-[#38bdf8]"
                : "text-slate-500 border-transparent hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
            }`}
          >
            <span className="material-symbols-outlined text-base">cloud_sync</span>
            Monitor de APIs & Alertas
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#45dfa4] animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab("database")}
            className={`px-4 py-2 font-mono text-[12px] font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "database"
                ? "text-sky-600 border-sky-600 dark:text-[#38bdf8] dark:border-[#38bdf8]"
                : "text-slate-500 border-transparent hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
            }`}
          >
            <span className="material-symbols-outlined text-base">storage</span>
            MySQL / MariaDB & APIs (.env)
          </button>

          <button
            onClick={() => setActiveTab("cache")}
            className={`px-4 py-2 font-mono text-[12px] font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "cache"
                ? "text-sky-600 border-sky-600 dark:text-[#38bdf8] dark:border-[#38bdf8]"
                : "text-slate-500 border-transparent hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
            }`}
          >
            <span className="material-symbols-outlined text-base">memory</span>
            Estatísticas do Cache Redis
          </button>

          <button
            onClick={() => setActiveTab("ingest")}
            className={`px-4 py-2 font-mono text-[12px] font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "ingest"
                ? "text-sky-600 border-sky-600 dark:text-[#38bdf8] dark:border-[#38bdf8]"
                : "text-slate-500 border-transparent hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
            }`}
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Ingestão Manual (Prisma)
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-2 font-mono text-[12px] font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "docs"
                ? "text-sky-600 border-sky-600 dark:text-[#38bdf8] dark:border-[#38bdf8]"
                : "text-slate-500 border-transparent hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"
            }`}
          >
            <span className="material-symbols-outlined text-base">integration_instructions</span>
            Arquitetura & Rotas REST
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-none space-y-6">
          {/* TAB: MONITORAMENTO DE APIS EXTERNAS & ALERTAS */}
          {activeTab === "apiMonitor" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-[#38bdf8] flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">cloud_sync</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-sky-600 dark:text-[#38bdf8] font-bold">
                        Monitor de Conexões Externas & Alertas
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4] animate-pulse" />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-[#262a35] text-slate-700 dark:text-[#87929a]">
                        Atualização Horária & Cache
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-[#bdc8d1] mt-0.5">
                      Supervisão em tempo real da API de previsão meteorológica de 7 dias e dos alertas de tempo severo do INMET.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/40 text-slate-800 dark:text-[#dfe2f1] flex items-center gap-2 shadow-xs">
                    <span className="material-symbols-outlined text-sm text-sky-600 dark:text-[#38bdf8]">schedule</span>
                    <span>Brasília: {apiMonitorData?.serverTimeBrt || "16/09/2026"}</span>
                  </div>
                  <button
                    onClick={() => {
                      fetchApiMonitor();
                      fetchCacheStats();
                    }}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 dark:bg-[#262a35] dark:hover:bg-[#313540] dark:text-[#dfe2f1] border border-slate-200 dark:border-[#3e484f]/40 transition-colors cursor-pointer shadow-xs"
                    title="Recarregar Status Agora"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                  </button>
                </div>
              </div>

              {/* Status Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD 1: PREVISÃO METEOROLÓGICA 7 DIAS */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3e484f]/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-[#38bdf8]">
                          <span className="material-symbols-outlined text-xl">partly_cloudy_day</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[14px] text-slate-900 dark:text-[#dfe2f1]">Previsão do Tempo (7 Dias)</h4>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-[#87929a] block truncate max-w-[220px]" title={apiMonitorData?.weather?.provider}>
                            {apiMonitorData?.weather?.provider || "Open-Meteo High-Res / Google Weather"}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 dark:bg-[#003728]/50 text-emerald-800 dark:text-[#84f7cb] border border-emerald-300 dark:border-[#45dfa4]/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4] animate-pulse" />
                        ONLINE
                      </span>
                    </div>

                    {/* Informações de consulta e cache */}
                    <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[11px]">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px] uppercase">Última Consulta</span>
                        <span className="text-slate-900 dark:text-[#dfe2f1] font-semibold block truncate" title={apiMonitorData?.weather?.lastCheckedFormatted || "Nenhuma consulta"}>
                          {apiMonitorData?.weather?.lastCheckedFormatted || "Carregando..."}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px] uppercase">Próxima Consulta</span>
                        <span className="text-sky-600 dark:text-[#38bdf8] font-semibold block truncate">
                          {apiMonitorData?.weather?.nextScheduledFormatted || "Agendada a cada 1 hora"}
                        </span>
                      </div>
                    </div>

                    {/* Contadores da API de Previsão */}
                    <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[11px] text-center">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">TOTAL</span>
                        <span className="text-slate-900 dark:text-[#dfe2f1] text-base font-bold">{apiMonitorData?.weather?.totalCalls ?? 0}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">AO VIVO</span>
                        <span className="text-amber-600 dark:text-[#ffbf9e] text-base font-bold">{apiMonitorData?.weather?.liveCalls ?? 0}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">CACHE HITS</span>
                        <span className="text-emerald-600 dark:text-[#45dfa4] text-base font-bold">{apiMonitorData?.weather?.cacheHits ?? 0}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 rounded-lg bg-white/70 dark:bg-[#0a0e18]/70 border border-slate-200 dark:border-[#3e484f]/20 text-[11px] font-mono text-slate-500 dark:text-[#87929a]">
                      <div className="flex items-center justify-between">
                        <span>Latência da última chamada:</span>
                        <span className="text-emerald-600 dark:text-[#45dfa4] font-bold">{apiMonitorData?.weather?.lastLatencyMs ?? 0} ms</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span>Estratégia do Cache:</span>
                        <span className="text-sky-600 dark:text-[#38bdf8]">TTL 1 hora (Memória + Disco)</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Teste / Ação */}
                  <div>
                    <button
                      onClick={handleTestWeather}
                      disabled={isTestingWeather}
                      className="w-full py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 dark:text-[#38bdf8] dark:border-sky-500/40 text-xs font-mono font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${isTestingWeather ? "animate-spin" : ""}`}>
                        {isTestingWeather ? "refresh" : "sync"}
                      </span>
                      {isTestingWeather ? "Consultando API Externa..." : "Testar Consulta da Previsão Agora"}
                    </button>
                    {weatherTestResult && (
                      <div className={`mt-2 p-2 rounded-lg font-mono text-[11px] ${weatherTestResult.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-[#003728]/40 dark:text-[#84f7cb] dark:border-[#45dfa4]/30" : "bg-red-50 text-red-800 border border-red-200 dark:bg-[#3e1412]/40 dark:text-[#ffb4ab] dark:border-[#ffb4ab]/30"}`}>
                        {weatherTestResult.ok ? `✓ ${weatherTestResult.summary} (${weatherTestResult.latencyMs}ms)` : `⚠️ ${weatherTestResult.error}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: ALERTAS INMET */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3e484f]/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#ff975d]">
                          <span className="material-symbols-outlined text-xl">warning</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[14px] text-slate-900 dark:text-[#dfe2f1]">Alertas Meteorológicos</h4>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-[#87929a] block truncate max-w-[220px]" title={apiMonitorData?.alerts?.provider}>
                            {apiMonitorData?.alerts?.provider || "INMET — Instituto Nacional de Meteorologia"}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 dark:bg-[#003728]/50 text-emerald-800 dark:text-[#84f7cb] border border-emerald-300 dark:border-[#45dfa4]/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4] animate-pulse" />
                        ONLINE
                      </span>
                    </div>

                    {/* Informações de consulta e cache */}
                    <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[11px]">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px] uppercase">Última Consulta</span>
                        <span className="text-slate-900 dark:text-[#dfe2f1] font-semibold block truncate" title={apiMonitorData?.alerts?.lastCheckedFormatted || "Nenhuma consulta"}>
                          {apiMonitorData?.alerts?.lastCheckedFormatted || "Carregando..."}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px] uppercase">Próxima Consulta</span>
                        <span className="text-amber-600 dark:text-[#ff975d] font-semibold block truncate">
                          {apiMonitorData?.alerts?.nextScheduledFormatted || "Agendada a cada 10 min"}
                        </span>
                      </div>
                    </div>

                    {/* Contadores da API de Alertas */}
                    <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[11px] text-center">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">TOTAL</span>
                        <span className="text-slate-900 dark:text-[#dfe2f1] text-base font-bold">{apiMonitorData?.alerts?.totalCalls ?? 0}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">AO VIVO</span>
                        <span className="text-amber-600 dark:text-[#ff975d] text-base font-bold">{apiMonitorData?.alerts?.liveCalls ?? 0}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
                        <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">CACHE HITS</span>
                        <span className="text-emerald-600 dark:text-[#45dfa4] text-base font-bold">{apiMonitorData?.alerts?.cacheHits ?? 0}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 rounded-lg bg-white/70 dark:bg-[#0a0e18]/70 border border-slate-200 dark:border-[#3e484f]/20 text-[11px] font-mono text-slate-500 dark:text-[#87929a]">
                      <div className="flex items-center justify-between">
                        <span>Latência da última chamada:</span>
                        <span className="text-emerald-600 dark:text-[#45dfa4] font-bold">{apiMonitorData?.alerts?.lastLatencyMs ?? 0} ms</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span>Status dos Alertas:</span>
                        <span className="text-amber-600 dark:text-[#ff975d] font-bold truncate max-w-[200px]" title={apiMonitorData?.alerts?.details}>
                          {apiMonitorData?.alerts?.details || "Monitoramento contínuo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Teste / Ação */}
                  <div>
                    <button
                      onClick={handleTestAlerts}
                      disabled={isTestingAlerts}
                      className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-[#ff975d] dark:border-amber-500/40 text-xs font-mono font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${isTestingAlerts ? "animate-spin" : ""}`}>
                        {isTestingAlerts ? "refresh" : "notifications_active"}
                      </span>
                      {isTestingAlerts ? "Consultando API de Alertas..." : "Testar Conexão de Alertas Agora"}
                    </button>
                    {alertsTestResult && (
                      <div className={`mt-2 p-2 rounded-lg font-mono text-[11px] ${alertsTestResult.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-[#003728]/40 dark:text-[#84f7cb] dark:border-[#45dfa4]/30" : "bg-red-50 text-red-800 border border-red-200 dark:bg-[#3e1412]/40 dark:text-[#ffb4ab] dark:border-[#ffb4ab]/30"}`}>
                        {alertsTestResult.ok ? `✓ API INMET OK: ${alertsTestResult.alertsCount} alertas vigentes (${alertsTestResult.latencyMs}ms)` : `⚠️ ${alertsTestResult.error}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AUDIT LOG: HISTÓRICO DE CHAMADAS DE API */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3e484f]/30">
                  <div>
                    <h4 className="font-semibold text-base text-slate-900 dark:text-[#dfe2f1] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sky-600 dark:text-[#38bdf8] text-lg">history</span>
                      Histórico de Chamadas às APIs (Audit Log)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#87929a] mt-0.5">
                      Trilha de auditoria das últimas 60 requisições realizadas com registro de status HTTP, latência e origem do dado.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Filter Buttons */}
                    <div className="inline-flex rounded-lg bg-white dark:bg-[#0a0e18] p-1 border border-slate-200 dark:border-[#3e484f]/30 font-mono text-xs shadow-xs">
                      <button
                        onClick={() => setApiHistoryFilter("ALL")}
                        className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${apiHistoryFilter === "ALL" ? "bg-sky-600 text-white font-bold dark:bg-[#38bdf8] dark:text-[#00354a]" : "text-slate-600 hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"}`}
                      >
                        Todas ({apiMonitorData?.history?.length ?? 0})
                      </button>
                      <button
                        onClick={() => setApiHistoryFilter("WEATHER_FORECAST")}
                        className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${apiHistoryFilter === "WEATHER_FORECAST" ? "bg-sky-600 text-white font-bold dark:bg-[#38bdf8] dark:text-[#00354a]" : "text-slate-600 hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"}`}
                      >
                        Previsão
                      </button>
                      <button
                        onClick={() => setApiHistoryFilter("INMET_ALERTS")}
                        className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${apiHistoryFilter === "INMET_ALERTS" ? "bg-sky-600 text-white font-bold dark:bg-[#38bdf8] dark:text-[#00354a]" : "text-slate-600 hover:text-slate-900 dark:text-[#87929a] dark:hover:text-[#dfe2f1]"}`}
                      >
                        Alertas
                      </button>
                    </div>

                    <button
                      onClick={handleClearApiHistory}
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-500/30 font-mono text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Limpar Histórico"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      <span>Limpar</span>
                    </button>
                  </div>
                </div>

                {/* Table of history records */}
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  {(!apiMonitorData?.history || apiMonitorData.history.length === 0) ? (
                    <div className="text-center py-8 font-mono text-xs text-slate-500 dark:text-[#87929a]">
                      Nenhuma chamada registrada no histórico até o momento.
                      <div className="mt-1 text-slate-700 dark:text-[#dfe2f1]">
                        Utilize os botões acima para executar testes manuais das APIs ou aguarde o ciclo do agendador automático.
                      </div>
                    </div>
                  ) : (
                    <table className="w-full font-mono text-xs text-left">
                      <thead className="text-[10px] text-slate-500 dark:text-[#87929a] uppercase border-b border-slate-200 dark:border-[#3e484f]/30 sticky top-0 bg-slate-50 dark:bg-[#171b26]">
                        <tr>
                          <th className="py-2 px-3">Horário</th>
                          <th className="py-2 px-3">Serviço</th>
                          <th className="py-2 px-3">Origem</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Latência</th>
                          <th className="py-2 px-3">Detalhes / Retorno</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#3e484f]/20 text-slate-800 dark:text-[#dfe2f1]">
                        {apiMonitorData.history
                          .filter((item) => apiHistoryFilter === "ALL" || item.service === apiHistoryFilter)
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-white/80 dark:hover:bg-[#0a0e18]/40 transition-colors">
                              <td className="py-2.5 px-3 whitespace-nowrap text-[#87929a]">{item.formattedTime}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  item.service === "WEATHER_FORECAST"
                                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                }`}>
                                  <span className="material-symbols-outlined text-xs">
                                    {item.service === "WEATHER_FORECAST" ? "partly_cloudy_day" : "warning"}
                                  </span>
                                  {item.service === "WEATHER_FORECAST" ? "Previsão" : "Alertas"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                  item.source === "API_LIVE"
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : item.source === "REDIS_CACHE"
                                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                                    : item.source === "DISK_CACHE"
                                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                    : item.source === "MANUAL_TEST"
                                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                    : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                                }`}>
                                  {item.source === "API_LIVE" ? "API Live" :
                                   item.source === "REDIS_CACHE" ? "Cache Redis" :
                                   item.source === "DISK_CACHE" ? "Cache Disco" :
                                   item.source === "MANUAL_TEST" ? "Teste Manual" : "Scheduler"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`font-bold ${item.success ? "text-[#45dfa4]" : "text-[#ef4444]"}`}>
                                  {item.status} {item.success ? "OK" : "ERR"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-[#87929a]">
                                {item.latencyMs} ms
                              </td>
                              <td className="py-2.5 px-3 max-w-xs truncate text-[11px]" title={item.summary}>
                                {item.summary}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 0: MYSQL / MARIADB & APIS (.ENV) */}
          {activeTab === "database" && (
            <div className="space-y-6">
              {/* Database Overview Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-[#38bdf8] flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">storage</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-sky-600 dark:text-[#38bdf8] font-bold">
                        {configData?.database?.provider || "MySQL / MariaDB"}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-[#262a35] text-slate-700 dark:text-[#87929a]">
                        Engine: {configData?.database?.engine || "InnoDB"}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-[#bdc8d1] mt-0.5">
                      Banco de dados relacional configurado no arquivo <code className="text-emerald-600 dark:text-[#45dfa4] font-mono">.env</code> com mapeamento da tabela <code className="text-sky-600 dark:text-[#38bdf8] font-mono">EMA_1_2026</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestDb}
                    disabled={isTestingDb}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white dark:bg-[#38bdf8] dark:text-[#00354a] hover:bg-sky-700 dark:hover:bg-[#7bd0ff] font-mono text-[12px] font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <span className={`material-symbols-outlined text-base ${isTestingDb ? "animate-spin" : ""}`}>
                      {isTestingDb ? "refresh" : "network_check"}
                    </span>
                    {isTestingDb ? "Testando..." : "Testar Conexão MySQL"}
                  </button>
                </div>
              </div>

              {/* Db Test Result Alert */}
              {dbTestResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 font-mono text-[12px] ${
                    dbTestResult.connected
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-[#003728]/40 dark:border-[#45dfa4]/50 dark:text-[#84f7cb]"
                      : "bg-red-50 border-red-300 text-red-800 dark:bg-[#3e1412]/40 dark:border-[#ffb4ab]/40 dark:text-[#ffb4ab]"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5">
                    {dbTestResult.connected ? "check_circle" : "error"}
                  </span>
                  <div className="space-y-1">
                    <div className="font-bold text-[13px]">
                      {dbTestResult.connected
                        ? "Conexão Estabelecida com Sucesso com o MySQL / MariaDB!"
                        : "Não foi possível conectar ao servidor MySQL / MariaDB"}
                    </div>
                    {dbTestResult.connected ? (
                      <div>
                        Versão do Servidor: <strong className="text-slate-900 dark:text-[#dfe2f1]">{dbTestResult.serverVersion}</strong> • Latência:{" "}
                        <strong className="text-slate-900 dark:text-[#dfe2f1]">{dbTestResult.latencyMs} ms</strong>
                      </div>
                    ) : (
                      <div className="text-[11px] leading-relaxed text-slate-700 dark:text-[#dfe2f1]/80">
                        {dbTestResult.error}
                        <div className="mt-1 text-red-700 dark:text-[#ffb4ab]">
                          Dica: Se o MariaDB está rodando no seu computador (XAMPP/Docker/WAMP), certifique-se de que a porta 3306 está aberta e ajuste o <code className="text-sky-600 dark:text-[#38bdf8]">DATABASE_URL</code> no arquivo <code className="text-sky-600 dark:text-[#38bdf8]">.env</code>.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid: Parâmetros lidos do .env */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parâmetros do Banco */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-3 font-mono text-[12px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#3e484f]/30">
                    <span className="text-sky-600 dark:text-[#38bdf8] font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">settings</span>
                      Variáveis de Ambiente (.env) • Banco
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#87929a]">Prisma ORM</span>
                  </div>

                  <div className="space-y-2 text-slate-800 dark:text-[#dfe2f1]">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_HOST:</span>
                      <span className="text-emerald-600 dark:text-[#45dfa4] font-semibold">{configData?.database?.host || "agudos.net"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_PORT:</span>
                      <span className="text-emerald-600 dark:text-[#45dfa4]">{configData?.database?.port || "3306"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_USER:</span>
                      <span className="text-slate-800 dark:text-[#dfe2f1]">{configData?.database?.user || "react_page"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_NAME (Telemetria):</span>
                      <span className="text-sky-600 dark:text-[#38bdf8] font-bold">{configData?.database?.database || "eder_estacao"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_TABLE_READINGS:</span>
                      <span className="text-amber-600 dark:text-[#ffbf9e] font-bold">{configData?.database?.tableReadings || "EMA_1_2026"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_USERS_NAME (Auth & Logs):</span>
                      <span className="text-indigo-600 dark:text-[#a5b4fc] font-bold">{configData?.database?.databaseUsers || "usuarios"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_TABLE_USERS:</span>
                      <span className="text-indigo-500 dark:text-[#c7d2fe]">{configData?.database?.tableUsers || "usuarios"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">DB_TABLE_HISTORICAL:</span>
                      <span className="text-emerald-600 dark:text-[#45dfa4]">{configData?.database?.tableHistorical || "dados_historicos"}</span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-slate-500 dark:text-[#87929a]">DATABASE_URL (Sanitizada):</span>
                      <span className="text-[11px] p-2 rounded bg-white dark:bg-[#0a0e18] text-emerald-700 dark:text-[#84f7cb] break-all border border-slate-200 dark:border-[#3e484f]/40 shadow-xs">
                        {configData?.database?.maskedUrl || "mysql://react_page:••••••••@agudos.net:3306/eder_estacao"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* APIs de Previsão Meteorológica */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-3 font-mono text-[12px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#3e484f]/30">
                    <span className="text-emerald-600 dark:text-[#45dfa4] font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">cloud_sync</span>
                      APIs de Previsão do Tempo (.env)
                    </span>
                    <button
                      onClick={handleTestWeather}
                      disabled={isTestingWeather}
                      className="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-[#38bdf8]/20 dark:text-[#38bdf8] dark:hover:bg-[#38bdf8]/30 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-xs ${isTestingWeather ? "animate-spin" : ""}`}>
                        {isTestingWeather ? "refresh" : "send"}
                      </span>
                      {isTestingWeather ? "Testando..." : "Testar API"}
                    </button>
                  </div>

                  <div className="space-y-2 text-slate-800 dark:text-[#dfe2f1]">
                    <div className="flex flex-col gap-0.5 py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">PROVEDOR PRINCIPAL:</span>
                      <span className="text-[11px] text-emerald-600 dark:text-[#45dfa4] font-bold">
                        Google Maps Platform Weather API (MetNet AI)
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">WEATHER_API_URL:</span>
                      <span className="text-[11px] text-sky-600 dark:text-[#38bdf8] truncate font-sans">
                        {configData?.weatherApi?.weatherApiUrl || "https://weather.googleapis.com/v1/forecast/days:lookup"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">WEATHER_API_KEY:</span>
                      <span className="text-emerald-600 dark:text-[#84f7cb] font-bold">
                        •••••••••••••••• (Configurada)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">WEATHER_CACHE_TTL:</span>
                      <span className="text-sky-600 dark:text-[#38bdf8] font-mono">
                        3600s (1 hora • Atualização de 1 em 1h)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#3e484f]/20">
                      <span className="text-slate-500 dark:text-[#87929a]">Coordenadas da Estação:</span>
                      <span className="text-emerald-600 dark:text-[#45dfa4]">
                        {configData?.weatherApi?.latitude || -23.5505}, {configData?.weatherApi?.longitude || -46.6333} ({configData?.weatherApi?.altitude || 760}m)
                      </span>
                    </div>
                  </div>

                  {weatherTestResult && (
                    <div
                      className={`p-2.5 rounded-lg border text-[11px] ${
                        weatherTestResult.ok
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-[#003728]/30 dark:border-[#45dfa4]/40 dark:text-[#84f7cb]"
                          : "bg-red-50 border-red-300 text-red-800 dark:bg-[#3e1412]/30 dark:border-[#ffb4ab]/40 dark:text-[#ffb4ab]"
                      }`}
                    >
                      {weatherTestResult.ok ? (
                        <div>
                          <div className="font-bold">✓ {weatherTestResult.provider || "Google Maps Platform Weather API"} conectada!</div>
                          <div className="text-[10px] text-emerald-700 dark:text-[#84f7cb]/80 mt-0.5">
                            Status HTTP {weatherTestResult.status} • Latência de resposta: {weatherTestResult.latencyMs}ms • Cache: 1h
                          </div>
                        </div>
                      ) : (
                        <div>Falha ao consultar API: {weatherTestResult.error || `HTTP ${weatherTestResult.status}`}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Exemplo de configuração do .env */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/40 font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-[#87929a]">
                  <span className="text-sky-600 dark:text-[#38bdf8] font-bold">Arquivo de Configuração ativo: /.env</span>
                  <span>Somente variáveis em uso</span>
                </div>
                <pre className="p-3 rounded-lg bg-white dark:bg-[#05070d] text-slate-800 dark:text-[#dfe2f1] overflow-x-auto leading-relaxed border border-slate-200 dark:border-[#3e484f]/20 shadow-xs">
{`# BANCO DE DADOS PRINCIPAL: TELEMETRIA EMA (MariaDB / MySQL)
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco?connect_timeout=20"
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="usuario"
DB_PASSWORD="••••••••"
DB_NAME="nome_do_banco"
DB_TABLE_READINGS="EMA_1_2026"
DB_SSL="false"

# BANCO DE DADOS SECUNDÁRIO: USUÁRIOS, AUDITORIA & SÉRIE CLIMATOLÓGICA
DB_USERS_NAME="usuarios"
DB_TABLE_USERS="usuarios"
DB_TABLE_USERS_LOGS="usuarios_logs"
DB_TABLE_HISTORICAL="dados_historicos"

# PREVISÃO NUMÉRICA DO TEMPO (APIs EXTERNAS)
WEATHER_API_PROVIDER="google"
WEATHER_API_KEY="••••••••••••••••"
WEATHER_API_URL="https://weather.googleapis.com/v1/forecast/days:lookup"
OPEN_METEO_API_URL="https://api.open-meteo.com/v1/forecast"
WEATHER_CACHE_TTL_SECONDS="3600"

# IDENTIFICAÇÃO E COORDENADAS GEOGRÁFICAS DA ESTAÇÃO EMA
STATION_NAME="Estação Meteorológica Automática — EMA Agudos"
STATION_CODE="#BR-EMA01 • INMET / WMO"
STATION_LATITUDE="-22.467009"
STATION_LONGITUDE="-48.973334"
STATION_ALTITUDE="618"

# AVISOS E ALERTAS METEOROLÓGICOS (INMET / DEFESA CIVIL)
INMET_ALERTS_API_URL="https://radarmeteorologico.com.br/api/v1/alertas"
INMET_ALERTS_UF="SP"
INMET_ALERTS_CACHE_TTL="600"

# SEGURANÇA, CRIPTOGRAFIA & SESSÃO JWT
JWT_SECRET="meteo-pulse-pro-secret-jwt-key-2026"

# CAMADA DE CACHE DISTRIBUÍDO: REDIS
REDIS_URL="redis://127.0.0.1:6379"
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_RESTRICT_LOCALHOST="true"`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 1: CACHE REDIS */}
          {activeTab === "cache" && (
            <div className="space-y-6">
              {/* Security Banner: Redis Localhost Without Authentication */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#002b1f]/30 border border-emerald-200 dark:border-[#45dfa4]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-[#003728] text-emerald-700 dark:text-[#45dfa4] border border-emerald-300 dark:border-[#45dfa4]/30 flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">security</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13px] text-emerald-900 dark:text-[#84f7cb] flex items-center gap-2">
                      Redis Restrito a Localhost (127.0.0.1) • Sem Autenticação
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-200 text-emerald-900 dark:bg-[#45dfa4]/20 dark:text-[#45dfa4] font-mono">
                        LOOPBACK SEGURO
                      </span>
                    </h4>
                    <p className="text-[12px] text-slate-700 dark:text-[#bdc8d1] mt-0.5 leading-relaxed">
                      Como o Redis está operando sem senha de autenticação, o serviço está restrito exclusivamente ao endereço local (<code className="text-sky-700 dark:text-[#8ed5ff] font-mono">127.0.0.1:6379</code>). Essa política de isolamento impede qualquer tentativa de conexão externa ou varredura de portas via internet.
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0 font-mono text-[11px]">
                  <span className="text-slate-500 dark:text-[#87929a]">Host: <strong className="text-slate-900 dark:text-[#dfe2f1]">{cacheStats?.redisConnection?.host || "127.0.0.1"}</strong></span>
                  <span className="text-slate-500 dark:text-[#87929a]">Porta: <strong className="text-slate-900 dark:text-[#dfe2f1]">{cacheStats?.redisConnection?.port || 6379}</strong></span>
                  <span className="text-emerald-700 dark:text-[#45dfa4]">✓ Sem Exposição Externa</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-[#87929a] block uppercase">Cache Hits</span>
                  <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-[#45dfa4]">{cacheStats?.hits ?? 0}</span>
                  <span className="text-[11px] text-slate-500 dark:text-[#87929a] block mt-0.5">leituras em memória</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-[#87929a] block uppercase">Cache Misses</span>
                  <span className="font-mono text-2xl font-bold text-amber-600 dark:text-[#ffbf9e]">{cacheStats?.misses ?? 0}</span>
                  <span className="text-[11px] text-slate-500 dark:text-[#87929a] block mt-0.5">consultas ao Prisma</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-[#87929a] block uppercase">Taxa de Acerto (Hit Rate)</span>
                  <span className="font-mono text-2xl font-bold text-sky-600 dark:text-[#38bdf8]">
                    {cacheStats?.hitRatePct ?? 0}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-[#87929a] block mt-0.5">eficiência de cache</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-[#87929a] block uppercase">Chaves Ativas</span>
                  <span className="font-mono text-2xl font-bold text-slate-900 dark:text-[#dfe2f1]">{cacheStats?.totalKeys ?? 0}</span>
                  <span className="text-[11px] text-slate-500 dark:text-[#87929a] block mt-0.5">~{cacheStats?.estimatedMemoryKb ?? 0} KB ocupados</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-[14px] text-slate-900 dark:text-[#dfe2f1]">Demonstração de Invalidação Automática</h4>
                  <p className="text-[12px] text-slate-600 dark:text-[#bdc8d1] max-w-lg">
                    Clique no botão abaixo para simular a chegada de um novo pulso da estação EMA. O backend registra a leitura no Prisma e imediatamente expurga as chaves do Redis, mantendo a consistência dos dados.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleSimulatePulse}
                    disabled={isSimulating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white dark:bg-[#38bdf8] dark:text-[#00354a] hover:bg-sky-700 dark:hover:bg-[#7bd0ff] font-medium text-[13px] shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-base ${isSimulating ? "animate-spin" : ""}`}>
                      sensors
                    </span>
                    <span>{isSimulating ? "Processando..." : "Simular Pulso EMA"}</span>
                  </button>

                  <button
                    onClick={handleFlushCache}
                    disabled={isFlushing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#262a35] hover:bg-red-50 dark:hover:bg-[#313540] text-red-600 dark:text-[#ffb4ab] border border-red-200 dark:border-[#ef4444]/30 font-medium text-[13px] shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete_sweep</span>
                    <span>Limpar Cache</span>
                  </button>
                </div>
              </div>

              {/* Active Keys Table */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-mono text-[12px] font-semibold text-sky-700 dark:text-[#8ed5ff] uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">vpn_key</span>
                    Chaves Ativas no Redis
                  </h4>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-[#87929a]">TTL dinâmico em tempo real</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#3e484f]/40 text-slate-500 dark:text-[#87929a]">
                        <th className="pb-2">CHAVE REDIS</th>
                        <th className="pb-2">TTL RESTANTE</th>
                        <th className="pb-2">HITS</th>
                        <th className="pb-2">TAGS DE INVALIDAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#3e484f]/20 text-slate-800 dark:text-[#dfe2f1]">
                      {cacheStats?.keys && cacheStats.keys.length > 0 ? (
                        cacheStats.keys.map((k, idx) => (
                          <tr key={idx} className="hover:bg-white/70 dark:hover:bg-[#262a35]/50 transition-colors">
                            <td className="py-2 text-sky-600 dark:text-[#38bdf8] font-bold">{k.key}</td>
                            <td className="py-2 text-emerald-600 dark:text-[#45dfa4]">{k.ttlSeconds}s</td>
                            <td className="py-2 text-slate-900 dark:text-[#dfe2f1]">{k.hits}</td>
                            <td className="py-2 text-slate-500 dark:text-[#87929a]">{k.tags.join(", ") || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500 dark:text-[#87929a]">
                            Nenhuma chave no cache no momento. Faça uma requisição para povoar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weather Forecast Disk Cache Panel */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-sky-200 dark:border-[#0284c7]/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-sky-500/15 text-sky-600 dark:text-[#38bdf8] border border-sky-500/30">
                      <span className="material-symbols-outlined text-lg">cloud_sync</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[13px] text-slate-900 dark:text-[#dfe2f1] flex items-center gap-2">
                        Cache em Disco da Previsão do Tempo (Google Weather API)
                        <span className="px-2 py-0.5 rounded text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-[#38bdf8] font-mono">
                          1 CHAMADA / HORA
                        </span>
                      </h4>
                      <p className="text-[12px] text-slate-500 dark:text-[#87929a]">
                        Evita exceder a cota diária da API do Google, salvando o resultado em disco e memória com scheduler horário.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      addLog("Disparando sincronização manual da Google Weather API...");
                      try {
                        const res = await safeFetchJson<{ success: boolean; fallbackActive?: boolean; data?: any; error?: string }>("/api/telemetry/forecast-7d/refresh", { method: "POST" });
                        if (res.ok && res.data?.success) {
                          if (res.data.fallbackActive) {
                            addLog(`⚠️ Google API indisponível: retornado último registro válido do disco (${res.data.data?.model || "Google Weather"}).`);
                          } else {
                            addLog(`✓ Previsão sincronizada via Google API e salva em disco!`);
                          }
                          fetchCacheStats();
                          onRefreshData();
                        } else {
                          addLog(`Falha ao sincronizar: ${res.data?.error || res.error || "Erro de resposta da API"}`);
                        }
                      } catch (e: any) {
                        addLog(`Erro: ${e.message}`);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 dark:text-[#38bdf8] border border-sky-200 dark:border-sky-500/40 text-xs font-mono font-medium transition-colors flex-shrink-0 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">sync</span>
                    Forçar Sincronização Agora
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-[#3e484f]/30 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] shadow-xs">
                    <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">LOCAL DO ARQUIVO</span>
                    <span className="text-slate-800 dark:text-[#dfe2f1] truncate block" title={cacheStats?.weatherCache?.filePath || "data/weather_forecast_cache.json"}>
                      data/weather_forecast_cache.json
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] shadow-xs">
                    <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">STATUS DO CACHE</span>
                    <span className={cacheStats?.weatherCache?.isFresh ? "text-emerald-600 dark:text-[#45dfa4] font-bold" : "text-amber-600 dark:text-[#ffbf9e]"}>
                      {cacheStats?.weatherCache?.isFresh ? "✓ Válido e Ativo" : "Expirado / Pendente"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] shadow-xs">
                    <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">INTERVALO TTL</span>
                    <span className="text-sky-600 dark:text-[#38bdf8]">60 minutos (3600s)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#0a0e18] shadow-xs">
                    <span className="text-slate-500 dark:text-[#87929a] block text-[10px]">PRÓXIMA CONSULTA</span>
                    <span className="text-emerald-600 dark:text-[#84f7cb]">
                      {cacheStats?.weatherCache?.nextScheduledHourlyUpdate || "Automática (Horária)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Activity Log */}
              {actionLog.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/30 font-mono text-[11px] shadow-xs">
                  <div className="text-slate-500 dark:text-[#87929a] mb-1 font-semibold">Registro de Ações Recentes:</div>
                  <div className="space-y-0.5 text-slate-700 dark:text-[#bdc8d1]">
                    {actionLog.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: GESTÃO DE USUÁRIOS (MARIADB) */}
          {activeTab === "users" && (
            <UserManagement
              currentUser={user}
              token={token}
              onUserModified={() => {
                fetchCacheStats();
                onRefreshData();
              }}
              onUnauthorized={onLogout}
            />
          )}

          {/* TAB: INGEST MANUAL */}
          {activeTab === "ingest" && (
            <form onSubmit={handleIngestSubmit} className="p-5 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-4">
              <div>
                <h4 className="font-semibold text-base text-slate-900 dark:text-[#dfe2f1]">Registro Manual de Leitura da Estação</h4>
                <p className="text-[12px] text-slate-600 dark:text-[#bdc8d1]">
                  Dispara a rota protegida <code className="text-sky-600 dark:text-[#38bdf8]">POST /api/telemetry</code>. Calcula Magnus-Tetens, VPD e reduz barometria ao nível do mar automaticamente.
                </p>
              </div>

              {!token && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-[#ff975d]/20 dark:border-[#ff975d]/40 dark:text-[#ffbf9e] text-[12px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">lock</span>
                  Você precisa estar autenticado com JWT para registrar leituras. Vá para a aba &quot;Autenticação JWT&quot;.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[12px]">
                <div>
                  <label className="block text-slate-600 dark:text-[#87929a] mb-1">Temperatura Atual (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempInput}
                    onChange={(e) => setTempInput(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/50 rounded-lg px-3 py-2 text-slate-900 dark:text-[#dfe2f1] shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#87929a] mb-1">Umidade Relativa (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={humInput}
                    onChange={(e) => setHumInput(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/50 rounded-lg px-3 py-2 text-slate-900 dark:text-[#dfe2f1] shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#87929a] mb-1">Pressão Local (hPa)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pressInput}
                    onChange={(e) => setPressInput(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/50 rounded-lg px-3 py-2 text-slate-900 dark:text-[#dfe2f1] shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#87929a] mb-1">Vento (km/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={windInput}
                    onChange={(e) => setWindInput(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/50 rounded-lg px-3 py-2 text-slate-900 dark:text-[#dfe2f1] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#87929a] mb-1">Chuva Acumulada Dia (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rainInput}
                    onChange={(e) => setRainInput(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0e18] border border-slate-200 dark:border-[#3e484f]/50 rounded-lg px-3 py-2 text-slate-900 dark:text-[#dfe2f1] shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!token || isIngesting}
                  className="px-5 py-2 rounded-lg bg-sky-600 text-white dark:bg-[#38bdf8] dark:text-[#00354a] hover:bg-sky-700 dark:hover:bg-[#7bd0ff] font-medium text-[13px] shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isIngesting ? "Gravando no Prisma..." : "Gravar Leitura & Invalidar Cache"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: DOCS & ARCHITECTURE */}
          {activeTab === "docs" && (
            <div className="space-y-6 font-mono text-[12px]">
              {/* Header Overview */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-600 dark:text-[#38bdf8] text-lg">api</span>
                    Catálogo de Endpoints RESTful & Arquitetura
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Visão completa de todas as rotas ativas do backend, parâmetros, níveis de autenticação e políticas de cache.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-[#45dfa4] border border-emerald-500/30">
                    23 Endpoints Ativos
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                    Prefix: /api/*
                  </span>
                </div>
              </div>

              {/* Group 1: Telemetria & Métricas Consolidadas */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3e484f]/20 pb-2">
                  <h5 className="font-bold text-sky-600 dark:text-[#38bdf8] flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">sensors</span>
                    Telemetria em Tempo Real & Métricas Consolidadas
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">MariaDB: EMA_1_2026</span>
                </div>
                <ul className="space-y-2 text-slate-700 dark:text-[#dfe2f1]">
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/current</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Última leitura dos sensores (temperatura, umidade, vento, pressão, chuva, radiação e sensação térmica). <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 60s</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/history-24h</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Série temporal contínua das últimas 24 horas (minuto a minuto) para gráficos da página principal. <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 180s</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/day?date=YYYY-MM-DD</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Consolidado completo de um dia: extremos (máx/mín), médias horárias, rajada máxima e curva de 24h. <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 300s</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/month?year=YYYY&month=MM</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Matriz diária de todos os dias do mês: totais de precipitação, médias térmicas e extremos. <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 600s</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/year?year=YYYY</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Balanço anual de 12 meses: chuva acumulada por mês, médias térmicas, recordes anuais e totais. <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 900s</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/rain-summary</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Totais diários consolidados dos últimos 7 dias e escalas volumétricas para o pluviômetro. <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 300s</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Ingestão manual de nova leitura meteorológica no MariaDB (Requer JWT de Operador). Invalida o cache Redis automaticamente.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/simulate-step</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Simula o avanço de um ciclo temporal da estação gerando uma nova leitura física no banco.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Group 2: Dados Históricos Multianual */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3e484f]/20 pb-2">
                  <h5 className="font-bold text-emerald-600 dark:text-[#45dfa4] flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Dados Históricos Multianual (2019 - 2026)
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">MariaDB: dados_historicos</span>
                </div>
                <ul className="space-y-2 text-slate-700 dark:text-[#dfe2f1]">
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/historical</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Retorna a matriz climatológica contínua multianual de 2019 a 2026, balanços consolidados de cada ano e recordes absolutos históricos (chuva, calor, frio).
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/historical/recalculate</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Recalcula as métricas consolidadas diretamente a partir das leituras brutas da estação (<code className="text-emerald-500 font-bold">EMA_1_2026</code>) e sincroniza na tabela <code className="text-emerald-500 font-bold">dados_historicos</code>.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Group 3: Previsão do Tempo & Alertas */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3e484f]/20 pb-2">
                  <h5 className="font-bold text-amber-600 dark:text-[#ff975d] flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">cloud_sync</span>
                    Previsão Numérica & Alertas Meteorológicos
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">Google Weather / INMET</span>
                </div>
                <ul className="space-y-2 text-slate-700 dark:text-[#dfe2f1]">
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/telemetry/forecast-7d</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Previsão de 7 dias obtida via Google Maps Platform Weather API (ou Open-Meteo se sem chave). Atualização horária com persistência em disco e memória. <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 3600s (1h)</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/alerts/active</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Consulta de avisos meteorológicos ativos do INMET / Defesa Civil para a UF configurada no <code className="text-sky-400 font-mono">.env</code>. <span className="text-sky-500 dark:text-[#8ed5ff]">TTL: 600s</span>
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/alerts/refresh</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Força consulta imediata na API do INMET ignorando o cache local.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Group 4: Hardware & Status da Estação */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3e484f]/20 pb-2">
                  <h5 className="font-bold text-violet-600 dark:text-[#c084fc] flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">satellite_alt</span>
                    Identificação, Hardware & Saúde da Estação
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">Hardware & Sensores</span>
                </div>
                <ul className="space-y-2 text-slate-700 dark:text-[#dfe2f1]">
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/station/info</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Metadados da estação: nome, código WMO, latitude, longitude, altitude, lista de sensores operacionais e versão de firmware.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/station/status</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Telemetria diagnóstica: tensão de bateria (V), intensidade do sinal de rádio/telemetria RSSI (dBm), barômetro e status de cada sensor.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/health</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Healthcheck geral do backend: timestamp UTC, versões do Express/Prisma e status das camadas de cache e segurança.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Group 5: Autenticação & Gerenciamento de Usuários */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3e484f]/20 pb-2">
                  <h5 className="font-bold text-indigo-600 dark:text-[#818cf8] flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">shield_person</span>
                    Autenticação & Controle de Acesso (RBAC)
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">MariaDB: usuarios</span>
                </div>
                <ul className="space-y-2 text-slate-700 dark:text-[#dfe2f1]">
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/auth/login</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Autenticação por credenciais com validação de hash bcrypt (10 rounds) e emissão de token JWT Bearer com validade de 24 horas.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/auth/me</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Retorna os dados do operador logado a partir do token de autorização Bearer.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/users</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Lista todos os usuários registrados com status ativo/inativo, role e último login (Requer role ADMIN).
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/users</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Cria um novo usuário na tabela `usuarios` com hash bcrypt de senha e registro de auditoria (Requer role ADMIN).
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-[#38bdf8]">PUT</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/users/:id</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Atualiza nome, email, nível de acesso (ADMIN, OPERATOR, VIEWER) ou redefinição de senha (Requer role ADMIN).
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-[#ffb4ab]">DELETE</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/users/:id</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Desativa ou remove o usuário do banco com logs de auditoria (Requer role ADMIN).
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/users/logs</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Consulta o histórico de auditoria gravado na tabela `usuarios_logs` (criação, alteração, login, exclusão) com IP e timestamp.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Group 6: Cache Redis & Performance */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3e484f]/20 pb-2">
                  <h5 className="font-bold text-rose-600 dark:text-[#ff7b92] flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">memory</span>
                    Camada de Cache de Alta Performance (Redis / Memória)
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">127.0.0.1:6379</span>
                </div>
                <ul className="space-y-2 text-slate-700 dark:text-[#dfe2f1]">
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/cache/stats</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Estatísticas em tempo real: hits, misses, hit rate (%), chaves ativas, memória alocada e latência do Redis.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/cache/clear</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Limpeza imediata de chaves seletivas ou purga total de cache (FLUSHDB) para forçar nova sincronização com o banco.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Group 7: Configuração de Ambiente (.env) & Testes Diagnósticos */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3e484f]/20 pb-2">
                  <h5 className="font-bold text-teal-600 dark:text-[#2dd4bf] flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">settings_suggest</span>
                    Configuração de Ambiente (.env) & Diagnósticos
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">Variáveis & Health</span>
                </div>
                <ul className="space-y-2 text-slate-700 dark:text-[#dfe2f1]">
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/config</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Retorna todas as variáveis de ambiente ativas sanitizadas (senhas e chaves mascaradas com segurança).
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4]">GET</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/config/api-monitor</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Retorna métricas de saúde, última chamada e anel de auditoria das últimas 50 requisições às APIs externas.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/config/api-monitor/clear-history</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Limpa o histórico de auditoria de chamadas de APIs externas.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/config/test-db</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Executa teste de ping, versão e latência contra o servidor MariaDB / MySQL.
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/config/test-weather</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Testa requisição direta à API de Previsão Numérica (Google Maps Weather / Open-Meteo).
                    </span>
                  </li>
                  <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <div className="flex items-center gap-1.5 min-w-[280px]">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-[#ff975d]">POST</span>
                      <code className="text-slate-900 dark:text-white font-bold">/api/config/test-alerts</code>
                    </div>
                    <span className="text-slate-500 dark:text-[#87929a] text-[11px]">
                      Testa conectividade e resposta do endpoint de avisos meteorológicos do INMET.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Database Architecture Detail Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-[#3e484f]/30 text-slate-700 dark:text-[#bdc8d1] font-sans">
                <h4 className="text-emerald-600 dark:text-[#45dfa4] font-bold mb-2.5 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm">database</span>
                  Estrutura e Tabelas do Banco de Dados MariaDB / MySQL:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-slate-800">
                    <strong className="text-sky-600 dark:text-[#38bdf8] font-mono text-[11px] block mb-1">
                      1. Tabela `EMA_1_{`ano`}` (ex: EMA_1_2026)
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Telemetria pontual minuto a minuto dos sensores da estação: Data, Hora, Temperatura (°C), Umidade (%), Ponto de Orvalho (°C), Pressão (hPa), Vento (km/h), Rajada (km/h), Direção do Vento, Chuva (mm) e Radiação Solar (W/m²).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-slate-800">
                    <strong className="text-emerald-600 dark:text-[#45dfa4] font-mono text-[11px] block mb-1">
                      2. Tabela `dados_historicos`
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Acervo da série climatológica contínua multianual de 2019 a 2026: ano, mes, chuva_acumulada_mm, temp_max_abs, temp_min_abs, temp_media, temp_media_max, temp_media_min, umi_media e dias_computados. Atualizada e recalculada automaticamente a partir da telemetria da estação.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-slate-800">
                    <strong className="text-indigo-600 dark:text-[#818cf8] font-mono text-[11px] block mb-1">
                      3. Tabela `usuarios`
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Controle de operadores com autenticação RBAC: <code>id</code>, <code>username</code> (único), <code>email</code> (único), <code>password_hash</code> (bcrypt salt 10 rounds), <code>name</code>, <code>role</code> (ADMIN, OPERATOR, VIEWER), <code>active</code>, <code>created_at</code>, <code>updated_at</code> e <code>last_login_at</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-slate-800">
                    <strong className="text-amber-600 dark:text-[#ff975d] font-mono text-[11px] block mb-1">
                      4. Tabela `usuarios_logs`
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Trilha de auditoria operacional em tempo real: registra logins com sucesso ou falha, criação de operadores, edições cadastrais e exclusões, armazenando o identificador do operador, ação executada, endereço IP de origem e carimbo de data/hora UTC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
