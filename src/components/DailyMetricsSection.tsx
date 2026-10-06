import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunrise,
  Sunset,
  CloudRain,
  Thermometer,
  Wind,
  Gauge,
  Droplets,
  Clock,
  Sparkles,
  Info,
  Loader2,
  TrendingUp,
  Activity,
  Compass,
  RefreshCw,
} from "lucide-react";
import { DayTelemetryData, DayTelemetryPoint } from "../types";
import { safeFetchJson } from "../lib/api";
import { getBrazilTodayStr, addDaysToDateStr } from "../lib/dateUtils";

interface DailyMetricsSectionProps {
  id?: string;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onDayDataLoaded?: (data: DayTelemetryData) => void;
  externalData?: DayTelemetryData | null;
}

export const DailyMetricsSection: React.FC<DailyMetricsSectionProps> = ({
  id = "metricas-dia",
  selectedDate: propSelectedDate,
  onSelectDate,
  onDayDataLoaded,
  externalData,
}) => {
  // Database records started on 2019-08-13
  const MIN_DATE = "2019-08-13";
  const todayStr = useMemo(() => {
    return getBrazilTodayStr();
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(propSelectedDate || todayStr);

  useEffect(() => {
    if (propSelectedDate && propSelectedDate !== selectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (onSelectDate) {
      onSelectDate(newDate);
    }
  };
  const [data, setData] = useState<DayTelemetryData | null>(null);

  useEffect(() => {
    if (externalData && externalData.date === selectedDate) {
      setData(externalData);
      setLoading(false);
    }
  }, [externalData, selectedDate]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<"thermal" | "rain_humidity" | "pressure_wind">("thermal");
  const [showTaxaChuva, setShowTaxaChuva] = useState<boolean>(true);
  const [showChuvaAcum, setShowChuvaAcum] = useState<boolean>(true);
  const [showUmidade, setShowUmidade] = useState<boolean>(true);

  // Crosshair and hover inspection state
  const [crosshairIndex, setCrosshairIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    svgX: number;
    svgY: number;
    mouseX: number;
    mouseY: number;
    pointIndex: number;
  } | null>(null);

  const chartWrapperRef = useRef<HTMLDivElement>(null);

  // Fetch telemetry for the selected date
  const fetchDayData = async (dateToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        data: DayTelemetryData;
        fromCache?: boolean;
      }>(`/api/telemetry/day?date=${encodeURIComponent(dateToFetch)}`);

      if (res.ok && res.data?.data) {
        setData(res.data.data);
        onDayDataLoaded?.(res.data.data);
      } else {
        setError(res.error || "Não foi possível carregar as métricas para a data selecionada.");
      }
    } catch (err: any) {
      setError(err?.message || "Falha na conexão com a estação meteorológica.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayData(selectedDate);
  }, [selectedDate]);

  // Date Navigation
  const handlePrevDay = () => {
    const newDateStr = addDaysToDateStr(selectedDate, -1);
    if (newDateStr >= MIN_DATE) {
      handleDateChange(newDateStr);
    }
  };

  const handleNextDay = () => {
    const newDateStr = addDaysToDateStr(selectedDate, 1);
    if (newDateStr <= todayStr) {
      handleDateChange(newDateStr);
    }
  };

  // Target table based on selected year
  const targetYear = selectedDate.split("-")[0];
  const targetTable = `EMA_1_${targetYear}`;

  // Formatted date string in Portuguese
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Chart computation
  const series = data?.timeSeries || [];

  // Active crosshair point
  const hoveredPoint: DayTelemetryPoint | null = useMemo(() => {
    if (crosshairIndex !== null && series[crosshairIndex]) {
      return series[crosshairIndex];
    }
    return series[series.length - 1] || null;
  }, [crosshairIndex, series]);

  // High resolution SVG dimensions
  const svgWidth = 1100;
  const svgHeight = 290;
  const paddingX = 45;
  const paddingY = 32;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // 1. Thermal Paths (Temp, Feel, Dew)
  const thermalChartData = useMemo(() => {
    if (series.length < 2) return null;
    const temps = series.map((s) => s.tempAtual);
    const feels = series.map((s) => s.sensacao);
    const dews = series.map((s) => s.pontoOrvalho);

    const minVal = Math.min(...temps, ...feels, ...dews);
    const maxVal = Math.max(...temps, ...feels, ...dews);
    const rangeMin = Math.floor(minVal - 1);
    const rangeMax = Math.ceil(maxVal + 1);
    const rangeSpan = Math.max(4, rangeMax - rangeMin);

    const getY = (val: number) => {
      const ratio = (val - rangeMin) / rangeSpan;
      return paddingY + chartHeight - ratio * chartHeight;
    };

    const getX = (index: number) => {
      return paddingX + (index / (series.length - 1)) * chartWidth;
    };

    const tempPoints = series.map((s, i) => `${getX(i)},${getY(s.tempAtual)}`);
    const feelPoints = series.map((s, i) => `${getX(i)},${getY(s.sensacao)}`);
    const dewPoints = series.map((s, i) => `${getX(i)},${getY(s.pontoOrvalho)}`);

    const tempPath = `M ${tempPoints.join(" L ")}`;
    const feelPath = `M ${feelPoints.join(" L ")}`;
    const dewPath = `M ${dewPoints.join(" L ")}`;

    const areaPath = `M ${getX(0)},${getY(series[0].tempAtual)} L ${tempPoints.join(" L ")} L ${getX(series.length - 1)},${paddingY + chartHeight} L ${getX(0)},${paddingY + chartHeight} Z`;

    return {
      tempPath,
      feelPath,
      dewPath,
      areaPath,
      rangeMin,
      rangeMax,
      getY,
      getX,
    };
  }, [series]);

  // 2. Rain & Humidity Paths (with Rain Rate / Taxa de Chuva)
  const rainHumChartData = useMemo(() => {
    if (series.length < 2) return null;
    const rains = series.map((s) => s.chuvaAcumuladaMm || 0);
    const taxas = series.map((s) => s.chuvaTaxaMmH || 0);

    const maxRain = Math.max(5, Math.ceil(Math.max(...rains) * 1.2));
    const maxTaxa = Math.max(10, Math.ceil(Math.max(...taxas) * 1.25));

    const humMin = 20;
    const humSpan = 80;

    const getHumY = (val: number) => {
      const ratio = (val - humMin) / humSpan;
      return paddingY + chartHeight - ratio * chartHeight;
    };

    const getRainY = (val: number) => {
      const ratio = val / maxRain;
      return paddingY + chartHeight - ratio * chartHeight;
    };

    const getTaxaY = (val: number) => {
      const ratio = Math.min(1, Math.max(0, val / maxTaxa));
      return paddingY + chartHeight - ratio * chartHeight;
    };

    const getX = (index: number) => {
      return paddingX + (index / (series.length - 1)) * chartWidth;
    };

    const humPoints = series.map((s, i) => `${getX(i)},${getHumY(s.umidade)}`);
    const humPath = `M ${humPoints.join(" L ")}`;

    const rainPoints = series.map((s, i) => `${getX(i)},${getRainY(s.chuvaAcumuladaMm || 0)}`);
    const rainAreaPath = `M ${getX(0)},${paddingY + chartHeight} L ${rainPoints.join(" L ")} L ${getX(series.length - 1)},${paddingY + chartHeight} Z`;

    // Taxa de Chuva profile curve & area
    const taxaPoints = series.map((s, i) => `${getX(i)},${getTaxaY(s.chuvaTaxaMmH || 0)}`);
    const taxaPath = `M ${taxaPoints.join(" L ")}`;
    const taxaAreaPath = `M ${getX(0)},${paddingY + chartHeight} L ${taxaPoints.join(" L ")} L ${getX(series.length - 1)},${paddingY + chartHeight} Z`;

    // Column bars for each reading where rain rate > 0
    const barWidth = Math.max(5, Math.min(20, (chartWidth / series.length) * 0.75));
    const rainBars = series.map((s, i) => {
      const rate = s.chuvaTaxaMmH || 0;
      const x = getX(i);
      const y = getTaxaY(rate);
      const height = (paddingY + chartHeight) - y;
      return {
        index: i,
        time: s.time,
        rate,
        x: x - barWidth / 2,
        centerX: x,
        y,
        width: barWidth,
        height,
        hasRain: rate > 0,
      };
    });

    // Detect peak rain rate
    let peakIndex = -1;
    let peakRate = 0;
    taxas.forEach((rate, i) => {
      if (rate > peakRate) {
        peakRate = rate;
        peakIndex = i;
      }
    });

    // Detect distinct rain periods/windows
    const rainPeriods: Array<{
      startIdx: number;
      endIdx: number;
      startTime: string;
      endTime: string;
      peakRate: number;
      peakTime: string;
      accumulated: number;
    }> = [];

    let currentPeriod: {
      startIdx: number;
      endIdx: number;
      startTime: string;
      endTime: string;
      peakRate: number;
      peakTime: string;
      startAccum: number;
      endAccum: number;
    } | null = null;

    series.forEach((s, i) => {
      const rate = s.chuvaTaxaMmH || 0;
      if (rate > 0) {
        if (!currentPeriod) {
          currentPeriod = {
            startIdx: i,
            endIdx: i,
            startTime: s.time,
            endTime: s.time,
            peakRate: rate,
            peakTime: s.time,
            startAccum: s.chuvaAcumuladaMm || 0,
            endAccum: s.chuvaAcumuladaMm || 0,
          };
        } else {
          currentPeriod.endIdx = i;
          currentPeriod.endTime = s.time;
          currentPeriod.endAccum = s.chuvaAcumuladaMm || 0;
          if (rate > currentPeriod.peakRate) {
            currentPeriod.peakRate = rate;
            currentPeriod.peakTime = s.time;
          }
        }
      } else if (currentPeriod) {
        rainPeriods.push({
          startIdx: currentPeriod.startIdx,
          endIdx: currentPeriod.endIdx,
          startTime: currentPeriod.startTime,
          endTime: currentPeriod.endTime,
          peakRate: currentPeriod.peakRate,
          peakTime: currentPeriod.peakTime,
          accumulated: Number((currentPeriod.endAccum - currentPeriod.startAccum).toFixed(1)),
        });
        currentPeriod = null;
      }
    });

    if (currentPeriod) {
      rainPeriods.push({
        startIdx: currentPeriod.startIdx,
        endIdx: currentPeriod.endIdx,
        startTime: currentPeriod.startTime,
        endTime: currentPeriod.endTime,
        peakRate: currentPeriod.peakRate,
        peakTime: currentPeriod.peakTime,
        accumulated: Number((currentPeriod.endAccum - currentPeriod.startAccum).toFixed(1)),
      });
    }

    return {
      humPath,
      rainAreaPath,
      taxaPath,
      taxaAreaPath,
      rainBars,
      rainPeriods,
      peakPoint:
        peakIndex >= 0 && peakRate > 0
          ? {
              x: getX(peakIndex),
              y: getTaxaY(peakRate),
              rate: peakRate,
              time: series[peakIndex].time,
            }
          : null,
      maxRain,
      maxTaxa,
      getHumY,
      getRainY,
      getTaxaY,
      getX,
    };
  }, [series]);

  // 3. Pressure & Wind Paths
  const pressWindChartData = useMemo(() => {
    if (series.length < 2) return null;
    const pressures = series.map((s) => s.pressaoHpa);
    const winds = series.map((s) => s.ventoKmH);
    const gusts = series.map((s) => s.rajadaKmH);

    const minP = Math.floor(Math.min(...pressures) - 1);
    const maxP = Math.ceil(Math.max(...pressures) + 1);
    const pSpan = Math.max(3, maxP - minP);

    const maxW = Math.max(20, Math.ceil(Math.max(...winds, ...gusts) * 1.15));

    const getPY = (p: number) => {
      const ratio = (p - minP) / pSpan;
      return paddingY + chartHeight - ratio * chartHeight;
    };

    const getWY = (w: number) => {
      const ratio = w / maxW;
      return paddingY + chartHeight - ratio * chartHeight;
    };

    const getX = (index: number) => {
      return paddingX + (index / (series.length - 1)) * chartWidth;
    };

    const pressPoints = series.map((s, i) => `${getX(i)},${getPY(s.pressaoHpa)}`);
    const windPoints = series.map((s, i) => `${getX(i)},${getWY(s.ventoKmH)}`);
    const gustPoints = series.map((s, i) => `${getX(i)},${getWY(s.rajadaKmH)}`);

    return {
      pressPath: `M ${pressPoints.join(" L ")}`,
      windPath: `M ${windPoints.join(" L ")}`,
      gustPath: `M ${gustPoints.join(" L ")}`,
      minP,
      maxP,
      maxW,
      getPY,
      getWY,
      getX,
    };
  }, [series]);

  // Mouse move handler for the chart to display hover values
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (series.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const svgX = (mouseX / rect.width) * svgWidth;
    const svgY = (mouseY / rect.height) * svgHeight;

    const clampedSvgX = Math.max(paddingX, Math.min(svgWidth - paddingX, svgX));
    const ratio = (clampedSvgX - paddingX) / chartWidth;
    const index = Math.round(ratio * (series.length - 1));
    const clampedIndex = Math.max(0, Math.min(series.length - 1, index));

    setCrosshairIndex(clampedIndex);
    setHoverPosition({
      svgX: paddingX + (clampedIndex / (series.length - 1)) * chartWidth,
      svgY,
      mouseX,
      mouseY,
      pointIndex: clampedIndex,
    });
  };

  const handleMouseLeave = () => {
    setCrosshairIndex(null);
    setHoverPosition(null);
  };

  // Reusable Chart Component
  const renderChart = (wrapperRef: React.RefObject<HTMLDivElement>) => (
    <div className="border border-slate-200/80 dark:border-[#2e3440] rounded-xl p-4 sm:p-5 bg-white dark:bg-[#171922] shadow-xs">
      {/* Chart Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#2e3440]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Curvas Diárias (24h)</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              • 00:00 às 23:59 BRT
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Passe o mouse sobre qualquer ponto da curva para visualizar os valores instantâneos.
          </p>
        </div>

        {/* Chart Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#13151b] rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveChart("thermal")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeChart === "thermal"
                ? "bg-white dark:bg-[#262a35] text-rose-600 dark:text-rose-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Temperatura & Sensação
          </button>
          <button
            type="button"
            onClick={() => setActiveChart("rain_humidity")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChart === "rain_humidity"
                ? "bg-white dark:bg-[#262a35] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
            <span>Chuva & Taxa (mm/h)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChart("pressure_wind")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeChart === "pressure_wind"
                ? "bg-white dark:bg-[#262a35] text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Barômetro & Vento
          </button>
        </div>

        {/* Rain layer toggles if activeChart is rain_humidity */}
        {activeChart === "rain_humidity" && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#13151b] rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1 font-semibold uppercase tracking-wider hidden sm:inline">Camadas:</span>
            <button
              type="button"
              onClick={() => setShowTaxaChuva(!showTaxaChuva)}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border ${
                showTaxaChuva
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold"
                  : "bg-transparent border-transparent text-slate-400 dark:text-slate-500 line-through"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showTaxaChuva ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"}`} />
              Taxa (mm/h)
            </button>
            <button
              type="button"
              onClick={() => setShowChuvaAcum(!showChuvaAcum)}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border ${
                showChuvaAcum
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold"
                  : "bg-transparent border-transparent text-slate-400 dark:text-slate-500 line-through"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showChuvaAcum ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`} />
              Acumulada (mm)
            </button>
            <button
              type="button"
              onClick={() => setShowUmidade(!showUmidade)}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border ${
                showUmidade
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-bold"
                  : "bg-transparent border-transparent text-slate-400 dark:text-slate-500 line-through"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showUmidade ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-600"}`} />
              Umidade (%)
            </button>
          </div>
        )}
      </div>

      {/* Top Value Strip on hover */}
      {hoveredPoint && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 py-2.5 px-4 my-3 bg-slate-50 dark:bg-[#13151b] rounded-xl border border-slate-200/60 dark:border-[#2e3440] text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>Horário: {hoveredPoint.time} BRT</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Temp: {hoveredPoint.tempAtual.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Sensação: {hoveredPoint.sensacao.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Umidade: {hoveredPoint.umidade}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Chuva: {hoveredPoint.chuvaAcumuladaMm.toFixed(1)} mm</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hoveredPoint.chuvaTaxaMmH > 0 ? "text-indigo-600 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800" : "text-indigo-600 dark:text-indigo-400"}`}>
            <span className={`w-2 h-2 rounded-full ${hoveredPoint.chuvaTaxaMmH > 0 ? "bg-indigo-500 animate-ping" : "bg-indigo-400"}`} />
            <span>Taxa Chuva: {hoveredPoint.chuvaTaxaMmH.toFixed(1)} mm/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Pressão: {hoveredPoint.pressaoHpa} hPa</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Vento: {hoveredPoint.ventoKmH} km/h ({hoveredPoint.ventoDirecao})</span>
          </div>
        </div>
      )}

      {/* Interactive Chart Container with Floating Tooltip Following Mouse */}
      <div ref={wrapperRef} className="relative w-full overflow-hidden mt-2">
        {/* Floating Tooltip displaying values when hovering over the graph */}
        {hoverPosition && hoveredPoint && (
          <div
            className="absolute pointer-events-none z-30 transition-transform duration-75 ease-out select-none"
            style={{
              left: `${(hoverPosition.svgX / svgWidth) * 100}%`,
              top: "16px",
              transform:
                hoverPosition.svgX > svgWidth * 0.65
                  ? "translateX(calc(-100% - 16px))"
                  : "translateX(16px)",
            }}
          >
            <div className="bg-white/95 dark:bg-[#0c1018]/95 backdrop-blur-md border border-slate-200 dark:border-sky-500/40 text-slate-800 dark:text-white rounded-xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.5)] p-3 min-w-[210px] text-xs font-mono">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-700/70 text-slate-600 dark:text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                  <Clock className="w-3.5 h-3.5" />
                  {hoveredPoint.time} BRT
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Amostra #{hoverPosition.pointIndex + 1}
                </span>
              </div>

              {activeChart === "thermal" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
                      Temperatura:
                    </span>
                    <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">
                      {hoveredPoint.tempAtual.toFixed(1)} °C
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
                      Sensação Térmica:
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                      {hoveredPoint.sensacao.toFixed(1)} °C
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-xs" />
                      Ponto de Orvalho:
                    </span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300">
                      {hoveredPoint.pontoOrvalho.toFixed(1)} °C
                    </span>
                  </div>
                </div>
              )}

              {activeChart === "rain_humidity" && (
                <div className="space-y-2">
                  <div
                    className={`p-2 rounded-lg border transition-all ${
                      hoveredPoint.chuvaTaxaMmH > 0
                        ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                        <CloudRain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Taxa de Chuva:
                      </span>
                      <span className="font-bold text-indigo-800 dark:text-indigo-200 text-sm font-mono">
                        {hoveredPoint.chuvaTaxaMmH.toFixed(1)} mm/h
                      </span>
                    </div>
                    <div className="text-[10px] text-right font-medium mt-0.5">
                      {hoveredPoint.chuvaTaxaMmH > 50 ? (
                        <span className="text-red-600 dark:text-red-400 font-bold">🌧️ Chuva Violenta / Torrencial</span>
                      ) : hoveredPoint.chuvaTaxaMmH > 10 ? (
                        <span className="text-amber-600 dark:text-amber-300 font-bold">🌧️ Chuva Forte</span>
                      ) : hoveredPoint.chuvaTaxaMmH > 2.5 ? (
                        <span className="text-indigo-600 dark:text-indigo-300 font-medium">🌦️ Chuva Moderada</span>
                      ) : hoveredPoint.chuvaTaxaMmH > 0 ? (
                        <span className="text-sky-600 dark:text-sky-300 font-medium">🌦️ Chuva Fraca / Garoa</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Sem precipitação no instante</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs" />
                      Chuva Acumulada:
                    </span>
                    <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                      {hoveredPoint.chuvaAcumuladaMm.toFixed(1)} mm
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-xs" />
                      Umidade Relativa:
                    </span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300 text-sm">
                      {hoveredPoint.umidade} %
                    </span>
                  </div>
                </div>
              )}

              {activeChart === "pressure_wind" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs" />
                      Pressão Barométrica:
                    </span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                      {hoveredPoint.pressaoHpa} hPa
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                      Vento Médio:
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                      {hoveredPoint.ventoKmH} km/h ({hoveredPoint.ventoDirecao})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                      <span className="w-2 h-2 rounded-full bg-teal-500 shadow-xs" />
                      Rajada Máxima:
                    </span>
                    <span className="font-bold text-teal-700 dark:text-teal-300">
                      {hoveredPoint.rajadaKmH} km/h
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Thermal gradient */}
            <linearGradient id="dayTempGradModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>

            {/* Rain gradient */}
            <linearGradient id="dayRainGradModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>

            {/* Rain Rate gradient (violet / indigo) */}
            <linearGradient id="dayTaxaGradModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>

            {/* Rain Rate column bar gradient */}
            <linearGradient id="dayTaxaBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
            </linearGradient>

            {/* Rain period highlight background gradient */}
            <linearGradient id="dayRainPeriodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
            </linearGradient>

            {/* Sun hours highlight band (approx 06:00 to 18:00) */}
            <linearGradient id="daylightBandModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <line
              key={i}
              x1={paddingX}
              y1={paddingY + r * chartHeight}
              x2={svgWidth - paddingX}
              y2={paddingY + r * chartHeight}
              stroke="currentColor"
              className="text-slate-200/80 dark:text-[#2e3440]"
              strokeDasharray="4,4"
              strokeWidth="1"
            />
          ))}

          {/* Hourly Time Axis Ticks (Every 3 hours) */}
          {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((hour) => {
            const x = paddingX + (hour / 24) * chartWidth;
            return (
              <g key={hour}>
                <line
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={paddingY + chartHeight}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#262a35]"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="text-[11px] font-mono fill-slate-400 dark:fill-slate-500 font-medium"
                >
                  {String(hour).padStart(2, "0")}:00
                </text>
              </g>
            );
          })}

          {/* Solar Daylight Band Highlight */}
          <rect
            x={paddingX + (6.2 / 24) * chartWidth}
            y={paddingY}
            width={((18.1 - 6.2) / 24) * chartWidth}
            height={chartHeight}
            fill="url(#daylightBandModal)"
          />

          {/* 1. THERMAL CHART TAB */}
          {activeChart === "thermal" && thermalChartData && (
            <g>
              <path d={thermalChartData.areaPath} fill="url(#dayTempGradModal)" />
              <path
                d={thermalChartData.dewPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4,3"
                strokeLinecap="round"
              />
              <path
                d={thermalChartData.feelPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d={thermalChartData.tempPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Y-Axis Labels */}
              <text
                x={paddingX - 10}
                y={paddingY + 8}
                textAnchor="end"
                className="text-[11px] font-mono font-bold fill-rose-500"
              >
                {thermalChartData.rangeMax}°C
              </text>
              <text
                x={paddingX - 10}
                y={paddingY + chartHeight}
                textAnchor="end"
                className="text-[11px] font-mono font-bold fill-sky-500"
              >
                {thermalChartData.rangeMin}°C
              </text>
            </g>
          )}

          {/* 2. RAIN & HUMIDITY CHART TAB (With Taxa de Chuva) */}
          {activeChart === "rain_humidity" && rainHumChartData && (
            <g>
              {/* Rain occurrence time-window bands */}
              {rainHumChartData.rainPeriods.map((period, pIdx) => {
                const xStart = rainHumChartData.getX(period.startIdx);
                const xEnd = rainHumChartData.getX(period.endIdx);
                const width = Math.max(16, xEnd - xStart);
                return (
                  <g key={`period-${pIdx}`}>
                    <rect
                      x={xStart - 4}
                      y={paddingY}
                      width={width + 8}
                      height={chartHeight}
                      fill="url(#dayRainPeriodGrad)"
                      stroke="#6366f1"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      rx="4"
                    />
                    {/* Floating badge for active rain window */}
                    <g transform={`translate(${xStart + width / 2}, ${paddingY + 12})`}>
                      <rect
                        x="-46"
                        y="-9"
                        width="92"
                        height="18"
                        rx="4"
                        className="fill-indigo-100 dark:fill-[#1e1b4b] stroke-indigo-300 dark:stroke-[#6366f1]"
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-indigo-900 dark:fill-indigo-200"
                      >
                        🌧️ {period.startTime} - {period.endTime}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Rain Accumulated Area & Line */}
              {showChuvaAcum && (
                <>
                  <path d={rainHumChartData.rainAreaPath} fill="url(#dayRainGradModal)" />
                  <path
                    d={rainHumChartData.rainAreaPath.replace(/ Z$/, "")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />
                </>
              )}

              {/* Taxa de Chuva Column Bars, Area and Curve */}
              {showTaxaChuva && (
                <>
                  {/* Rain Rate Columns for active rain points */}
                  {rainHumChartData.rainBars.map((bar) => {
                    if (!bar.hasRain) return null;
                    return (
                      <g key={`bar-${bar.index}`}>
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          fill="url(#dayTaxaBarGrad)"
                          stroke="#c7d2fe"
                          strokeWidth="0.75"
                          rx="2"
                          className="transition-all"
                        />
                        {bar.height > 22 && (
                          <text
                            x={bar.centerX}
                            y={bar.y - 4}
                            textAnchor="middle"
                            className="text-[9px] font-mono font-bold fill-indigo-500 dark:fill-indigo-300"
                          >
                            {bar.rate.toFixed(1)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Continuous Taxa de Chuva curve & area */}
                  <path d={rainHumChartData.taxaAreaPath} fill="url(#dayTaxaGradModal)" />
                  <path
                    d={rainHumChartData.taxaPath}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Peak Rain Rate Pin */}
                  {rainHumChartData.peakPoint && (
                    <g
                      transform={`translate(${rainHumChartData.peakPoint.x}, ${rainHumChartData.peakPoint.y})`}
                    >
                      <circle r="5" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
                      <line
                        x1="0"
                        y1="-5"
                        x2="0"
                        y2="-20"
                        stroke="#4f46e5"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      <g transform="translate(0, -30)">
                        <rect
                          x="-58"
                          y="-10"
                          width="116"
                          height="20"
                          rx="4"
                          className="fill-indigo-100 dark:fill-[#1e1b4b] stroke-indigo-400 dark:stroke-[#818cf8]"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          className="text-[9.5px] font-mono font-bold fill-indigo-900 dark:fill-indigo-100"
                        >
                          Pico {rainHumChartData.peakPoint.rate.toFixed(1)} mm/h às {rainHumChartData.peakPoint.time}
                        </text>
                      </g>
                    </g>
                  )}
                </>
              )}

              {/* Relative Humidity Curve */}
              {showUmidade && (
                <path
                  d={rainHumChartData.humPath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Left Axis: Humidity (%) */}
              {showUmidade && (
                <>
                  <text
                    x={paddingX - 10}
                    y={paddingY + 8}
                    textAnchor="end"
                    className="text-[11px] font-mono font-bold fill-cyan-500"
                  >
                    100%
                  </text>
                  <text
                    x={paddingX - 10}
                    y={paddingY + chartHeight}
                    textAnchor="end"
                    className="text-[11px] font-mono font-bold fill-cyan-500"
                  >
                    20%
                  </text>
                </>
              )}

              {/* Right Axis 1: Taxa de Chuva (mm/h) */}
              {showTaxaChuva && (
                <>
                  <text
                    x={svgWidth - paddingX + 10}
                    y={paddingY + 8}
                    textAnchor="start"
                    className="text-[11px] font-mono font-bold fill-indigo-500"
                  >
                    {rainHumChartData.maxTaxa} mm/h
                  </text>
                  <text
                    x={svgWidth - paddingX + 10}
                    y={paddingY + 20}
                    textAnchor="start"
                    className="text-[9.5px] font-mono font-medium fill-indigo-400"
                  >
                    Taxa Máx.
                  </text>
                </>
              )}

              {/* Right Axis 2: Chuva Acumulada (mm) */}
              {showChuvaAcum && (
                <>
                  <text
                    x={svgWidth - paddingX + 10}
                    y={paddingY + chartHeight - 14}
                    textAnchor="start"
                    className="text-[11px] font-mono font-bold fill-blue-500"
                  >
                    {rainHumChartData.maxRain} mm
                  </text>
                  <text
                    x={svgWidth - paddingX + 10}
                    y={paddingY + chartHeight}
                    textAnchor="start"
                    className="text-[9.5px] font-mono font-medium fill-blue-400"
                  >
                    Acumulada
                  </text>
                </>
              )}
            </g>
          )}

          {/* 3. BAROMETER & WIND CHART TAB */}
          {activeChart === "pressure_wind" && pressWindChartData && (
            <g>
              <path
                d={pressWindChartData.pressPath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={pressWindChartData.gustPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <path
                d={pressWindChartData.windPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Left Axis: Pressure (hPa) */}
              <text
                x={paddingX - 10}
                y={paddingY + 8}
                textAnchor="end"
                className="text-[11px] font-mono font-bold fill-indigo-500"
              >
                {pressWindChartData.maxP} hPa
              </text>
              <text
                x={paddingX - 10}
                y={paddingY + chartHeight}
                textAnchor="end"
                className="text-[11px] font-mono font-bold fill-indigo-500"
              >
                {pressWindChartData.minP} hPa
              </text>

              {/* Right Axis: Wind (km/h) */}
              <text
                x={svgWidth - paddingX + 10}
                y={paddingY + 8}
                textAnchor="start"
                className="text-[11px] font-mono font-bold fill-emerald-500"
              >
                {pressWindChartData.maxW} km/h
              </text>
              <text
                x={svgWidth - paddingX + 10}
                y={paddingY + chartHeight}
                textAnchor="start"
                className="text-[11px] font-mono font-bold fill-emerald-500"
              >
                0 km/h
              </text>
            </g>
          )}

          {/* Interactive Crosshair & Curve Value Dots */}
          {crosshairIndex !== null && series.length > 0 && hoveredPoint && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                y1={paddingY}
                x2={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                y2={paddingY + chartHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />

              {/* Timestamp badge at bottom of crosshair */}
              <g
                transform={`translate(${paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}, ${paddingY + chartHeight + 14})`}
              >
                <rect x="-24" y="-9" width="48" height="18" rx="4" fill="#0284c7" />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  className="text-[10px] font-mono font-bold"
                >
                  {hoveredPoint.time}
                </text>
              </g>

              {/* Thermal dots on curves */}
              {activeChart === "thermal" && thermalChartData && (
                <>
                  <circle
                    cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                    cy={thermalChartData.getY(hoveredPoint.tempAtual)}
                    r="5.5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                    cy={thermalChartData.getY(hoveredPoint.sensacao)}
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                    cy={thermalChartData.getY(hoveredPoint.pontoOrvalho)}
                    r="4.5"
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Rain, Taxa and Humidity dots */}
              {activeChart === "rain_humidity" && rainHumChartData && (
                <>
                  {showUmidade && (
                    <circle
                      cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                      cy={rainHumChartData.getHumY(hoveredPoint.umidade)}
                      r="5.5"
                      fill="#06b6d4"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                  {showChuvaAcum && (
                    <circle
                      cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                      cy={rainHumChartData.getRainY(hoveredPoint.chuvaAcumuladaMm)}
                      r="4.5"
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                  {showTaxaChuva && (
                    <circle
                      cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                      cy={rainHumChartData.getTaxaY(hoveredPoint.chuvaTaxaMmH)}
                      r={hoveredPoint.chuvaTaxaMmH > 0 ? "6.5" : "4"}
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </>
              )}

              {/* Pressure and Wind dots */}
              {activeChart === "pressure_wind" && pressWindChartData && (
                <>
                  <circle
                    cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                    cy={pressWindChartData.getPY(hoveredPoint.pressaoHpa)}
                    r="5.5"
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                    cy={pressWindChartData.getWY(hoveredPoint.ventoKmH)}
                    r="4.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={paddingX + (crosshairIndex / (series.length - 1)) * chartWidth}
                    cy={pressWindChartData.getWY(hoveredPoint.rajadaKmH)}
                    r="4"
                    fill="#14b8a6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4 pt-3 border-t border-slate-100 dark:border-[#2e3440] text-xs">
        {activeChart === "thermal" && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-rose-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Temperatura (°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-amber-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Sensação Térmica (°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-b border-dashed border-cyan-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Ponto de Orvalho (°C)</span>
            </div>
          </>
        )}

        {activeChart === "rain_humidity" && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-500/80 border border-indigo-500 rounded-xs" />
              <span className="text-slate-800 dark:text-slate-200 font-bold">Taxa de Chuva (mm/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500/40 border border-blue-500 rounded-xs" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Chuva Acumulada (mm)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-cyan-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Umidade Relativa (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-2 bg-indigo-500/20 border border-dashed border-indigo-400 rounded-xs" />
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Janelas de Precipitação</span>
            </div>
          </>
        )}

        {activeChart === "pressure_wind" && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-indigo-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Pressão Barométrica (hPa)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Vento Médio (km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-b border-dashed border-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Rajadas Máximas (km/h)</span>
            </div>
          </>
        )}
      </div>

      {/* Precipitation Occurrence Timeline (Horários em que ocorreram chuvas) */}
      {activeChart === "rain_humidity" && rainHumChartData && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2e3440]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CloudRain className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Horários de Precipitação e Taxa de Chuva
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold font-mono">
                {rainHumChartData.rainPeriods.length} {rainHumChartData.rainPeriods.length === 1 ? "período" : "períodos"}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Clique no horário para posicionar a mira no gráfico
            </span>
          </div>

          {rainHumChartData.rainPeriods.length === 0 ? (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#13151b] border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
              Sem registro de taxa de precipitação nesta data (período sem chuva).
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {rainHumChartData.rainPeriods.map((period, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCrosshairIndex(period.startIdx);
                  }}
                  className="p-2.5 rounded-lg bg-indigo-50/60 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200/90 dark:border-indigo-800/80 transition-all text-left flex flex-col gap-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {period.startTime} às {period.endTime}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      Ver no gráfico →
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-mono pt-1 border-t border-indigo-200/50 dark:border-indigo-800/50">
                    <span>
                      Pico:{" "}
                      <strong className="text-indigo-600 dark:text-indigo-300">
                        {period.peakRate.toFixed(1)} mm/h
                      </strong>{" "}
                      ({period.peakTime})
                    </span>
                    <span>
                      Acum.: <strong>{period.accumulated.toFixed(1)} mm</strong>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 4 Top Metric Cards (Chuva, Extremos Térmicos com horário, Ciclo Solar, Dinâmica do Vento)
  const renderMetricCards = (isModal: boolean = false) => {
    if (!data) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Chuva Acumulada no Dia */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#13151b]/60 border border-slate-200/90 dark:border-[#2e3440] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-500" />
              Chuva Acumulada
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold">
              24 Horas
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                {data.summary.chuvaTotalMm.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-slate-500">mm</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.summary.chuvaTotalMm === 0
                ? "Sem registro de precipitação hoje"
                : `Volume total precipitado em Agudos`}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/50">
            <span>Pico de Intensidade:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {data.summary.chuvaPicoMmH.toFixed(1)} mm/h às {data.summary.chuvaPicoHora}
            </span>
          </div>
        </div>

        {/* 2. Extremos Térmicos (Máxima e Mínima com Horários) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#13151b]/60 border border-slate-200/90 dark:border-[#2e3440] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-500" />
              Extremos Térmicos
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold">
              Δ {data.summary.amplitudeTermica}°C
            </span>
          </div>
          <div className="my-2 grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-slate-50/90 dark:bg-[#1a1c23]/60 border border-slate-200/70 dark:border-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Máxima</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                  {data.summary.tempMax.toFixed(1)}°
                </span>
                <span className="text-[10px] font-mono text-slate-400">às {data.summary.tempMaxTime}</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50/90 dark:bg-[#1a1c23]/60 border border-slate-200/70 dark:border-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-sky-500 block">Mínima</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-mono text-sky-600 dark:text-sky-400">
                  {data.summary.tempMin.toFixed(1)}°
                </span>
                <span className="text-[10px] font-mono text-slate-400">às {data.summary.tempMinTime}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/50">
            <span>Temperatura Média:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {data.summary.tempMedia.toFixed(1)} °C
            </span>
          </div>
        </div>

        {/* 3. Ciclo Solar (Nascer e Pôr do Sol em Agudos) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#13151b]/60 border border-slate-200/90 dark:border-[#2e3440] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              Ciclo Solar (Agudos)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">
              {data.sunTimes.duracaoDia} luz
            </span>
          </div>
          <div className="my-2 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/90 dark:bg-[#1a1c23]/60 border border-slate-200/70 dark:border-slate-800/50">
              <Sunrise className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Nascer</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {data.sunTimes.nascerDoSol}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/90 dark:bg-[#1a1c23]/60 border border-slate-200/70 dark:border-slate-800/50">
              <Sunset className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pôr do Sol</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {data.sunTimes.porDoSol}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/50">
            <span>Meio-dia Solar:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {data.sunTimes.meioDiaSolar}
            </span>
          </div>
        </div>

        {/* 4. Vento, Rajadas & Barômetro */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#13151b]/60 border border-slate-200/90 dark:border-[#2e3440] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-emerald-500" />
              Dinâmica do Vento
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
              {data.summary.rajadaMaxDirecao}
            </span>
          </div>
          <div className="my-2 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rajada Máx</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {data.summary.rajadaMaxKmH}
                </span>
                <span className="text-xs font-semibold text-slate-400">km/h</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">às {data.summary.rajadaMaxHora}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Vento Máx</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono text-slate-700 dark:text-slate-300">
                  {data.summary.ventoMaxKmH}
                </span>
                <span className="text-xs font-semibold text-slate-400">km/h</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{data.summary.ventoMaxDirecao}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
            <span>Barômetro Digital (BMP390):</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {data.summary.pressaoMin} - {data.summary.pressaoMax} hPa
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Secondary Strip (Umidade, UV, Barômetro, Amostras)
  const renderSecondaryStrip = () => {
    if (!data) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-xl bg-slate-50 dark:bg-[#13151b] border border-slate-200/60 dark:border-[#2e3440] text-xs">
        <div className="flex items-center gap-2.5">
          <Droplets className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <div>
            <span className="text-slate-400 block text-[11px]">Sensor de Umidade (SHT35)</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {data.summary.umiMin}% - {data.summary.umiMax}% (Média {data.summary.umiMedia}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div>
            <span className="text-slate-400 block text-[11px]">Índice UV Máximo</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {data.summary.uvMax} •{" "}
              {data.summary.uvMax >= 8
                ? "Muito Alto"
                : data.summary.uvMax >= 5
                ? "Alto"
                : data.summary.uvMax >= 3
                ? "Moderado"
                : "Baixo"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Gauge className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <div>
            <span className="text-slate-400 block text-[11px]">Pressão Média Local</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {data.summary.pressaoMedia} hPa (760m alt.)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div>
            <span className="text-slate-400 block text-[11px]">Leituras Processadas</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {data.summary.totalRegistros} amostras no dia
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Reusable Date Selector Bar
  const renderDateControls = () => (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick shortcuts */}
      <button
        type="button"
        onClick={() => handleDateChange(todayStr)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
          selectedDate === todayStr
            ? "bg-[#0284c7] text-white font-bold shadow-xs dark:bg-[#38bdf8] dark:text-[#00354a]"
            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs dark:bg-[#262a35] dark:text-slate-300 dark:hover:bg-[#313540] dark:border-transparent"
        }`}
      >
        Hoje
      </button>
      <button
        type="button"
        onClick={() => {
          const yesterdayStr = addDaysToDateStr(todayStr, -1);
          handleDateChange(yesterdayStr);
        }}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs dark:bg-[#262a35] dark:text-slate-300 dark:hover:bg-[#313540] dark:border-transparent transition-all cursor-pointer"
      >
        Ontem
      </button>
      <button
        type="button"
        onClick={() => handleDateChange(MIN_DATE)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
          selectedDate === MIN_DATE
            ? "bg-[#0284c7] text-white font-bold shadow-xs dark:bg-[#38bdf8] dark:text-[#00354a]"
            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs dark:bg-[#262a35] dark:text-slate-300 dark:hover:bg-[#313540] dark:border-transparent"
        }`}
        title="13 de Agosto de 2019: Início dos registros meteorológicos"
      >
        13/08/2019 (Início)
      </button>

      {/* Date Picker & Stepper */}
      <div className="flex items-center rounded-xl bg-white dark:bg-[#171922] border border-slate-300 dark:border-[#2e3440] p-0.5 shadow-xs">
        <button
          type="button"
          onClick={handlePrevDay}
          disabled={selectedDate <= MIN_DATE || loading}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#262a35] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Dia Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <input
          type="date"
          value={selectedDate}
          min={MIN_DATE}
          max={todayStr}
          onChange={(e) => {
            if (e.target.value) handleDateChange(e.target.value);
          }}
          className="px-2 py-1 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white border-0 focus:outline-hidden cursor-pointer"
        />

        <button
          type="button"
          onClick={handleNextDay}
          disabled={selectedDate >= todayStr || loading}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#262a35] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Próximo Dia"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Station Status Indicator */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
        title={`Registros meteorológicos oficiais da estação (${targetYear})`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Estação Conectada</span>
      </div>

      {/* Refresh */}
      <button
        type="button"
        onClick={() => fetchDayData(selectedDate)}
        disabled={loading}
        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-xs dark:bg-[#262a35] dark:text-slate-300 dark:hover:bg-[#313540] dark:border-transparent transition-all cursor-pointer disabled:opacity-50"
        title="Recarregar dia"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl bg-white dark:bg-[#1a1c23] border border-slate-200/90 dark:border-[#2e3440] shadow-sm overflow-hidden"
    >
      {/* Section Header & Date Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-[#2e3440] bg-slate-50/50 dark:bg-[#1f222b]/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-800/40 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Métricas do Dia</span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-sky-100/70 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60">
                    Histórico EMA
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {formattedDate} • Registros meteorológicos de Agudos/SP
                </p>
              </div>
            </div>
          </div>

          {renderDateControls()}
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
          <span className="text-sm font-medium">
            Carregando registros de {selectedDate}...
          </span>
        </div>
      )}

      {/* Error Alert */}
      {!loading && error && (
        <div className="m-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-sm">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div>
            <p className="font-bold">Aviso na Consulta</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Card Content */}
      {!loading && data && (
        <div className="p-4 sm:p-6 space-y-5">
          {renderMetricCards(false)}
          {renderSecondaryStrip()}

          {/* Inline 24h Graph */}
          {renderChart(chartWrapperRef)}
        </div>
      )}
    </section>
  );
};
