'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Link as LinkIcon, 
  AlertCircle, 
  Trash2, 
  Clipboard,
  Sun,
  Moon,
  Check
} from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import Footer from '@/components/Footer';

// Custom SVG Icons for Brands
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.52-4.06-1.39-.77-.57-1.39-1.33-1.89-2.14v7.07c.05 1.56-.25 3.19-1.07 4.54-1.33 2.19-3.9 3.52-6.52 3.25-2.6-.14-5.07-1.86-5.99-4.38-.97-2.58-.29-5.71 1.72-7.58 1.67-1.57 4.14-2.19 6.34-1.59v4.01c-1.16-.4-2.47-.22-3.48.51-1.01.7-1.52 1.99-1.25 3.21.27 1.14 1.25 2.05 2.4 2.26 1.34.28 2.85-.36 3.42-1.6.26-.53.33-1.13.3-1.72V.02z" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);



interface VideoData {
  platform: string;
  title: string;
  thumbnail?: string;
  author?: string;
  videoUrl?: string;
  audioUrl?: string;
  images?: string[];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<VideoData | null>(null);
  const [resultOriginalUrl, setResultOriginalUrl] = useState('');
  const [canPaste, setCanPaste] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showPasteToast, setShowPasteToast] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState('');

  // Initial setup: PWA, Theme & Clipboard capabilities
  useEffect(() => {
    // 1. Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.error('Service Worker registration failed:', err));
    }

    // 2. Initialize Theme
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // 3. Enable Clipboard Paste capability detection
    if (typeof window !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      setCanPaste(true);
    }
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Clipboard auto-detection on page focus
  useEffect(() => {
    if (!canPaste) return;

    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        const cleaned = text.trim();
        const lower = cleaned.toLowerCase();
        
        const isTikTok = lower.includes('tiktok.com');
        const isTwitter = lower.includes('twitter.com') || lower.includes('x.com');
        
        if ((isTikTok || isTwitter) && cleaned !== url && cleaned !== resultOriginalUrl) {
          setClipboardUrl(cleaned);
          setShowPasteToast(true);
        } else {
          setShowPasteToast(false);
        }
      } catch (err) {
        // Silently catch clipboard permission denied or focus issues
      }
    };

    checkClipboard();
    window.addEventListener('focus', checkClipboard);
    return () => {
      window.removeEventListener('focus', checkClipboard);
    };
  }, [canPaste, url, resultOriginalUrl]);

  const handlePasteToastAccept = () => {
    setUrl(clipboardUrl);
    setShowPasteToast(false);
    setError(null);
  };

  // Auto-detect platform from URL input
  useEffect(() => {
    const lowerUrl = url.toLowerCase().trim();
    if (lowerUrl.includes('tiktok.com')) {
      setDetectedPlatform('tiktok');
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      setDetectedPlatform('twitter');
    } else if (url === '') {
      setDetectedPlatform(null);
    } else {
      setDetectedPlatform('generic');
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setError(null);
      }
    } catch (err) {
      console.error('Clipboard paste failed:', err);
      setError("No pudimos leer el portapapeles. Por favor, mantén presionado el cuadro de texto y selecciona 'Pegar'.");
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    setResultData(null);
  };

  const processUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    setResultData(null);

    // Barra de progreso UX (falsa pero da tranquilidad al usuario)
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
      fakeProgress += fakeProgress < 50 ? 5 : fakeProgress < 85 ? 2 : 0.5;
      if (fakeProgress > 95) fakeProgress = 95;
      
      const progressBar = document.getElementById('ux-progress-bar');
      const progressText = document.getElementById('ux-progress-text');
      if (progressBar) progressBar.style.width = `${fakeProgress}%`;
      if (progressText) progressText.innerText = `Analizando enlace... ${Math.round(fakeProgress)}%`;
    }, 500);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultData(data);
        setResultOriginalUrl(targetUrl);
      } else {
        setError(data.error || 'Ocurrió un error inesperado al procesar el enlace.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Error de conexión con el servidor. Reintenta en unos segundos.');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processUrl(url);
  };

  // Auto-trigger extraction if 'url' query parameter is present on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('url');
      if (urlParam) {
        const decodedUrl = decodeURIComponent(urlParam);
        setUrl(decodedUrl);
        processUrl(decodedUrl);
        // Clear query param to prevent loop on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Get matching styles for active platform icon in the input bar
  const getInputIcon = () => {
    const iconClass = "w-6 h-6 transition-all duration-300";
    switch (detectedPlatform) {
      case 'tiktok':
        return <TikTokIcon className={`${iconClass} text-slate-800`} />;
      case 'twitter':
        return <XIcon className={`${iconClass} text-slate-800`} />;
      default:
        return <LinkIcon className={`${iconClass} text-slate-400`} />;
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 max-w-4xl mx-auto w-full relative">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all duration-200 active:scale-90"
          title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
        </button>
      </div>

      {/* Title Header */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-800 dark:text-slate-100">
          Descargador de Videos <span className="text-blue-600 dark:text-blue-400">HD</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
          Descarga videos e historias de <strong className="text-slate-800 dark:text-slate-100">TikTok</strong> y <strong className="text-slate-800 dark:text-slate-100">X (Twitter)</strong> al instante y sin marca de agua.
        </p>
      </div>

      {/* Main Card/Input Panel */}
      <div className="w-full mb-10">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm rounded-lg p-2 flex items-center border border-slate-200 dark:border-slate-700 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
            
            {/* Network Icon Left */}
            <div className="pl-3 pr-2 select-none">
              {getInputIcon()}
            </div>

            {/* Input URL field */}
            <input 
              type="url" 
              placeholder="Pega el enlace de TikTok o X aquí..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              required
              className="flex-1 bg-transparent py-3 px-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm sm:text-base min-w-0"
            />

            {/* Clear / Paste / Action Buttons Right */}
            <div className="flex items-center gap-1.5 pr-1 shrink-0">
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                  title="Limpiar enlace"
                >
                  <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              )}

              {canPaste && !url && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1 py-2 px-3 rounded-xl text-indigo-600 dark:text-indigo-300 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all font-semibold text-xs sm:text-sm active:scale-95 border border-indigo-500/15"
                >
                  <Clipboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Pegar</span>
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center gap-1.5 py-3 px-5 sm:px-6 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <div className="spinner !w-4 !h-4 !border-t-white" />
                    <span className="hidden sm:inline">Procesando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Dynamic Results Display */}
      {error && (
        <div className="w-full mb-8 flex items-start gap-3 p-4 rounded-md border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {loading && !resultData && (
        <div className="w-full mb-8 bg-white dark:bg-slate-800 rounded-md p-6 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center py-10 gap-5 shadow-sm">
          <div className="w-full max-w-sm flex flex-col items-center gap-3">
            <div className="spinner !w-8 !h-8 !border-t-blue-600 mb-2" />
            <span id="ux-progress-text" className="text-slate-600 dark:text-slate-300 text-sm font-medium">Analizando enlace... 0%</span>
            
            {/* Progress bar track */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-600/50">
              {/* Progress bar fill */}
              <div 
                id="ux-progress-bar"
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: '0%' }}
              />
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1">Descargando en máxima calidad. Esto puede tomar unos segundos...</span>
          </div>
        </div>
      )}

      {resultData && (
        <div className="w-full mb-10">
          <VideoCard data={resultData} originalUrl={resultOriginalUrl} />
        </div>
      )}

      {/* Value Grid / Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-6 md:mt-12 mb-10">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-base mb-1">Descarga Instantánea</h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            Sin esperar segundos de publicidad. Obtén tus enlaces de descarga directos de forma inmediata.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-base mb-1">100% Seguro y Privado</h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            No guardamos registro de tus descargas ni recopilamos datos personales. Libre de virus y malware.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-base mb-1">Optimizado para Móvil</h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            Guarda tus videos directamente en la galería de tu Android o iOS como si fuera una App nativa.
          </p>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="w-full max-w-3xl mx-auto mb-16 text-left">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">Preguntas más frecuentes</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">¿Por qué usar ByteDownloader HD para descargar videos de TikTok o X?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              ByteDownloader HD es la herramienta más estable y rápida para descargar videos sin marca de agua. Nuestro sistema inteligente es capaz de descargar historias de TikTok y videos de X (Twitter) en la más alta calidad posible, de manera totalmente gratuita.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">¿Cómo descargar videos en Android o iOS?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Simplemente copia el enlace del video desde la aplicación de TikTok o X, pégalo en nuestro buscador de arriba y presiona "Descargar". El archivo se guardará directamente en la galería de tu dispositivo móvil.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">¿Por qué no puedo descargar algunos videos?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">Posibles causas de errores al descargar videos:</p>
            <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300 text-sm space-y-1">
              <li>El video ha sido eliminado o la cuenta ha sido suspendida.</li>
              <li>El video está restringido geográficamente.</li>
              <li>Estamos experimentando bloqueos temporales por parte de la plataforma. Si tienes este problema, intenta nuevamente más tarde.</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
              Nota: Si un perfil público de TikTok te da error, nuestro motor intentará usar una ruta alternativa de respaldo para extraer la historia o video.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">¿Tengo que pagar por descargar videos?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              No, ByteDownloader HD es una herramienta 100% gratuita que te ayuda a descargar tus contenidos favoritos de TikTok y X sin ningún costo.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">¿ByteDownloader HD guarda copias de los videos descargados?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Absolutamente no. No almacenamos videos ni guardamos registros de lo que descargas. Todos los archivos multimedia provienen directamente de los servidores originales (CDN) de las respectivas plataformas.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Clipboard Toast */}
      {showPasteToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[90%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4 animate-float flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <Clipboard className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Enlace detectado</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate break-all">{clipboardUrl}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowPasteToast(false)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
            >
              Ignorar
            </button>
            <button
              type="button"
              onClick={handlePasteToastAccept}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Pegar enlace</span>
            </button>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}
