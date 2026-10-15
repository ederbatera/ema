import React from "react";

interface EmaLogoProps {
  className?: string;
  isDark?: boolean;
}

export const EmaLogo: React.FC<EmaLogoProps> = ({
  className = "h-8 w-auto",
  isDark = true,
}) => {
  return (
    <svg
      viewBox="0 0 132 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform duration-200 group-hover:scale-[1.03] drop-shadow-sm select-none`}
      aria-label="Logotipo EMA - Estação Meteorológica Agudos"
    >
      <defs>
        {/* Yellow circle: Sol & Radiação Solar */}
        <linearGradient id="emaYellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#FFDE00" : "#FACC15"} />
          <stop offset="100%" stopColor={isDark ? "#F59E0B" : "#D97706"} />
        </linearGradient>

        {/* Cyan/Blue circle: Atmosfera, Umidade & Céu */}
        <linearGradient id="emaCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#38BDF8" : "#0EA5E9"} />
          <stop offset="100%" stopColor={isDark ? "#0284C7" : "#0369A1"} />
        </linearGradient>

        {/* Gray/Slate circle: Barometria, Sensores & Hardware */}
        <linearGradient id="emaGrayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#94A3B8" : "#64748B"} />
          <stop offset="100%" stopColor={isDark ? "#64748B" : "#475569"} />
        </linearGradient>

        {/* Subtle 3D circle highlight overlay */}
        <linearGradient id="emaGloss" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Circle 1: 'e' (Amarelo Solar) */}
      <g>
        <circle cx="22" cy="22" r="18" fill="url(#emaYellowGrad)" />
        <circle cx="22" cy="22" r="18" fill="url(#emaGloss)" />
        <path
          fill="#ffffff"
          fillRule="evenodd"
          d="
            M 22 13.5
            C 27 13.5 30.5 17 30.5 22.2
            L 30.5 23.2
            L 17.5 23.2
            C 17.8 25.8 19.8 27.5 22.3 27.5
            C 24.5 27.5 26.2 26.6 27.2 25.2
            L 30.3 27
            C 28.5 29.5 25.6 31 22.2 31
            C 17 31 13.5 27.2 13.5 22.25
            C 13.5 17.3 17 13.5 22 13.5 Z
            M 26.5 19.8
            C 26.2 17.8 24.5 16.6 22 16.6
            C 19.5 16.6 17.8 17.8 17.5 19.8
            L 26.5 19.8 Z
          "
        />
      </g>

      {/* Circle 2: 'm' (Azul / Ciano Atmosférico) */}
      <g>
        <circle cx="66" cy="22" r="18" fill="url(#emaCyanGrad)" />
        <circle cx="66" cy="22" r="18" fill="url(#emaGloss)" />
        <path
          fill="#ffffff"
          fillRule="evenodd"
          d="
            M 56.5 31
            L 56.5 18
            C 56.5 15.2 58.6 13.5 61.2 13.5
            C 63.4 13.5 65.2 14.8 66 16.6
            C 66.8 14.8 68.6 13.5 70.8 13.5
            C 73.4 13.5 75.5 15.2 75.5 18
            L 75.5 31
            L 71.5 31
            L 71.5 19
            C 71.5 17.5 70.6 16.6 69.4 16.6
            C 68.1 16.6 67.2 17.5 67.2 19
            L 67.2 31
            L 63.2 31
            L 63.2 19
            C 63.2 17.5 62.3 16.6 61.1 16.6
            C 59.8 16.6 58.9 17.5 58.9 19
            L 58.9 31
            Z
          "
        />
      </g>

      {/* Circle 3: 'a' (Cinza Sensor / Hardware Metálico) */}
      <g>
        <circle cx="110" cy="22" r="18" fill="url(#emaGrayGrad)" />
        <circle cx="110" cy="22" r="18" fill="url(#emaGloss)" />
        <path
          fill="#ffffff"
          fillRule="evenodd"
          d="
            M 110 13.5
            C 114.5 13.5 117.8 17 117.8 21.8
            L 117.8 31
            L 114 31
            L 114 28.5
            C 113 30.1 111.2 31 109 31
            C 105 31 102 27.7 102 22.3
            C 102 16.9 105 13.5 109.5 13.5
            L 110 13.5 Z
            M 109.8 16.8
            C 106.9 16.8 105.5 19 105.5 22.3
            C 105.5 25.5 106.9 27.7 109.8 27.7
            C 112.5 27.7 114 25.5 114 22.3
            C 114 19.1 112.5 16.8 109.8 16.8 Z
          "
        />
      </g>
    </svg>
  );
};
