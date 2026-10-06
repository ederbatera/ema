import React, { useState } from "react";
import { WeatherAlertItem } from "../types";

interface AlertBannerProps {
  alert: WeatherAlertItem | null;
  alerts?: WeatherAlertItem[];
}

function parseAlertId(id?: string): string {
  if (!id) return "";
  return id.replace(/^inmet-/, "#");
}

function formatAlertDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const clean = dateStr.replace(" ", "T");
    const d = new Date(clean);
    if (isNaN(d.getTime())) return dateStr;
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${weekdays[d.getDay()]}, ${day}/${month}`;
  } catch {
    return dateStr;
  }
}

function formatFullPeriod(inicio?: string, fim?: string, fallback?: string): string {
  if (inicio && fim) {
    const startDay = formatAlertDate(inicio);
    const endDay = formatAlertDate(fim);
    const startTime = inicio.includes(" ") ? inicio.split(" ")[1] : (inicio.includes("T") ? inicio.split("T")[1]?.slice(0, 5) : "");
    const endTime = fim.includes(" ") ? fim.split(" ")[1] : (fim.includes("T") ? fim.split("T")[1]?.slice(0, 5) : "");
    if (startDay === endDay) {
      return `${startDay} • das ${startTime || "00:00"} às ${endTime || "23:59"} BRT`;
    }
    return `De ${startDay} (${startTime || "00:00"}) até ${endDay} (${endTime || "23:59"}) BRT`;
  }
  return fallback || "Vigente";
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert: propAlert, alerts = [] }) => {
  const [dismissed, setDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedDetails, setExpandedDetails] = useState(false);

  const activeAlerts = alerts.length > 0 ? alerts : propAlert ? [propAlert] : [];

  if (activeAlerts.length === 0) {
    return (
      <div className="px-4 py-2.5 rounded-xl subcard-surface border border-theme flex items-center justify-between text-[12px] text-theme-muted font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 dark:text-[#45dfa4] font-medium">Condições Estáveis</span>
          <span>•</span>
          <span>Nenhum aviso adverso em vigor no momento para a região (INMET)</span>
        </div>
        <span className="hidden sm:inline text-[11px] text-theme-muted">Monitoramento Oficial Contínuo</span>
      </div>
    );
  }

  const currentAlert = activeAlerts[Math.min(currentIndex, activeAlerts.length - 1)] || activeAlerts[0];

  // Severity color styles
  const isRed =
    currentAlert.nivelNum === 3 ||
    currentAlert.level?.toLowerCase().includes("vermelho") ||
    currentAlert.severity?.toLowerCase().includes("grande");
  const isOrange =
    !isRed &&
    (currentAlert.nivelNum === 2 ||
      (currentAlert.level?.toLowerCase().includes("laranja") && currentAlert.nivelNum !== 1) ||
      (currentAlert.severity?.toLowerCase().includes("perigo") &&
        !currentAlert.severity?.toLowerCase().includes("potencial")));

  const borderClass = isRed
    ? "border-red-500/50 dark:border-red-500/40"
    : isOrange
    ? "border-amber-500/50 dark:border-amber-500/40"
    : "border-yellow-500/50 dark:border-yellow-500/40";

  const stripGradient = isRed
    ? "bg-gradient-to-b from-red-600 via-rose-500 to-amber-600"
    : isOrange
    ? "bg-gradient-to-b from-amber-500 via-orange-500 to-red-500"
    : "bg-gradient-to-b from-yellow-400 via-amber-400 to-orange-400";

  const badgeBg = isRed
    ? "bg-red-100 text-red-700 dark:bg-[#93000a]/70 dark:text-[#ffb4ab] border-red-300 dark:border-[#ef4444]/40"
    : isOrange
    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border-amber-300 dark:border-amber-700/50"
    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700/50";

  const iconBg = isRed
    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
    : isOrange
    ? "bg-amber-500/10 text-amber-600 dark:text-[#ff975d] border-amber-500/30"
    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";

  // Minimized state bar
  if (dismissed) {
    return (
      <div className="px-4 py-2.5 rounded-xl card-surface border border-amber-500/30 shadow-sm flex items-center justify-between text-[12px] transition-all">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="font-mono font-semibold text-amber-600 dark:text-[#ff975d]">
            {activeAlerts.length} {activeAlerts.length === 1 ? "Aviso Meteorológico Ativo" : "Avisos Meteorológicos Ativos"} (INMET):
          </span>
          <span className="text-theme-main font-medium truncate max-w-md">
            {currentAlert.title} ({parseAlertId(currentAlert.id)} • {formatAlertDate(currentAlert.inicio || currentAlert.fim)})
          </span>
        </div>
        <button
          onClick={() => setDismissed(false)}
          className="text-theme-muted hover:text-theme-main font-mono text-[11px] underline underline-offset-2 flex items-center gap-1 cursor-pointer"
        >
          <span>Restaurar Painel de Alerta</span>
          <span className="material-symbols-outlined text-sm">open_in_full</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`relative overflow-hidden p-4 sm:p-5 rounded-xl card-surface ${borderClass} border shadow-md transition-all`}
      role="alert"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripGradient}`} />

      <div className="flex flex-col gap-3">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 shadow-inner border`}
            >
              <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Level badge */}
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 border ${badgeBg}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isRed ? "bg-red-400" : isOrange ? "bg-amber-400" : "bg-yellow-400"
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isRed ? "bg-red-500" : isOrange ? "bg-amber-500" : "bg-yellow-500"
                      }`}
                    />
                  </span>
                  {currentAlert.level || (isOrange ? "Alerta Laranja • Perigo" : "Alerta Amarelo • Perigo Potencial")}
                </span>

                {/* Official Bulletin Number Badge */}
                {currentAlert.id && (
                  <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md subcard-surface border border-theme text-theme-main font-semibold flex items-center gap-1">
                    <span className="text-theme-muted">Boletim</span>
                    <span>{parseAlertId(currentAlert.id)}</span>
                  </span>
                )}

                {/* Source badge */}
                <span className="font-mono text-[11px] text-[#0284c7] dark:text-[#38bdf8] font-bold uppercase tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  FONTE OFICIAL: INMET
                </span>
              </div>

              {/* Title & Detailed Period */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl text-theme-main font-semibold tracking-tight">
                    {currentAlert.title}
                  </h3>
                  {activeAlerts.length > 1 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded subcard-surface text-theme-muted border border-theme">
                      Aviso {currentIndex + 1} de {activeAlerts.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-mono text-theme-secondary">
                  <span className="text-theme-muted">Vigência:</span>
                  <span className="font-semibold text-theme-main">
                    {formatFullPeriod(currentAlert.inicio, currentAlert.fim, currentAlert.validUntil)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Actions & Multi-alert pagination */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-theme">
            {activeAlerts.length > 1 && (
              <div className="flex items-center gap-1 subcard-surface p-1 rounded-lg border border-theme">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeAlerts.length - 1))}
                  className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-[#262a35] text-theme-muted hover:text-theme-main font-mono text-[11px] flex items-center cursor-pointer"
                  title="Aviso anterior"
                >
                  <span className="material-symbols-outlined text-xs">chevron_left</span>
                </button>
                <span className="px-2 font-mono text-[11px] text-theme-main font-medium">
                  {currentIndex + 1} de {activeAlerts.length}
                </span>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev < activeAlerts.length - 1 ? prev + 1 : 0))}
                  className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-[#262a35] text-theme-muted hover:text-theme-main font-mono text-[11px] flex items-center cursor-pointer"
                  title="Próximo aviso"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <a
                className="px-3 py-1.5 rounded-lg subcard-surface hover:bg-slate-200 dark:hover:bg-[#313540] text-theme-main text-[12px] border border-theme shadow-sm transition-all flex items-center gap-1.5"
                href="#chart-section-baro"
              >
                <span className="material-symbols-outlined text-sm text-[#0284c7] dark:text-[#38bdf8]">query_stats</span>
                <span className="hidden sm:inline">Telemetria</span>
              </a>

              {currentAlert.url && (
                <a
                  href={currentAlert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#0284c7]/10 hover:bg-[#0284c7]/20 text-[#0284c7] dark:text-[#38bdf8] text-[12px] border border-[#0284c7]/30 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>Boletim INMET</span>
                </a>
              )}

              <button
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-[#262a35] text-theme-muted hover:text-theme-main transition-colors flex items-center cursor-pointer"
                onClick={() => setDismissed(true)}
                title="Minimizar alerta temporariamente"
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-alert tabs with distinct dates and bulletin IDs */}
        {activeAlerts.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-theme/60 pl-1 sm:pl-14">
            <span className="font-mono text-[11px] text-theme-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">event_upcoming</span>
              Boletins em Vigor:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeAlerts.map((al, idx) => {
                const isSelected = idx === currentIndex;
                const numId = parseAlertId(al.id) || `#${idx + 1}`;
                const dateLabel = formatAlertDate(al.inicio || al.fim);
                return (
                  <button
                    key={al.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? "bg-[#0284c7] text-white border-sky-400 font-semibold shadow-sm"
                        : "subcard-surface text-theme-muted hover:text-theme-main border-theme hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="opacity-90">{numId}</span>
                    <span>•</span>
                    <span>{dateLabel || al.validUntil || al.title}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] font-mono text-theme-muted">
              (Boletins oficiais consecutivos emitidos para dias diferentes)
            </span>
          </div>
        )}

        {/* Alert Description */}
        <p className="text-[13px] text-theme-secondary max-w-5xl leading-relaxed pl-1 sm:pl-14">
          {currentAlert.description}
        </p>

        {/* Expandable Safety Tips & Civil Defense Instructions */}
        <div className="pl-1 sm:pl-14 pt-1">
          <button
            onClick={() => setExpandedDetails(!expandedDetails)}
            className="flex items-center gap-1.5 font-mono text-[11px] text-amber-600 dark:text-[#ff975d] hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              {expandedDetails ? "expand_less" : "expand_more"}
            </span>
            <span>
              {expandedDetails ? "Ocultar Recomendações e Riscos" : "Ver Riscos e Recomendações da Defesa Civil"}
            </span>
          </button>

          {expandedDetails && (
            <div className="mt-2.5 p-3 rounded-lg subcard-surface border border-theme flex flex-col gap-2 text-[12px]">
              {currentAlert.riscos && currentAlert.riscos.length > 0 && (
                <div>
                  <div className="font-mono text-[11px] font-semibold text-theme-main flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-amber-500 text-sm">thunderstorm</span>
                    Riscos Meteorológicos Previstos:
                  </div>
                  <ul className="list-disc list-inside text-theme-secondary space-y-0.5 font-mono text-[11px]">
                    {currentAlert.riscos.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentAlert.instrucoes && currentAlert.instrucoes.length > 0 && (
                <div className="pt-2 border-t border-theme">
                  <div className="font-mono text-[11px] font-semibold text-theme-main flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">shield</span>
                    Instruções de Segurança:
                  </div>
                  <ul className="list-disc list-inside text-theme-secondary space-y-0.5 font-mono text-[11px]">
                    {currentAlert.instrucoes.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-[11px] text-theme-muted">
                <span className="flex items-center gap-1 text-[#0284c7] dark:text-[#38bdf8]">
                  <span className="material-symbols-outlined text-xs">call</span>
                  Defesa Civil: 199
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <span className="material-symbols-outlined text-xs">call</span>
                  Corpo de Bombeiros: 193
                </span>
                {currentAlert.atualizadoEm && (
                  <span className="ml-auto text-[10px]">
                    Sincronizado: {new Date(currentAlert.atualizadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} BRT
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
