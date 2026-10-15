import React, { useState, useEffect } from "react";
import { safeFetchJson } from "../lib/api";

interface StationFooterProps {
  onOpenBackendModal?: () => void;
  onOpenAboutModal?: () => void;
  onCalibrate?: () => void;
  isCalibrating?: boolean;
  isPainelRoute?: boolean;
  version?: string;
  imageTag?: string;
}

export const StationFooter: React.FC<StationFooterProps> = ({
  onOpenBackendModal,
  onOpenAboutModal,
  onCalibrate,
  isCalibrating = false,
  isPainelRoute = false,
  version: propVersion,
  imageTag: propImageTag,
}) => {
  const defaultVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";
  const [version, setVersion] = useState<string>(propVersion || defaultVersion);
  const [imageTag, setImageTag] = useState<string>(
    propImageTag || `ederbatera/ema:${propVersion || defaultVersion}`
  );

  useEffect(() => {
    safeFetchJson<{
      success: boolean;
      version?: string;
      imageTag?: string;
    }>("/api/station/version")
      .then((res) => {
        if (res.ok && res.data?.version) {
          setVersion(res.data.version);
          if (res.data.imageTag) {
            setImageTag(res.data.imageTag);
          }
        }
      })
      .catch(() => {
        // Fallback to static env
      });
  }, []);

  return (
    <footer className="mt-8 pt-6 pb-10 border-t border-theme flex flex-col gap-6 text-[13px]" id="footer-diagnostics">
      {/* Sensor Health Status Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-2.5 p-3 rounded-xl subcard-surface border border-theme">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] dark:bg-[#45dfa4] shadow-[0_0_8px_rgba(69,223,164,0.6)]" />
          <div>
            <div className="font-mono text-[11px] text-theme-main font-semibold">Barômetro PTB330</div>
            <div className="font-mono text-[10px] text-emerald-600 dark:text-[#45dfa4]">Calibrado & Operacional</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl subcard-surface border border-theme">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] dark:bg-[#45dfa4] shadow-[0_0_8px_rgba(69,223,164,0.6)]" />
          <div>
            <div className="font-mono text-[11px] text-theme-main font-semibold">Pluviômetro RG-15</div>
            <div className="font-mono text-[10px] text-emerald-600 dark:text-[#45dfa4]">Sensor Óptico Ativo</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl subcard-surface border border-theme">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] dark:bg-[#45dfa4] shadow-[0_0_8px_rgba(69,223,164,0.6)]" />
          <div>
            <div className="font-mono text-[11px] text-theme-main font-semibold">Higrômetro HMP155</div>
            <div className="font-mono text-[10px] text-emerald-600 dark:text-[#45dfa4]">Psicrometria Precisa</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl subcard-surface border border-theme">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] dark:bg-[#45dfa4] shadow-[0_0_8px_rgba(69,223,164,0.6)]" />
          <div>
            <div className="font-mono text-[11px] text-theme-main font-semibold">Anemômetro 2D</div>
            <div className="font-mono text-[10px] text-emerald-600 dark:text-[#45dfa4]">Ultrassom Contínuo</div>
          </div>
        </div>
      </div>

      {/* Meta & System Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-theme-muted text-[12px] font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <span>Estação EMA Agudos #BR-SP-AGU-EMA01</span>
          <span>•</span>
          <span>Coord: -22.4670°, -48.9733° (618m)</span>
          <span>•</span>
          <span>Firmware: v4.8.1-PRO</span>
          <span>•</span>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 font-mono text-[11px] shadow-xs"
            title="Versão da Imagem Docker em execução na Stack"
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="font-medium text-slate-600 dark:text-slate-400">Versão:</span>
            <span className="font-bold text-sky-700 dark:text-sky-200">v{version}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">({imageTag})</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {onOpenAboutModal && (
            <button
              onClick={onOpenAboutModal}
              className="hover:text-[#0284c7] dark:hover:text-[#38bdf8] transition-colors flex items-center gap-1 cursor-pointer"
              title="Informações sobre o projeto e mantenedores"
            >
              <span className="material-symbols-outlined text-sm">info</span>
              <span>Sobre o Projeto</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
