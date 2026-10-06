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
} from "lucide-react";
import { MonthTelemetryData, MonthDaySummary } from "../types";
import { safeFetchJson } from "../lib/api";
import { getBrazilDate } from "../lib/dateUtils";

interface MonthlyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDay: (date: string) => void;
  initialYear?: number;
  initialMonth?: number;
}

export const MonthlyMetricsSection: React.FC<MonthlyMetricsModalProps> = ({
  isOpen,
  onClose,
  onSelectDay,
  initialYear,
  initialMonth,
}) => {
  const { year: currentYear, month: currentMonth } = useMemo(() => getBrazilDate(), []);

  // Month and Year state
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || currentMonth);
  const [viewMode, setViewMode] = useState<"table" | "bars">("table");

  // Sync initial props if changed
  useEffect(() => {
    if (initialYear) setSelectedYear(initialYear);
    if (initialMonth) setSelectedMonth(initialMonth);
  }, [initialYear, initialMonth, isOpen]);

  // Data & Loading state
  const [data, setData] = useState<MonthTelemetryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Available years: 2019 to current year
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= 2019; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Fetch month data
  const fetchMonthData = async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        fromCache?: boolean;
        data: MonthTelemetryData;
      }>(`/api/telemetry/month?year=${year}&month=${month}`);

      if (res.ok && res.data && res.data.data) {
        setData(res.data.data);
      } else {
        setError(res.error || "Não foi possível carregar os registros consolidados deste mês.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro de conexão ao carregar dados mensais.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when month/year changes or when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMonthData(selectedYear, selectedMonth);
    }
  }, [isOpen, selectedYear, selectedMonth]);

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

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedYear === 2019 && selectedMonth <= 8) return; // DB begins in Aug 2019
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedYear >= currentYear && selectedMonth >= currentMonth) return;
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  };

  const isMinMonth = selectedYear === 2019 && selectedMonth <= 8;
  const isMaxMonth = selectedYear >= currentYear && selectedMonth >= currentMonth;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      id="modal-metricas-mes"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-metricas-mes-title"
    >
      <div className="w-full max-w-[98vw] 2xl:max-w-[1720px] h-[95vh] flex flex-col bg-white dark:bg-[#13151b] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-[#2e3440] overflow-hidden">
        {/* MODAL HEADER */}
        <header className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200/80 dark:border-[#262a35] bg-slate-50/90 dark:bg-[#181a20]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284c7]/10 dark:bg-[#38bdf8]/15 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center flex-shrink-0 border border-[#0284c7]/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="modal-metricas-mes-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  Métricas Consolidadas do Mês
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#0284c7]/15 text-[#0284c7] dark:text-[#38bdf8] border border-[#0284c7]/30">
                  {monthNames[selectedMonth - 1]} / {selectedYear}
                </span>
                {data && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Estação Conectada</span>
                    <span className="opacity-70">• Dados Oficiais</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Estatísticas diárias, acumulado de chuva, extremos térmicos e histórico meteorológico completo.
              </p>
            </div>
          </div>

          {/* Controls: Month Selector & Close Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick Mês Atual */}
            <button
              type="button"
              onClick={handleCurrentMonth}
              disabled={selectedYear === currentYear && selectedMonth === currentMonth}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200/80 dark:bg-[#262a35] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#313540] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Mês Atual
            </button>

            {/* Stepper Month Navigation */}
            <div className="flex items-center rounded-xl bg-white dark:bg-[#1c1f26] border border-slate-300 dark:border-[#2e3440] p-0.5 shadow-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isMinMonth || loading}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#262a35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Select */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white px-2 py-1 border-0 focus:outline-hidden cursor-pointer"
              >
                {monthNames.map((name, idx) => {
                  const mNum = idx + 1;
                  const isFutureMonth = selectedYear === currentYear && mNum > currentMonth;
                  const isBeforeStart = selectedYear === 2019 && mNum < 8;
                  return (
                    <option
                      key={mNum}
                      value={mNum}
                      disabled={isFutureMonth || isBeforeStart}
                      className="bg-white dark:bg-[#1c1f26] text-slate-900 dark:text-white"
                    >
                      {name}
                    </option>
                  );
                })}
              </select>

              {/* Year Select */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  const newYear = Number(e.target.value);
                  setSelectedYear(newYear);
                  if (newYear === 2019 && selectedMonth < 8) {
                    setSelectedMonth(8);
                  } else if (newYear === currentYear && selectedMonth > currentMonth) {
                    setSelectedMonth(currentMonth);
                  }
                }}
                className="bg-transparent text-xs font-bold font-mono text-slate-900 dark:text-white px-2 py-1 border-0 focus:outline-hidden cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option
                    key={yr}
                    value={yr}
                    className="bg-white dark:bg-[#1c1f26] text-slate-900 dark:text-white"
                  >
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={isMaxMonth || loading}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#262a35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Próximo Mês"
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
                title="Tabela Detalhada"
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
                title="Visão Gráfica Térmica"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Gráficos</span>
              </button>
            </div>

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
              <RefreshCw className="w-5 h-5 animate-spin text-[#0284c7]" />
              <span className="text-sm font-medium">
                Carregando registros de {monthNames[selectedMonth - 1]} de {selectedYear}...
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => fetchMonthData(selectedYear, selectedMonth)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* TOP MONTH GENERAL CARDS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. CHUVA ACUMULADA NO MÊS */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/90 dark:border-[#262a35] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-blue-500" />
                      Chuva Acumulada no Mês
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {data.summary.diasComChuva} {data.summary.diasComChuva === 1 ? "dia c/ chuva" : "dias c/ chuva"}
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                        {data.summary.chuvaAcumuladaMesMm.toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">mm</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Total precipitado em {data.summary.diasRegistrados} dias monitorados.
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 dark:border-[#262a35] flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Maior chuva em 24h:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {data.summary.maiorChuvaDiaMm.toFixed(1)} mm
                      {data.summary.maiorChuvaData && (
                        <span className="text-[11px] font-normal text-slate-400 ml-1">
                          (dia {data.summary.maiorChuvaData.split("-")[2]})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 2. DIA MAIS QUENTE DO MÊS (DESTACADO EM VERMELHO) */}
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                      Dia Mais Quente do Mês
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                      Recorde Mensal
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                        {data.summary.tempMaxAbsoluta.toFixed(1)}°
                      </span>
                      <span className="text-xs font-bold text-rose-500 dark:text-rose-400">Máxima Absoluta</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-700/80 dark:text-rose-300 font-mono">
                      <span>
                        Data:{" "}
                        <strong className="underline decoration-rose-400 font-bold">
                          {data.summary.tempMaxData
                            ? `${data.summary.tempMaxData.split("-")[2]}/${data.summary.tempMaxData.split("-")[1]}/${data.summary.tempMaxData.split("-")[0]}`
                            : "--"}
                        </strong>
                      </span>
                      {data.summary.tempMaxHora && (
                        <span>às {data.summary.tempMaxHora}</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40">
                    {data.summary.tempMaxData && (
                      <button
                        type="button"
                        onClick={() => onSelectDay(data.summary.tempMaxData!)}
                        className="w-full py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Abrir Métricas deste Dia</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. DIA MAIS FRIO DO MÊS (DESTACADO EM AZUL) */}
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <Snowflake className="w-4 h-4 text-sky-500 animate-pulse" />
                      Dia Mais Frio do Mês
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-200/80 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
                      Mínima Absoluta
                    </span>
                  </div>
                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-sky-600 dark:text-sky-400">
                        {data.summary.tempMinAbsoluta.toFixed(1)}°
                      </span>
                      <span className="text-xs font-bold text-sky-500 dark:text-sky-400">Mínima Absoluta</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-sky-700/80 dark:text-sky-300 font-mono">
                      <span>
                        Data:{" "}
                        <strong className="underline decoration-sky-400 font-bold">
                          {data.summary.tempMinData
                            ? `${data.summary.tempMinData.split("-")[2]}/${data.summary.tempMinData.split("-")[1]}/${data.summary.tempMinData.split("-")[0]}`
                            : "--"}
                        </strong>
                      </span>
                      {data.summary.tempMinHora && (
                        <span>às {data.summary.tempMinHora}</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-sky-200/60 dark:border-sky-900/40">
                    {data.summary.tempMinData && (
                      <button
                        type="button"
                        onClick={() => onSelectDay(data.summary.tempMinData!)}
                        className="w-full py-1 px-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Abrir Métricas deste Dia</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. MÉDIAS TÉRMICAS & VENTO DO MÊS */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/90 dark:border-[#262a35] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-emerald-500" />
                      Médias & Atmosfera
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      Consolidação
                    </span>
                  </div>
                  <div className="my-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Temp. Média Geral:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {data.summary.tempMediaMes.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Média das Máximas:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {data.summary.mediaDasMaximas.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Média das Mínimas:</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {data.summary.mediaDasMinimas.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Amplitude Média:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {data.summary.amplitudeMediaMes.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-[#262a35] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-slate-400" />
                      Rajada Máx: <strong>{data.summary.rajadaMaxMes} km/h</strong> ({data.summary.rajadaMaxDirecao})
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-500" />
                      Umi.: <strong>{data.summary.umiMediaMes}%</strong>
                    </span>
                  </div>
                </div>
              </section>

              {/* INTERACTIVE GUIDE & INSTRUCTIONS */}
              <div className="px-4 py-2.5 rounded-xl bg-blue-50/80 dark:bg-[#182234] border border-blue-200/80 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="font-medium">
                    Clique em qualquer linha ou dia da tabela para abrir o modal de <strong>Métricas do Dia</strong> correspondente.
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Dia Mais Quente
                  </span>
                  <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    Dia Mais Frio
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Chuva
                  </span>
                </div>
              </div>

              {/* TABLE VIEW: ALL DAYS IN THE MONTH */}
              {viewMode === "table" && (
                <div className="bg-white dark:bg-[#181a20] rounded-2xl border border-slate-200/90 dark:border-[#262a35] shadow-xs overflow-hidden">
                  <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-[#262a35] flex items-center justify-between bg-slate-50/60 dark:bg-[#1c1f26]/60">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-[#0284c7]" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Detalhamento Diário ({data.days.length} Dias em {monthNames[selectedMonth - 1]})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Ordenado do dia 1 ao {data.summary.totalDiasNoMes}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#262a35] bg-slate-100/70 dark:bg-[#14161d] text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3 sm:px-4">Dia</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Temp. Mínima</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Temp. Máxima</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Amplitude</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Temp. Média</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Chuva Total</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Pico Chuva</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Umidade Média</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Rajada Máx</th>
                          <th className="py-3 px-2 sm:px-3 text-center">Amostras</th>
                          <th className="py-3 px-3 sm:px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-[#262a35]/60">
                        {data.days.map((day) => {
                          const isHot = day.isHottestDay;
                          const isCold = day.isColdestDay;
                          const isFuture = day.isFuture;

                          let rowBgClass =
                            "hover:bg-slate-100/70 dark:hover:bg-[#20242e] transition-colors cursor-pointer";
                          if (isHot) {
                            rowBgClass =
                              "bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 border-l-4 border-l-rose-500 cursor-pointer font-medium";
                          } else if (isCold) {
                            rowBgClass =
                              "bg-sky-500/10 hover:bg-sky-500/20 dark:bg-sky-950/40 dark:hover:bg-sky-950/60 border-l-4 border-l-sky-500 cursor-pointer font-medium";
                          } else if (isFuture) {
                            rowBgClass = "opacity-45 bg-slate-50/50 dark:bg-[#15171e]/50 cursor-not-allowed";
                          }

                          return (
                            <tr
                              key={day.date}
                              className={rowBgClass}
                              onClick={() => {
                                if (!isFuture) onSelectDay(day.date);
                              }}
                              title={
                                isFuture
                                  ? "Dia futuro ainda não registrado"
                                  : `Clique para visualizar métricas detalhadas do dia ${day.dayNumber}`
                              }
                            >
                              {/* Dia & Semana */}
                              <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                                      isHot
                                        ? "bg-rose-500 text-white shadow-xs"
                                        : isCold
                                        ? "bg-sky-500 text-white shadow-xs"
                                        : "bg-slate-200 dark:bg-[#262a35] text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {String(day.dayNumber).padStart(2, "0")}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {day.dayOfWeek}
                                      </span>
                                      {isHot && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white flex items-center gap-0.5">
                                          <Flame className="w-2.5 h-2.5" />
                                          MAIS QUENTE
                                        </span>
                                      )}
                                      {isCold && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-600 text-white flex items-center gap-0.5">
                                          <Snowflake className="w-2.5 h-2.5" />
                                          MAIS FRIO
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      {day.date.split("-").reverse().join("/")}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Temp Mínima */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : (
                                  <div>
                                    <span
                                      className={`font-mono font-bold text-sm ${
                                        isCold ? "text-sky-600 dark:text-sky-400 font-extrabold" : "text-sky-600 dark:text-sky-400"
                                      }`}
                                    >
                                      {day.tempMin.toFixed(1)}°C
                                    </span>
                                    {day.tempMinTime && (
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {day.tempMinTime}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Temp Máxima */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : (
                                  <div>
                                    <span
                                      className={`font-mono font-bold text-sm ${
                                        isHot ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-rose-600 dark:text-rose-400"
                                      }`}
                                    >
                                      {day.tempMax.toFixed(1)}°C
                                    </span>
                                    {day.tempMaxTime && (
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {day.tempMaxTime}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Amplitude Térmica */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : (
                                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                    {day.amplitudeTermica.toFixed(1)}°C
                                  </span>
                                )}
                              </td>

                              {/* Temp Média */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : (
                                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                    {day.tempMedia.toFixed(1)}°C
                                  </span>
                                )}
                              </td>

                              {/* Chuva Total */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : day.chuvaTotalMm > 0 ? (
                                  <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                                    <CloudRain className="w-3 h-3" />
                                    {day.chuvaTotalMm.toFixed(1)} mm
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">0.0 mm</span>
                                )}
                              </td>

                              {/* Pico Chuva */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : day.chuvaPicoMmH && day.chuvaPicoMmH > 0 ? (
                                  <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                                    <strong>{day.chuvaPicoMmH.toFixed(1)} mm/h</strong>
                                    {day.chuvaPicoHora && (
                                      <div className="text-[10px] text-slate-400">{day.chuvaPicoHora}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">--</span>
                                )}
                              </td>

                              {/* Umidade Média */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : (
                                  <span className="font-mono text-slate-700 dark:text-slate-300">
                                    {day.umiMedia}%
                                  </span>
                                )}
                              </td>

                              {/* Rajada Máx */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : (
                                  <span className="font-mono text-slate-700 dark:text-slate-300">
                                    {day.rajadaMaxKmH} km/h
                                    {day.rajadaMaxDirecao && (
                                      <span className="text-[10px] text-slate-400 ml-1">
                                        {day.rajadaMaxDirecao}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </td>

                              {/* Total Registros */}
                              <td className="py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-slate-400 font-mono">--</span>
                                ) : (
                                  <span className="font-mono text-xs text-slate-500">
                                    {day.totalRegistros}
                                  </span>
                                )}
                              </td>

                              {/* Botão Ver Dia */}
                              <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                                {isFuture ? (
                                  <span className="text-[11px] text-slate-400">Pendente</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectDay(day.date);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#0284c7]/10 hover:bg-[#0284c7] text-[#0284c7] hover:text-white dark:text-[#38bdf8] dark:hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Ver Dia</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BARS / GRAPHICAL VIEW */}
              {viewMode === "bars" && (
                <div className="bg-white dark:bg-[#181a20] rounded-2xl border border-slate-200/90 dark:border-[#262a35] p-4 sm:p-6 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-rose-500" />
                        Variação Térmica Diária (Mínima vs Máxima)
                      </h4>
                      <span className="text-xs text-slate-400">
                        Clique na barra para ver o dia correspondente
                      </span>
                    </div>

                    <div className="space-y-2 pt-2">
                      {data.days.map((day) => {
                        if (day.isFuture) return null;
                        const isHot = day.isHottestDay;
                        const isCold = day.isColdestDay;

                        // Visual bar width scaled from 0°C to 40°C
                        const minPercent = Math.max(0, Math.min(100, (day.tempMin / 40) * 100));
                        const maxPercent = Math.max(0, Math.min(100, (day.tempMax / 40) * 100));
                        const spanWidth = Math.max(2, maxPercent - minPercent);

                        return (
                          <div
                            key={day.date}
                            onClick={() => onSelectDay(day.date)}
                            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-3 text-xs ${
                              isHot
                                ? "bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900"
                                : isCold
                                ? "bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-900"
                                : "hover:bg-slate-100 dark:hover:bg-[#20242e] border border-transparent"
                            }`}
                          >
                            <span className="w-16 font-mono font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                              Dia {String(day.dayNumber).padStart(2, "0")} ({day.dayOfWeek})
                            </span>

                            <div className="flex-1 h-5 bg-slate-100 dark:bg-[#14161d] rounded-full relative overflow-hidden border border-slate-200 dark:border-slate-800">
                              <div
                                className={`absolute top-0 bottom-0 rounded-full ${
                                  isHot
                                    ? "bg-gradient-to-r from-amber-500 to-rose-600 shadow-sm"
                                    : isCold
                                    ? "bg-gradient-to-r from-sky-400 to-blue-600 shadow-sm"
                                    : "bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                                }`}
                                style={{
                                  left: `${minPercent}%`,
                                  width: `${spanWidth}%`,
                                }}
                              />
                            </div>

                            <div className="w-40 flex items-center justify-end gap-2 font-mono text-xs flex-shrink-0">
                              <span className="text-sky-600 dark:text-sky-400 font-bold">
                                {day.tempMin.toFixed(1)}°
                              </span>
                              <span className="text-slate-400">à</span>
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                {day.tempMax.toFixed(1)}°
                              </span>
                              {day.chuvaTotalMm > 0 && (
                                <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 text-[11px]">
                                  <CloudRain className="w-3 h-3" />
                                  {day.chuvaTotalMm.toFixed(1)}m
                                </span>
                              )}
                            </div>
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

        {/* MODAL FOOTER */}
        <footer className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200/80 dark:border-[#262a35] bg-slate-50 dark:bg-[#181a20] flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Estação Meteorológica Agudos • Ano de Referência: <strong>{selectedYear}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-[#262a35] dark:hover:bg-[#313540] text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
