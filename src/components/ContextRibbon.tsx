import React, { useEffect, useState } from "react";
import { formatCountdown } from "../lib/syncScheduler";

interface ContextRibbonProps {
  batteryPct?: number;
  lastSyncTime?: Date | null;
  lastDbRecordTime?: string | null;
  lastDbRecordDate?: string | null;
  lastDbRegistro?: number | null;
  nextSyncTimestamp?: number;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const ContextRibbon: React.FC<ContextRibbonProps> = ({
  batteryPct = 100,
  lastSyncTime,
  lastDbRecordTime,
  lastDbRecordDate,
  lastDbRegistro,
  nextSyncTimestamp,
  isSyncing = false,
  onManualSync,
}) => {
  const [clock, setClock] = useState("");
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setClock(`${h}:${m}:${s} BRT`);

      if (nextSyncTimestamp) {
        setCountdown(formatCountdown(nextSyncTimestamp));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [nextSyncTimestamp]);

  // Formats the exact database pulse timestamp (HH:MM:SS)
  const lastPulseFormatted = (() => {
    if (lastDbRecordTime) {
      const trimmed = lastDbRecordTime.trim();
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
        return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
      }
      if (trimmed.includes("T")) {
        const timePart = trimmed.split("T")[1]?.substring(0, 8);
        if (timePart && /^\d{2}:\d{2}:\d{2}$/.test(timePart)) return timePart;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
      return trimmed;
    }
    return "--:--:--";
  })();

  return (
    <section className="w-full p-4 sm:p-5 rounded-xl card-surface border border-theme shadow-md backdrop-blur-md">
      <div className="flex items-center gap-3 sm:gap-4 w-full">
        {/* Radar Icon */}
        <div className="w-11 h-11 rounded-xl subcard-surface flex items-center justify-center text-[#0284c7] dark:text-[#8ed5ff] shadow-inner border border-theme shrink-0">
          <span className={`material-symbols-outlined text-2xl text-[#0284c7] dark:text-[#38bdf8] ${isSyncing ? "animate-spin" : ""}`}>
            {isSyncing ? "sync" : "radar"}
          </span>
        </div>

        {/* Station Metadata & Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[11px] text-theme-muted uppercase tracking-wider">
              EMA #BR-EMA01 • INMET / WMO
            </span>

            {isSyncing ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-500/15 dark:bg-sky-400/20 text-[#0284c7] dark:text-[#38bdf8] font-mono text-[11px] font-medium border border-sky-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] dark:bg-[#38bdf8] mr-1.5 animate-pulse" />
                Atualizando valores...
              </span>
            ) : (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#059669]/15 dark:bg-[#00bd85]/20 text-[#059669] dark:text-[#45dfa4] font-mono text-[11px] font-medium border border-[#059669]/25 dark:border-[#00bd85]/30"
                title="Sincronização configurada a cada 5 min (offset +20s após gravação dos sensores)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#45dfa4] mr-1.5 animate-ping" />
                Ciclo 5m (:20s)
              </span>
            )}

            {countdown && !isSyncing && (
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Próx. sincronização em <strong className="text-slate-700 dark:text-slate-200 font-semibold">{countdown}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl lg:text-2xl text-theme-main font-bold tracking-tight truncate">
              Estação Meteorológica Agudos
            </h1>

            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                title="Buscar novos valores no banco de dados agora (sem recarregar a página)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-[#262a35] dark:hover:bg-[#313645] border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${isSyncing ? "animate-spin" : ""}`}>refresh</span>
                <span>{isSyncing ? "Atualizando..." : "Sincronizar agora"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[12px] text-theme-muted mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#059669] dark:text-[#45dfa4]">update</span>
              <span>Leitura dos sensores</span>
            </span>
            <span className="text-theme-muted/50 hidden sm:inline">•</span>
            <span
              title={
                lastDbRecordTime
                  ? `Horário exato do último registro gravado no banco de dados${lastDbRecordDate ? ` em ${lastDbRecordDate.split("-").reverse().join("/")}` : ""}${lastDbRegistro ? ` (Registro #${lastDbRegistro})` : ""}`
                  : "Aguardando leitura do banco de dados..."
              }
              className="cursor-help"
            >
              Último pulso gravado: <strong className="font-semibold text-[#0284c7] dark:text-[#38bdf8]">{lastPulseFormatted}</strong>
            </span>
            <span className="text-theme-muted/50 hidden sm:inline">•</span>
            <span>Relógio: {clock || "--:--:--"}</span>
            <span className="text-theme-muted/50 hidden sm:inline">•</span>
            <span>Altitude: 760m</span>
            <span className="text-theme-muted/50 hidden sm:inline">•</span>
            <span>Bateria: {batteryPct}%</span>
          </div>
        </div>
      </div>
    </section>
  );
};
