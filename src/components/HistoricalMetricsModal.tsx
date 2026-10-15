import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CloudRain,
  Thermometer,
  Flame,
  Snowflake,
  Droplets,
  BarChart3,
  Calendar,
  Database,
  RefreshCw,
  Download,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { HistoricalTelemetryData, HistoricalYearSeries } from "../types";
import { safeFetchJson } from "../lib/api";
import { getBrazilTodayStr } from "../lib/dateUtils";

interface HistoricalMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMonthly?: (year: number, month: number) => void;
}

type MetricKey =
  | "chuva"
  | "temp_max"
  | "temp_min"
  | "temp_media"
  | "temp_media_max"
  | "temp_media_min"
  | "umi_media";

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  aggregation: "sum" | "avg" | "max" | "min";
  icon: React.ReactNode;
  colorType: "rain" | "hot" | "cold" | "temp" | "hum";
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: "chuva",
    label: "Chuva Acumulada",
    unit: "mm",
    aggregation: "sum",
    icon: <CloudRain className="w-4 h-4 text-sky-500" />,
    colorType: "rain",
  },
  {
    key: "temp_max",
    label: "Temp. Máxima Absoluta",
    unit: "°C",
    aggregation: "max",
    icon: <Flame className="w-4 h-4 text-rose-500" />,
    colorType: "hot",
  },
  {
    key: "temp_min",
    label: "Temp. Mínima Absoluta",
    unit: "°C",
    aggregation: "min",
    icon: <Snowflake className="w-4 h-4 text-cyan-500" />,
    colorType: "cold",
  },
  {
    key: "temp_media",
    label: "Temperatura Média",
    unit: "°C",
    aggregation: "avg",
    icon: <Thermometer className="w-4 h-4 text-amber-500" />,
    colorType: "temp",
  },
  {
    key: "temp_media_max",
    label: "Média das Máximas Diárias",
    unit: "°C",
    aggregation: "avg",
    icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
    colorType: "hot",
  },
  {
    key: "temp_media_min",
    label: "Média das Mínimas Diárias",
    unit: "°C",
    aggregation: "avg",
    icon: <TrendingUp className="w-4 h-4 text-blue-400 rotate-180" />,
    colorType: "cold",
  },
  {
    key: "umi_media",
    label: "Umidade Média Relativa",
    unit: "%",
    aggregation: "avg",
    icon: <Droplets className="w-4 h-4 text-teal-500" />,
    colorType: "hum",
  },
];

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const HistoricalMetricsModal: React.FC<HistoricalMetricsModalProps> = ({
  isOpen,
  onClose,
  onOpenMonthly,
}) => {
  const [data, setData] = useState<HistoricalTelemetryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("chuva");
  const [viewTab, setViewTab] = useState<"matrix" | "annual">("matrix");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch historical data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        data: HistoricalTelemetryData;
      }>("/api/telemetry/historical");

      if (res.ok && res.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        setError(res.error || "Não foi possível obter os dados históricos.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro de conexão ao carregar dados históricos.");
    } finally {
      setLoading(false);
    }
  };

  // Recalculate 2026 data directly from MariaDB raw telemetry
  const handleRecalculate = async () => {
    setRecalculating(true);
    setStatusMessage("Recalculando métricas consolidadas diretamente da tabela EMA_1_2026...");
    try {
      const res = await safeFetchJson<{
        success: boolean;
        message: string;
        data: HistoricalTelemetryData;
      }>("/api/telemetry/historical/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: 2026 }),
      });

      if (res.ok && res.data?.success && res.data.data) {
        setData(res.data.data);
        setStatusMessage("Métricas de 2026 recalculadas e salvas na tabela MariaDB `dados_historicos`!");
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage("Falha ao recalcular métricas do banco de dados.");
      }
    } catch {
      setStatusMessage("Erro de rede ao solicitar recálculo.");
    } finally {
      setRecalculating(false);
    }
  };

  // Export JSON file
  const handleExportJSON = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data.series, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `dados_historicos_EMA_${getBrazilTodayStr()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard shortcut (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeMetricConfig = useMemo(
    () => METRIC_CONFIGS.find((m) => m.key === selectedMetric) || METRIC_CONFIGS[0],
    [selectedMetric]
  );

  // Find min and max for active metric across all valid values for heatmap scaling
  const metricRange = useMemo(() => {
    if (!data?.series) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;

    Object.values(data.series).forEach((yearData) => {
      const arr = yearData[selectedMetric] || [];
      arr.forEach((v) => {
        if (v !== null && v !== undefined) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    return { min, max };
  }, [data, selectedMetric]);

  // Dynamic cell background style based on value and metric type
  const getCellBg = (val: number | null) => {
    if (val === null || val === undefined) return "bg-transparent text-slate-400 dark:text-slate-600";
    const range = metricRange.max - metricRange.min || 1;
    const ratio = Math.max(0, Math.min(1, (val - metricRange.min) / range));

    switch (activeMetricConfig.colorType) {
      case "rain": {
        if (val === 0) return "bg-transparent text-slate-500";
        if (ratio > 0.6) return "bg-sky-500/25 text-sky-900 dark:text-sky-200 font-bold";
        if (ratio > 0.3) return "bg-sky-500/15 text-sky-800 dark:text-sky-300 font-medium";
        return "bg-sky-500/5 text-slate-700 dark:text-slate-200";
      }
      case "hot": {
        if (ratio > 0.7) return "bg-rose-500/25 text-rose-900 dark:text-rose-200 font-bold";
        if (ratio > 0.4) return "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-medium";
        return "bg-amber-500/5 text-slate-700 dark:text-slate-200";
      }
      case "cold": {
        if (ratio < 0.3) return "bg-cyan-500/25 text-cyan-900 dark:text-cyan-200 font-bold";
        if (ratio < 0.6) return "bg-blue-500/15 text-blue-800 dark:text-blue-300 font-medium";
        return "bg-blue-500/5 text-slate-700 dark:text-slate-200";
      }
      case "temp": {
        if (ratio > 0.65) return "bg-orange-500/20 text-orange-900 dark:text-orange-200 font-semibold";
        if (ratio < 0.35) return "bg-blue-500/15 text-blue-900 dark:text-blue-200 font-semibold";
        return "bg-emerald-500/10 text-slate-700 dark:text-slate-200";
      }
      case "hum": {
        if (ratio > 0.7) return "bg-teal-500/20 text-teal-900 dark:text-teal-200 font-bold";
        if (ratio < 0.3) return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
        return "bg-teal-500/5 text-slate-700 dark:text-slate-200";
      }
      default:
        return "text-slate-700 dark:text-slate-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-7xl max-h-[94vh] flex flex-col rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#232b3e] shadow-[0_24px_70px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#151c2c]/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-[#45dfa4] flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Dados Históricos da Estação (2019 - 2026)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  MariaDB: dados_historicos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Série climatológica contínua gerada e recalculada automaticamente a partir da telemetria da estação.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 transition-all disabled:opacity-50 cursor-pointer"
              title="Recalcula meses de 2026 a partir da tabela EMA_1_2026"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Recalcular 2026</span>
            </button>

            <button
              onClick={handleExportJSON}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#232b3e] dark:hover:bg-[#2e374d] dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer"
              title="Baixar série em JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-[#232b3e] transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status notification banner if any */}
        {statusMessage && (
          <div className="px-5 py-2 text-xs font-medium bg-sky-500/15 border-b border-sky-500/30 text-sky-800 dark:text-sky-200 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm font-medium text-slate-500">
                Lendo tabela <code className="font-mono text-emerald-600">dados_historicos</code> no MariaDB...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-center space-y-2">
              <p className="font-bold">{error}</p>
              <button
                onClick={loadData}
                type="button"
                className="px-4 py-2 rounded-lg bg-rose-500 text-white text-xs font-bold"
              >
                Tentar Novamente
              </button>
            </div>
          ) : data ? (
            <>
              {/* Top Record Highlights Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Recorde Chuva Mensal */}
                <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/25">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                    <CloudRain className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Maior Chuva Mensal</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {data.records.recordeChuvaMensal.valor.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">mm</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {MONTH_NAMES[data.records.recordeChuvaMensal.mes - 1]} / {data.records.recordeChuvaMensal.ano}
                  </p>
                </div>

                {/* 2. Recorde Calor Absoluto */}
                <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/25">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <Flame className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Maior Temp. Absoluta</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {data.records.recordeTempMax.valor.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">°C</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {MONTH_NAMES[data.records.recordeTempMax.mes - 1]} / {data.records.recordeTempMax.ano}
                  </p>
                </div>

                {/* 3. Recorde Frio Absoluto */}
                <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/25">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <Snowflake className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Menor Temp. Absoluta</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {data.records.recordeTempMin.valor.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">°C</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {MONTH_NAMES[data.records.recordeTempMin.mes - 1]} / {data.records.recordeTempMin.ano}
                  </p>
                </div>

                {/* 4. Ano Mais Chuvoso */}
                <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-500/25">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                    <Droplets className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Ano Mais Chuvoso</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {data.records.recordeChuvaAnual.valor.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">mm</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Ano {data.records.recordeChuvaAnual.ano}
                  </p>
                </div>
              </div>

              {/* Metric Selector Pills & View Tabs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {METRIC_CONFIGS.map((config) => {
                    const isActive = selectedMetric === config.key;
                    return (
                      <button
                        key={config.key}
                        onClick={() => setSelectedMetric(config.key)}
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1a2133] dark:hover:bg-[#232c44] dark:text-slate-300 border border-transparent"
                        }`}
                      >
                        {config.icon}
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* View switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#1a2133] border border-slate-200/80 dark:border-slate-800 self-start md:self-auto flex-shrink-0">
                  <button
                    onClick={() => setViewTab("matrix")}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewTab === "matrix"
                        ? "bg-white dark:bg-[#26314c] text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Matriz Mensal
                  </button>
                  <button
                    onClick={() => setViewTab("annual")}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewTab === "annual"
                        ? "bg-white dark:bg-[#26314c] text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Balanço Anual
                  </button>
                </div>
              </div>

              {/* View 1: Climatological Monthly Matrix */}
              {viewTab === "matrix" && (
                <div className="rounded-xl border border-slate-200 dark:border-[#232b3e] overflow-hidden bg-white dark:bg-[#141b2b]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#232b3e] bg-slate-50 dark:bg-[#182136] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4 w-20">Ano</th>
                          {MONTH_NAMES.map((m) => (
                            <th key={m} className="py-3 px-2 text-center">
                              {m}
                            </th>
                          ))}
                          <th className="py-3 px-4 text-right bg-slate-100 dark:bg-[#1e2942]">
                            {activeMetricConfig.aggregation === "sum" ? "Total Anual" : "Média Anual"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1f283d] font-mono">
                        {Object.entries(data.series)
                          .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10))
                          .map(([yearStr, yearObj]) => {
                            const yearNum = parseInt(yearStr, 10);
                            const values: (number | null)[] = yearObj[selectedMetric] || Array(12).fill(null);
                            const validValues = values.filter((v): v is number => v !== null && v !== undefined);

                            let annualCalc: number | null = null;
                            if (validValues.length > 0) {
                              if (activeMetricConfig.aggregation === "sum") {
                                annualCalc = Math.round(validValues.reduce((s, v) => s + v, 0) * 100) / 100;
                              } else if (activeMetricConfig.aggregation === "max") {
                                annualCalc = Math.max(...validValues);
                              } else if (activeMetricConfig.aggregation === "min") {
                                annualCalc = Math.min(...validValues);
                              } else {
                                annualCalc = Math.round((validValues.reduce((s, v) => s + v, 0) / validValues.length) * 10) / 10;
                              }
                            }

                            const isCurrent = yearNum === 2026;

                            return (
                              <tr
                                key={yearStr}
                                className={`hover:bg-slate-50/80 dark:hover:bg-[#1a2338] transition-colors ${
                                  isCurrent ? "bg-emerald-500/[0.04]" : ""
                                }`}
                              >
                                {/* Year Column */}
                                <td className="py-3 px-4 font-bold font-sans text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  <span>{yearStr}</span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-600 dark:text-[#45dfa4]">
                                      Atual
                                    </span>
                                  )}
                                </td>

                                {/* 12 Months */}
                                {values.map((val, mIdx) => {
                                  const formatted =
                                    val !== null && val !== undefined
                                      ? activeMetricConfig.unit === "mm"
                                        ? val.toFixed(1)
                                        : val.toFixed(1)
                                      : "-";

                                  const cellClass = getCellBg(val);

                                  return (
                                    <td
                                      key={mIdx}
                                      onClick={() => {
                                        if (val !== null && onOpenMonthly) {
                                          onOpenMonthly(yearNum, mIdx + 1);
                                        }
                                      }}
                                      className={`py-2 px-2 text-center transition-all ${
                                        val !== null && onOpenMonthly ? "cursor-pointer hover:underline" : ""
                                      } ${cellClass}`}
                                      title={`${MONTH_NAMES[mIdx]}/${yearStr}: ${
                                        val !== null ? `${val} ${activeMetricConfig.unit}` : "Sem dados"
                                      }`}
                                    >
                                      {formatted}
                                    </td>
                                  );
                                })}

                                {/* Annual Consolidated */}
                                <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-[#172033]">
                                  {annualCalc !== null
                                    ? `${annualCalc.toFixed(1)} ${activeMetricConfig.unit}`
                                    : "-"}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 2: Annual Balance Table */}
              {viewTab === "annual" && (
                <div className="rounded-xl border border-slate-200 dark:border-[#232b3e] overflow-hidden bg-white dark:bg-[#141b2b]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#232b3e] bg-slate-50 dark:bg-[#182136] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Ano</th>
                          <th className="py-3 px-4 text-right">Chuva Total (mm)</th>
                          <th className="py-3 px-4 text-right">Temp. Média (°C)</th>
                          <th className="py-3 px-4 text-right">Máx. Absoluta (°C)</th>
                          <th className="py-3 px-4 text-right">Mín. Absoluta (°C)</th>
                          <th className="py-3 px-4 text-right">Umidade Média (%)</th>
                          <th className="py-3 px-4 text-center">Meses Computados</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1f283d] font-mono">
                        {data.annualSummaries
                          .sort((a, b) => b.ano - a.ano)
                          .map((summary) => (
                            <tr
                              key={summary.ano}
                              className="hover:bg-slate-50 dark:hover:bg-[#1a2338] transition-colors"
                            >
                              <td className="py-3 px-4 font-bold font-sans text-slate-900 dark:text-white">
                                {summary.ano}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-sky-600 dark:text-sky-400">
                                {summary.chuvaTotal.toFixed(1)} mm
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                                {summary.tempMedia.toFixed(1)} °C
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                {summary.tempMaxAbs.toFixed(1)} °C
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-cyan-600 dark:text-cyan-400">
                                {summary.tempMinAbs.toFixed(1)} °C
                              </td>
                              <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                                {summary.umiMedia > 0 ? `${summary.umiMedia.toFixed(1)} %` : "-"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {summary.mesesValidos} / 12
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Informative Footer Note */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-[#232b3e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    Armazenamento persistente na tabela <strong className="font-mono text-slate-700 dark:text-slate-200">dados_historicos</strong> no MariaDB. Valores de 2026 sincronizados dinamicamente a partir dos sensores da EMA.
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 self-end sm:self-auto font-mono">
                  Última sincronização: {new Date(data.lastUpdated).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
