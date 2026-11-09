'use client';

import React from 'react';

interface ByteLogLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export default function ByteLogLogo({
  className = '',
  size = 'lg',
  animated = true
}: ByteLogLogoProps) {
  const sizeClasses = {
    sm: 'max-w-[240px] w-full',
    md: 'max-w-[340px] w-full',
    lg: 'max-w-[440px] sm:max-w-[500px] w-full',
    xl: 'max-w-[520px] sm:max-w-[600px] w-full'
  }[size];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${sizeClasses} ${className}`}>
      {/* Glow ambiental de fondo pulsante */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-sky-500/25 via-blue-600/30 to-cyan-400/25 rounded-full blur-3xl opacity-75 animate-pulse pointer-events-none" />

      {/* SVG Vectorial 100% Editable con Elementos Separados e IDs Únicos */}
      <svg
        id="downloader-bytelog-svg"
        viewBox="0 0 560 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-auto drop-shadow-[0_16px_32px_rgba(0,140,255,0.35)] ${animated ? 'logo-svg-active' : ''}`}
        aria-label="Downloader ByteLog"
      >
        <defs>
          {/* Gradientes Originales: Azules, Blancos, Azul Oscuro y Cian */}
          <linearGradient id="bl-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="bl-arrow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>

          <linearGradient id="bl-tray-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="bl-text-cyan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>

          <linearGradient id="bl-text-white-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Filtro de resplandor neón */}
          <filter id="bl-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ============================================================== */}
        {/* GRUPO 1: ICONO DE DESCARGA SEPARADO (ID: logo-icon) */}
        {/* ============================================================== */}
        <g id="logo-icon" className="bytelog-icon-group">
          {/* Escudo / Hexágono exterior azul oscuro y brillante */}
          <rect
            id="icon-shield-border"
            x="12"
            y="16"
            width="104"
            height="104"
            rx="28"
            fill="#08142c"
            stroke="url(#bl-tray-grad)"
            strokeWidth="3.5"
            className="icon-shield-path"
          />

          {/* Círculo interior de energía */}
          <circle
            id="icon-inner-glow"
            cx="64"
            cy="68"
            r="38"
            fill="url(#bl-icon-grad)"
            opacity="0.25"
          />

          {/* Flecha de descarga vectorial */}
          <g id="icon-download-arrow" className="icon-arrow-motion">
            {/* Tallo de la flecha */}
            <path
              id="icon-arrow-stem"
              d="M64 36V70"
              stroke="url(#bl-arrow-grad)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Cabeza triangular de la flecha */}
            <path
              id="icon-arrow-head"
              d="M48 64L64 80L80 64"
              stroke="url(#bl-arrow-grad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Bandeja digital de soporte de descarga */}
          <path
            id="icon-tray-base"
            d="M40 88H88"
            stroke="url(#bl-tray-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#bl-glow)"
          />

          {/* Pequeños puntos de circuito cyberpunk */}
          <circle id="icon-dot-left" cx="30" cy="68" r="2.5" fill="#38bdf8" />
          <circle id="icon-dot-right" cx="98" cy="68" r="2.5" fill="#00e5ff" />
        </g>

        {/* ============================================================== */}
        {/* GRUPO 2: TEXTO TIPOGRÁFICO VECTORIAL (ID: logo-text) */}
        {/* ============================================================== */}
        <g id="logo-text" className="bytelog-text-group">
          
          {/* Palabra 1: "Downloader" (Letras blancas vectoriales independientes) */}
          <g id="word-downloader" className="bytelog-word-downloader">
            {/* Letra D */}
            <g id="letter-D" className="bytelog-letter" style={{ animationDelay: '0.04s' }}>
              <text x="136" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" letterSpacing="0.5">D</text>
            </g>
            {/* Letra o */}
            <g id="letter-o-1" className="bytelog-letter" style={{ animationDelay: '0.08s' }}>
              <text x="166" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">o</text>
            </g>
            {/* Letra w */}
            <g id="letter-w" className="bytelog-letter" style={{ animationDelay: '0.12s' }}>
              <text x="190" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">w</text>
            </g>
            {/* Letra n */}
            <g id="letter-n" className="bytelog-letter" style={{ animationDelay: '0.16s' }}>
              <text x="224" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">n</text>
            </g>
            {/* Letra l */}
            <g id="letter-l" className="bytelog-letter" style={{ animationDelay: '0.20s' }}>
              <text x="248" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">l</text>
            </g>
            {/* Letra o */}
            <g id="letter-o-2" className="bytelog-letter" style={{ animationDelay: '0.24s' }}>
              <text x="260" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">o</text>
            </g>
            {/* Letra a */}
            <g id="letter-a" className="bytelog-letter" style={{ animationDelay: '0.28s' }}>
              <text x="284" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">a</text>
            </g>
            {/* Letra d */}
            <g id="letter-d" className="bytelog-letter" style={{ animationDelay: '0.32s' }}>
              <text x="306" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">d</text>
            </g>
            {/* Letra e */}
            <g id="letter-e" className="bytelog-letter" style={{ animationDelay: '0.36s' }}>
              <text x="330" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">e</text>
            </g>
            {/* Letra r */}
            <g id="letter-r" className="bytelog-letter" style={{ animationDelay: '0.40s' }}>
              <text x="352" y="74" fill="url(#bl-text-white-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38">r</text>
            </g>
          </g>

          {/* Palabra 2: "ByteLog" (Letras cian eléctrico vectoriales independientes) */}
          <g id="word-bytelog" className="bytelog-word-bytelog">
            {/* Espacio separador estilizado */}
            {/* Letra B */}
            <g id="letter-B" className="bytelog-letter letter-cyan" style={{ animationDelay: '0.46s' }}>
              <text x="380" y="74" fill="url(#bl-text-cyan-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" filter="url(#bl-glow)">B</text>
            </g>
            {/* Letra y */}
            <g id="letter-y" className="bytelog-letter letter-cyan" style={{ animationDelay: '0.50s' }}>
              <text x="408" y="74" fill="url(#bl-text-cyan-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" filter="url(#bl-glow)">y</text>
            </g>
            {/* Letra t */}
            <g id="letter-t" className="bytelog-letter letter-cyan" style={{ animationDelay: '0.54s' }}>
              <text x="428" y="74" fill="url(#bl-text-cyan-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" filter="url(#bl-glow)">t</text>
            </g>
            {/* Letra e */}
            <g id="letter-e-2" className="bytelog-letter letter-cyan" style={{ animationDelay: '0.58s' }}>
              <text x="444" y="74" fill="url(#bl-text-cyan-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" filter="url(#bl-glow)">e</text>
            </g>
            {/* Letra L */}
            <g id="letter-L" className="bytelog-letter letter-cyan" style={{ animationDelay: '0.62s' }}>
              <text x="468" y="74" fill="url(#bl-text-cyan-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" filter="url(#bl-glow)">L</text>
            </g>
            {/* Letra o */}
            <g id="letter-o-3" className="bytelog-letter letter-cyan" style={{ animationDelay: '0.66s' }}>
              <text x="490" y="74" fill="url(#bl-text-cyan-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" filter="url(#bl-glow)">o</text>
            </g>
            {/* Letra g */}
            <g id="letter-g" className="bytelog-letter letter-cyan" style={{ animationDelay: '0.70s' }}>
              <text x="514" y="74" fill="url(#bl-text-cyan-grad)" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="38" filter="url(#bl-glow)">g</text>
            </g>
          </g>

          {/* Subtítulo / Tagline debajo del nombre principal */}
          <g id="logo-tagline" className="bytelog-tagline-group">
            <rect x="136" y="94" width="7" height="7" rx="2" fill="#38bdf8" />
            <text
              x="152"
              y="101"
              fill="#94a3b8"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
              fontWeight="700"
              fontSize="12"
              letterSpacing="2.5"
            >
              FULL HD 1080P • SIN MARCA DE AGUA
            </text>
          </g>
        </g>
      </svg>

      {/* Estilos CSS Avanzados: Rebotes, Rotaciones Suaves y Onda Letra por Letra */}
      <style jsx>{`
        /* Animación continua del Icono */
        .icon-shield-path {
          transition: transform 0.3s ease, stroke 0.3s ease;
        }

        .icon-arrow-motion {
          animation: arrowBounce 2.5s ease-in-out infinite;
          transform-origin: 64px 64px;
        }

        @keyframes arrowBounce {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(4px);
          }
        }

        /* Animación letra por letra */
        .logo-svg-active .bytelog-letter {
          display: inline-block;
          transform-origin: center bottom;
          animation: letterWaveSmooth 4s ease-in-out infinite;
        }

        @keyframes letterWaveSmooth {
          0%, 65%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          15% {
            transform: translateY(-7px) rotate(-2deg);
          }
          28% {
            transform: translateY(1.5px) rotate(1deg);
          }
          40% {
            transform: translateY(-2px) rotate(0deg);
          }
        }

        /* Efecto hover interactivo sobre letras */
        .bytelog-letter:hover {
          transform: translateY(-9px) scale(1.1) !important;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
        }

        /* Brillo especial en hover sobre el icono */
        #logo-icon:hover #icon-shield-border {
          stroke: #00f0ff;
          filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.7));
          cursor: pointer;
        }

        #logo-icon:hover .icon-arrow-motion {
          transform: translateY(6px) scale(1.05);
        }
      `}</style>
    </div>
  );
}
