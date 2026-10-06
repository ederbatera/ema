import React, { useState, useRef, useMemo } from "react";
import { History24hData } from "../types";

interface HistoryTelemetryProps {
  history: History24hData | null;
}

export const HistoryTelemetry: React.FC<HistoryTelemetryProps> = ({ history }) => {
  const [activeTab, setActiveTab] = useState<"both" | "thermal" | "baro">("both");
  const [crosshair, setCrosshair] = useState<{
    visible: boolean;
    x: number;
    tempY: number;
    humY: number;
    time: string;
    temp: string;
    hum: string;
    press: string;
    dew: string;
    feel: string;
    tooltipLeft: number;
    tooltipTop: number;
  }>({
    visible: false,
    x: 0,
    tempY: 0,
    humY: 0,
    time: "12:00 BRT",
    temp: "26.4 °C",
    hum: "68 %",
    press: "951.2 hPa",
    dew: "17.1 °C",
    feel: "27.8 °C",
    tooltipLeft: 0,
    tooltipTop: 0,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathTempRef = useRef<SVGPathElement>(null);
  const pathHumRef = useRef<SVGPathElement>(null);

  const summary = history?.summary || {
    mediaTermica: 22.1,
    mediaUmidade: 74,
    precipitacaoTotal: 14.8,
    ventoMedio: 11.4,
    tempMin: 18.2,
    tempMinTime: "05:40",
    tempMax: 28.9,
    tempMaxTime: "13:15",
    humMax: 89,
    humMaxTime: "06:10",
    humMin: 52,
    humMinTime: "14:30",
    pressMin: 947.5,
    pressMinTime: "06:00",
    pressMax: 953.8,
    pressMaxTime: "10:30",
    mediaPress: 950.8,
  };

  const series = history?.series;

  // Dynamically compute SVG Paths from series data
  const {
    tempPath,
    tempAreaPath,
    humPath,
    humAreaPath,
    baroPath,
    maxP,
    midP1,
    midP2,
    minP,
    maxPtPos,
    minPtPos,
  } = useMemo(() => {
    if (!series || series.length < 2) {
      return {
        tempPath: "M 0,200 C 125,230 250,245 375,220 C 500,140 625,60 750,50 C 875,85 940,110 1000,95",
        tempAreaPath: "M 0,200 C 125,230 250,245 375,220 C 500,140 625,60 750,50 C 875,85 940,110 1000,95 L 1000,280 L 0,280 Z",
        humPath: "M 0,110 C 125,70 250,55 375,60 C 500,75 625,185 750,210 C 875,170 940,140 1000,145",
        humAreaPath: "M 0,110 C 125,70 250,55 375,60 C 500,75 625,185 750,210 C 875,170 940,140 1000,145 L 1000,280 L 0,280 Z",
        baroPath: "M 0,90 C 150,85 280,60 400,50 C 470,45 510,180 580,195 C 680,215 800,160 1000,140",
        maxP: 955,
        midP1: 952,
        midP2: 949,
        minP: 946,
        maxPtPos: { x: 400, y: 50 },
        minPtPos: { x: 580, y: 195 },
      };
    }

    const n = series.length;
    // Temperature scale: 14°C to 34°C mapped to y: 240 -> 35
    const tPoints = series.map((pt, i) => {
      const x = Number(((i / (n - 1)) * 1000).toFixed(1));
      const clampedT = Math.max(14, Math.min(34, pt.temp));
      const y = Number((240 - ((clampedT - 14) / 20) * 205).toFixed(1));
      return { x, y };
    });

    // Humidity scale (UMI_ATUAL): 30% to 100% mapped to y: 240 -> 35
    const hPoints = series.map((pt, i) => {
      const x = Number(((i / (n - 1)) * 1000).toFixed(1));
      const hVal = pt.umiAtual ?? pt.umidade ?? 70;
      const clampedH = Math.max(30, Math.min(100, hVal));
      const y = Number((240 - ((clampedH - 30) / 70) * 205).toFixed(1));
      return { x, y };
    });

    // Pressure scale (P_ATM)
    const allP = series.map((s) => s.pAtm ?? s.pressaoLocal ?? s.pressaoHpa ?? 951);
    const rawMax = Math.max(...allP);
    const rawMin = Math.min(...allP);
    const effMax = Math.ceil(rawMax + 1);
    const effMin = Math.floor(rawMin - 1);
    const pSpan = Math.max(4, effMax - effMin);

    let maxIdx = 0;
    let minIdx = 0;
    let currMax = -Infinity;
    let currMin = Infinity;

    const bPoints = series.map((pt, i) => {
      const x = Number(((i / (n - 1)) * 1000).toFixed(1));
      const p = pt.pAtm ?? pt.pressaoLocal ?? pt.pressaoHpa ?? 951;
      if (p > currMax) {
        currMax = p;
        maxIdx = i;
      }
      if (p < currMin) {
        currMin = p;
        minIdx = i;
      }
      // y from 210 down to 45
      const y = Number((210 - ((p - effMin) / pSpan) * 165).toFixed(1));
      return { x, y };
    });

    const buildPath = (pts: { x: number; y: number }[]) =>
      pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), "");

    const tPath = buildPath(tPoints);
    const hPath = buildPath(hPoints);
    const bPath = buildPath(bPoints);

    return {
      tempPath: tPath,
      tempAreaPath: `${tPath} L 1000,280 L 0,280 Z`,
      humPath: hPath,
      humAreaPath: `${hPath} L 1000,280 L 0,280 Z`,
      baroPath: bPath,
      maxP: effMax,
      midP1: Math.round(effMin + pSpan * 0.67),
      midP2: Math.round(effMin + pSpan * 0.33),
      minP: effMin,
      maxPtPos: bPoints[maxIdx] || { x: 400, y: 50 },
      minPtPos: bPoints[minIdx] || { x: 580, y: 195 },
    };
  }, [series]);

  // Dynamic 24-hour timeline ticks matching the actual readings on the X-axis
  const timelineTicks = useMemo(() => {
    const count = 9;

    if (series && series.length >= 2) {
      const n = series.length;
      return Array.from({ length: count }, (_, i) => {
        const idx = Math.min(n - 1, Math.round((i / (count - 1)) * (n - 1)));
        const pt = series[idx];
        const isLast = i === count - 1;
        const isFirst = i === 0;
        const isMajor = i % 2 === 0; // 0, 2, 4, 6, 8 for compact mobile screens

        return {
          time: pt.time,
          label: isLast ? `${pt.time} (Agora)` : pt.time,
          shortLabel: pt.time,
          x: Number(((i / (count - 1)) * 1000).toFixed(1)),
          isCurrent: isLast,
          isFirst,
          isMajor,
        };
      });
    }

    // Fallback: Rolling 24-hour window ending at current local time
    const now = new Date();
    return Array.from({ length: count }, (_, i) => {
      const hoursAgo = 24 - (i / (count - 1)) * 24;
      const tickTime = new Date(now.getTime() - hoursAgo * 3600 * 1000);
      const hStr = String(tickTime.getHours()).padStart(2, "0");
      const mStr = String(tickTime.getMinutes()).padStart(2, "0");
      const timeStr = `${hStr}:${mStr}`;
      const isLast = i === count - 1;
      const isFirst = i === 0;
      const isMajor = i % 2 === 0;

      return {
        time: timeStr,
        label: isLast ? `${timeStr} (Agora)` : timeStr,
        shortLabel: timeStr,
        x: Number(((i / (count - 1)) * 1000).toFixed(1)),
        isCurrent: isLast,
        isFirst,
        isMajor,
      };
    });
  }, [series]);

  // Dynamic hourly rain bars generated from actual series readings
  const rainBars = useMemo(() => {
    if (!series || series.length === 0) {
      return [
        { x: 50, y: 208, width: 18, height: 2, opacity: 0.3 },
        { x: 150, y: 208, width: 18, height: 2, opacity: 0.3 },
        { x: 250, y: 208, width: 18, height: 2, opacity: 0.3 },
        { x: 350, y: 208, width: 18, height: 2, opacity: 0.3 },
        { x: 440, y: 170, width: 22, height: 40, opacity: 0.75 },
        { x: 475, y: 60, width: 26, height: 150, opacity: 1.0 },
        { x: 515, y: 140, width: 22, height: 70, opacity: 0.8 },
        { x: 550, y: 190, width: 20, height: 20, opacity: 0.5 },
        { x: 650, y: 208, width: 18, height: 2, opacity: 0.3 },
        { x: 750, y: 208, width: 18, height: 2, opacity: 0.3 },
        { x: 850, y: 208, width: 18, height: 2, opacity: 0.3 },
      ];
    }

    const numBuckets = 24;
    const bucketSize = Math.max(1, Math.floor(series.length / numBuckets));
    const bars = [];

    for (let b = 0; b < numBuckets; b++) {
      const slice = series.slice(b * bucketSize, (b + 1) * bucketSize);
      if (slice.length === 0) continue;
      const maxRate = Math.max(...slice.map((s) => s.chuvaTaxa || 0));
      const xCenter = (b / numBuckets) * 1000 + (1000 / numBuckets) / 2;
      const barWidth = Math.max(8, Math.min(22, Math.floor(1000 / numBuckets) - 6));
      const barX = Math.round(xCenter - barWidth / 2);
      const height = maxRate > 0 ? Math.min(160, Math.max(4, (maxRate / 20) * 160)) : 2;
      const barY = Math.round(210 - height);
      const opacity = maxRate > 10 ? 0.95 : maxRate > 3 ? 0.75 : maxRate > 0 ? 0.5 : 0.2;

      bars.push({
        x: barX,
        y: barY,
        width: barWidth,
        height,
        opacity,
      });
    }

    return bars;
  }, [series]);

  // Interactive mouse move for hover crosshair & tooltip
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!wrapperRef.current || !svgRef.current || !pathTempRef.current || !pathHumRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setCrosshair((prev) => ({ ...prev, visible: false }));
      return;
    }

    const relX = clientX - rect.left;
    const svgX = Math.max(0, Math.min(1000, (relX / rect.width) * 1000));

    // Approximate Y using SVG Path length search
    const lenTemp = pathTempRef.current.getTotalLength();
    const lenHum = pathHumRef.current.getTotalLength();

    const getYForX = (path: SVGPathElement, targetX: number, totalLen: number) => {
      let low = 0;
      let high = totalLen;
      let bestPoint = path.getPointAtLength(0);
      for (let i = 0; i < 18; i++) {
        const mid = (low + high) / 2;
        const pt = path.getPointAtLength(mid);
        bestPoint = pt;
        if (Math.abs(pt.x - targetX) < 0.5) break;
        if (pt.x < targetX) low = mid;
        else high = mid;
      }
      return bestPoint.y;
    };

    let tempY = 150;
    let humY = 150;
    try {
      tempY = getYForX(pathTempRef.current, svgX, lenTemp);
      humY = getYForX(pathHumRef.current, svgX, lenHum);
    } catch {
      // fallback
    }

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const mouseXInWrapper = clientX - wrapperRect.left;
    const mouseYInWrapper = clientY - wrapperRect.top;

    let tipLeft = mouseXInWrapper + 16;
    if (tipLeft + 240 > wrapperRect.width - 12) {
      tipLeft = mouseXInWrapper - 240 - 16;
    }
    if (tipLeft < 8) tipLeft = 8;

    let tipTop = mouseYInWrapper - 65;
    if (tipTop < 10) tipTop = 10;
    if (tipTop + 165 > wrapperRect.height - 10) {
      tipTop = wrapperRect.height - 165 - 10;
    }

    // Direct match from series if available
    if (series && series.length > 0) {
      const idx = Math.min(series.length - 1, Math.max(0, Math.round((svgX / 1000) * (series.length - 1))));
      const pt = series[idx];
      const timeFormatted = `${pt.time} BRT`;
      const humVal = pt.umiAtual ?? pt.umidade;
      const pAtmVal = pt.pAtm ?? pt.pressaoLocal ?? pt.pressaoHpa;

      setCrosshair({
        visible: true,
        x: svgX,
        tempY,
        humY,
        time: timeFormatted,
        temp: `${pt.temp.toFixed(1)} °C`,
        hum: `${humVal} %`,
        press: `${pAtmVal.toFixed(1)} hPa`,
        dew: `${pt.pontoOrvalho.toFixed(1)} °C`,
        feel: `${pt.sensacaoTermica.toFixed(1)} °C`,
        tooltipLeft: tipLeft,
        tooltipTop: tipTop,
      });
      return;
    }

    // Fallback formula if series not loaded
    let calcTemp = 18 + ((225 - tempY) * 12) / 195;
    let calcHum = 40 + ((225 - humY) * 60) / 195;
    calcTemp = Math.max(17.8, Math.min(29.4, calcTemp));
    calcHum = Math.max(38, Math.min(92, calcHum));

    const a = 17.27;
    const b = 237.7;
    const alpha = (a * calcTemp) / (b + calcTemp) + Math.log(calcHum / 100.0);
    const dewPoint = (b * alpha) / (a - alpha);
    const heatIndex =
      calcTemp +
      0.33 * ((calcHum / 100) * 6.105 * Math.exp((17.27 * calcTemp) / (237.7 + calcTemp))) -
      0.7 * 2.5 -
      4.0;
    const perceivedFeel = calcTemp * 0.7 + heatIndex * 0.3;

    const nowMs = Date.now();
    const pointMs = nowMs - (1 - svgX / 1000) * 24 * 3600 * 1000;
    const pointDate = new Date(pointMs);
    const hours = pointDate.getHours();
    const mins = Math.round(pointDate.getMinutes() / 5) * 5;
    const finalH = hours + (mins === 60 ? 1 : 0);
    const finalM = mins === 60 ? 0 : mins;
    const timeFormatted = `${String(finalH % 24).padStart(2, "0")}:${String(finalM).padStart(2, "0")} BRT`;

    setCrosshair({
      visible: true,
      x: svgX,
      tempY,
      humY,
      time: timeFormatted,
      temp: `${calcTemp.toFixed(1)} °C`,
      hum: `${Math.round(calcHum)} %`,
      press: `951.0 hPa`,
      dew: `${dewPoint.toFixed(1)} °C`,
      feel: `${perceivedFeel.toFixed(1)} °C`,
      tooltipLeft: tipLeft,
      tooltipTop: tipTop,
    });
  };

  const handleMouseLeave = () => {
    setCrosshair((prev) => ({ ...prev, visible: false }));
  };

  return (
    <section className="p-5 rounded-xl card-surface border border-theme shadow-md flex flex-col gap-4">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-theme">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#0284c7] dark:text-[#38bdf8] uppercase font-semibold">
              Dinâmica Atmosférica Contínua
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4]" />
          </div>
          <h2 className="text-xl sm:text-2xl text-theme-main font-semibold tracking-tight">
            Histórico Telemetria 24 Horas
          </h2>
          <p className="text-[13px] text-theme-secondary">
            Variação detalhada dos sensores da estação com leituras sincronizadas a cada 15 minutos.
          </p>
        </div>

        {/* Tab Switches */}
        <div className="flex flex-wrap items-center gap-1 subcard-surface p-1 rounded-lg border border-theme">
          <button
            onClick={() => setActiveTab("both")}
            className={`px-3 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeTab === "both"
                ? "text-white bg-[#0284c7] dark:bg-[#38bdf8] dark:text-[#00354a] font-semibold shadow-sm"
                : "text-theme-muted hover:text-theme-main"
            }`}
          >
            Visualização Combinada
          </button>
          <button
            onClick={() => setActiveTab("thermal")}
            className={`px-3 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeTab === "thermal"
                ? "text-white bg-[#0284c7] dark:bg-[#38bdf8] dark:text-[#00354a] font-semibold shadow-sm"
                : "text-theme-muted hover:text-theme-main"
            }`}
          >
            Temperatura & Umidade Relativa
          </button>
          <button
            onClick={() => setActiveTab("baro")}
            className={`px-3 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeTab === "baro"
                ? "text-white bg-[#0284c7] dark:bg-[#38bdf8] dark:text-[#00354a] font-semibold shadow-sm"
                : "text-theme-muted hover:text-theme-main"
            }`}
          >
            Pressão Atmosférica & Chuva
          </button>
        </div>
      </div>

      {/* 24h Meta Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg subcard-surface text-[13px] border border-theme">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 dark:text-[#ffbf9e] text-base">device_thermostat</span>
          <div>
            <span className="text-theme-muted">Média Térmica:</span>{" "}
            <span className="font-medium text-theme-main">{summary.mediaTermica} °C</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8] text-base">water_drop</span>
          <div>
            <span className="text-theme-muted">Umidade Média:</span>{" "}
            <span className="font-medium text-theme-main">{summary.mediaUmidade} %</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 dark:text-[#45dfa4] text-base">compress</span>
          <div>
            <span className="text-theme-muted">Pressão Média:</span>{" "}
            <span className="font-medium text-theme-main">{summary.mediaPress ?? 951} hPa</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sky-600 dark:text-[#38bdf8] text-base">cloud</span>
          <div>
            <span className="text-theme-muted">Precipitação Total:</span>{" "}
            <span className="font-medium text-theme-main">{summary.precipitacaoTotal} mm</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Curva Térmica e Umidade Relativa (UMI_ATUAL) */}
      {(activeTab === "both" || activeTab === "thermal") && (
        <div className="flex flex-col gap-1 p-4 rounded-xl subcard-surface border border-theme" id="chart-section-thermal">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[13px]">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] text-theme-main font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> Temperatura (°C)
              </span>
              <span className="font-mono text-[11px] text-theme-main font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] dark:bg-[#38bdf8]" /> Umidade Relativa (%)
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[12px] text-theme-muted">
              <span>Mín: {summary.tempMin}°C ({summary.tempMinTime})</span>
              <span>•</span>
              <span>Máx: {summary.tempMax}°C ({summary.tempMaxTime})</span>
            </div>
          </div>

          {/* Responsive SVG Chart with Crosshair */}
          <div
            ref={wrapperRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-72 sm:h-80 pt-4 cursor-crosshair select-none"
          >
            <svg
              ref={svgRef}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 1000 300"
            >
              <defs>
                <linearGradient id="chartTempGrad" x1="0%" x2="0%" y1="0%" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chartHumGrad" x1="0%" x2="0%" y1="0%" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guidelines */}
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="1000" y1="35" y2="35" />
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="1000" y1="100" y2="100" />
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="1000" y1="170" y2="170" />
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="1000" y1="240" y2="240" />

              {/* Vertical Time Guidelines */}
              {timelineTicks.map((tick, i) => (
                <line
                  key={`vt-${i}`}
                  className="text-slate-200/50 dark:text-[#262a35]/60"
                  stroke="currentColor"
                  strokeDasharray="2 3"
                  strokeWidth="0.5"
                  x1={tick.x}
                  x2={tick.x}
                  y1="35"
                  y2="240"
                />
              ))}

              {/* Axis Labels */}
              <text fill="#ea580c" fontFamily="JetBrains Mono" fontSize="11" x="5" y="38">34°C</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="965" y="38">100%</text>
              <text fill="#ea580c" fontFamily="JetBrains Mono" fontSize="11" x="5" y="104">27°C</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="972" y="104">80%</text>
              <text fill="#ea580c" fontFamily="JetBrains Mono" fontSize="11" x="5" y="174">20°C</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="972" y="174">55%</text>
              <text fill="#ea580c" fontFamily="JetBrains Mono" fontSize="11" x="5" y="244">14°C</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="972" y="244">30%</text>

              {/* Humidity Curve (UMI_ATUAL) */}
              <path d={humAreaPath} fill="url(#chartHumGrad)" />
              <path
                ref={pathHumRef}
                d={humPath}
                fill="none"
                stroke="#0284c7"
                strokeLinecap="round"
                strokeWidth="2.5"
              />

              {/* Temperature Curve */}
              <path d={tempAreaPath} fill="url(#chartTempGrad)" />
              <path
                ref={pathTempRef}
                d={tempPath}
                fill="none"
                stroke="#f97316"
                strokeLinecap="round"
                strokeWidth="2.5"
              />

              {/* Dynamic Crosshair Elements */}
              {crosshair.visible && (
                <g className="pointer-events-none">
                  <line
                    stroke="#0284c7"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                    x1={crosshair.x}
                    x2={crosshair.x}
                    y1="20"
                    y2="255"
                  />
                  {/* Temp Point */}
                  <circle
                    cx={crosshair.x}
                    cy={crosshair.tempY}
                    fill="#ea580c"
                    r="5"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Hum Point */}
                  <circle
                    cx={crosshair.x}
                    cy={crosshair.humY}
                    fill="#0284c7"
                    r="5"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Floating Tooltip with Sensor Values */}
            {crosshair.visible && (
              <div
                style={{
                  transform: `translate(${crosshair.tooltipLeft}px, ${crosshair.tooltipTop}px)`,
                }}
                className="pointer-events-none absolute top-0 left-0 z-30 min-w-[220px] p-3 rounded-xl card-surface backdrop-blur-md border border-theme shadow-2xl text-theme-main"
              >
                <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-theme">
                  <div className="flex items-center gap-1.5 text-[#0284c7] dark:text-[#38bdf8]">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span className="font-mono text-[12px] font-bold tracking-wider">{crosshair.time}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded subcard-surface text-[10px] font-mono text-theme-muted font-medium border border-theme">
                    SÉRIE 24H
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 font-mono text-[12px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-theme-secondary font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#f97316]" /> Temp:
                    </span>
                    <span className="text-[14px] text-amber-600 dark:text-[#ff975d] font-bold">{crosshair.temp}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-theme-secondary font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#0284c7] dark:bg-[#38bdf8]" /> Umidade:
                    </span>
                    <span className="text-[14px] text-[#0284c7] dark:text-[#38bdf8] font-bold">{crosshair.hum}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-theme-secondary font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#45dfa4]" /> Pressão:
                    </span>
                    <span className="text-[13px] text-emerald-600 dark:text-[#45dfa4] font-bold">{crosshair.press}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-theme text-[11px] text-theme-secondary">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-emerald-600 dark:text-[#45dfa4]">device_thermostat</span> P. Orvalho:
                    </span>
                    <span className="text-emerald-600 dark:text-[#45dfa4] font-semibold">{crosshair.dew}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-[11px] text-theme-muted">
                    <span>Sensação Térmica:</span>
                    <span className="text-theme-main font-medium">{crosshair.feel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Marks */}
            <div className="flex justify-between items-center text-theme-muted font-mono text-[11px] sm:text-[12px] pt-3 px-2 border-t border-theme">
              {timelineTicks.map((tick, idx) => (
                <span
                  key={idx}
                  className={`${
                    tick.isCurrent
                      ? "text-[#0284c7] dark:text-[#38bdf8] font-semibold"
                      : ""
                  } ${!tick.isMajor ? "hidden sm:inline" : "inline"}`}
                >
                  <span className="sm:hidden">{tick.shortLabel}</span>
                  <span className="hidden sm:inline">{tick.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chart 2: Pressão Atmosférica e Precipitação */}
      {(activeTab === "both" || activeTab === "baro") && (
        <div className="flex flex-col gap-1 p-4 rounded-xl subcard-surface border border-theme" id="chart-section-baro">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[13px]">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] text-theme-main font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4]" /> Pressão Atmosférica (hPa)
              </span>
              <span className="font-mono text-[11px] text-theme-main font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7] dark:bg-[#38bdf8]" /> Precipitação Horária (mm)
              </span>
            </div>
            <div className="font-mono text-[12px] text-theme-muted">
              Sensor: <span className="text-theme-main font-medium">Barômetro Digital (BMP390)</span> • Total 24h:{" "}
              <span className="text-[#0284c7] dark:text-[#38bdf8] font-medium">{summary.precipitacaoTotal} mm</span>
            </div>
          </div>

          <div className="relative w-full h-64 sm:h-72 pt-4">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 240">
              {/* Guidelines */}
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.75" x1="0" x2="1000" y1="45" y2="45" />
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.75" x1="0" x2="1000" y1="100" y2="100" />
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.75" x1="0" x2="1000" y1="155" y2="155" />
              <line className="text-slate-300 dark:text-[#313540]" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.75" x1="0" x2="1000" y1="210" y2="210" />

              {/* Vertical Time Guidelines */}
              {timelineTicks.map((tick, i) => (
                <line
                  key={`vb-${i}`}
                  className="text-slate-200/50 dark:text-[#262a35]/60"
                  stroke="currentColor"
                  strokeDasharray="2 3"
                  strokeWidth="0.5"
                  x1={tick.x}
                  x2={tick.x}
                  y1="45"
                  y2="210"
                />
              ))}

              {/* Labels dynamically derived from P_ATM range */}
              <text fill="#059669" fontFamily="JetBrains Mono" fontSize="11" x="5" y="49">{maxP} hPa</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="965" y="49">20 mm</text>
              <text fill="#059669" fontFamily="JetBrains Mono" fontSize="11" x="5" y="104">{midP1} hPa</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="965" y="104">15 mm</text>
              <text fill="#059669" fontFamily="JetBrains Mono" fontSize="11" x="5" y="159">{midP2} hPa</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="965" y="159">10 mm</text>
              <text fill="#059669" fontFamily="JetBrains Mono" fontSize="11" x="5" y="214">{minP} hPa</text>
              <text fill="#0284c7" fontFamily="JetBrains Mono" fontSize="11" x="970" y="214">0 mm</text>

              {/* Dynamic Hourly Rain Bars */}
              {rainBars.map((bar, i) => (
                <rect
                  key={i}
                  fill="#0284c7"
                  height={bar.height}
                  opacity={bar.opacity}
                  rx="1.5"
                  width={bar.width}
                  x={bar.x}
                  y={bar.y}
                />
              ))}

              {/* Dynamic Barometric Line (P_ATM) */}
              <path
                d={baroPath}
                fill="none"
                stroke="#059669"
                strokeLinecap="round"
                strokeWidth="2.5"
              />

              {/* Extreme Callout Pins */}
              <circle cx={maxPtPos.x} cy={maxPtPos.y} fill="#059669" r="4.5" stroke="#ffffff" strokeWidth="2" />
              <text fill="#059669" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x={maxPtPos.x} y={Math.max(20, maxPtPos.y - 12)}>
                Máx {summary.pressMax ?? 953} hPa ({summary.pressMaxTime ?? "10:30"})
              </text>

              <circle cx={minPtPos.x} cy={minPtPos.y} fill="#ef4444" r="4.5" stroke="#ffffff" strokeWidth="2" />
              <text fill="#ef4444" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x={minPtPos.x} y={Math.min(235, minPtPos.y + 16)}>
                Mín {summary.pressMin ?? 947} hPa ({summary.pressMinTime ?? "06:00"})
              </text>
            </svg>

            {/* Timeline Marks */}
            <div className="flex justify-between items-center text-theme-muted font-mono text-[11px] sm:text-[12px] pt-3 px-2 border-t border-theme">
              {timelineTicks.map((tick, idx) => (
                <span
                  key={idx}
                  className={`${
                    tick.isCurrent
                      ? "text-[#0284c7] dark:text-[#38bdf8] font-semibold"
                      : ""
                  } ${!tick.isMajor ? "hidden sm:inline" : "inline"}`}
                >
                  <span className="sm:hidden">{tick.shortLabel}</span>
                  <span className="hidden sm:inline">{tick.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
