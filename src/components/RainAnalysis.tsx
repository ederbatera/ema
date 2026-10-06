import React from "react";
import { RainSummaryData } from "../types";

interface RainAnalysisProps {
  rainData: RainSummaryData | null;
  onOpenMonthlyMetrics?: () => void;
}

export const RainAnalysis: React.FC<RainAnalysisProps> = ({ rainData, onOpenMonthlyMetrics }) => {
  const last7 = rainData?.last7Days || [
    { dayLabel: "06/09 (Dom)", date: "2026-09-06", rainfallMm: 2.8 },
    { dayLabel: "07/09 (Seg)", date: "2026-09-07", rainfallMm: 0.28 },
    { dayLabel: "08/09 (Ter)", date: "2026-09-08", rainfallMm: 0.0 },
    { dayLabel: "09/09 (Qua)", date: "2026-09-09", rainfallMm: 0.84 },
    { dayLabel: "10/09 (Qui)", date: "2026-09-10", rainfallMm: 8.96 },
    { dayLabel: "Ontem", date: "2026-09-11", rainfallMm: 3.92 },
    { dayLabel: "Hoje", date: "2026-09-12", rainfallMm: 32.48, isToday: true },
  ];

  const acumulados = rainData?.acumulados || {
    mes: 69.16,
    seteDias: 49.28,
    hoje: 32.48,
    cincoMinutos: 0.0,
    escalaMaxMm: 80,
  };

  const maxVal = Math.max(35, ...last7.map((d) => d.rainfallMm));

  return (
    <section className="p-5 rounded-xl card-surface border border-theme shadow-md flex flex-col gap-6" id="rain-section">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-theme">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#0284c7] dark:text-[#38bdf8] uppercase font-semibold">
              Monitoramento Pluviométrico Avançado
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#45dfa4]" />
          </div>
          <h2 className="text-xl sm:text-2xl text-theme-main font-semibold tracking-tight">
            Precipitação & Acumulados
          </h2>
          <p className="text-[13px] text-theme-secondary">
            Dados pluviométricos consolidados por período com base no sensor óptico RG-15.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenMonthlyMetrics && (
            <button
              type="button"
              onClick={onOpenMonthlyMetrics}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 text-[#0284c7] dark:text-[#38bdf8] text-xs font-bold border border-sky-500/30 transition-all cursor-pointer shadow-xs"
              title="Abrir modal com todos os dias do mês, acumulado e extremos térmicos"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              <span>Abrir Métricas Mês (Modal)</span>
            </button>
          )}

          <div className="flex items-center gap-2 p-2.5 rounded-lg subcard-surface border border-theme">
            <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38bdf8] text-xl">water_drop</span>
            <div>
              <span className="font-mono text-[11px] text-theme-muted block uppercase">Acumulado Mês</span>
              <span className="font-mono text-base text-theme-main font-semibold">{acumulados.mes.toFixed(2)} mm</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg subcard-surface border border-theme">
            <span className="material-symbols-outlined text-amber-500 dark:text-[#ffbf9e] text-xl">flash_on</span>
            <div>
              <span className="font-mono text-[11px] text-theme-muted block uppercase">Pico 24h</span>
              <span className="font-mono text-base text-theme-main font-semibold">{acumulados.hoje.toFixed(2)} mm</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subseção 1: Precipitação Últimos 7 dias */}
        <div className="p-4 rounded-xl subcard-surface border border-theme flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] text-[#0284c7] dark:text-[#38bdf8] uppercase font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">calendar_view_week</span>
                Precipitação Últimos 7 dias
              </span>
              <span className="font-mono text-[11px] text-theme-muted">Valores diários</span>
            </div>

            <div className="grid grid-cols-7 gap-2 h-44 items-end pt-4 pb-2 border-b border-theme">
              {last7.map((item, idx) => {
                const heightPct = Math.max(8, Math.round((item.rainfallMm / maxVal) * 100));
                const isHighlight = item.isToday;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isHighlight ? "text-[#0284c7] dark:text-[#38bdf8]" : "text-theme-muted"
                      }`}
                    >
                      {item.rainfallMm.toFixed(2)}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-[#1c1f2a] rounded-t-md flex items-end h-full overflow-hidden border border-slate-200/50 dark:border-transparent">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isHighlight
                            ? "bg-[#0284c7] dark:bg-[#38bdf8] shadow-[0_0_12px_rgba(2,132,199,0.3)] dark:shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                            : "bg-sky-200/80 hover:bg-sky-300/90 dark:bg-[#262a35] dark:group-hover:bg-[#313540]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-2 text-center font-mono text-[11px] text-theme-muted pt-2">
              {last7.map((item, idx) => (
                <span
                  key={idx}
                  className={`truncate ${
                    item.isToday ? "text-[#0284c7] dark:text-[#38bdf8] font-semibold" : ""
                  }`}
                >
                  {item.dayLabel}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-theme text-[12px] text-theme-secondary">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-[#45dfa4] font-medium">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Sensor Óptico RG-15 Ativo
            </span>
            <span className="font-mono text-theme-muted">Capacidade pluviométrica normal</span>
          </div>
        </div>

        {/* Subseção 2: Acumulados - Série volumétrica consolidada */}
        <div className="p-4 rounded-xl subcard-surface border border-theme flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] text-emerald-600 dark:text-[#45dfa4] uppercase font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">stacked_bar_chart</span>
                Acumulados - Série Volumétrica
              </span>
              <span className="font-mono text-[11px] text-theme-muted">Escala 0 a 80 mm</span>
            </div>

            <div className="flex flex-col gap-4 py-2">
              {/* Mês */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[13px]">
                  <span className="text-theme-main font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0284c7] dark:bg-[#38bdf8]" /> Mês (Setembro)
                  </span>
                  <span className="font-mono font-bold text-theme-main">{acumulados.mes.toFixed(2)} mm</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1c1f2a] rounded-full h-3 overflow-hidden border border-slate-200/50 dark:border-transparent">
                  <div
                    style={{ width: `${Math.min(100, (acumulados.mes / 80) * 100)}%` }}
                    className="bg-[#0284c7] dark:bg-[#38bdf8] h-full rounded-full shadow-[0_0_8px_rgba(2,132,199,0.3)] dark:shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-500"
                  />
                </div>
              </div>

              {/* 7 dias */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[13px]">
                  <span className="text-theme-main font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0284c7] dark:bg-[#8ed5ff]" /> Últimos 7 dias
                  </span>
                  <span className="font-mono font-bold text-theme-main">{acumulados.seteDias.toFixed(2)} mm</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1c1f2a] rounded-full h-3 overflow-hidden border border-slate-200/50 dark:border-transparent">
                  <div
                    style={{ width: `${Math.min(100, (acumulados.seteDias / 80) * 100)}%` }}
                    className="bg-sky-500 dark:bg-[#8ed5ff] h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Hoje */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[13px]">
                  <span className="text-theme-main font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#45dfa4]" /> Hoje
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-[#45dfa4]">{acumulados.hoje.toFixed(2)} mm</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1c1f2a] rounded-full h-3 overflow-hidden border border-slate-200/50 dark:border-transparent">
                  <div
                    style={{ width: `${Math.min(100, (acumulados.hoje / 80) * 100)}%` }}
                    className="bg-emerald-500 dark:bg-[#45dfa4] h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] dark:shadow-[0_0_8px_rgba(69,223,164,0.5)] transition-all duration-500"
                  />
                </div>
              </div>

              {/* 5 minutos */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[13px]">
                  <span className="text-theme-muted font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-[#3e484f]" /> Últimos 5 minutos
                  </span>
                  <span className="font-mono font-bold text-theme-muted">{acumulados.cincoMinutos.toFixed(2)} mm</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1c1f2a] rounded-full h-3 overflow-hidden border border-slate-200/50 dark:border-transparent">
                  <div
                    style={{ width: `${Math.min(100, (acumulados.cincoMinutos / 80) * 100)}%` }}
                    className="bg-slate-300 dark:bg-[#3e484f] h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-theme font-mono text-[11px] text-theme-muted">
            <span>0 mm</span>
            <span>20 mm</span>
            <span>40 mm</span>
            <span>60 mm</span>
            <span>80 mm (Escala Máx)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
