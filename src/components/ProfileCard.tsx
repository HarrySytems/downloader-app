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
  CheckCircle2,
  Share2
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
  download_url?: string;
}

export interface ProfileVideoItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
  is_story?: boolean;
}

export interface ProfileData {
  success: boolean;
  is_private: boolean;
  username: string;
  nickname: string;
  avatar?: string;
  video_count?: number;
  has_active_story?: boolean;
  stories?: ProfileStoryItem[];
  message?: string;
  videos: ProfileVideoItem[];
}

interface ProfileCardProps {
  data: ProfileData;
  onSelectVideo: (videoUrl: string) => void;
  onBack: () => void;
}

export default function ProfileCard({ data, onSelectVideo, onBack }: ProfileCardProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'stories'>('videos');
  
  // Paginación progresiva para soportar hasta 100+ videos o historias sin lag
  const [visibleVideoCount, setVisibleVideoCount] = useState<number>(35);
  const [visibleStoryCount, setVisibleStoryCount] = useState<number>(35);

  // Referencia y estados para el carrusel horizontal en escritorio
  const storyRowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScrollState = () => {
    if (storyRowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storyRowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [data.stories]);

  const scrollStoryRow = (direction: 'left' | 'right') => {
    if (storyRowRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      storyRowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScrollState, 350);
    }
  };

  const handleVideoClick = (video: ProfileVideoItem | ProfileStoryItem) => {
    setDownloadingId(video.id);
    onSelectVideo(video.url);
  };

  const hasStories = Boolean(data.stories && data.stories.length > 0);
  const activeStories = data.stories || [];

  // Formato de tiempo relativo para historias (ej: "Hace 2h", "Hace 45m")
  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return null;
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, now - timestamp);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  };

  // Calcular suma total de 'Me gusta' de los videos cargados
  const totalLikesEstimated = data.videos.reduce((acc, v) => {
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

  const paginatedVideos = data.videos.slice(0, visibleVideoCount);
  const paginatedStories = activeStories.slice(0, visibleStoryCount);

  return (
    <div className="w-full bg-[#0b1328]/95 dark:bg-[#0b1328]/95 bg-white text-slate-900 dark:text-white rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-200 dark:border-slate-800/90 shadow-2xl transition-all duration-300">
      
      {/* Botón superior de volver */}
      <div className="mb-6 flex items-center justify-between">
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

      {/* CABECERA DEL PERFIL - CLON EXACTO DE LA IMAGEN */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full md:w-auto">
          {/* Avatar con Anillo Luminoso */}
          <div 
            onClick={() => {
              if (hasStories) {
                handleVideoClick(activeStories[0]);
              }
            }}
            className={`relative group shrink-0 ${hasStories ? 'cursor-pointer' : ''}`}
            title={hasStories ? 'Toca para ver historia activa' : 'Foto de perfil'}
          >
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] shadow-xl transition-transform duration-300 ${
              hasStories 
                ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-pulse hover:scale-105' 
                : 'bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600'
            }`}>
              <div className="w-full h-full rounded-full p-[3px] bg-white dark:bg-[#0b1328]">
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
                    <User className="w-14 h-14 text-slate-500" />
                  )}
                  {hasStories && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white fill-current drop-shadow-md" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasStories && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg border border-white dark:border-[#0b1328] shrink-0 whitespace-nowrap">
                Historia
              </span>
            )}
          </div>

          {/* Información del Creador */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1 flex items-center justify-center sm:justify-start gap-2">
              <span>{data.nickname || data.username}</span>
            </h2>

            <p className="text-sm font-semibold text-sky-500 dark:text-sky-400 mb-4">
              @{data.username}
            </p>

            {/* Fila de Estadísticas */}
            <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-8 text-sm mb-3">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                  {data.video_count || data.videos.length}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">Publicaciones</span>
              </div>
              
              <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 self-center" />

              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                  {hasStories ? `${activeStories.length} activa${activeStories.length > 1 ? 's' : ''}` : '0'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">Historias (24h)</span>
              </div>

              <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 self-center" />

              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                  {totalLikesEstimated > 0 ? formatBigNumber(totalLikesEstimated) : 'Público'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">Me gusta</span>
              </div>
            </div>

            {/* Mensaje de estado / bio */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {data.is_private ? (
                'Esta cuenta es privada en TikTok.'
              ) : (
                'Perfil público verificado de TikTok. Descarga sus videos e historias en Full HD sin marca de agua.'
              )}
            </p>
          </div>
        </div>

        {/* Botón Acción Destacado: "Descargar perfil" estilo imagen */}
        <div className="shrink-0 flex items-center justify-center w-full md:w-auto mt-2 md:mt-0">
          <button
            type="button"
            onClick={() => {
              if (hasStories) {
                handleVideoClick(activeStories[0]);
              } else if (data.videos.length > 0) {
                handleVideoClick(data.videos[0]);
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/30 transition-all duration-200 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Descargar perfil</span>
          </button>
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
          {/* SECCIÓN HISTORIAS ACTIVAS (ÚNICAMENTE SI EL USUARIO TIENE HISTORIAS REALES) */}
          {hasStories && (
            <div className="py-6 border-b border-slate-200 dark:border-slate-800 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                  </span>
                  <span>Historias Activas (24h) • {activeStories.length} disponible{activeStories.length > 1 ? 's' : ''}</span>
                </h3>

                {/* Flechas de navegación para escritorio */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollStoryRow('left')}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Desplazar a la izquierda"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollStoryRow('right')}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Desplazar a la derecha"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fila Horizontal de Burbujas de Historias */}
              <div 
                ref={storyRowRef}
                onScroll={checkScrollState}
                className="flex items-center gap-5 sm:gap-6 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                {activeStories.map((story, idx) => {
                  const timeAgo = formatTimeAgo(story.created_at);
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => handleVideoClick(story)}
                      className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none"
                    >
                      <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:scale-105 group-active:scale-95 transition-transform duration-200 shadow-md">
                        <div className="p-[2px] bg-white dark:bg-[#0b1328] rounded-full">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-900 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={story.thumbnail || data.avatar}
                              alt={story.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                if (data.avatar) (e.target as HTMLImageElement).src = data.avatar;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-white fill-current drop-shadow-md" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center max-w-[80px]">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block group-hover:text-pink-500">
                          {activeStories.length > 1 ? `Historia ${idx + 1}` : 'Historia'}
                        </span>
                        <span className="text-[10px] text-pink-500 dark:text-pink-400 font-medium block">
                          {timeAgo || story.duration || '0:15'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PESTAÑAS DE CONTENIDO */}
          <div className="mt-7 mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
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
                <span>Videos</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {data.videos.length}
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

            <span className="text-xs text-slate-400 hidden sm:inline">
              Formato H.264 compatible con Windows, Mac y Celular
            </span>
          </div>

          {/* CUADRÍCULA DE VIDEOS - EXACTAMENTE COMO EN EL DISEÑO */}
          {activeTab === 'videos' ? (
            data.videos.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                Este usuario no tiene publicaciones públicas recientes.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                  {paginatedVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleVideoClick(video)}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800/90 hover:border-sky-500/80 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1"
                    >
                      {/* Portada del video */}
                      {video.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
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

                      {/* Duración (Esquina Superior Derecha) */}
                      {video.duration && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                          {video.duration}
                        </span>
                      )}

                      {/* Gradiente inferior permanente con vistas y botón de descarga */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between text-white">
                        
                        {/* Vistas (Esquina Inferior Izquierda con ícono Play) */}
                        <div className="flex items-center gap-1.5 font-bold text-xs drop-shadow-md">
                          <Play className="w-3.5 h-3.5 fill-current text-white" />
                          <span>{video.views}</span>
                        </div>

                        {/* Botón de Descarga (Esquina Inferior Derecha - Estilo de la imagen) */}
                        <div 
                          className="p-2 rounded-lg bg-black/60 hover:bg-sky-500 text-white backdrop-blur-md border border-white/10 hover:border-sky-400 transition-all duration-200 active:scale-90 shadow-md"
                          title="Descargar este video en HD"
                        >
                          {downloadingId === video.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Botón Cargar Más */}
                {data.videos.length > visibleVideoCount && (
                  <div className="pt-4 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleVideoCount((prev) => prev + 35)}
                      className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-300 dark:border-slate-700"
                    >
                      Cargar más videos ({data.videos.length - visibleVideoCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* CUADRÍCULA DE HISTORIAS */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {paginatedStories.map((story, idx) => {
                  const timeAgo = formatTimeAgo(story.created_at);
                  return (
                    <div
                      key={story.id}
                      onClick={() => handleVideoClick(story)}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border-2 border-pink-500/80 hover:border-pink-400 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1"
                    >
                      {/* Miniatura */}
                      {story.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
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

                      {/* Badge HISTORIA # */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-rose-600 font-extrabold text-[10px] text-white shadow-md">
                        HISTORIA #{idx + 1}
                      </span>

                      {/* Tiempo relativo */}
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                        {timeAgo || story.duration || '0:15'}
                      </span>

                      {/* Gradiente inferior con vistas y descarga */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between text-white">
                        <div className="flex items-center gap-1.5 font-bold text-xs drop-shadow-md">
                          <Play className="w-3.5 h-3.5 fill-current text-white" />
                          <span>{story.views || '80+'}</span>
                        </div>

                        <div 
                          className="p-2 rounded-lg bg-black/60 hover:bg-pink-600 text-white backdrop-blur-md border border-white/10 hover:border-pink-400 transition-all duration-200 active:scale-90 shadow-md"
                          title="Descargar esta historia en HD"
                        >
                          {downloadingId === story.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
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
    </div>
  );
}
