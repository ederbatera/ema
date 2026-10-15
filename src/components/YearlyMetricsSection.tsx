import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  CloudRain,
  Thermometer,
  Flame,
  Snowflake,
  Wind,
  Droplets,
  Gauge,
  Activity,
  ArrowUpRight,
  BarChart3,
  List,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  Download,
  Sun,
  Layers,
} from "lucide-react";
import { YearTelemetryData, YearMonthSummary } from "../types";
import { safeFetchJson } from "../lib/api";
import { getBrazilDate } from "../lib/dateUtils";

interface YearlyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMonth?: (year: number, month: number) => void;
  onSelectDay?: (date: string) => void;
}

export const YearlyMetricsSection: React.FC<YearlyMetricsModalProps> = ({
  isOpen,
  onClose,
  onSelectMonth,
  onSelectDay,
}) => {
  const { year: currentYear, month: currentMonth } = useMemo(() => getBrazilDate(), []);

  // Selected Year state
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [viewMode, setViewMode] = useState<"table" | "bars">("table");

  // Data & Loading state
  const [data, setData] = useState<YearTelemetryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Available years: 2019 to current year
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= 2019; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Fetch yearly data
  const fetchYearData = async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        fromCache?: boolean;
        data: YearTelemetryData;
      }>(`/api/telemetry/year?year=${year}`);

      if (res.ok && res.data && res.data.data) {
        setData(res.data.data);
      } else {
        setError(res.error || "Não foi possível carregar os registros consolidados deste ano.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro de conexão ao carregar dados anuais.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when year changes or modal opens
  useEffect(() => {
    if (isOpen) {
      fetchYearData(selectedYear);
    }
  }, [isOpen, selectedYear]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Navigation handlers
  const handlePrevYear = () => {
    if (selectedYear <= 2019) return;
    setSelectedYear((y) => y - 1);
  };

  const handleNextYear = () => {
    if (selectedYear >= currentYear) return;
    setSelectedYear((y) => y + 1);
  };

  const handleCurrentYear = () => {
    setSelectedYear(currentYear);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (!data) return;

    const headers = [
      "Mês",
      "Chuva Acumulada (mm)",
      "Dias c/ Chuva",
      "Maior Chuva 24h (mm)",
      "Data Maior Chuva",
      "Temp. Mínima Absoluta (°C)",
      "Data Mínima",
      "Temp. Média (°C)",
      "Temp. Máxima Absoluta (°C)",
      "Data Máxima",
      "Amplitude Térmica Média (°C)",
      "Rajada Máxima (km/h)",
      "Direção Rajada",
      "Umidade Média (%)",
      "Pressão Média (hPa)",
    ];

    const rows = data.months.map((m) => [
      m.monthName,
      m.chuvaTotalMm.toFixed(1),
      m.diasComChuva,
      m.maiorChuvaDiaMm.toFixed(1),
      m.maiorChuvaData || "--",
      m.tempMinAbsoluta.toFixed(1),
      m.tempMinData || "--",
      m.tempMedia.toFixed(1),
      m.tempMaxAbsoluta.toFixed(1),
      m.tempMaxData || "--",
      m.amplitudeMedia.toFixed(1),
      m.rajadaMax,
      m.rajadaDir,
      m.umiMedia,
      m.pressaoMedia.toFixed(1),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EMA_Metricas_Ano_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Max rain among months for relative visual progress bars
  const maxRainInAnyMonth = useMemo(() => {
    if (!data || !data.months) return 100;
    const maxVal = Math.max(...data.months.map((m) => m.chuvaTotalMm), 0);
    return maxVal > 0 ? maxVal : 100;
  }, [data]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      id="modal-metricas-ano"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-metricas-ano-title"
    >
      <div className="w-full max-w-[98vw] 2xl:max-w-[1720px] h-[95vh] flex flex-col bg-white dark:bg-[#13151b] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-[#2e3440] overflow-hidden">
        {/* MODAL HEADER */}
        <header className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200/80 dark:border-[#262a35] bg-slate-50/90 dark:bg-[#181a20]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="modal-metricas-ano-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  Métricas Consolidadas do Ano
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {selectedYear}
                </span>
                {data && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Estação Conectada</span>
                    <span className="opacity-70">• Série Histórica</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Balanço meteorológico completo dos 12 meses, acumulados anuais, recordes de temperatura e drill-down mensal.
              </p>
            </div>
          </div>

          {/* Controls: Year Selector & Tools */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick Ano Atual */}
            <button
              type="button"
              onClick={handleCurrentYear}
              disabled={selectedYear === currentYear}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200/80 dark:bg-[#262a35] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#313540] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Ano Atual
            </button>

            {/* Stepper Year Navigation */}
            <div className="flex items-center rounded-xl bg-white dark:bg-[#1c1f26] border border-slate-300 dark:border-[#2e3440] p-0.5 shadow-xs">
              <button
                type="button"
                onClick={handlePrevYear}
                disabled={selectedYear <= 2019 || loading}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#262a35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Ano Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Year Select */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold font-mono text-slate-900 dark:text-white px-3 py-1 border-0 focus:outline-hidden cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option
                    key={yr}
                    value={yr}
                    className="bg-white dark:bg-[#1c1f26] text-slate-900 dark:text-white font-mono"
                  >
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextYear}
                disabled={selectedYear >= currentYear || loading}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#262a35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Próximo Ano"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View switcher (Table / Bars) */}
            <div className="hidden md:flex items-center bg-slate-200/80 dark:bg-[#1c1f26] p-0.5 rounded-xl border border-slate-300/80 dark:border-[#2e3440]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-[#262a35] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Tabela Detalhada dos 12 Meses"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("bars")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "bars"
                    ? "bg-white dark:bg-[#262a35] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Visão Gráfica Anual"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Gráficos</span>
              </button>
            </div>

            {/* CSV Export Button */}
            {data && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                title="Exportar dados anuais para planilha CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            )}

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-[#262a35] transition-colors cursor-pointer"
              title="Fechar modal (Esc)"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MODAL CONTENT BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-5 bg-slate-100/50 dark:bg-[#13151b]">
          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 flex items-center justify-center gap-3 bg-white dark:bg-[#181a20] rounded-xl border border-slate-200 dark:border-[#262a35] text-slate-600 dark:text-slate-300">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
              <span className="text-sm font-medium">
                Carregando balanço meteorológico consolidado de {selectedYear}...
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => fetchYearData(selectedYear)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* TOP YEAR GENERAL CARDS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. CHUVA ACUMULADA NO ANO */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/90 dark:border-[#262a35] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-blue-500" />
                      Chuva Acumulada no Ano
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {data.summary.diasComChuvaAno} dias c/ chuva
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                        {data.summary.chuvaAcumuladaAnoMm.toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">mm</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Média de {data.summary.mediaPluviometricaMensal.toFixed(1)} mm/mês em {data.summary.totalMesesMonitorados} meses monitorados.
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 dark:border-[#262a35] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Maior chuva 24h:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {data.summary.maiorChuva24hAnoMm.toFixed(1)} mm
                        {data.summary.maiorChuva24hData && (
                          <span className="text-[11px] font-normal text-slate-400 ml-1">
                            ({data.summary.maiorChuva24hData.split("-").reverse().join("/")})
                          </span>
                        )}
                      </span>
                    </div>
                    {data.summary.mesMaisChuvoso && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Mês mais chuvoso:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {data.summary.mesMaisChuvoso.nome} ({data.summary.mesMaisChuvoso.chuvaMm.toFixed(1)} mm)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. DIA MAIS QUENTE DO ANO (DESTACADO EM VERMELHO) */}
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                      Dia Mais Quente do Ano
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                      Recorde Anual
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                        {data.summary.tempMaxAbsolutaAno.toFixed(1)}°
                      </span>
                      <span className="text-xs font-bold text-rose-500 dark:text-rose-400">Máxima Absoluta</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-700/80 dark:text-rose-300 font-mono">
                      <span>
                        Data:{" "}
                        <strong className="underline decoration-rose-400 font-bold">
                          {data.summary.tempMaxData
                            ? data.summary.tempMaxData.split("-").reverse().join("/")
                            : "--"}
                        </strong>
                      </span>
                      {data.summary.tempMaxHora && (
                        <span>às {data.summary.tempMaxHora}</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40">
                    {data.summary.tempMaxData && onSelectDay && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectDay(data.summary.tempMaxData!);
                        }}
                        className="w-full py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Abrir Métricas deste Dia</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. DIA MAIS FRIO DO ANO (DESTACADO EM AZUL) */}
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <Snowflake className="w-4 h-4 text-sky-500 animate-pulse" />
                      Dia Mais Frio do Ano
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-200/80 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
                      Mínima Absoluta
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-sky-600 dark:text-sky-400">
                        {data.summary.tempMinAbsolutaAno.toFixed(1)}°
                      </span>
                      <span className="text-xs font-bold text-sky-500 dark:text-sky-400">Mínima Absoluta</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-sky-700/80 dark:text-sky-300 font-mono">
                      <span>
                        Data:{" "}
                        <strong className="underline decoration-sky-400 font-bold">
                          {data.summary.tempMinData
                            ? data.summary.tempMinData.split("-").reverse().join("/")
                            : "--"}
                        </strong>
                      </span>
                      {data.summary.tempMinHora && (
                        <span>às {data.summary.tempMinHora}</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-sky-200/60 dark:border-sky-900/40">
                    {data.summary.tempMinData && onSelectDay && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectDay(data.summary.tempMinData!);
                        }}
                        className="w-full py-1 px-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Abrir Métricas deste Dia</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. MÉDIAS TÉRMICAS & ATMOSFERA ANUAL */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/90 dark:border-[#262a35] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-emerald-500" />
                      Médias & Atmosfera Anual
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      Consolidação
                    </span>
                  </div>
                  <div className="my-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Temp. Média Geral:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {data.summary.tempMediaAno.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Média das Máximas:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {data.summary.mediaAnualDasMaximas.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Média das Mínimas:</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {data.summary.mediaAnualDasMinimas.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Amplitude Extrema:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {data.summary.amplitudeTermicaAno.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-[#262a35] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-slate-400" />
                      Rajada Máx: <strong>{data.summary.rajadaMaxAno} km/h</strong> ({data.summary.rajadaMaxDir})
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-500" />
                      Umi.: <strong>{data.summary.umiMediaAno}%</strong>
                    </span>
                  </div>
                </div>
              </section>

              {/* SECONDARY ATMOSPHERIC METRICS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#262a35] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Dias Calor Intenso (≥30°C)</div>
                    <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      {data.summary.diasCalorIntenso} dias
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#262a35] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                    <Snowflake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Dias Frios (≤12°C)</div>
                    <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      {data.summary.diasFrio} dias
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#262a35] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Pressão Média Anual</div>
                    <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      {data.summary.pressaoMediaAno.toFixed(1)} hPa
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#262a35] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Total de Dias Monitorados</div>
                    <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      {data.summary.totalDiasMonitorados} dias
                    </div>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE GUIDE & INSTRUCTIONS */}
              <div className="px-4 py-2.5 rounded-xl bg-amber-50/80 dark:bg-[#262016] border border-amber-200/80 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="font-medium">
                    Clique em qualquer linha ou botão <strong>Abrir Mês</strong> para carregar o modal detalhado de <strong>Métricas Mês</strong> correspondente.
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Mês Mais Chuvoso
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Mês Mais Quente
                  </span>
                  <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    Mês Mais Frio
                  </span>
                </div>
              </div>

              {/* VIEW 1: COMPLETE 12-MONTH TABLE */}
              {viewMode === "table" && (
                <div className="rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/90 dark:border-[#262a35] shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-[#1f232b] text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-[#262a35]">
                          <th className="py-3 px-3.5 sm:px-4">Mês</th>
                          <th className="py-3 px-3 text-right">Chuva Acum.</th>
                          <th className="py-3 px-3 text-center">Dias Chuva</th>
                          <th className="py-3 px-3 text-right">Maior 24h</th>
                          <th className="py-3 px-3 text-right">T. Mín. Abs.</th>
                          <th className="py-3 px-3 text-right">T. Média</th>
                          <th className="py-3 px-3 text-right">T. Máx. Abs.</th>
                          <th className="py-3 px-3 text-right">Ampl. Média</th>
                          <th className="py-3 px-3 text-right">Rajada Máx.</th>
                          <th className="py-3 px-3 text-center">Umid. Média</th>
                          <th className="py-3 px-3 text-center">Pressão</th>
                          <th className="py-3 px-3.5 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#262a35]">
                        {data.months.map((m) => {
                          const isHottest = m.isHottestMonth;
                          const isColdest = m.isColdestMonth;
                          const isWettest = m.isWettestMonth;
                          const isDriest = m.isDriestMonth;
                          const isUnavailable = m.isFuture || m.isBeforeInception;

                          let rowClass = "hover:bg-slate-50/80 dark:hover:bg-[#20242e] transition-colors";
                          if (isWettest) rowClass += " bg-blue-50/40 dark:bg-blue-950/20";
                          else if (isHottest) rowClass += " bg-rose-50/40 dark:bg-rose-950/20";
                          else if (isColdest) rowClass += " bg-sky-50/40 dark:bg-sky-950/20";

                          return (
                            <tr
                              key={m.month}
                              className={`${rowClass} ${isUnavailable ? "opacity-45" : "cursor-pointer"}`}
                              onClick={() => {
                                if (!isUnavailable && onSelectMonth) {
                                  onSelectMonth(selectedYear, m.month);
                                }
                              }}
                            >
                              {/* Mês */}
                              <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {m.monthName}
                                  </span>
                                  {isWettest && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                      + CHUVOSO
                                    </span>
                                  )}
                                  {isHottest && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                                      + QUENTE
                                    </span>
                                  )}
                                  {isColdest && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                                      + FRIO
                                    </span>
                                  )}
                                  {isDriest && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                      + SECO
                                    </span>
                                  )}
                                  {m.isBeforeInception && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-[#262a35]">
                                      Pré-EMA
                                    </span>
                                  )}
                                  {m.isFuture && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-[#262a35]">
                                      Futuro
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Chuva Acumulada */}
                              <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <div>
                                    <span>{m.chuvaTotalMm.toFixed(1)} mm</span>
                                    <div className="w-16 h-1 bg-slate-100 dark:bg-[#262a35] rounded-full overflow-hidden ml-auto mt-1">
                                      <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{
                                          width: `${Math.min(100, (m.chuvaTotalMm / maxRainInAnyMonth) * 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Dias com Chuva */}
                              <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#262a35] text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                                    {m.diasComChuva} d
                                  </span>
                                )}
                              </td>

                              {/* Maior Chuva em 24h */}
                              <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {isUnavailable || m.maiorChuvaDiaMm === 0 ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <div>
                                    <span className="font-bold">{m.maiorChuvaDiaMm.toFixed(1)} mm</span>
                                    {m.maiorChuvaData && (
                                      <div className="text-[10px] text-slate-400">
                                        dia {m.maiorChuvaData.split("-")[2]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Temp Mínima Absoluta */}
                              <td className="py-3 px-3 text-right font-mono text-sky-600 dark:text-sky-400 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <div>
                                    <span className="font-bold">{m.tempMinAbsoluta.toFixed(1)}°</span>
                                    {m.tempMinData && (
                                      <div className="text-[10px] text-slate-400">
                                        dia {m.tempMinData.split("-")[2]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Temp Média */}
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  `${m.tempMedia.toFixed(1)}°C`
                                )}
                              </td>

                              {/* Temp Máxima Absoluta */}
                              <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <div>
                                    <span className="font-bold">{m.tempMaxAbsoluta.toFixed(1)}°</span>
                                    {m.tempMaxData && (
                                      <div className="text-[10px] text-slate-400">
                                        dia {m.tempMaxData.split("-")[2]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Amplitude Térmica Média */}
                              <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  `${m.amplitudeMedia.toFixed(1)}°C`
                                )}
                              </td>

                              {/* Rajada Máxima */}
                              <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  <div>
                                    <span className="font-semibold">{m.rajadaMax} km/h</span>
                                    <span className="text-[10px] text-slate-400 ml-1">({m.rajadaDir})</span>
                                  </div>
                                )}
                              </td>

                              {/* Umidade Média */}
                              <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  `${m.umiMedia}%`
                                )}
                              </td>

                              {/* Pressão Média */}
                              <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {isUnavailable ? (
                                  <span className="text-slate-400">--</span>
                                ) : (
                                  `${m.pressaoMedia.toFixed(1)} hPa`
                                )}
                              </td>

                              {/* Ação Drill-down */}
                              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                {!isUnavailable && onSelectMonth ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectMonth(selectedYear, m.month);
                                    }}
                                    className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                    title={`Abrir Métricas de ${m.monthName}`}
                                  >
                                    <span>Abrir</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">--</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Tabela Footer Consolidado */}
                      <tfoot>
                        <tr className="bg-slate-100/90 dark:bg-[#1a1d24] font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-[#2e3440]">
                          <td className="py-3 px-3.5 sm:px-4">
                            TOTAL / MÉDIA ANUAL
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                            {data.summary.chuvaAcumuladaAnoMm.toFixed(1)} mm
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {data.summary.diasComChuvaAno} dias
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {data.summary.maiorChuva24hAnoMm.toFixed(1)} mm
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-sky-600 dark:text-sky-400">
                            {data.summary.tempMinAbsolutaAno.toFixed(1)}°
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {data.summary.tempMediaAno.toFixed(1)}°C
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                            {data.summary.tempMaxAbsolutaAno.toFixed(1)}°
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                            {data.summary.amplitudeMediaAnual.toFixed(1)}°C
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {data.summary.rajadaMaxAno} km/h
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {data.summary.umiMediaAno}%
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {data.summary.pressaoMediaAno.toFixed(1)} hPa
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className="text-[10px] text-slate-400 font-mono">12 Meses</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: VISUAL CHARTS VIEW */}
              {viewMode === "bars" && (
                <div className="space-y-4">
                  {/* Gráfico 1: Chuva Mês a Mês */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/90 dark:border-[#262a35] shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <CloudRain className="w-4 h-4 text-blue-500" />
                          <span>Distribuição Pluviométrica Mensal ({selectedYear})</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Acumulado de chuva em milímetros mês a mês com indicador de pico.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        Total: {data.summary.chuvaAcumuladaAnoMm.toFixed(1)} mm
                      </span>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 pb-2 items-end h-56 border-b border-slate-200 dark:border-[#262a35]">
                      {data.months.map((m) => {
                        const isUnavailable = m.isFuture || m.isBeforeInception;
                        const pct = isUnavailable ? 0 : (m.chuvaTotalMm / maxRainInAnyMonth) * 100;
                        const isWettest = m.isWettestMonth;

                        return (
                          <div
                            key={m.month}
                            className={`flex flex-col items-center justify-end h-full group ${
                              isUnavailable ? "opacity-30" : "cursor-pointer"
                            }`}
                            onClick={() => {
                              if (!isUnavailable && onSelectMonth) {
                                onSelectMonth(selectedYear, m.month);
                              }
                            }}
                          >
                            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {m.chuvaTotalMm.toFixed(0)}mm
                            </span>
                            <div className="w-full max-w-[28px] h-full flex items-end bg-slate-100 dark:bg-[#20242e] rounded-t-lg overflow-hidden">
                              <div
                                className={`w-full rounded-t-lg transition-all duration-500 ${
                                  isWettest
                                    ? "bg-blue-600 dark:bg-blue-400 shadow-md"
                                    : "bg-blue-400/80 dark:bg-blue-500/70 group-hover:bg-blue-500"
                                }`}
                                style={{ height: `${Math.max(pct, m.chuvaTotalMm > 0 ? 6 : 0)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-2 truncate max-w-full text-center">
                              {m.monthName.slice(0, 3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gráfico 2: Variação Térmica Mês a Mês */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/90 dark:border-[#262a35] shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-emerald-500" />
                          <span>Perfil Térmico Mensal: Mínima, Média e Máxima Absoluta</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Amplitude térmica e extremos observados na estação em cada mês.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="flex items-center gap-1 text-rose-500">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Máx
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Média
                        </span>
                        <span className="flex items-center gap-1 text-sky-500">
                          <span className="w-2 h-2 rounded-full bg-sky-500" /> Mín
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {data.months.map((m) => {
                        const isUnavailable = m.isFuture || m.isBeforeInception;
                        return (
                          <div
                            key={m.month}
                            onClick={() => {
                              if (!isUnavailable && onSelectMonth) {
                                onSelectMonth(selectedYear, m.month);
                              }
                            }}
                            className={`p-3 rounded-xl border border-slate-200 dark:border-[#262a35] bg-slate-50/70 dark:bg-[#1f232b] flex flex-col justify-between ${
                              isUnavailable ? "opacity-40" : "cursor-pointer hover:border-amber-500/40"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                              <span>{m.monthName}</span>
                              {m.isHottestMonth && <span className="text-[10px] text-rose-500">🔥 Quente</span>}
                              {m.isColdestMonth && <span className="text-[10px] text-sky-500">❄️ Frio</span>}
                            </div>
                            {isUnavailable ? (
                              <div className="py-4 text-center text-xs text-slate-400">Sem registros</div>
                            ) : (
                              <div className="my-2 space-y-1 text-xs font-mono">
                                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                  <span>Máx:</span>
                                  <span className="font-bold">{m.tempMaxAbsoluta.toFixed(1)}°C</span>
                                </div>
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                  <span>Média:</span>
                                  <span className="font-bold">{m.tempMedia.toFixed(1)}°C</span>
                                </div>
                                <div className="flex justify-between text-sky-600 dark:text-sky-400">
                                  <span>Mín:</span>
                                  <span className="font-bold">{m.tempMinAbsoluta.toFixed(1)}°C</span>
                                </div>
                                <div className="pt-1.5 border-t border-slate-200 dark:border-[#2e3440] flex justify-between text-[11px] text-amber-600 dark:text-amber-400">
                                  <span>Ampl:</span>
                                  <span>{m.amplitudeMedia.toFixed(1)}°C</span>
                                </div>
                              </div>
                            )}
                            {!isUnavailable && (
                              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                                <span>{m.chuvaTotalMm.toFixed(1)} mm chuva</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
