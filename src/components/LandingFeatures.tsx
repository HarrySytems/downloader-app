'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Smartphone, 
  HelpCircle, 
  ChevronDown, 
  Zap, 
  CheckCircle2, 
  Flame
} from 'lucide-react';

export default function LandingFeatures() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: '¿Cómo descargar videos de TikTok sin marca de agua?',
      a: 'Es muy sencillo: abre la app de TikTok, toca en "Compartir" en el video que te guste y selecciona "Copiar enlace". Luego pégalo en la barra superior de ByteDownloader HD y presiona "Buscar". Podrás descargarlo inmediatamente en resolución Full HD 1080p sin logotipos.'
    },
    {
      q: '¿Se pueden descargar las historias activas de 24 horas y destacadas?',
      a: '¡Sí! Somos una de las pocas plataformas con soporte completo de historias y destacados de TikTok. Solo escribe el @nombre_de_usuario del creador (por ejemplo @pepito123) y nuestro sistema detectará automáticamente todas sus historias activas y carpetas destacadas para verlas o descargarlas una a una.'
    },
    {
      q: '¿Qué sucede si una cuenta es privada?',
      a: 'Por políticas de privacidad de TikTok y seguridad del usuario, solo se puede acceder al contenido de cuentas públicas. Si ingresas un usuario privado, el sistema te avisará de inmediato de forma transparente.'
    },
    {
      q: '¿Es gratis y seguro utilizar ByteDownloader HD?',
      a: 'Es 100% gratuito, anónimo y seguro. No almacenamos registros de tus descargas, no necesitas registrarte ni vincular tu cuenta de TikTok.'
    },
    {
      q: '¿Cómo funciona el Bot de Telegram de ByteDownloader?',
      a: 'Puedes usar nuestro bot oficial @ByteDownloaderHD_bot tocando el botón flotante en la esquina inferior. Te permite consultar usuarios, previsualizar historias una por una directamente en el chat y descargarlas a tu galería sin abrir el navegador.'
    }
  ];

  return (
    <div className="w-full mt-12 sm:mt-16 space-y-16">
      
      {/* 1. SECCIÓN DE BENEFICIOS Y CARACTERÍSTICAS */}
      <section className="w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Características Premium Gratuitas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ¿Por qué elegir <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">ByteDownloader HD</span>?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mt-2">
            La herramienta más avanzada para visualizar y guardar contenido de TikTok en calidad original.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#0b1328]/80 border border-slate-800/80 hover:border-sky-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5 group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                Sin Marca de Agua
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Descarga videos limpios en resolución original Full HD (1080p) con audio cristalino y sin molestos logos de TikTok.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-sky-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Calidad 1080p garantizada</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#0b1328]/80 border border-slate-800/80 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                Historias de 24 Horas
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualiza y guarda todas las historias activas de cualquier creador antes de que desaparezcan (tanto videos como fotos).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
              <Flame className="w-3.5 h-3.5" />
              <span>Soporte 100% de historias</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#0b1328]/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                100% Anónimo y Seguro
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nadie sabrá que viste o descargaste su perfil. No requiere registro, contraseñas ni instalaciones sospechosas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sin dejar rastro</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#0b1328]/80 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                Multi-Dispositivo
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Diseño ultraligero que se adapta con perfección a teléfonos móviles (iPhone y Android), tabletas y computadoras.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-purple-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>iOS, Android y PC</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SECCIÓN DE PREGUNTAS FRECUENTES (FAQ) */}
      <section className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Centro de Ayuda</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Resolvemos todas tus dudas sobre el uso de la plataforma y el bot de Telegram.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800/90 bg-[#0b1328]/70 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-slate-200">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-sky-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
