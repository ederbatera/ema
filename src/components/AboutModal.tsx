import React, { useEffect } from "react";
import { X, Github, User, Check, Mail, Info, ShieldAlert } from "lucide-react";
import { EmaLogo } from "./EmaLogo";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-[#262f3f] shadow-[0_25px_70px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden text-slate-800 dark:text-[#dfe2f1] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-[#1e2638] bg-slate-50/80 dark:bg-[#131929]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3.5">
            <EmaLogo isDark={isDark} className="h-9 w-auto shrink-0" />
            <div>
              <h2
                id="about-modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight"
              >
                Sobre o projeto
              </h2>
              <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-[#87929a] mt-0.5">
                Estação Meteorológica de Agudos/SP - EMA.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-[#1c2436] dark:hover:bg-[#28344d] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-[#87929a] dark:hover:text-white transition-all cursor-pointer border border-transparent dark:border-[#2f3b54]"
            title="Fechar (Esc)"
            aria-label="Fechar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13.5px] leading-relaxed">
          {/* Project Description */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-100/70 dark:bg-[#141b2c] border border-slate-200/80 dark:border-[#222c42] text-slate-700 dark:text-[#c4cbd9] leading-relaxed">
            <p>
              A <strong className="text-slate-950 dark:text-white font-semibold">EMA - Estação Metereologica de Agudos</strong> é
              um projeto em desenvolvimento, de iniciativa privada de pessoas com interesse pela Metereologia e Climatologia.
              Somos autodidatas em eletrônica, programação de microcontroladores, interfaceamento de hardware com a Internet,
              Linux, linguagem C, MYSQL, JAVASCRIPT e NODE.JS. Não temos nenhuma vinculação com quaisquer empresas, entidades ou
              órgãos públicos, todos os custos da implantação e manutenção são com recursos próprios.
            </p>
          </div>

          {/* Maintainers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sky-600 dark:text-[#38bdf8] text-xl">group</span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Mantenedores
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Maintainer 1: José Antonio Martins */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-[#20293d] shadow-sm hover:border-sky-500/40 transition-colors">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-[#38bdf8] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                    José Antonio Martins
                  </h4>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-[13px] text-slate-600 dark:text-[#9eabbf]">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#45dfa4] shrink-0 mt-0.5" />
                    <span>Hardware, instrumentação, eletrotécnica.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#45dfa4] shrink-0 mt-0.5" />
                    <span>Idealização, projeto e pesquisa.</span>
                  </li>
                </ul>
              </div>

              {/* Maintainer 2: Eder Machado */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-[#20293d] shadow-sm hover:border-sky-500/40 transition-colors">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-600 dark:text-[#38bdf8] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                    Eder Machado
                  </h4>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-[13px] text-slate-600 dark:text-[#9eabbf]">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#45dfa4] shrink-0 mt-0.5" />
                    <span>Integração, servidores, página web.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#45dfa4] shrink-0 mt-0.5" />
                    <span>Idealização, projeto e pesquisa.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Disclaimer / Isenção de Responsabilidades */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Isenção de Responsabilidades
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-[#20293d] text-xs sm:text-[13px] text-slate-600 dark:text-[#9ba7b9] space-y-3 leading-relaxed">
              <p>
                Não garantimos as informações disponíveis, elas são apenas para observação educacional e pesquisa.
                Os dados não devem ser utilizadas como referência para quaisquer outros fins, tais como apoio a navegação
                aérea, agricultura, Defesa Civil etc. Em nenhum caso a EMA pode ser responsabilizada por danos especiais,
                indiretos ou decorrentes, ou nenhum dano vinculado ao que provenha do uso destes produtos.
              </p>
              <p>
                Os produtos apresentados nesta página não podem ser usados para propósitos comerciais, copiados integral
                ou parcialmente para a reprodução em meios de divulgação, sem a expressa autorização. Os usuários deverão
                sempre mencionar a fonte das informações e dados como &ldquo;EMA - Estação Meteorológica Agudos&rdquo;.
              </p>
              <p>
                À exemplo de outras estações de medição, a EMA exibe informações do local onde está instalada, não sendo
                possível estimar a abrangência geográfica das condições do tempo nela exibida.
              </p>

              {/* Contact */}
              <div className="pt-2 border-t border-slate-200 dark:border-[#1e2638] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-slate-700 dark:text-[#c4cbd9] font-medium">
                  Sugestões e críticas? Entre em contato:
                </span>
                <a
                  href="mailto:ema@agudos.net"
                  className="inline-flex items-center gap-1.5 font-mono text-sky-600 hover:text-sky-700 dark:text-[#38bdf8] dark:hover:text-[#8ed5ff] font-semibold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>ema@agudos.net</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with GitHub Link */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-[#1e2638] bg-slate-50/80 dark:bg-[#131929]/80 flex items-center justify-between gap-4">
          <a
            href="https://github.com/ederbatera/ema"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-medium text-sky-600 hover:text-sky-700 dark:text-[#38bdf8] dark:hover:text-[#8ed5ff] hover:underline transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>Repositório do Projeto no GitHub</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-[#1c2436] dark:hover:bg-[#28344d] text-slate-800 dark:text-[#dfe2f1] text-xs font-semibold transition-colors cursor-pointer"
            type="button"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
