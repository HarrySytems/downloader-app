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
  Search,
  ArrowLeft,
  Sparkles,
  Layers,
  Film
} from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import ProfileCard, { ProfileData } from '@/components/ProfileCard';
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
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [resultOriginalUrl, setResultOriginalUrl] = useState('');
  const [canPaste, setCanPaste] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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

    // 2. Initialize Theme (default to dark for the sleek design)
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const initialTheme = savedTheme ? (savedTheme as 'light' | 'dark') : 'dark';
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
        // Silently catch clipboard permission denied
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
      setError("No pudimos leer el portapapeles. Mantén presionado el cuadro de texto y selecciona 'Pegar'.");
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    setResultData(null);
    setProfileData(null);
  };

  const isProfileQuery = (input: string) => {
    const clean = input.trim();
    const lower = clean.toLowerCase();
    
    if (lower.includes('/video/') || lower.includes('/photo/') || lower.includes('/status/')) {
      return false;
    }
    if (lower.startsWith('@')) return true;
    if (lower.includes('tiktok.com/@') && !lower.includes('/video/') && !lower.includes('/photo/')) return true;
    
    if (!lower.startsWith('http://') && !lower.startsWith('https://') && /^[a-zA-Z0-9_.-]+$/.test(clean) && !lower.includes('.com') && !lower.includes('.lat') && !lower.includes('/')) {
      return true;
    }

    return false;
  };

  const processUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    
    // CORRECCIÓN CRUCIAL: Limpiar datos anteriores de inmediato para que ningún perfil quede atascado
    setProfileData(null);
    setResultData(null);

    const isProfile = isProfileQuery(targetUrl);

    // Barra de progreso UX
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
      fakeProgress += fakeProgress < 50 ? 6 : fakeProgress < 85 ? 2.5 : 0.5;
      if (fakeProgress > 95) fakeProgress = 95;
      
      const progressBar = document.getElementById('ux-progress-bar');
      const progressText = document.getElementById('ux-progress-text');
      if (progressBar) progressBar.style.width = `${fakeProgress}%`;
      if (progressText) {
        progressText.innerText = isProfile 
          ? `Cargando perfil y publicaciones... ${Math.round(fakeProgress)}%` 
          : `Analizando enlace... ${Math.round(fakeProgress)}%`;
      }
    }, 350);

    try {
      if (isProfile) {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: targetUrl }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setProfileData(data);
          setResultData(null);
          setError(null);
        } else {
          setProfileData(null);
          setError(data.error || 'No se pudo cargar el perfil de TikTok. Revisa el nombre de usuario.');
        }
      } else {
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
          setError(null);
        } else {
          setResultData(null);
          setError(data.error || 'Ocurrió un error inesperado al procesar el enlace.');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setProfileData(null);
      setResultData(null);
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
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#070e20] dark:bg-[#070e20] text-white">
      
      {/* BARRA SUPERIOR DE ENLACE - CLON EXACTO DE LA CABECERA EN EL DISEÑO */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#070e20]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo y Marca a la izquierda */}
          <div 
            onClick={() => {
              setProfileData(null);
              setResultData(null);
              setError(null);
              setUrl('');
            }}
            className="flex items-center gap-3 cursor-pointer shrink-0 self-start md:self-auto"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Descargador de Videos</span>
                <span className="text-sky-400">HD</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Descarga videos y perfiles de TikTok
              </p>
            </div>
          </div>

          {/* BARRA DE ENLACE EN EL MEDIO */}
          <div className="w-full md:max-w-2xl flex-1">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="bg-[#0b1428] rounded-xl px-2 py-1.5 flex items-center border border-slate-700/80 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all shadow-inner">
                
                {/* Ícono de cadena enlace */}
                <div className="pl-2.5 pr-2 select-none text-sky-400">
                  <LinkIcon className="w-4 h-4" />
                </div>

                {/* Input de texto */}
                <input 
                  type="text" 
                  placeholder="Pega el enlace de TikTok o nombre de usuario..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  required
                  className="flex-1 bg-transparent py-1.5 px-2 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none min-w-0"
                />

                {/* Botones Limpiar / Pegar */}
                <div className="flex items-center gap-1 shrink-0 pr-1">
                  {url && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Limpiar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {canPaste && !url && (
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Pegar</span>
                    </button>
                  )}

                  {/* Botón Buscar estilo de la imagen */}
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-lg font-bold text-xs text-white bg-sky-500 hover:bg-sky-400 shadow-md shadow-sky-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="hidden sm:inline">Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Buscar</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Selector de Tema a la derecha */}
          <div className="hidden md:flex items-center shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title="Cambiar tema"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
            </button>
          </div>

        </div>
      </header>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">

        {/* Notificación de Portapapeles Flotante */}
        {showPasteToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] border border-sky-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold block">Enlace detectado</span>
              <span className="text-slate-400 truncate max-w-[180px] block">{clipboardUrl}</span>
            </div>
            <button
              onClick={handlePasteToastAccept}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
            >
              Pegar
            </button>
          </div>
        )}

        {/* Alerta de Error Clara y Limpia */}
        {error && (
          <div className="w-full mb-6 flex items-start gap-3 p-4 rounded-2xl border border-red-500/40 bg-red-950/30 text-red-200 text-sm shadow-lg backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <p className="leading-relaxed font-medium">{error}</p>
          </div>
        )}

        {/* Barra de Carga Dinámica */}
        {loading && (
          <div className="w-full mb-8 bg-[#0b1328]/90 rounded-3xl p-8 border border-slate-800 flex flex-col items-center justify-center py-14 gap-5 shadow-xl backdrop-blur-md">
            <div className="w-full max-w-md flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-1" />
              <span id="ux-progress-text" className="text-slate-200 text-sm font-bold">
                Analizando enlace... 0%
              </span>
              
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                  id="ux-progress-bar"
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300 ease-out"
                  style={{ width: '0%' }}
                />
              </div>
              <span className="text-[11px] text-slate-400 text-center mt-1">
                Obteniendo multimedia en máxima calidad Full HD 1080p...
              </span>
            </div>
          </div>
        )}

        {/* Si hay perfil cargado -> Tarjeta de Perfil Estilo Mockup */}
        {profileData && !loading && (
          <div className="w-full mb-10">
            <ProfileCard
              data={profileData}
              onSelectVideo={(videoUrl) => {
                processUrl(videoUrl);
              }}
              onBack={() => setProfileData(null)}
            />
          </div>
        )}

        {/* Si hay un video individual seleccionado */}
        {resultData && !loading && (
          <div className="w-full mb-10 space-y-4">
            {profileData && (
              <button
                type="button"
                onClick={() => setResultData(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs border border-slate-700 shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Volver a las publicaciones de @{profileData.username}</span>
              </button>
            )}
            <VideoCard data={resultData} originalUrl={resultOriginalUrl} />
          </div>
        )}

        {/* Estado inicial cuando no hay búsquedas activas */}
        {!profileData && !resultData && !loading && !error && (
          <div className="py-12 sm:py-20 flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6 shadow-xl shadow-sky-500/5">
              <Download className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Descarga Cualquier Video o Perfil Completo
            </h2>

            <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-md leading-relaxed">
              Ingresa el enlace de un video, historia o busca a cualquier creador de TikTok con su <strong className="text-sky-400">@usuario</strong> para ver su perfil y descargar sus videos en HD.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-500 mr-1 font-semibold">Ejemplos para probar:</span>
              <button
                type="button"
                onClick={() => {
                  setUrl('@zullyy_cs');
                  processUrl('@zullyy_cs');
                }}
                className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-sky-500/20 hover:text-sky-400 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                @zullyy_cs
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl('@aydnsarpy');
                  processUrl('@aydnsarpy');
                }}
                className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-sky-500/20 hover:text-sky-400 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                @aydnsarpy
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl('@zachking');
                  processUrl('@zachking');
                }}
                className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-sky-500/20 hover:text-sky-400 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                @zachking
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
