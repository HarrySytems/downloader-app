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
    sm: 'max-w-[200px] w-full',
    md: 'max-w-[280px] w-full',
    lg: 'max-w-[340px] sm:max-w-[420px] w-full',
    xl: 'max-w-[420px] sm:max-w-[500px] w-full'
  }[size];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${sizeClasses} ${className}`}>
      {/* Glow ambiental de fondo pulsante */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-sky-500/25 via-blue-600/30 to-cyan-400/25 rounded-full blur-2xl opacity-75 animate-pulse pointer-events-none" />

      {/* Imagen oficial del logo vectorial con animación de flotación y rebote suave */}
      <div className={`w-full relative transition-transform duration-500 hover:scale-105 ${animated ? 'logo-float-anim' : ''}`}>
        <img
          src="/logo.png"
          alt="Downloader ByteLog"
          className="w-full h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,140,255,0.4)]"
          loading="eager"
        />
      </div>

      <style jsx>{`
        .logo-float-anim {
          animation: floatLogoSmooth 4s ease-in-out infinite;
        }

        @keyframes floatLogoSmooth {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(-0.5deg);
          }
        }
      `}</style>
    </div>
  );
}
