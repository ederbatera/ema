import { useEffect, useState, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { ContextRibbon } from "./components/ContextRibbon";
import { AlertBanner } from "./components/AlertBanner";
import { TelemetryCards } from "./components/TelemetryCards";
import { HistoryTelemetry } from "./components/HistoryTelemetry";
import { RainAnalysis } from "./components/RainAnalysis";
import { ExtendedForecast } from "./components/ExtendedForecast";
import { DailyMetricsSection } from "./components/DailyMetricsSection";
import { MonthlyMetricsSection } from "./components/MonthlyMetricsSection";
import { YearlyMetricsSection } from "./components/YearlyMetricsSection";
import { HistoricalMetricsModal } from "./components/HistoricalMetricsModal";
import { StationFooter } from "./components/StationFooter";
import { BackendModal } from "./components/BackendModal";
import { AboutModal } from "./components/AboutModal";
import { safeFetchJson } from "./lib/api";
import { getBrazilTodayStr } from "./lib/dateUtils";
import {
  getNextSyncSchedule,
  SENSOR_CYCLE_MINUTES,
  SYNC_OFFSET_SECONDS,
} from "./lib/syncScheduler";
import {
  ComputedTelemetry,
  History24hData,
  RainSummaryData,
  ForecastData,
  WeatherAlertItem,
  CacheStatsData,
  AuthUser,
  DayTelemetryData,
} from "./types";

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("meteo_theme");
      if (saved) return saved === "dark";
    } catch {
      // ignore
    }
    return true;
  });

  // URL route state for /painel
  const checkIsPainelRoute = () => {
    try {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return path.startsWith("/painel") || hash.startsWith("#/painel") || hash.startsWith("#painel");
    } catch {
      return false;
    }
  };

  const [isPainelRoute, setIsPainelRoute] = useState(checkIsPainelRoute);
  const [backendModalOpen, setBackendModalOpen] = useState(() => checkIsPainelRoute());
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [monthlyMetricsModalOpen, setMonthlyMetricsModalOpen] = useState(false);
  const [yearlyMetricsModalOpen, setYearlyMetricsModalOpen] = useState(false);
  const [historicalMetricsModalOpen, setHistoricalMetricsModalOpen] = useState(false);
  const [monthlyInitialYear, setMonthlyInitialYear] = useState<number | undefined>(undefined);
  const [monthlyInitialMonth, setMonthlyInitialMonth] = useState<number | undefined>(undefined);
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(() => {
    return getBrazilTodayStr();
  });
  const [dayData, setDayData] = useState<DayTelemetryData | null>(null);
  const [isDayLoading, setIsDayLoading] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Drill-down: Clicking a day in the monthly modal scrolls to that day's metrics on the home page
  const handleSelectDayFromMonth = useCallback((date: string) => {
    setSelectedDailyDate(date);
    setMonthlyMetricsModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById("metricas-dia");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
    showToast(`Carregando métricas do dia ${date} na página principal.`);
  }, []);

  // Drill-down: Clicking a month in the yearly modal opens the monthly modal for that year/month
  const handleSelectMonthFromYear = useCallback((year: number, month: number) => {
    setMonthlyInitialYear(year);
    setMonthlyInitialMonth(month);
    setYearlyMetricsModalOpen(false);
    setMonthlyMetricsModalOpen(true);
  }, []);

  // Drill-down: Clicking a record day from the yearly modal scrolls to that day
  const handleSelectDayFromYear = useCallback((date: string) => {
    setSelectedDailyDate(date);
    setYearlyMetricsModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById("metricas-dia");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
    showToast(`Carregando métricas do dia ${date} na página principal.`);
  }, []);

  // Drill-down: Clicking a month in the historical modal opens the monthly modal for that year/month
  const handleSelectMonthFromHistorical = useCallback((year: number, month: number) => {
    setMonthlyInitialYear(year);
    setMonthlyInitialMonth(month);
    setHistoricalMetricsModalOpen(false);
    setMonthlyMetricsModalOpen(true);
  }, []);

  // Sync theme with <html>, <body>, and localStorage
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
      }
      localStorage.setItem("meteo_theme", isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  // Sync URL changes (popstate and hashchange)
  useEffect(() => {
    const handleRoute = () => {
      const onPainel = checkIsPainelRoute();
      setIsPainelRoute(onPainel);
      if (onPainel) {
        setBackendModalOpen(true);
      }
    };

    window.addEventListener("popstate", handleRoute);
    window.addEventListener("hashchange", handleRoute);
    return () => {
      window.removeEventListener("popstate", handleRoute);
      window.removeEventListener("hashchange", handleRoute);
    };
  }, []);

  const navigateToPainel = () => {
    try {
      window.history.pushState({}, "", "/painel");
    } catch {
      window.location.hash = "/painel";
    }
    setIsPainelRoute(true);
    setBackendModalOpen(true);
  };

  const navigateToHome = () => {
    try {
      window.history.pushState({}, "", "/");
    } catch {
      window.location.hash = "";
    }
    setIsPainelRoute(false);
    setBackendModalOpen(false);
  };

  // Telemetry & API State
  const [telemetry, setTelemetry] = useState<ComputedTelemetry | null>(null);
  const [history, setHistory] = useState<History24hData | null>(null);
  const [rainData, setRainData] = useState<RainSummaryData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [alert, setAlert] = useState<WeatherAlertItem | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStatsData | null>(null);

  // Synchronized 5-minute sensor polling state (:20s offset after sensor writes)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastDbRecordTime, setLastDbRecordTime] = useState<string | null>(null);
  const [lastDbRecordDate, setLastDbRecordDate] = useState<string | null>(null);
  const [lastDbRegistro, setLastDbRegistro] = useState<number | null>(null);
  const [nextSyncTimestamp, setNextSyncTimestamp] = useState<number>(() => {
    return getNextSyncSchedule(SYNC_OFFSET_SECONDS, SENSOR_CYCLE_MINUTES).targetTimestamp;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // JWT Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Restore saved auth from localStorage on mount and proactively validate token
  useEffect(() => {
    const savedToken = localStorage.getItem("meteo_jwt_token");
    const savedUser = localStorage.getItem("meteo_jwt_user");
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);

        // Proactively verify if token is still valid against the server
        safeFetchJson<{ success: boolean; user?: AuthUser }>("/api/auth/me", {
          headers: { Authorization: `Bearer ${savedToken}` },
        }).then((res) => {
          if (!res.ok || !res.data?.success) {
            // Stale or expired token: clear gracefully so user gets a clean login
            localStorage.removeItem("meteo_jwt_token");
            localStorage.removeItem("meteo_jwt_user");
            setToken(null);
            setUser(null);
          } else if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("meteo_jwt_user", JSON.stringify(res.data.user));
          }
        }).catch(() => {
          // ignore network hiccups
        });
      } catch {
        localStorage.removeItem("meteo_jwt_token");
        localStorage.removeItem("meteo_jwt_user");
      }
    }
  }, []);

  const handleLogin = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("meteo_jwt_token", newToken);
    localStorage.setItem("meteo_jwt_user", JSON.stringify(newUser));
    showToast(`Bem-vindo, ${newUser.name}! Sessão autenticada com sucesso.`);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("meteo_jwt_token");
    localStorage.removeItem("meteo_jwt_user");
    showToast("Sessão encerrada com sucesso.");
  };

  // Fetch all endpoints smoothly in background, without full page reload
  const fetchAllData = useCallback(async (options: { fresh?: boolean } = {}) => {
    setIsSyncing(true);
    const freshParam = options.fresh ? "?fresh=1" : "";
    try {
      const [currRes, histRes, rainRes, foreRes, alertRes, cacheRes] = await Promise.all([
        safeFetchJson<{
          success: boolean;
          data?: {
            registro?: number;
            timestamp?: string;
            horaGravacao?: string;
            dataGravacao?: string;
            computed: ComputedTelemetry;
            raw?: any;
          };
        }>(`/api/telemetry/current${freshParam}`),
        safeFetchJson<{ success: boolean; data?: History24hData }>(`/api/telemetry/history-24h${freshParam}`),
        safeFetchJson<{ success: boolean; data?: RainSummaryData }>(`/api/telemetry/rain-summary${freshParam}`),
        safeFetchJson<{ success: boolean; data?: ForecastData }>("/api/telemetry/forecast-7d"),
        safeFetchJson<{ success: boolean; data?: WeatherAlertItem[] }>("/api/alerts"),
        safeFetchJson<{ success: boolean; data?: CacheStatsData }>("/api/cache/stats"),
      ]);

      if (currRes.ok && currRes.data?.success && currRes.data.data) {
        const currentPayload = currRes.data.data;
        if (currentPayload.computed) {
          setTelemetry(currentPayload.computed);
        }
        // Extract the exact database record time (not the client page reload time)
        const hora = currentPayload.horaGravacao || currentPayload.computed?.horaGravacao;
        if (hora) {
          setLastDbRecordTime(hora);
        } else if (currentPayload.timestamp || currentPayload.computed?.timestamp) {
          const rawTs = currentPayload.timestamp || currentPayload.computed?.timestamp || "";
          const time = rawTs.includes("T")
            ? rawTs.split("T")[1]?.substring(0, 8)
            : new Date(rawTs).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setLastDbRecordTime(time || null);
        }
        if (currentPayload.dataGravacao || currentPayload.computed?.dataGravacao) {
          setLastDbRecordDate(currentPayload.dataGravacao || currentPayload.computed?.dataGravacao || null);
        } else if (currentPayload.timestamp && currentPayload.timestamp.includes("T")) {
          setLastDbRecordDate(currentPayload.timestamp.split("T")[0]);
        }
        if (currentPayload.registro || currentPayload.computed?.registro) {
          setLastDbRegistro(currentPayload.registro || currentPayload.computed?.registro || null);
        }
      }

      if (histRes.ok && histRes.data?.success && histRes.data.data) {
        setHistory(histRes.data.data);
      }

      if (rainRes.ok && rainRes.data?.success && rainRes.data.data) {
        setRainData(rainRes.data.data);
      }

      if (foreRes.ok && foreRes.data?.success && foreRes.data.data) {
        const foreData = foreRes.data.data;
        if (!foreData.lastUpdated && (foreRes.data as any)?.cacheInfo?.savedAt) {
          foreData.lastUpdated = (foreRes.data as any).cacheInfo.savedAt;
        }
        setForecast(foreData);
      }

      if (alertRes.ok && alertRes.data?.success && Array.isArray(alertRes.data.data)) {
        setAlerts(alertRes.data.data);
        setAlert(alertRes.data.data.length > 0 ? alertRes.data.data[0] : null);
      }

      if (cacheRes.ok && cacheRes.data?.success && cacheRes.data.data) {
        setCacheStats(cacheRes.data.data);
      }

      // Also refresh today's daily telemetry if currently selected, keeping values live
      const todayStr = getBrazilTodayStr();
      if (selectedDailyDate === todayStr) {
        const dayRes = await safeFetchJson<{ success: boolean; data: DayTelemetryData }>(
          `/api/telemetry/day?date=${encodeURIComponent(todayStr)}${options.fresh ? "&fresh=1" : ""}`
        );
        if (dayRes.ok && dayRes.data?.data) {
          setDayData(dayRes.data.data);
        }
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.warn("Aviso na atualização de dados da API:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedDailyDate]);

  // Stable references to prevent effect thrashing
  const lastSyncTimeRef = useRef<Date | null>(null);
  useEffect(() => {
    lastSyncTimeRef.current = lastSyncTime;
  }, [lastSyncTime]);

  const fetchAllDataRef = useRef(fetchAllData);
  useEffect(() => {
    fetchAllDataRef.current = fetchAllData;
  }, [fetchAllData]);

  // Aligned 5-minute synchronization cycle with +20s offset
  // (e.g. 00:00:20, 00:05:20, 00:10:20)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const armNextTimer = () => {
      const schedule = getNextSyncSchedule(SYNC_OFFSET_SECONDS, SENSOR_CYCLE_MINUTES);
      setNextSyncTimestamp(schedule.targetTimestamp);

      timeoutId = setTimeout(async () => {
        if (isCancelled) return;
        // Background fetch with fresh bypass to immediately read committed DB records
        await fetchAllDataRef.current({ fresh: true });
        if (!isCancelled) {
          armNextTimer();
        }
      }, schedule.delayMs);
    };

    // Initial background pull on mount
    fetchAllDataRef.current({ fresh: false });
    // Arm timer to the nearest XX:00:20 or XX:05:20
    armNextTimer();

    // Tab visibility & system sleep wake-up handler
    const handleWakeup = () => {
      if (document.visibilityState === "visible") {
        const schedule = getNextSyncSchedule(SYNC_OFFSET_SECONDS, SENSOR_CYCLE_MINUTES);
        setNextSyncTimestamp(schedule.targetTimestamp);

        const nowMs = Date.now();
        const lastMs = lastSyncTimeRef.current?.getTime() ?? 0;
        // If more than 5 minutes have elapsed while tab was hidden/asleep, pull fresh data now
        if (nowMs - lastMs >= SENSOR_CYCLE_MINUTES * 60 * 1000) {
          fetchAllDataRef.current({ fresh: true });
          if (timeoutId) clearTimeout(timeoutId);
          armNextTimer();
        }
      }
    };

    document.addEventListener("visibilitychange", handleWakeup);
    window.addEventListener("focus", handleWakeup);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleWakeup);
      window.removeEventListener("focus", handleWakeup);
    };
  }, []);

  const handleManualSync = useCallback(() => {
    fetchAllData({ fresh: true });
  }, [fetchAllData]);

  // Fetch daily telemetry data whenever selectedDailyDate changes
  useEffect(() => {
    let isMounted = true;
    setIsDayLoading(true);
    safeFetchJson<{ success: boolean; data: DayTelemetryData }>(
      `/api/telemetry/day?date=${encodeURIComponent(selectedDailyDate)}`
    )
      .then((res) => {
        if (isMounted) {
          if (res.ok && res.data?.data) {
            setDayData(res.data.data);
          }
          setIsDayLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsDayLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDailyDate]);

  // Calibrate sensors
  const handleCalibrate = async () => {
    setIsCalibrating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await safeFetchJson<{ success: boolean; error?: string }>("/api/station/calibrate", {
        method: "POST",
        headers,
      });

      if (res.ok && res.data?.success) {
        showToast("Calibragem de zero do barômetro PTB330 concluída!");
        fetchAllData();
      } else {
        showToast(res.data?.error || res.error || "Falha na calibração.");
      }
    } catch (err: any) {
      showToast(`Erro de rede: ${err.message}`);
    } finally {
      setIsCalibrating(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!history || !history.series || history.series.length === 0) {
      showToast("Aguardando carregamento da série para exportação.");
      return;
    }

    const headers = [
      "Registro",
      "Timestamp",
      "Horario",
      "Temperatura_C",
      "Umidade_Pct",
      "Ponto_Orvalho_C",
      "Sensacao_Termica_C",
      "Pressao_Nivel_Mar_hPa",
      "Pressao_Local_hPa",
      "Chuva_Dia_mm",
      "Vento_kmh",
      "Direcao_Vento",
    ];

    const rows = history.series.map((pt) => [
      pt.registro,
      pt.timestamp,
      pt.time,
      pt.temp.toFixed(1),
      pt.umidade,
      pt.pontoOrvalho.toFixed(1),
      pt.sensacaoTermica.toFixed(1),
      pt.pressaoHpa.toFixed(1),
      pt.pressaoLocal.toFixed(1),
      pt.chuvaMm.toFixed(1),
      pt.ventoKmH.toFixed(1),
      pt.ventoDir,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telemetria_EMA_${getBrazilTodayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Arquivo CSV gerado e descarregado com sucesso!");
  };

  const handleRefreshForecast = async () => {
    try {
      showToast("Consultando APIs meteorológicas (Google API & Open-Meteo)...");
      const res = await safeFetchJson<{ success: boolean; data?: ForecastData }>("/api/telemetry/forecast-7d/refresh", {
        method: "POST",
      });
      if (res.ok && res.data?.success && res.data.data) {
        setForecast(res.data.data);
        showToast("Previsão atualizada com sucesso (Google API Principal & Open-Meteo Comparativo)!");
      } else {
        showToast("Falha na atualização da previsão meteorológica.");
      }
    } catch {
      showToast("Erro ao conectar à API para atualização da previsão.");
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "dark bg-[#0a0e18] text-[#dfe2f1]" : "bg-[#f8fafc] text-[#0f172a]"} transition-colors duration-200`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl card-surface border border-sky-500/60 shadow-[0_12px_36px_rgba(0,0,0,0.4)] text-theme-main flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8] text-xl">info</span>
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <Header
        onToggleTheme={() => setIsDark(!isDark)}
        isDark={isDark}
        onOpenBackendModal={() => setBackendModalOpen(true)}
        onOpenAboutModal={() => setAboutModalOpen(true)}
        onOpenMonthlyMetricsModal={() => {
          setMonthlyInitialYear(undefined);
          setMonthlyInitialMonth(undefined);
          setMonthlyMetricsModalOpen(true);
        }}
        onOpenYearlyMetricsModal={() => setYearlyMetricsModalOpen(true)}
        onOpenHistoricalMetricsModal={() => setHistoricalMetricsModalOpen(true)}
        user={user}
        cacheHitRate={cacheStats?.hitRatePct ?? 0}
        isPainelRoute={isPainelRoute}
        onNavigateHome={navigateToHome}
        onNavigatePainel={navigateToPainel}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
      />

      {/* Main Content Body */}
      <main className="pt-20 px-3 sm:px-6 lg:px-8 max-w-[1720px] mx-auto space-y-5" id="main-telemetry">
        {/* Banner visible only on /painel */}
        {isPainelRoute && (
          <div className="p-4 rounded-xl card-surface border border-sky-500/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center border border-sky-500/30 flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">terminal</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-[#0284c7] dark:text-[#38bdf8]">
                    Rota /painel Ativa
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-xs text-theme-secondary mt-0.5">
                  Acesso aos controles administrativos, banco MySQL / MariaDB e gestão de cache Redis habilitados nesta URL.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setBackendModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:hover:bg-[#7bd0ff] text-white dark:text-[#00354a] font-mono text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">dns</span>
                Abrir Console
              </button>
              <button
                onClick={navigateToHome}
                className="px-3 py-1.5 rounded-lg subcard-surface hover:bg-slate-200 dark:hover:bg-[#262a35] text-theme-main text-xs font-medium border border-theme transition-all flex items-center gap-1"
                title="Voltar para a visualização comum"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Sair de /painel
              </button>
            </div>
          </div>
        )}

        {/* Context Ribbon (Station name, live clock, metadata, and 5-min sync countdown) */}
        <ContextRibbon
          batteryPct={telemetry?.bateriaPct ?? 98}
          lastSyncTime={lastSyncTime}
          lastDbRecordTime={lastDbRecordTime || telemetry?.horaGravacao}
          lastDbRecordDate={lastDbRecordDate || telemetry?.dataGravacao}
          lastDbRegistro={lastDbRegistro || telemetry?.registro}
          nextSyncTimestamp={nextSyncTimestamp}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
        />

        {/* Dismissible Weather Alert (Live INMET Feed) */}
        <AlertBanner alert={alert} alerts={alerts} />

        {/* 5 Critical Telemetry Cards */}
        <TelemetryCards
          telemetry={telemetry}
          history={history}
          selectedDate={selectedDailyDate}
          onSelectDate={setSelectedDailyDate}
          dayData={dayData}
          isDayLoading={isDayLoading}
        />

        {/* Métricas do Dia (Historical & Daily Query with Dynamic Table Routing) */}
        <DailyMetricsSection
          id="metricas-dia"
          selectedDate={selectedDailyDate}
          onSelectDate={setSelectedDailyDate}
          onDayDataLoaded={(data) => setDayData(data)}
          externalData={dayData}
        />

        {/* 24-Hour Continuous Telemetry (Combined, Thermal & Barometric Charts with Crosshair) */}
        <HistoryTelemetry history={history} />

        {/* Advanced Rain Monitoring & Volumetric Analysis */}
        <RainAnalysis
          rainData={rainData}
          onOpenMonthlyMetrics={() => setMonthlyMetricsModalOpen(true)}
        />

        {/* 7-Day Numerical Weather Forecast */}
        <ExtendedForecast forecast={forecast} />

        {/* Diagnostics & Sensor Footer */}
        <StationFooter
          onOpenBackendModal={() => setBackendModalOpen(true)}
          onOpenAboutModal={() => setAboutModalOpen(true)}
          onCalibrate={handleCalibrate}
          isCalibrating={isCalibrating}
          isPainelRoute={isPainelRoute}
        />
      </main>

      {/* Monthly Metrics Modal (Exclusive Modal for Métrica Mês) */}
      <MonthlyMetricsSection
        isOpen={monthlyMetricsModalOpen}
        onClose={() => setMonthlyMetricsModalOpen(false)}
        onSelectDay={handleSelectDayFromMonth}
        initialYear={monthlyInitialYear}
        initialMonth={monthlyInitialMonth}
      />

      {/* Yearly Metrics Modal (Consolidated 12-Month Balances & Extremes) */}
      <YearlyMetricsSection
        isOpen={yearlyMetricsModalOpen}
        onClose={() => setYearlyMetricsModalOpen(false)}
        onSelectMonth={handleSelectMonthFromYear}
        onSelectDay={handleSelectDayFromYear}
      />

      {/* Historical Metrics Modal (Multi-Year Climatological Series from MariaDB) */}
      <HistoricalMetricsModal
        isOpen={historicalMetricsModalOpen}
        onClose={() => setHistoricalMetricsModalOpen(false)}
        onOpenMonthly={handleSelectMonthFromHistorical}
      />

      {/* About Project Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        isDark={isDark}
      />

      {/* Backend & Redis Cache Management Modal */}
      <BackendModal
        isOpen={backendModalOpen}
        onClose={() => setBackendModalOpen(false)}
        user={user}
        token={token}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRefreshData={fetchAllData}
      />
    </div>
  );
}
