import React, { useState, useMemo } from "react";
import { ForecastData } from "../types";

interface ExtendedForecastProps {
  forecast: ForecastData | null;
}

export const ExtendedForecast: React.FC<ExtendedForecastProps> = ({ forecast }) => {
  // Source switcher: "google" (Principal) or "openMeteo" (Comparação)
  const [selectedSource, setSelectedSource] = useState<"google" | "openMeteo">("google");

  // Determine active forecast based on selection, falling back gracefully
  const activeForecast = useMemo(() => {
    if (!forecast) return null;
    if (selectedSource === "google") {
      return forecast.providers?.google || (forecast.source === "Open-Meteo" ? null : forecast) || forecast;
    }
    if (selectedSource === "openMeteo") {
      return forecast.providers?.openMeteo || (forecast.source === "Open-Meteo" ? forecast : null) || forecast;
    }
    return forecast;
  }, [forecast, selectedSource]);

  // Comparison forecast (the other one) to enable comparative metrics
  const comparisonForecast = useMemo(() => {
    if (!forecast?.providers) return null;
    return selectedSource === "google"
      ? forecast.providers.openMeteo
      : forecast.providers.google;
  }, [forecast, selectedSource]);

  const today = activeForecast?.today || {
    title: "HOJE • DESTAQUE",
    dateStr: "Segunda-feira, 24 Outubro",
    tempCurrent: 26.4,
    tempMax: 29,
    tempMin: 18,
    condition: "Parcialmente Nublado",
    description: "Aberturas de sol com pancadas isoladas de chuva à tarde.",
    probChuva: "40 %",
    estChuva: "5 a 10 mm est.",
    ventoMedio: "14 km/h",
    ventoDir: "Direção SSE",
    uvIndex: "8 / 11",
    uvStatus: "Muito Alto",
    nascerDoSol: "06:12",
    solAzimute: "Azimute 78°",
    porDoSol: "18:24",
    luzDiurna: "12h 12m luz",
    faixaTermica: "18° / 29°",
    amplitude: "Amplitude 11°C",
  };

  const days = activeForecast?.days || [
    {
      id: "d1",
      label: "AMANHÃ",
      dayOfWeek: "Terça-feira",
      condition: "Sol com algumas nuvens passageiras.",
      tempMax: 30,
      tempMin: 19,
      probChuva: 15,
      rainMm: 0,
      windKmH: 12,
      icon: "sunny",
      badgeColor: "text-[#0284c7] dark:text-[#38bdf8]",
    },
    {
      id: "d2",
      label: "QUARTA-FEIRA",
      dayOfWeek: "Quarta-feira",
      condition: "Ensolarado e firme, ar seco.",
      tempMax: 32,
      tempMin: 20,
      probChuva: 5,
      rainMm: 0,
      windKmH: 16,
      icon: "wb_sunny",
      badgeColor: "text-slate-500 dark:text-[#87929a]",
    },
    {
      id: "d3",
      label: "QUINTA-FEIRA",
      dayOfWeek: "Quinta-feira",
      condition: "Chuvas fortes e trovoadas à tarde.",
      tempMax: 27,
      tempMin: 21,
      probChuva: 80,
      rainMm: 22,
      windKmH: 24,
      icon: "thunderstorm",
      badgeColor: "text-red-500 dark:text-[#ffb4ab]",
    },
    {
      id: "d4",
      label: "SEXTA-FEIRA",
      dayOfWeek: "Sexta-feira",
      condition: "Chuva matinal e queda de temperatura.",
      tempMax: 23,
      tempMin: 17,
      probChuva: 65,
      rainMm: 8,
      windKmH: 20,
      icon: "rainy",
      badgeColor: "text-slate-500 dark:text-[#87929a]",
    },
    {
      id: "d5",
      label: "SÁBADO",
      dayOfWeek: "Sábado",
      condition: "Céu limpo, ventos calmos e ar fresco.",
      tempMax: 24,
      tempMin: 15,
      probChuva: 10,
      rainMm: 0,
      windKmH: 10,
      icon: "air",
      badgeColor: "text-emerald-600 dark:text-[#45dfa4]",
    },
    {
      id: "d6",
      label: "DOMINGO",
      dayOfWeek: "Domingo",
      condition: "Sol entre nuvens, agradável.",
      tempMax: 26,
      tempMin: 16,
      probChuva: 20,
      rainMm: 2,
      windKmH: 13,
      icon: "partly_cloudy_day",
      badgeColor: "text-slate-500 dark:text-[#87929a]",
    },
  ];

  // Format time of the last external API query (or cached pulse)
  const lastUpdateFormatted = useMemo(() => {
    const raw = activeForecast?.lastUpdated || activeForecast?.cacheMeta?.cachedAt;
    if (raw) {
      try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          return (
            d.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }) + " BRT"
          );
        }
      } catch {
        // fallback
      }
      return String(raw);
    }
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " BRT";
  }, [activeForecast?.lastUpdated, activeForecast?.cacheMeta?.cachedAt]);

  // Calculate cumulative predicted rainfall for the 7-day period
  const todayRainEst = parseFloat(today.estChuva) || 0;
  const futureDaysRain = days.reduce((acc, d) => acc + (Number(d.rainMm) || 0), 0);
  const totalPredictedRain = todayRainEst + futureDaysRain;

  // Comparison rainfall calculation
  const otherRainTotal = useMemo(() => {
    if (!comparisonForecast) return null;
    const tRain = parseFloat(comparisonForecast.today?.estChuva) || 0;
    const fRain = (comparisonForecast.days || []).reduce((acc, d) => acc + (Number(d.rainMm) || 0), 0);
    return tRain + fRain;
  }, [comparisonForecast]);

  return (
    <section className="p-5 rounded-xl card-surface border transition-colors flex flex-col gap-6" id="forecast-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-[#0284c7] dark:text-[#38bdf8] uppercase font-semibold">
              Previsão Meteorológica Estendida
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#45dfa4]" />

            {/* Source badge */}
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                selectedSource === "google"
                  ? "text-[#0284c7] dark:text-[#38bdf8]"
                  : "text-emerald-600 dark:text-[#45dfa4]"
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {selectedSource === "google" ? "verified" : "compare_arrows"}
              </span>
              FONTE: {selectedSource === "google" ? "GOOGLE API (PRINCIPAL)" : "OPEN-METEO (COMPARATIVO)"}
            </span>

            {/* Horário da última consulta da API */}
            <span
              className="font-mono text-[11px] px-2.5 py-0.5 rounded-md subcard-surface border border-theme text-theme-main font-semibold flex items-center gap-1.5"
              title={`Horário da última consulta da previsão (${selectedSource === "google" ? "Google Maps Weather" : "Open-Meteo"})`}
            >
              <span className="material-symbols-outlined text-xs text-[#0284c7] dark:text-[#38bdf8]">schedule</span>
              <span className="text-theme-muted font-normal">Atualização:</span>
              <span>{lastUpdateFormatted}</span>
            </span>

            <span className="font-mono text-[10px] px-2 py-0.5 rounded subcard-surface border border-theme text-theme-main flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">cloud_done</span>
              {activeForecast?.model || (selectedSource === "google" ? "Google Maps Platform Weather API" : "Open-Meteo High-Res")}
            </span>

            {/* Total Rain Volume in Horizon */}
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-[#0284c7] dark:text-[#38bdf8] flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">water_drop</span>
              Chuva Prevista 7 Dias: <strong className="font-bold">{totalPredictedRain.toFixed(1)} mm</strong>
            </span>

            {/* Comparison rain total tag */}
            {otherRainTotal !== null && (
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                title={`No modelo comparativo (${selectedSource === "google" ? "Open-Meteo" : "Google Weather"}), a chuva prevista é de ${otherRainTotal.toFixed(1)} mm`}
              >
                <span className="material-symbols-outlined text-[12px]">difference</span>
                {selectedSource === "google" ? "Open-Meteo:" : "Google:"} <strong className="font-bold">{otherRainTotal.toFixed(1)} mm</strong>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl text-theme-main font-semibold tracking-tight mt-1">
            Horizonte Sinótico 7 Dias
          </h2>
          <p className="text-[13px] text-theme-secondary">
            {selectedSource === "google"
              ? "Previsão numérica oficial de alta resolução via Google Maps Platform Weather API (MetNet AI)."
              : "Previsão comparativa de alta resolução via modelos numéricos ECMWF / GFS (Open-Meteo)."}
          </p>
        </div>

        {/* Controles: Seletor Intercalar entre as fontes e Confiança */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Alternador de Fontes */}
          <div
            className="flex items-center p-1 rounded-lg subcard-surface border border-theme shadow-xs"
            role="group"
            aria-label="Selecionar Fonte de Previsão"
          >
            <button
              type="button"
              id="btn-forecast-source-google"
              onClick={() => setSelectedSource("google")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                selectedSource === "google"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-theme-secondary hover:text-theme-main hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title="Alternar para Google Maps Platform Weather API — MetNet / AI High-Res (Modelo Principal)"
            >
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>Google API (Principal)</span>
            </button>

            <button
              type="button"
              id="btn-forecast-source-openmeteo"
              onClick={() => setSelectedSource("openMeteo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                selectedSource === "openMeteo"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-theme-secondary hover:text-theme-main hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title="Alternar para Open-Meteo — ECMWF / GFS (Modelo Comparativo)"
            >
              <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
              <span>Open-Meteo (Comparação)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-theme-muted subcard-surface px-3 py-2 rounded-lg border border-theme">
            <span className="w-2 h-2 rounded-full bg-[#059669] dark:bg-[#45dfa4]" />
            Confiança: {activeForecast?.confidence || "95% ALTA"}
          </div>
        </div>
      </div>

      {/* Featured Today Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-sky-50/70 via-white to-sky-50/40 dark:from-[#1c2230] dark:via-[#171b26] dark:to-[#0a0e18] border border-sky-200/80 dark:border-[#38bdf8]/30 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-sky-100 dark:bg-[#38bdf8]/15 flex items-center justify-center flex-shrink-0 text-sky-700 dark:text-[#38bdf8] border border-sky-200 dark:border-[#38bdf8]/30">
              <span className="material-symbols-outlined text-3xl">partly_cloudy_day</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-[#38bdf8]/20 text-sky-700 dark:text-[#38bdf8] font-mono text-[11px] font-bold">
                  {today.title}
                </span>
                <span className="font-mono text-[12px] text-theme-secondary">{today.dateStr}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-mono font-bold text-theme-main">{today.tempCurrent}°C</span>
                <span className="text-sm font-mono text-theme-muted">
                  Máx {today.tempMax}° • Mín {today.tempMin}°
                </span>
              </div>
              <p className="text-[13px] text-theme-secondary mt-0.5">{today.description}</p>
            </div>
          </div>

          {/* Quick Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/90 dark:bg-[#0a0e18]/60 p-3.5 rounded-xl border border-sky-100 dark:border-white/10 shadow-xs text-[12px]">
            <div>
              <span className="text-theme-muted block font-mono text-[10px] uppercase">Chuva & Volume</span>
              <span className="font-mono font-bold text-[#0284c7] dark:text-[#38bdf8] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">water_drop</span>
                {today.probChuva}
              </span>
              <span className="text-[#0284c7] dark:text-[#38bdf8] font-semibold block text-[11px] mt-0.5">
                Vol: {today.estChuva}
              </span>
            </div>
            <div>
              <span className="text-theme-muted block font-mono text-[10px] uppercase">Vento Médio</span>
              <span className="font-mono font-bold text-theme-main">{today.ventoMedio}</span>
              <span className="text-theme-muted block text-[10px]">{today.ventoDir}</span>
            </div>
            <div>
              <span className="text-theme-muted block font-mono text-[10px] uppercase">Índice UV</span>
              <span className="font-mono font-bold text-[#d97706] dark:text-[#ffbf9e]">{today.uvIndex}</span>
              <span className="text-theme-muted block text-[10px]">{today.uvStatus}</span>
            </div>
            <div>
              <span className="text-theme-muted block font-mono text-[10px] uppercase">Sol / Luz</span>
              <span className="font-mono font-bold text-theme-main">{today.nascerDoSol} / {today.porDoSol}</span>
              <span className="text-theme-muted block text-[10px]">{today.luzDiurna}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Day Horizon Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {days.map((d, index) => {
          // Guaranteed elimination of D+ labels
          const cleanLabel = (!d.label || d.label.startsWith("D+"))
            ? (index === 0 ? "AMANHÃ" : d.dayOfWeek.toUpperCase())
            : d.label;

          return (
            <div
              key={d.id}
              className={`p-4 rounded-xl subcard-surface border border-theme flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-[#171b26] transition-all group ${
                cleanLabel === "ALERTA" ? "border-amber-500/50 bg-amber-500/10" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-[10px] font-bold tracking-wider ${d.badgeColor}`}>
                    {cleanLabel}
                  </span>
                  <span className="material-symbols-outlined text-xl text-[#0284c7] dark:text-[#38bdf8] group-hover:scale-110 transition-transform">
                    {d.icon}
                  </span>
                </div>

                <div className="font-semibold text-[13px] text-theme-main mb-1">{d.dayOfWeek}</div>
                <p className="text-[11px] text-theme-muted leading-tight mb-3 line-clamp-2">{d.condition}</p>
              </div>

              <div className="pt-2 border-t border-theme flex flex-col gap-1.5 font-mono text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#ea580c] dark:text-[#ffbf9e] font-bold">{d.tempMax}°</span>
                  <span className="text-[#0284c7] dark:text-[#8ed5ff]">{d.tempMin}°</span>
                </div>

                {/* Rain Probability & Volume */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-0.5 text-theme-muted" title="Probabilidade de precipitação">
                    <span className="material-symbols-outlined text-xs text-[#0284c7] dark:text-[#38bdf8]">water_drop</span>
                    {d.probChuva}%
                  </span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[10.5px] ${
                      (d.rainMm ?? 0) > 0
                        ? "bg-[#0284c7]/15 dark:bg-[#38bdf8]/20 text-[#0284c7] dark:text-[#38bdf8]"
                        : "text-theme-muted"
                    }`}
                    title="Volume de chuva previsto"
                  >
                    {(d.rainMm ?? 0) > 0 ? `${Number(d.rainMm).toFixed(1)} mm` : "0.0 mm"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-theme-muted pt-0.5 border-t border-theme/40">
                  <span className="uppercase tracking-wider">Vento</span>
                  <span>{d.windKmH} km/h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

