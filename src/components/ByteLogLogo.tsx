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
  // Dimensiones según el tamaño
  const sizeClasses = {
    sm: 'w-40 sm:w-48',
    md: 'w-56 sm:w-64',
    lg: 'w-72 sm:w-96',
    xl: 'w-80 sm:w-[480px]'
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none group ${sizeClasses} ${className}`}>
      {/* Glow ambiental de fondo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-sky-500/20 via-blue-600/20 to-cyan-400/20 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 animate-pulse pointer-events-none" />

      <svg
        viewBox="0 0 900 620"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-auto drop-shadow-[0_15px_30px_rgba(0,122,255,0.35)] ${animated ? 'bytelog-logo-animated' : ''}`}
        aria-label="Logo Downloader ByteLog"
      >
        <defs>
          {/* Gradientes Oficiales ByteLog */}
          {/* Carpeta Fondo */}
          <linearGradient id="folderBackGrad" x1="280" y1="50" x2="620" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0070F3" />
            <stop offset="50%" stopColor="#0051C7" />
            <stop offset="100%" stopColor="#00358A" />
          </linearGradient>

          {/* Carpeta Frontal */}
          <linearGradient id="folderFrontGrad" x1="240" y1="120" x2="680" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00B4D8" />
            <stop offset="30%" stopColor="#0096C7" />
            <stop offset="70%" stopColor="#0077B6" />
            <stop offset="100%" stopColor="#023E8A" />
          </linearGradient>

          {/* Flecha de Descarga */}
          <linearGradient id="arrowGrad" x1="450" y1="140" x2="450" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Texto 'Downloader' (Blanco / Plata Metálico con Sombra) */}
          <linearGradient id="textDownloaderGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Texto 'ByteLog' (Cyan Eléctrico a Azul Neón) */}
          <linearGradient id="textByteLogGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#00A3FF" />
            <stop offset="100%" stopColor="#0070F3" />
          </linearGradient>

          {/* Líneas de Velocidad */}
          <linearGradient id="speedLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0070F3" />
          </linearGradient>

          {/* Sombra de relieve */}
          <filter id="logoDepthShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#02142B" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* ======================================================== */}
        {/* GRUPO 1: ICONO DE CARPETA DE DESCARGA (#folder-icon)       */}
        {/* ======================================================== */}
        <g id="folder-icon" className="folder-floating">
          {/* Borde exterior oscuro de la carpeta */}
          <path
            d="M 280 80 L 450 80 L 490 125 L 630 125 C 655 125 675 145 675 170 L 665 410 C 665 435 645 455 620 455 L 260 455 C 235 455 215 435 215 410 L 235 125 C 235 100 255 80 280 80 Z"
            fill="#031936"
            stroke="#0080FF"
            strokeWidth="8"
            strokeLinejoin="round"
          />

          {/* Solapa posterior de la carpeta */}
          <path
            d="M 285 86 L 445 86 L 485 130 L 620 130 C 640 130 658 145 658 165 L 650 260 L 245 260 L 250 120 C 250 100 265 86 285 86 Z"
            fill="url(#folderBackGrad)"
          />

          {/* Cara frontal abierta de la carpeta */}
          <path
            d="M 230 160 L 670 160 C 690 160 705 175 700 195 L 660 415 C 655 435 638 450 618 450 L 262 450 C 242 450 225 435 220 415 L 180 195 C 175 175 190 160 210 160 Z"
            fill="url(#folderFrontGrad)"
            stroke="#00E5FF"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Brillo diagonal en la tapa frontal */}
          <path
            d="M 230 160 L 400 160 L 280 450 L 240 450 Z"
            fill="#FFFFFF"
            opacity="0.12"
          />

          {/* ======================================================== */}
          {/* GRUPO 2: FLECHA Y BANDEJA DE DESCARGA (#arrow-download)  */}
          {/* ======================================================== */}
          <g id="arrow-download" className="arrow-bouncing">
            {/* Silueta exterior / borde de la flecha */}
            <path
              d="M 375 180 L 505 180 C 515 180 520 185 520 195 L 520 270 L 575 270 C 588 270 595 285 585 295 L 450 405 C 442 412 430 412 422 405 L 295 295 C 285 285 292 270 305 270 L 360 270 L 360 195 C 360 185 365 180 375 180 Z"
              fill="#031936"
              stroke="#0080FF"
              strokeWidth="10"
              strokeLinejoin="round"
            />

            {/* Flecha blanca central */}
            <path
              d="M 380 188 L 500 188 C 506 188 510 192 510 198 L 510 276 L 565 276 C 574 276 578 286 572 292 L 447 395 C 443 398 437 398 433 395 L 308 292 C 302 286 306 276 315 276 L 370 276 L 370 198 C 370 192 374 188 380 188 Z"
              fill="url(#arrowGrad)"
            />

            {/* Bandeja de descarga inferior */}
            <path
              d="M 320 375 L 320 420 C 320 430 330 440 340 440 L 540 440 C 550 440 560 430 560 420 L 560 375"
              fill="none"
              stroke="#031936"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 320 375 L 320 420 C 320 430 330 440 340 440 L 540 440 C 550 440 560 430 560 420 L 560 375"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* ======================================================== */}
        {/* GRUPO 3: LÍNEAS DE VELOCIDAD (#speed-lines)              */}
        {/* ======================================================== */}
        <g id="speed-lines" className="speed-lines-anim">
          <rect x="130" y="475" width="130" height="14" rx="7" fill="url(#speedLineGrad)" stroke="#031936" strokeWidth="3" />
          <rect x="145" y="505" width="105" height="14" rx="7" fill="url(#speedLineGrad)" stroke="#031936" strokeWidth="3" />
        </g>

        {/* ======================================================== */}
        {/* GRUPO 4: TEXTO 'Downloader' (Letra por Letra)            */}
        {/* ======================================================== */}
        <g id="text-downloader" className="text-downloader-group" filter="url(#logoDepthShadow)">
          {/* Contorno exterior 3D unificado para el texto Downloader */}
          <text
            x="70"
            y="435"
            fontFamily="'Arial Black', 'Impact', 'Montserrat', sans-serif"
            fontSize="105"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="-2"
            fill="#031936"
            stroke="#031936"
            strokeWidth="30"
            strokeLinejoin="miter"
            strokeMiterlimit="3"
            transform="skewX(-11)"
          >
            Downloader
          </text>

          {/* Borde Neón Azul */}
          <text
            x="70"
            y="435"
            fontFamily="'Arial Black', 'Impact', 'Montserrat', sans-serif"
            fontSize="105"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="-2"
            fill="#031936"
            stroke="#0088FF"
            strokeWidth="12"
            strokeLinejoin="round"
            transform="skewX(-11)"
          >
            Downloader
          </text>

          {/* Letras individuales en capas para animación independiente */}
          <g transform="skewX(-11)" className="letters-downloader">
            <text id="letter-D" className="char-anim char-1" x="70" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">D</text>
            <text id="letter-o1" className="char-anim char-2" x="160" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">o</text>
            <text id="letter-w" className="char-anim char-3" x="232" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">w</text>
            <text id="letter-n" className="char-anim char-4" x="330" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">n</text>
            <text id="letter-l" className="char-anim char-5" x="405" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">l</text>
            <text id="letter-o2" className="char-anim char-6" x="445" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">o</text>
            <text id="letter-a" className="char-anim char-7" x="517" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">a</text>
            <text id="letter-d" className="char-anim char-8" x="585" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">d</text>
            <text id="letter-e" className="char-anim char-9" x="660" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">e</text>
            <text id="letter-r" className="char-anim char-10" x="725" y="435" fill="url(#textDownloaderGrad)" fontFamily="'Arial Black', sans-serif" fontSize="105" fontWeight="900" fontStyle="italic">r</text>
          </g>
        </g>

        {/* ======================================================== */}
        {/* GRUPO 5: TEXTO 'ByteLog' (Letra por Letra en Cyan/Azul) */}
        {/* ======================================================== */}
        <g id="text-bytelog" className="text-bytelog-group" filter="url(#logoDepthShadow)">
          {/* Contorno exterior 3D oscuro */}
          <text
            x="245"
            y="545"
            fontFamily="'Arial Black', 'Impact', 'Montserrat', sans-serif"
            fontSize="115"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="-2"
            fill="#031936"
            stroke="#031936"
            strokeWidth="32"
            strokeLinejoin="miter"
            strokeMiterlimit="3"
            transform="skewX(-11)"
          >
            ByteLog
          </text>

          {/* Borde Neón Cyan */}
          <text
            x="245"
            y="545"
            fontFamily="'Arial Black', 'Impact', 'Montserrat', sans-serif"
            fontSize="115"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="-2"
            fill="#031936"
            stroke="#00E5FF"
            strokeWidth="12"
            strokeLinejoin="round"
            transform="skewX(-11)"
          >
            ByteLog
          </text>

          {/* Letras individuales en capas */}
          <g transform="skewX(-11)" className="letters-bytelog">
            <text id="letter-B" className="char-anim char-11" x="245" y="545" fill="url(#textByteLogGrad)" fontFamily="'Arial Black', sans-serif" fontSize="115" fontWeight="900" fontStyle="italic">B</text>
            <text id="letter-y" className="char-anim char-12" x="340" y="545" fill="url(#textByteLogGrad)" fontFamily="'Arial Black', sans-serif" fontSize="115" fontWeight="900" fontStyle="italic">y</text>
            <text id="letter-t" className="char-anim char-13" x="415" y="545" fill="url(#textByteLogGrad)" fontFamily="'Arial Black', sans-serif" fontSize="115" fontWeight="900" fontStyle="italic">t</text>
            <text id="letter-e2" className="char-anim char-14" x="475" y="545" fill="url(#textByteLogGrad)" fontFamily="'Arial Black', sans-serif" fontSize="115" fontWeight="900" fontStyle="italic">e</text>
            <text id="letter-L" className="char-anim char-15" x="555" y="545" fill="#FFFFFF" fontFamily="'Arial Black', sans-serif" fontSize="115" fontWeight="900" fontStyle="italic">L</text>
            <text id="letter-o3" className="char-anim char-16" x="625" y="545" fill="#FFFFFF" fontFamily="'Arial Black', sans-serif" fontSize="115" fontWeight="900" fontStyle="italic">o</text>
            <text id="letter-g" className="char-anim char-17" x="705" y="545" fill="#FFFFFF" fontFamily="'Arial Black', sans-serif" fontSize="115" fontWeight="900" fontStyle="italic">g</text>
          </g>
        </g>
      </svg>

      {/* Estilos e Inyección de Animaciones CSS */}
      <style jsx>{`
        .bytelog-logo-animated .folder-floating {
          animation: floatLogoFolder 4s ease-in-out infinite;
          transform-origin: center;
        }

        .bytelog-logo-animated .arrow-bouncing {
          animation: bounceLogoArrow 2.5s ease-in-out infinite;
          transform-origin: 450px 290px;
        }

        .bytelog-logo-animated .speed-lines-anim {
          animation: pulseSpeedLines 2s ease-in-out infinite alternate;
        }

        .bytelog-logo-animated .char-anim {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), fill 0.25s ease;
          display: inline-block;
          cursor: pointer;
        }

        .bytelog-logo-animated:hover .char-anim:hover {
          transform: translateY(-8px) scale(1.08);
          fill: #38BDF8 !important;
        }

        @keyframes floatLogoFolder {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(-0.5deg);
          }
        }

        @keyframes bounceLogoArrow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(12px);
          }
        }

        @keyframes pulseSpeedLines {
          0% {
            opacity: 0.6;
            transform: translateX(0px);
          }
          100% {
            opacity: 1;
            transform: translateX(8px);
          }
        }
      `}</style>
    </div>
  );
}
