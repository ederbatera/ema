import React, { useMemo } from "react";
import { ComputedTelemetry, History24hData, DayTelemetryData } from "../types";
import { getBrazilTodayStr, addDaysToDateStr } from "../lib/dateUtils";

interface TelemetryCardsProps {
  telemetry: ComputedTelemetry | null;
  history?: History24hData | null;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  dayData?: DayTelemetryData | null;
  isDayLoading?: boolean;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  telemetry,
  history,
  selectedDate,
  onSelectDate,
  dayData,
  isDayLoading,
}) => {
  const todayStr = useMemo(() => getBrazilTodayStr(), []);
  const effectiveDate = selectedDate || todayStr;
  const isToday = effectiveDate === todayStr;
  const isHistorical = !isToday && !!dayData && dayData.date === effectiveDate;

  const MIN_DATE = "2019-08-13";

  const handlePrevDay = () => {
    if (!onSelectDate) return;
    const newDateStr = addDaysToDateStr(effectiveDate, -1);
    if (newDateStr >= MIN_DATE) {
      onSelectDate(newDateStr);
    }
  };

  const handleNextDay = () => {
    if (!onSelectDate) return;
    const newDateStr = addDaysToDateStr(effectiveDate, 1);
    if (newDateStr <= todayStr) {
      onSelectDate(newDateStr);
    }
  };

  const dateFormatted = useMemo(() => {
    try {
      const [y, m, d] = effectiveDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } catch {
      return effectiveDate;
    }
  }, [effectiveDate]);

  // Safe defaults if loading or initial (reflects selected historical day if available)
  const temp = isHistorical ? dayData.summary.tempMedia : (telemetry?.tempAtual ?? 17.4);
  const feel = isHistorical ? dayData.summary.tempMedia : (telemetry?.tempSensacao ?? 17.4);
  const dew = isHistorical
    ? Number((dayData.summary.tempMedia - (100 - dayData.summary.umiMedia) / 5).toFixed(1))
    : (telemetry?.pontoOrvalho ?? 17.2);
  const hum = isHistorical ? dayData.summary.umiMedia : (telemetry?.umiAtual ?? telemetry?.umidade ?? 99);
  const vpd = telemetry?.deficitVaporKpa ?? 0.02;
  const vpdStatus = telemetry?.vpdStatus ?? "Baixo";
  const wind = isHistorical ? dayData.summary.ventoMaxKmH : (telemetry?.ventoVelKmH ?? 14.4);
  const beaufort = telemetry?.ventoBeaufortNum ?? 3;
  const beaufortDesc = telemetry?.ventoBeaufortDesc ?? "Brisa Leve";
  const windDir = isHistorical ? dayData.summary.ventoMaxDirecao : (telemetry?.ventoDirecao ?? "SSE 158°");
  const windDeg = telemetry?.ventoDirecaoGraus ?? 158;
  const gust = isHistorical ? dayData.summary.rajadaMaxKmH : (telemetry?.rajadaKmH ?? 38.2);
  const gustTime = isHistorical ? dayData.summary.rajadaMaxHora : (telemetry?.rajadaHora ?? "14:25");
  const sustained = telemetry?.ventoMedia10mKmH ?? 11.4;

  // Pressão da coluna P_ATM da tabela
  const pressAtm = isHistorical ? dayData.summary.pressaoMedia : (telemetry?.pAtm ?? telemetry?.pressaoLocalHpa ?? 951);
  const pressTrend = telemetry?.pressaoTendencia3h ?? 0.0;
  const pressGradiente =
    telemetry?.pressaoGradiente ??
    (pressTrend > 0.2 ? "Elevação" : pressTrend < -0.2 ? "Queda" : "Estável");

  // Extremos calculados estritamente para o dia em exibição (das 00:00:00 em diante)
  const dayExtremesFromSeries = useMemo(() => {
    if (!history?.series || history.series.length === 0) return null;

    // Filtra pontos pertencentes estritamente ao dia (00:00:00 em diante)
    const pointsForDay = history.series.filter((pt) => {
      if (!pt.timestamp) return false;
      const ptDate = pt.timestamp.split("T")[0];
      return ptDate === effectiveDate;
    });

    if (pointsForDay.length === 0) return null;

    let tMin = 999;
    let tMinTime = "--:--";
    let tMax = -999;
    let tMaxTime = "--:--";

    let hMin = 999;
    let hMinTime = "--:--";
    let hMax = -999;
    let hMaxTime = "--:--";

    let pMin = 9999;
    let pMinTime = "--:--";
    let pMax = -9999;
    let pMaxTime = "--:--";

    for (const pt of pointsForDay) {
      const timeStr = pt.time || (pt.timestamp ? pt.timestamp.substring(11, 16) : "--:--");

      const t = pt.temp;
      if (typeof t === "number" && !isNaN(t)) {
        if (t < tMin) {
          tMin = t;
          tMinTime = timeStr;
        }
        if (t > tMax) {
          tMax = t;
          tMaxTime = timeStr;
        }
      }

      const h = pt.umidade ?? pt.umiAtual;
      if (typeof h === "number" && !isNaN(h)) {
        if (h < hMin) {
          hMin = h;
          hMinTime = timeStr;
        }
        if (h > hMax) {
          hMax = h;
          hMaxTime = timeStr;
        }
      }

      const p = pt.pressaoHpa ?? pt.pressaoLocal ?? pt.pAtm;
      if (typeof p === "number" && !isNaN(p)) {
        if (p < pMin) {
          pMin = p;
          pMinTime = timeStr;
        }
        if (p > pMax) {
          pMax = p;
          pMaxTime = timeStr;
        }
      }
    }

    return {
      tempMin: tMin === 999 ? null : tMin,
      tempMinTime: tMinTime,
      tempMax: tMax === -999 ? null : tMax,
      tempMaxTime: tMaxTime,
      humMin: hMin === 999 ? null : hMin,
      humMinTime: hMinTime,
      humMax: hMax === -999 ? null : hMax,
      humMaxTime: hMaxTime,
      pressMin: pMin === 9999 ? null : pMin,
      pressMinTime: pMinTime,
      pressMax: pMax === -9999 ? null : pMax,
      pressMaxTime: pMaxTime,
    };
  }, [history?.series, effectiveDate]);

  const hasDaySummary = !!dayData && dayData.date === effectiveDate;

  // Extremos térmicos, higrométricos e barométricos calculados no dia atual (das 00:00:00 em frente)
  const tempMax = hasDaySummary
    ? dayData.summary.tempMax
    : (dayExtremesFromSeries?.tempMax ?? (temp ? Number(temp.toFixed(1)) : 20.0));
  const tempMaxTime = hasDaySummary
    ? dayData.summary.tempMaxTime
    : (dayExtremesFromSeries?.tempMaxTime ?? "--:--");

  const tempMin = hasDaySummary
    ? dayData.summary.tempMin
    : (dayExtremesFromSeries?.tempMin ?? (temp ? Number(temp.toFixed(1)) : 16.7));
  const tempMinTime = hasDaySummary
    ? dayData.summary.tempMinTime
    : (dayExtremesFromSeries?.tempMinTime ?? "--:--");

  const humMax = hasDaySummary
    ? dayData.summary.umiMax
    : (dayExtremesFromSeries?.humMax ?? hum);
  const humMaxTime = hasDaySummary
    ? dayData.summary.umiMaxTime
    : (dayExtremesFromSeries?.humMaxTime ?? "--:--");

  const humMin = hasDaySummary
    ? dayData.summary.umiMin
    : (dayExtremesFromSeries?.humMin ?? hum);
  const humMinTime = hasDaySummary
    ? dayData.summary.umiMinTime
    : (dayExtremesFromSeries?.humMinTime ?? "--:--");

  const pressSea = telemetry?.pressaoNivelMarHpa ?? 1039.1;
  const pressMax = hasDaySummary
    ? dayData.summary.pressaoMax
    : (dayExtremesFromSeries?.pressMax ?? pressAtm);
  const pressMaxTime = hasDaySummary
    ? (dayData.summary.pressaoMaxTime && dayData.summary.pressaoMaxTime !== "--:--"
        ? dayData.summary.pressaoMaxTime
        : dayExtremesFromSeries?.pressMaxTime ?? "--:--")
    : (dayExtremesFromSeries?.pressMaxTime ?? "--:--");

  const pressMin = hasDaySummary
    ? dayData.summary.pressaoMin
    : (dayExtremesFromSeries?.pressMin ?? pressAtm);
  const pressMinTime = hasDaySummary
    ? (dayData.summary.pressaoMinTime && dayData.summary.pressaoMinTime !== "--:--"
        ? dayData.summary.pressaoMinTime
        : dayExtremesFromSeries?.pressMinTime ?? "--:--")
    : (dayExtremesFromSeries?.pressMinTime ?? "--:--");

  // --- PRECIPITAÇÃO E CHUVA NO DIA DINÂMICAS ---
  const totalRain = useMemo(() => {
    if (dayData && dayData.date === effectiveDate) {
      return dayData.summary.chuvaTotalMm ?? 0;
    }
    if (isToday) {
      return telemetry?.chuvaHojeMm ?? 0;
    }
    return 0;
  }, [dayData, effectiveDate, isToday, telemetry]);

  const rainPeakRate = useMemo(() => {
    if (dayData && dayData.date === effectiveDate) {
      return dayData.summary.chuvaPicoMmH ?? 0;
    }
    if (isToday) {
      return telemetry?.chuvaPicoMmH ?? 0;
    }
    return 0;
  }, [dayData, effectiveDate, isToday, telemetry]);

  const rainPeakTime = useMemo(() => {
    if (dayData && dayData.date === effectiveDate) {
      return dayData.summary.chuvaPicoHora && dayData.summary.chuvaPicoHora !== "--:--"
        ? dayData.summary.chuvaPicoHora
        : "--:--";
    }
    if (isToday) {
      return telemetry?.chuvaPicoHora || "--:--";
    }
    return "--:--";
  }, [dayData, effectiveDate, isToday, telemetry]);

  const currentRainRate = isToday ? (telemetry?.chuvaTaxaMmH ?? 0) : 0;

  // Evaporação estimada e saldo hídrico
  const evapEst = useMemo(() => {
    if (isToday && telemetry?.evaporacaoEstMm) {
      return telemetry.evaporacaoEstMm;
    }
    if (dayData?.summary) {
      const est = dayData.summary.tempMedia * 0.12 + dayData.summary.amplitudeTermica * 0.08;
      return Math.max(1.5, Math.min(6.5, Number(est.toFixed(1))));
    }
    return 3.2;
  }, [isToday, telemetry, dayData]);

  const waterBalance = useMemo(() => {
    return Number((totalRain - evapEst).toFixed(1));
  }, [totalRain, evapEst]);

  // Distribuição de chuva por blocos horários (8 blocos de 3 horas cobrindo as 24 horas)
  const { rainBlocks, maxBlockRain, activeRainLabel, rainDurationMin } = useMemo(() => {
    const blocks = [
      { label: "00h-03h", shortLabel: "00h", rain: 0, peakRate: 0 },
      { label: "03h-06h", shortLabel: "03h", rain: 0, peakRate: 0 },
      { label: "06h-09h", shortLabel: "06h", rain: 0, peakRate: 0 },
      { label: "09h-12h", shortLabel: "09h", rain: 0, peakRate: 0 },
      { label: "12h-15h", shortLabel: "12h", rain: 0, peakRate: 0 },
      { label: "15h-18h", shortLabel: "15h", rain: 0, peakRate: 0 },
      { label: "18h-21h", shortLabel: "18h", rain: 0, peakRate: 0 },
      { label: "21h-24h", shortLabel: "21h", rain: 0, peakRate: 0 },
    ];

    let durationMin = 0;
    const series =
      (dayData && dayData.date === effectiveDate ? dayData.timeSeries : null) ||
      (isToday && history?.series
        ? history.series.filter((pt) => pt.timestamp?.split("T")[0] === effectiveDate)
        : null) ||
      [];

    if (series.length > 0) {
      let prevAccum = 0;
      for (const p of series) {
        const timeStr = "time" in p ? p.time : "";
        const [hStr] = timeStr.split(":");
        const hour = parseInt(hStr, 10);
        const bIdx = Math.min(7, Math.max(0, Math.floor((isNaN(hour) ? 0 : hour) / 3)));

        const accum = "chuvaAcumuladaMm" in p ? (p.chuvaAcumuladaMm || 0) : ("chuvaMm" in p ? (p.chuvaMm || 0) : 0);
        const rate = "chuvaTaxaMmH" in p ? (p.chuvaTaxaMmH || 0) : ("chuvaTaxa" in p ? (p.chuvaTaxa || 0) : 0);

        const delta = Math.max(0, accum - prevAccum);
        prevAccum = accum;

        blocks[bIdx].rain += delta;
        if (rate > blocks[bIdx].peakRate) {
          blocks[bIdx].peakRate = rate;
        }

        if (rate > 0 || delta > 0) {
          durationMin += 5;
        }
      }
    } else if (isToday && telemetry?.chuvaDuracaoMin) {
      durationMin = telemetry.chuvaDuracaoMin;
    }

    const maxRain = Math.max(0.1, ...blocks.map((b) => b.rain));
    const active = blocks.filter((b) => b.rain > 0.05 || b.peakRate > 0);

    let activeLabel = "Sem registro";
    if (totalRain === 0 || active.length === 0) {
      activeLabel = "Sem registro";
    } else if (active.length === 1) {
      activeLabel = active[0].label;
    } else if (active.length > 1) {
      const firstH = active[0].label.split("-")[0];
      const lastH = active[active.length - 1].label.split("-")[1];
      activeLabel = `${firstH}-${lastH}`;
    }

    return {
      rainBlocks: blocks,
      maxBlockRain: maxRain,
      activeRainLabel: activeLabel,
      rainDurationMin: durationMin,
    };
  }, [dayData, effectiveDate, history, isToday, telemetry, totalRain]);

  const formattedDuration = useMemo(() => {
    if (totalRain === 0 || rainDurationMin === 0) {
      return "0 min";
    }
    const hours = Math.floor(rainDurationMin / 60);
    const mins = rainDurationMin % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  }, [totalRain, rainDurationMin]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
      {/* Card 1: Temperatura */}
      <article className="p-5 rounded-xl card-surface hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden border border-theme">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-500 dark:text-[#ffbf9e] text-lg">thermostat</span>
              <span className="font-mono text-[11px] text-theme-muted uppercase font-semibold">Temperatura</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4] font-mono text-[11px] flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4]" /> Estável
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-2">
            <span className="font-mono text-4xl text-theme-main font-semibold tracking-tight">
              {temp.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-theme-muted font-medium">°C</span>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-theme-secondary pb-2">
            <div>
              Sensação: <span className="font-medium text-theme-main">{feel.toFixed(1)} °C</span>
            </div>
            <div>
              Orvalho: <span className="font-medium text-theme-main">{dew.toFixed(1)} °C</span>
            </div>
          </div>
        </div>

        {/* Micro Extremos do Dia */}
        <div className="pt-2 mt-1 flex flex-col gap-1.5 subcard-surface p-2.5 rounded-lg border border-theme">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-amber-600 dark:text-[#ffbf9e]">
              <span className="material-symbols-outlined text-base">arrow_upward</span>
              <span className="font-mono text-[11px] font-semibold">Máx: {tempMax.toFixed(1)} °C</span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">{tempMaxTime}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-sky-600 dark:text-[#8ed5ff]">
              <span className="material-symbols-outlined text-base">arrow_downward</span>
              <span className="font-mono text-[11px] font-semibold">Mín: {tempMin.toFixed(1)} °C</span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">{tempMinTime}</span>
          </div>
        </div>

        {/* Sparkline Térmico SVG */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1 font-mono text-[11px] text-theme-muted">
            <span>Variação 6h</span>
            <span className="text-amber-600 dark:text-[#ff975d] font-semibold">+1.2 °C/h</span>
          </div>
          <svg className="w-full h-9 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 24">
            <defs>
              <linearGradient id="tempGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,20 Q15,22 30,17 T60,11 T85,5 L100,8 L100,24 L0,24 Z" fill="url(#tempGrad)" />
            <path d="M0,20 Q15,22 30,17 T60,11 T85,5 L100,8" fill="none" stroke="#f97316" strokeLinecap="round" strokeWidth="2" />
            <circle cx="100" cy="8" fill="#f97316" r="2.5" />
          </svg>
        </div>
      </article>

      {/* Card 2: Umidade Relativa */}
      <article className="p-5 rounded-xl card-surface hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden border border-theme">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8] text-lg">humidity_percentage</span>
              <span className="font-mono text-[11px] text-theme-muted uppercase font-semibold">Umidade Relativa</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-[#45dfa4] font-mono text-[11px] font-medium">
              Conforto A
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-2">
            <span className="font-mono text-4xl text-theme-main font-semibold tracking-tight">{hum}</span>
            <span className="font-mono text-xs text-theme-muted font-medium">%</span>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-theme-secondary pb-2">
            <div>
              Deficit: <span className="font-medium text-theme-main">{vpd} kPa</span>
            </div>
            <div>
              VPD: <span className="font-medium text-emerald-600 dark:text-[#45dfa4]">{vpdStatus}</span>
            </div>
          </div>
        </div>

        {/* Micro Extremos do Dia */}
        <div className="pt-2 mt-1 flex flex-col gap-1.5 subcard-surface p-2.5 rounded-lg border border-theme">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-sky-600 dark:text-[#8ed5ff]">
              <span className="material-symbols-outlined text-base">arrow_upward</span>
              <span className="font-mono text-[11px] font-semibold">Máx: {humMax} %</span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">{humMaxTime}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-amber-600 dark:text-[#ffbf9e]">
              <span className="material-symbols-outlined text-base">arrow_downward</span>
              <span className="font-mono text-[11px] font-semibold">Mín: {humMin} %</span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">{humMinTime}</span>
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="mt-4 flex items-center gap-3">
          <div className="w-11 h-11 relative flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-[#313540]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-[#0284c7] dark:text-[#38bdf8]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${hum}, 100`}
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <span className="absolute font-mono text-[10px] text-theme-main font-semibold">{hum}%</span>
          </div>
          <div className="flex-1 text-[11px] text-theme-muted leading-tight">
            <span className="text-[12px] font-medium text-theme-main block">Sensor: Termo-higrômetro (SHT35)</span>
            <span>{telemetry?.estabilidadePsicrometrica || "Índice psicrométrico estável, sem risco de orvalho iminente."}</span>
          </div>
        </div>
      </article>

      {/* Card 3: Vento em Tempo Real */}
      <article className="p-5 rounded-xl card-surface hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden border-t-4 border-t-[#0284c7] dark:border-t-[#38bdf8] border-x border-b border-theme">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8] text-lg">air</span>
              <span className="font-mono text-[11px] text-[#0284c7] dark:text-[#8ed5ff] uppercase font-bold">Vento em Tempo Real</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-[#0284c7] dark:text-[#38bdf8] font-mono text-[11px] font-medium">
              Beaufort {beaufort}
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-2">
            <span className="font-mono text-4xl text-theme-main font-semibold tracking-tight">{wind.toFixed(1)}</span>
            <span className="font-mono text-xs text-theme-muted font-medium">km/h</span>
            <span className="font-mono text-[10px] text-theme-muted ml-auto subcard-surface px-1.5 py-0.5 rounded border border-theme">
              {beaufortDesc}
            </span>
          </div>

          <div className="flex items-center justify-between text-[13px] text-theme-secondary pb-2">
            <div>
              Média (10m): <span className="font-medium text-theme-main">{sustained} km/h</span>
            </div>
            <div>
              Direção: <span className="font-medium text-emerald-600 dark:text-[#45dfa4]">{windDir}</span>
            </div>
          </div>
        </div>

        {/* Micro Extremos com Rosa dos Ventos Integrada */}
        <div className="pt-2 mt-1 flex items-center justify-between gap-2 subcard-surface p-2.5 rounded-lg border border-theme">
          <div className="flex flex-col gap-0.5">
            <div className="text-[13px]">
              <span className="flex items-center gap-1 text-amber-600 dark:text-[#ffbf9e]">
                <span className="material-symbols-outlined text-base">storm</span>
                <span className="font-mono text-[11px] font-semibold">Rajada: {gust} km/h</span>
              </span>
              <span className="font-mono text-[11px] text-theme-muted pl-5">às {gustTime} BRT</span>
            </div>
            <div className="text-[11px] text-theme-muted pl-5">
              Sustentado: <span className="text-theme-main font-mono font-medium">{sustained} km/h</span>
            </div>
          </div>

          {/* Mini Rosa dos Ventos SVG Dinâmica */}
          <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0" title={`Vento de ${windDir} (${windDeg}°)`}>
            <svg className="w-12 h-12" viewBox="0 0 60 60">
              <circle cx="30" cy="30" fill="none" r="26" stroke="currentColor" className="text-slate-300 dark:text-[#313540]" strokeWidth="1.5" />
              <circle cx="30" cy="30" fill="none" r="20" stroke="currentColor" className="text-slate-300 dark:text-[#313540]" strokeDasharray="2 3" strokeWidth="1" />
              <text fill="currentColor" className="text-slate-500 dark:text-[#87929a]" fontFamily="JetBrains Mono" fontSize="7" fontWeight="bold" textAnchor="middle" x="30" y="9">N</text>
              <text fill="currentColor" className="text-slate-500 dark:text-[#87929a]" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="53" y="32">L</text>
              <text fill="currentColor" className="text-slate-500 dark:text-[#87929a]" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="30" y="55">S</text>
              <text fill="currentColor" className="text-slate-500 dark:text-[#87929a]" fontFamily="JetBrains Mono" fontSize="6" textAnchor="middle" x="7" y="32">O</text>
              <g transform={`rotate(${windDeg} 30 30)`}>
                <line stroke="#f97316" strokeLinecap="round" strokeWidth="2.5" x1="30" x2="30" y1="12" y2="30" />
                <polygon fill="#f97316" points="30,8 26,16 34,16" />
                <circle cx="30" cy="30" fill="#0284c7" r="3" />
              </g>
            </svg>
          </div>
        </div>

        {/* Indicador Visual do Vento */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1 font-mono text-[11px] text-theme-muted">
            <span>Intensidade Dinâmica</span>
            <span className="text-emerald-600 dark:text-[#45dfa4] font-medium">Fluxo Contínuo</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#313540] rounded-full h-2 overflow-hidden flex">
            <div className="bg-emerald-500 dark:bg-[#45dfa4] w-1/3 h-full" />
            <div className="bg-[#0284c7] dark:bg-[#38bdf8] w-1/4 h-full rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
            <div className="bg-slate-300 dark:bg-[#3e484f] w-5/12 h-full" />
          </div>
        </div>
      </article>

      {/* Card 4: Pressão Atmosférica */}
      <article className="p-5 rounded-xl card-surface hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden border border-theme">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8] text-lg">compress</span>
              <span className="font-mono text-[11px] text-theme-muted uppercase font-semibold">Pressão Atmosférica</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-[#0284c7] dark:text-[#8ed5ff] font-mono text-[11px] flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-xs">
                {pressTrend > 0 ? "trending_up" : pressTrend < 0 ? "trending_down" : "trending_flat"}
              </span>{" "}
              {pressTrend >= 0 ? `+${pressTrend.toFixed(1)}` : pressTrend.toFixed(1)}/3h
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-2">
            <span className="font-mono text-4xl text-theme-main font-semibold tracking-tight">{pressAtm}</span>
            <span className="font-mono text-xs text-theme-muted font-medium">hPa</span>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-theme-secondary pb-2">
            <div>
              Sensor: <span className="font-medium text-theme-main">Barômetro Digital (BMP390)</span>
            </div>
            <div>
              Nível Mar: <span className="font-medium text-theme-muted">{pressSea.toFixed(1)} hPa</span>
            </div>
          </div>
        </div>

        {/* Micro Extremos do Dia */}
        <div className="pt-2 mt-1 flex flex-col gap-1.5 subcard-surface p-2.5 rounded-lg border border-theme">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-sky-600 dark:text-[#8ed5ff]">
              <span className="material-symbols-outlined text-base">arrow_upward</span>
              <span className="font-mono text-[11px] font-semibold">Máx: {pressMax} hPa</span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">{pressMaxTime}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-theme-muted">
              <span className="material-symbols-outlined text-base">arrow_downward</span>
              <span className="font-mono text-[11px] font-semibold">Mín: {pressMin} hPa</span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">{pressMinTime}</span>
          </div>
        </div>

        {/* Indicador Barométrico Gradiente */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1 font-mono text-[11px] text-theme-muted">
            <span>Gradiente Sinótico</span>
            <span className="text-[#0284c7] dark:text-[#38bdf8] font-medium">{pressGradiente}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#313540] rounded-full h-2 overflow-hidden flex">
            <div
              className={`w-1/3 h-full transition-all ${
                pressGradiente === "Queda"
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  : "bg-slate-300 dark:bg-[#3e484f]"
              }`}
            />
            <div
              className={`w-1/3 h-full transition-all ${
                pressGradiente === "Estável"
                  ? "bg-[#0284c7] dark:bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  : "bg-slate-200 dark:bg-[#313540]"
              }`}
            />
            <div
              className={`w-1/3 h-full transition-all ${
                pressGradiente === "Elevação"
                  ? "bg-emerald-500 dark:bg-[#45dfa4] shadow-[0_0_8px_rgba(69,223,164,0.5)]"
                  : "bg-slate-300 dark:bg-[#3e484f]"
              }`}
            />
          </div>
        </div>
      </article>

      {/* Card 5: Precipitação e Chuva */}
      <article className="p-5 rounded-xl card-surface hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden border border-theme">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8] text-lg">rainy</span>
              <span className="font-mono text-[11px] text-theme-muted uppercase font-semibold">
                {isToday ? "Chuva (Hoje)" : `Chuva (${dateFormatted})`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {onSelectDate && (
                <div className="flex items-center rounded-md subcard-surface border border-theme p-0.5">
                  <button
                    type="button"
                    onClick={handlePrevDay}
                    title="Dia anterior"
                    className="w-5 h-5 flex items-center justify-center rounded text-theme-muted hover:text-theme-main hover:bg-slate-200 dark:hover:bg-[#262a35] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextDay}
                    disabled={isToday}
                    title={isToday ? "Hoje é a data mais recente" : "Próximo dia"}
                    className="w-5 h-5 flex items-center justify-center rounded text-theme-muted hover:text-theme-main hover:bg-slate-200 dark:hover:bg-[#262a35] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>
              )}
              <span className="px-2 py-0.5 rounded-full subcard-surface text-theme-muted font-mono text-[11px] border border-theme">
                {isToday
                  ? `${currentRainRate.toFixed(1)} mm/h agora`
                  : totalRain > 0
                  ? `Pico ${rainPeakRate.toFixed(1)} mm/h`
                  : "Sem chuva"}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-1 my-2">
            <span className="font-mono text-4xl text-theme-main font-semibold tracking-tight">
              {totalRain.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-theme-muted font-medium">mm</span>
            {isDayLoading && (
              <span className="ml-2 w-2 h-2 rounded-full bg-sky-500 animate-ping inline-block" title="Carregando..." />
            )}
          </div>

          <div className="flex items-center gap-4 text-[13px] text-theme-secondary pb-2">
            <div>
              Duração:{" "}
              <span className="font-medium text-theme-main">{formattedDuration}</span>
            </div>
            <div>
              Evap:{" "}
              <span className="font-medium text-theme-main">{evapEst.toFixed(1)} mm</span>
            </div>
          </div>
        </div>

        {/* Micro Extremos do Dia */}
        <div className="pt-2 mt-1 flex flex-col gap-1.5 subcard-surface p-2.5 rounded-lg border border-theme">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-sky-600 dark:text-[#8ed5ff]">
              <span className="material-symbols-outlined text-base">flash_on</span>
              <span className="font-mono text-[11px] font-semibold">
                Pico: {rainPeakRate > 0 ? `${rainPeakRate.toFixed(1)} mm/h` : "0.0 mm/h"}
              </span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">
              {rainPeakTime && rainPeakTime !== "--:--" ? rainPeakTime : "--:--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-[#45dfa4]">
              <span className="material-symbols-outlined text-base">water_drop</span>
              <span className="font-mono text-[11px] font-semibold">
                Saldo: {waterBalance >= 0 ? `+${waterBalance.toFixed(1)}` : waterBalance.toFixed(1)} mm
              </span>
            </span>
            <span className="font-mono text-[12px] text-theme-muted">RG-15</span>
          </div>
        </div>

        {/* Mini Distribuição de Chuva por Horário (Pancadas Registradas) */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1 font-mono text-[11px] text-theme-muted">
            <span>Pancadas Registradas</span>
            <span
              className={`font-mono text-[10px] ${
                activeRainLabel === "Sem registro"
                  ? "text-slate-400 dark:text-[#87929a]"
                  : "text-[#0284c7] dark:text-[#38bdf8] font-semibold"
              }`}
            >
              {activeRainLabel}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1 h-3.5 items-end">
            {rainBlocks.map((b, idx) => {
              const hasRain = b.rain > 0.05 || b.peakRate > 0;
              if (!hasRain) {
                return (
                  <div
                    key={idx}
                    className="bg-slate-200 dark:bg-[#313540] h-1 rounded-sm transition-all hover:bg-slate-300 dark:hover:bg-slate-600"
                    title={`${b.label}: 0.0 mm (Sem chuva)`}
                  />
                );
              }
              const heightPct = Math.max(25, Math.min(100, Math.round((b.rain / maxBlockRain) * 100)));
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className="bg-[#0284c7] dark:bg-[#38bdf8] rounded-sm transition-all shadow-[0_0_6px_rgba(56,189,248,0.4)]"
                  title={`${b.label}: ${b.rain.toFixed(1)} mm (Pico ${b.peakRate.toFixed(1)} mm/h)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-400 dark:text-[#87929a] mt-0.5 px-0.5">
            <span>00h</span>
            <span>06h</span>
            <span>12h</span>
            <span>18h</span>
            <span>24h</span>
          </div>
        </div>
      </article>
    </section>
  );
};
