'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Play, 
  Heart, 
  Download, 
  ExternalLink, 
  ArrowLeft,
  Film,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  History,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Music,
  FolderHeart
} from 'lucide-react';

export interface ProfileStoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration?: string;
  views?: string;
  likes?: string;
  created_at?: number;
  is_story?: boolean;
  is_image?: boolean;
  images?: string[];
  download_url?: string;
  music_url?: string;
}

export interface ProfileHighlightItem {
  id: string;
  title: string;
  cover: string;
  count: number;
  items: ProfileStoryItem[];
}

export interface ProfileVideoItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
  raw_views?: number;
  raw_likes?: number;
  timestamp?: number;
  is_story?: boolean;
  play_url?: string;
  music_url?: string;
}

export interface ProfileData {
  success: boolean;
  is_private: boolean;
  username: string;
  nickname: string;
  avatar?: string;
  signature?: string;
  verified?: boolean;
  followers?: string;
  following?: string;
  total_likes?: string;
  total_videos?: number | string;
  video_count?: number;
  has_active_story?: boolean;
  stories?: ProfileStoryItem[];
  highlights?: ProfileHighlightItem[];
  message?: string;
  videos: ProfileVideoItem[];
  has_more?: boolean;
  next_start?: number;
}

interface ProfileCardProps {
  data: ProfileData;
  onSelectVideo: (item: ProfileVideoItem | ProfileStoryItem | string) => void;
  onBack: () => void;
}

export default function ProfileCard({ data, onSelectVideo, onBack }: ProfileCardProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'stories'>('videos');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  
  // Estado para Colección Destacada activa
  const [selectedHighlight, setSelectedHighlight] = useState<ProfileHighlightItem | null>(null);

  // Estado para modal de opciones de formato (MP4 Full HD, Sin Sonido, MP3)
  const [formatModalItem, setFormatModalItem] = useState<{
    id: string;
    title: string;
    url: string;
    downloadUrl: string;
    musicUrl?: string;
    isStory?: boolean;
    isImage?: boolean;
  } | null>(null);

  // Estado de videos dinámicos con paginación progresiva del servidor
  const [videos, setVideos] = useState<ProfileVideoItem[]>(data.videos || []);
  const [nextStart, setNextStart] = useState<number>(data.next_start || ((data.videos?.length || 0) + 1));
  const [hasMore, setHasMore] = useState<boolean>(data.has_more ?? ((data.videos?.length || 0) >= 35));
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filtro de ordenamiento: Recientes | Popular (Más Vistos) | Más Antiguos
  const [sortFilter, setSortFilter] = useState<'recent' | 'popular' | 'oldest'>('recent');

  // Paginación de historias si hay muchas
  const [visibleStoryCount, setVisibleStoryCount] = useState<number>(35);

  useEffect(() => {
    setVideos(data.videos || []);
    setNextStart(data.next_start || ((data.videos?.length || 0) + 1));
    setHasMore(data.has_more ?? ((data.videos?.length || 0) >= 35));
    setSortFilter('recent');
    setLoadError(null);
    setSelectedHighlight(null);
  }, [data]);

  // Descarga individual inteligente con resolución automática de streams Full HD
  const triggerDownload = async (urlOrStream: string, filename: string, label: string, isAudio?: boolean) => {
    try {
      setToastMessage({ text: `⬇️ Preparando ${label}...`, type: 'info' });

      let targetUrl = urlOrStream;
      const lowerName = filename.toLowerCase();
      const isPhotoDownload = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp');
      const isAudioDownload = Boolean(isAudio) || lowerName.endsWith('.mp3');

      // Si es un enlace de página de TikTok, extraer el stream real vía /api/download
      const isTikTokPage = targetUrl.includes('tiktok.com/@') || 
                           targetUrl.includes('/video/') || 
                           targetUrl.includes('/photo/') || 
                           targetUrl.includes('/story/') || 
                           targetUrl.includes('/stories/') ||
                           targetUrl.includes('vm.tiktok.com') ||
                           targetUrl.includes('vt.tiktok.com');
      
      if (isTikTokPage) {
        try {
          const res = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl })
          });
          if (res.ok) {
            const resultData = await res.json();
            if (resultData.success) {
              if (isAudioDownload && resultData.audioUrl) {
                targetUrl = resultData.audioUrl;
              } else if (isPhotoDownload) {
                // PRIORIDAD ABSOLUTA A FOTOS: Nunca asignar video ni audio a una descarga de imagen
                if (resultData.photoUrl) {
                  targetUrl = resultData.photoUrl;
                } else if (resultData.images && resultData.images.length > 0) {
                  targetUrl = resultData.images[0];
                } else if (resultData.thumbnail) {
                  targetUrl = resultData.thumbnail;
                }
              } else if (resultData.videoUrl) {
                targetUrl = resultData.videoUrl;
              }
            }
          }
        } catch (e) {
          console.error('Extraction error:', e);
        }
      }

      const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setToastMessage({ text: `✅ ¡${label} descargado con éxito!`, type: 'success' });
      }, 1500);

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch {
      setToastMessage({ text: 'Error al iniciar la descarga.', type: 'error' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Referencias para carruseles horizontales con flechas
  const storyRowRef = useRef<HTMLDivElement>(null);
  const highlightRowRef = useRef<HTMLDivElement>(null);

  const scrollStoryRow = (direction: 'left' | 'right') => {
    if (storyRowRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      storyRowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const scrollHighlightRow = (direction: 'left' | 'right') => {
    if (highlightRowRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      highlightRowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleVideoClick = (video: ProfileVideoItem | ProfileStoryItem, isStory?: boolean) => {
    // Si es un video de la cuadrícula normal de publicaciones, abrir el reproductor y descargador de alta calidad
    if (!isStory && !(video as any).is_story) {
      onSelectVideo(video);
      return;
    }

    // Para historias o destacados, abrir el modal de opciones de formato
    const isImg = Boolean((video as any).is_image);
    const dlUrl = video.url || (video as any).download_url || (video as any).play_url;
    setFormatModalItem({
      id: video.id,
      title: video.title || `Publicación de @${data.username}`,
      url: video.url,
      downloadUrl: dlUrl,
      musicUrl: (video as any).music_url || '',
      isStory: Boolean(isStory),
      isImage: isImg
    });
  };

  // Cargar siguiente lote de 35 videos del servidor
  const handleLoadMoreVideos = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: data.username,
          start: nextStart,
          count: 35
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success && Array.isArray(resData.videos)) {
        const newVids: ProfileVideoItem[] = resData.videos;
        if (newVids.length === 0) {
          setHasMore(false);
        } else {
          setVideos(prev => {
            const existingIds = new Set(prev.map(v => v.id));
            const filtered = newVids.filter(v => !existingIds.has(v.id));
            return [...prev, ...filtered];
          });
          setNextStart(resData.next_start || (nextStart + newVids.length));
          setHasMore(resData.has_more ?? (newVids.length >= 35));
        }
      } else {
        setLoadError(resData.error || 'No se pudieron cargar más videos.');
      }
    } catch {
      setLoadError('Error al conectar con el servidor.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Ordenamiento de videos cargados
  const sortedVideos = React.useMemo(() => {
    const list = [...videos];
    if (sortFilter === 'popular') {
      return list.sort((a, b) => {
        const getViews = (item: ProfileVideoItem) => {
          if (typeof item.raw_views === 'number' && item.raw_views > 0) return item.raw_views;
          const s = (item.views || '').toUpperCase().trim();
          if (s.endsWith('M')) return parseFloat(s) * 1_000_000;
          if (s.endsWith('K')) return parseFloat(s) * 1_000;
          return parseFloat(s) || 0;
        };
        return getViews(b) - getViews(a);
      });
    }
    if (sortFilter === 'oldest') {
      return list.reverse();
    }
    return list;
  }, [videos, sortFilter]);

  const hasStories = Boolean(data.stories && data.stories.length > 0);
  const activeStories = data.stories || [];

  const hasHighlights = Boolean(data.highlights && data.highlights.length > 0);
  const activeHighlights = data.highlights || [];

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return null;
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, now - timestamp);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  };

  const totalLikesEstimated = videos.reduce((acc, v) => {
    if (typeof v.raw_likes === 'number' && v.raw_likes > 0) return acc + v.raw_likes;
    const raw = v.likes || '0';
    if (raw.includes('M')) return acc + parseFloat(raw) * 1_000_000;
    if (raw.includes('K')) return acc + parseFloat(raw) * 1_000;
    return acc + (parseFloat(raw) || 0);
  }, 0);

  const formatBigNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`.replace('.0M', 'M');
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`.replace('.0K', 'K');
    return n.toString();
  };

  const paginatedStories = activeStories.slice(0, visibleStoryCount);

  return (
    <div className="w-full bg-[#0b1328]/95 dark:bg-[#0b1328]/95 bg-white text-slate-900 dark:text-white rounded-3xl p-4 sm:p-7 md:p-8 border border-slate-200 dark:border-slate-800/90 shadow-2xl transition-all duration-300">
      
      {/* Botón superior de volver */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al buscador</span>
        </button>

        <a
          href={`https://www.tiktok.com/@${data.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <span>Abrir perfil en TikTok</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* CABECERA DEL PERFIL */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 w-full md:w-auto">
          {/* Foto de Perfil (Solo foto estática, sin clics ni badges confusos) */}
          <div 
            className="relative shrink-0 select-none"
            title={`Foto de perfil de @${data.username}`}
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] shadow-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600">
              <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-[#0b1328]">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                  {data.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.avatar}
                      alt={data.nickname}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información del Creador */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1 flex items-center justify-center sm:justify-start gap-2">
              <span>{data.nickname || data.username}</span>
              {data.verified && (
                <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
              )}
            </h2>

            <p className="text-sm font-semibold text-sky-500 dark:text-sky-400 mb-3">
              @{data.username}
            </p>

            {/* Fila de Estadísticas */}
            <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-7 text-sm mb-3">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                  {data.total_videos ? data.total_videos : (hasMore ? `${videos.length}+` : videos.length)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">Publicaciones</span>
              </div>
              
              <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 self-center" />

              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                  {data.followers || (hasStories ? `${activeStories.length} activas` : '0')}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">{data.followers ? 'Seguidores' : 'Historias'}</span>
              </div>

              <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 self-center" />

              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                  {data.total_likes || (totalLikesEstimated > 0 ? formatBigNumber(totalLikesEstimated) : 'Público')}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">Me gusta</span>
              </div>
            </div>

            {/* Mensaje de estado / bio */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed whitespace-pre-line">
              {data.signature || (data.is_private ? (
                'Esta cuenta es privada en TikTok.'
              ) : (
                'Perfil público de TikTok. Explora y descarga sus publicaciones e historias en HD sin marca de agua.'
              ))}
            </p>
          </div>
        </div>

      </div>

      {/* Si es privado */}
      {data.is_private ? (
        <div className="mt-8 flex flex-col items-center justify-center p-8 md:p-12 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Esta cuenta es privada
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            El usuario @{data.username} configuró su perfil como privado. Solo sus seguidores aprobados en TikTok pueden ver sus publicaciones e historias.
          </p>
        </div>
      ) : (
        <>
          {/* 1. SECCIÓN HISTORIAS ACTIVAS (24H) */}
          {hasStories && (
            <div className="py-5 border-b border-slate-200 dark:border-slate-800 relative">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                  </span>
                  <span>Historias Activas (24h) • {activeStories.length} disponible{activeStories.length > 1 ? 's' : ''}</span>
                </h3>

                {/* Flechas de navegación para deslizar carrusel */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollStoryRow('left')}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    title="Desplazar a la izquierda"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollStoryRow('right')}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    title="Desplazar a la derecha"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Fila Horizontal de Burbujas de Historias */}
              <div 
                ref={storyRowRef}
                className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                {activeStories.map((story, idx) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => handleVideoClick(story, true)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                    title={`Toca para ver Historia #${idx + 1}`}
                  >
                    <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:scale-105 group-active:scale-95 transition-transform duration-200 shadow-md">
                      <div className="p-[2px] bg-white dark:bg-[#0b1328] rounded-full">
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-slate-900 relative">
                          <img
                            src={story.thumbnail || data.avatar}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              if (data.avatar) (e.target as HTMLImageElement).src = data.avatar;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Download className="w-5 h-5 text-white stroke-[2.5] drop-shadow-md" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#0b1328]">
                        <Download className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    </div>
                    <div className="text-center max-w-[80px]">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block group-hover:text-pink-500">
                        {activeStories.length > 1 ? `Historia ${idx + 1}` : 'Historia'}
                      </span>
                      <span className="text-[10px] text-pink-500 dark:text-pink-400 font-semibold block">
                        {story.is_image ? 'Foto HD' : 'Video HD'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. SECCIÓN COLECCIONES DESTACADAS (ESTILO TIKTOK) */}
          {hasHighlights && (
            <div className="py-5 border-b border-slate-200 dark:border-slate-800 relative">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                  <span>Destacados • {activeHighlights.length} coleccione{activeHighlights.length > 1 ? 's' : ''}</span>
                </h3>

                {/* Flechas de navegación para deslizar carrusel (3-4 visibles) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollHighlightRow('left')}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    title="Desplazar a la izquierda"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollHighlightRow('right')}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    title="Desplazar a la derecha"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Fila Horizontal de Burbujas de Destacados (3-4 visibles en pantalla) */}
              <div 
                ref={highlightRowRef}
                className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                {activeHighlights.map((hl) => (
                  <button
                    key={hl.id}
                    type="button"
                    onClick={() => setSelectedHighlight(selectedHighlight?.id === hl.id ? null : hl)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                    title={`Toca para ver ${hl.title}`}
                  >
                    <div className={`relative p-[2.5px] rounded-full transition-all duration-300 shadow-md ${
                      selectedHighlight?.id === hl.id
                        ? 'bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 scale-105 ring-2 ring-sky-400/50'
                        : 'bg-gradient-to-tr from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 group-hover:bg-gradient-to-tr group-hover:from-cyan-400 group-hover:via-sky-500 group-hover:to-blue-600 group-hover:scale-105'
                    }`}>
                      <div className="p-[2px] bg-white dark:bg-[#0b1328] rounded-full">
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-slate-900 relative">
                          <img
                            src={hl.cover || data.avatar}
                            alt={hl.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-white fill-current drop-shadow-md" />
                          </div>
                        </div>
                      </div>

                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-sky-500 text-white shadow-sm border border-white dark:border-[#0b1328]">
                        {hl.count || hl.items?.length || 1}
                      </span>
                    </div>

                    <div className="text-center max-w-[85px] sm:max-w-[95px]">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block group-hover:text-sky-400">
                        {hl.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {hl.count || hl.items?.length || 1} videos
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Vista Expandida de la Colección Seleccionada (Descarga Individual en Full HD) */}
              {selectedHighlight && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <FolderHeart className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Colección: <span className="text-sky-400">{selectedHighlight.title}</span> ({selectedHighlight.items?.length || 0} publicaciones individuales)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedHighlight(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      Cerrar ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedHighlight.items?.map((item, itemIdx) => (
                      <div key={item.id || itemIdx} className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col shadow-sm">
                        <div className="relative aspect-[9/16] w-full overflow-hidden bg-slate-950">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                            {item.duration || '0:15'}
                          </div>
                        </div>
                        <div className="p-2 flex flex-col gap-1.5 flex-1 justify-between bg-slate-900/95">
                          <span className="text-[11px] font-semibold text-slate-200 truncate block">
                            {item.title || `Item #${itemIdx + 1}`}
                          </span>
                          
                          {/* Descarga Individual Inteligente (Fotos solo JPG HD, Videos en MP4/Mute/MP3) */}
                          <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
                            {Boolean((item as any).is_image || item.duration === 'Foto') ? (
                              <button
                                type="button"
                                onClick={() => triggerDownload(item.url || item.download_url || '', `destacado_${data.username}_${itemIdx + 1}.jpg`, 'Foto en Alta Definición (JPG)', false)}
                                className="w-full py-1.5 px-2 rounded bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>Descargar Foto HD (JPG)</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => triggerDownload(item.url || item.download_url || '', `destacado_${data.username}_${itemIdx + 1}.mp4`, 'Video Full HD 1080p', false)}
                                  className="w-full py-1.5 px-2 rounded bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>MP4 Full HD</span>
                                </button>
                                <div className={`grid ${item.music_url ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
                                  <button
                                    type="button"
                                    onClick={() => triggerDownload(item.url || item.download_url || '', `destacado_mudo_${data.username}_${itemIdx + 1}.mp4`, 'Video Sin Sonido', false)}
                                    className="py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold flex items-center justify-center gap-0.5 transition-colors"
                                  >
                                    <VolumeX className="w-2.5 h-2.5" />
                                    <span>Sin Sonido</span>
                                  </button>
                                  {item.music_url && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerDownload(item.music_url || '', `destacado_audio_${data.username}_${itemIdx + 1}.mp3`, 'Audio MP3', true);
                                      }}
                                      className="py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold flex items-center justify-center gap-0.5 transition-colors"
                                    >
                                      <Music className="w-2.5 h-2.5" />
                                      <span>Audio MP3</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. PESTAÑAS Y CONTROLES DE FILTRO/ORDEN */}
          <div className="mt-6 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all relative ${
                  activeTab === 'videos'
                    ? 'text-sky-500 dark:text-sky-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Publicaciones</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {videos.length}
                </span>
                {activeTab === 'videos' && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-sky-500 dark:bg-sky-400 rounded-full" />
                )}
              </button>

              {hasStories && (
                <button
                  type="button"
                  onClick={() => setActiveTab('stories')}
                  className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all relative ${
                    activeTab === 'stories'
                      ? 'text-pink-500 dark:text-pink-400'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Historias</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">
                    {activeStories.length}
                  </span>
                  {activeTab === 'stories' && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-pink-500 dark:bg-pink-400 rounded-full" />
                  )}
                </button>
              )}
            </div>

            {/* BOTONES DE ORDENAMIENTO */}
            {activeTab === 'videos' && videos.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setSortFilter('recent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sortFilter === 'recent'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recientes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortFilter('popular')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sortFilter === 'popular'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Más Vistos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortFilter('oldest')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    sortFilter === 'oldest'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Más Antiguos</span>
                </button>
              </div>
            )}
          </div>

          {/* CUADRÍCULA DE VIDEOS */}
          {activeTab === 'videos' ? (
            videos.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                Este usuario no tiene publicaciones públicas disponibles.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                  {sortedVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleVideoClick(video)}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800/90 hover:border-sky-500/80 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1"
                    >
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            if (data.avatar) (e.target as HTMLImageElement).src = data.avatar;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                          <Film className="w-8 h-8" />
                        </div>
                      )}

                      {video.duration && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                          {video.duration}
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between text-white">
                        <div className="flex items-center gap-1.5 font-bold text-xs drop-shadow-md">
                          <Play className="w-3.5 h-3.5 fill-current text-white" />
                          <span>{video.views}</span>
                        </div>

                        <div 
                          className="p-2 rounded-lg bg-black/60 hover:bg-sky-500 text-white backdrop-blur-md border border-white/10 hover:border-sky-400 transition-all duration-200 active:scale-90 shadow-md"
                          title="Descargar este video en Full HD"
                        >
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ERROR AL CARGAR MÁS */}
                {loadError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center flex items-center justify-center gap-2">
                    <span>{loadError}</span>
                    <button
                      type="button"
                      onClick={handleLoadMoreVideos}
                      className="underline font-bold hover:text-red-300"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* BOTÓN CARGAR MÁS */}
                <div className="pt-4 flex flex-col items-center justify-center gap-2">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={handleLoadMoreVideos}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-7 py-3 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white font-bold text-sm transition-all border border-sky-500/30 hover:border-sky-400 shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Obteniendo los siguientes 35 videos...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Cargar más videos (+35)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold text-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Has llegado al primer video publicado por @{data.username} ({videos.length} videos en total)</span>
                    </div>
                  )}

                  <span className="text-[11px] text-slate-400">
                    {videos.length} videos cargados • Descargas individuales en Full HD 1080p
                  </span>
                </div>
              </div>
            )
          ) : (
            /* CUADRÍCULA DE HISTORIAS INDIVIDUALES */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {paginatedStories.map((story, idx) => {
                  const timeAgo = formatTimeAgo(story.created_at);
                  return (
                    <div
                      key={story.id}
                      onClick={() => handleVideoClick(story, true)}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border-2 border-pink-500/80 hover:border-pink-400 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1"
                    >
                      {story.thumbnail ? (
                        <img
                          src={story.thumbnail}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            if (data.avatar) (e.target as HTMLImageElement).src = data.avatar;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                          <Film className="w-8 h-8" />
                        </div>
                      )}

                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-rose-600 font-extrabold text-[10px] text-white shadow-md flex items-center gap-1">
                        {story.is_image ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                        <span>{story.is_image ? 'FOTO' : 'VIDEO'} #{idx + 1}</span>
                      </span>

                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                        {timeAgo || story.duration || '0:15'}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between text-white">
                        <div className="flex items-center gap-1.5 font-bold text-xs drop-shadow-md">
                          <Play className="w-3.5 h-3.5 fill-current text-white" />
                          <span>{story.views || '80+'}</span>
                        </div>

                        <div 
                          className="p-2 rounded-lg bg-black/60 hover:bg-pink-600 text-white backdrop-blur-md border border-white/10 hover:border-pink-400 transition-all duration-200 active:scale-90 shadow-md"
                          title="Descargar esta historia"
                        >
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeStories.length > visibleStoryCount && (
                <div className="pt-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleStoryCount((prev) => prev + 25)}
                    className="px-6 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/50 text-pink-600 dark:text-pink-400 font-bold text-xs transition-colors border border-pink-200 dark:border-pink-800"
                  >
                    Cargar más historias ({activeStories.length - visibleStoryCount} restantes)
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL DE DESCARGA POR FORMATO (MP4 FULL HD, SIN SONIDO, MP3) */}
      {formatModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setFormatModalItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold p-1"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">
                  Descarga Individual
                </h3>
                <p className="text-xs text-slate-400">
                  Selecciona el formato que prefieras:
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 mb-5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              {formatModalItem.title}
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Para FOTOS: Única opción de Descarga en Alta Resolución (JPG genuino) - NUNCA mostrar MP3 */}
              {formatModalItem.isImage ? (
                <button
                  type="button"
                  onClick={() => {
                    const dlUrl = formatModalItem.url || formatModalItem.downloadUrl;
                    triggerDownload(dlUrl, `ByteDownloader_${data.username}_${formatModalItem.id}.jpg`, 'Foto en Alta Definición (JPG)', false);
                    setFormatModalItem(null);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-sky-500/25 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4" />
                    <span>Descargar Foto HD (JPG)</span>
                  </div>
                  <span className="text-[10px] uppercase font-black bg-white/20 px-2 py-0.5 rounded-full">Recomendado</span>
                </button>
              ) : (
                <>
                  {/* Para VIDEOS: Opción 1 - Video Full HD 1080p */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerDownload(formatModalItem.downloadUrl || formatModalItem.url, `ByteDownloader_${data.username}_${formatModalItem.id}.mp4`, 'Video MP4 Full HD (1080p)', false);
                      setFormatModalItem(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-sky-500/25 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <Film className="w-4 h-4" />
                      <span>Video MP4 Full HD (1080p H.264)</span>
                    </div>
                    <span className="text-[10px] uppercase font-black bg-white/20 px-2 py-0.5 rounded-full">Recomendado</span>
                  </button>

                  {/* Para VIDEOS: Opción 2 - Video Sin Sonido (Mute) */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerDownload(formatModalItem.downloadUrl || formatModalItem.url, `ByteDownloader_SinSonido_${data.username}_${formatModalItem.id}.mp4`, 'Video Sin Sonido (Mudo)', false);
                      setFormatModalItem(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-between border border-slate-700 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <span>Video Sin Sonido (Mute)</span>
                    </div>
                    <span className="text-xs text-slate-400">MP4</span>
                  </button>

                  {/* Para VIDEOS: Opción 3 - Audio MP3 (Solo si tiene pista de audio) */}
                  {formatModalItem.musicUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const audioSource = formatModalItem.musicUrl || formatModalItem.downloadUrl || formatModalItem.url;
                        triggerDownload(audioSource, `ByteDownloader_Audio_${data.username}_${formatModalItem.id}.mp3`, 'Audio MP3 (Música Original)', true);
                        setFormatModalItem(null);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-between border border-slate-700 transition-all active:scale-95"
                    >
                      <div className="flex items-center gap-2.5">
                        <Music className="w-4 h-4 text-emerald-400" />
                        <span>Solo Audio (MP3)</span>
                      </div>
                      <span className="text-xs text-emerald-400">MP3</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setFormatModalItem(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/95 border border-slate-700 text-white shadow-2xl backdrop-blur-md">
          {toastMessage.type === 'info' && (
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          {toastMessage.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
