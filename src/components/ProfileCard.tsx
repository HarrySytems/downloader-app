'use client';

import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Play, 
  Heart, 
  Eye, 
  Clock, 
  Download, 
  ExternalLink, 
  ArrowLeft,
  Film,
  Sparkles,
  Flame,
  Star,
  Zap,
  Image as ImageIcon
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
  const [activeTab, setActiveTab] = useState<'all' | 'stories' | 'videos'>('all');

  const handleVideoClick = (video: ProfileVideoItem | ProfileStoryItem) => {
    setDownloadingId(video.id);
    onSelectVideo(video.url);
  };

  const hasStories = data.stories && data.stories.length > 0;
  const activeStories = data.stories || [];

  // Ordenar por reproducciones para obtener los destacados estilo Instagram
  const topVideo = data.videos && data.videos.length > 0 ? data.videos[0] : null;
  const mostViewedVideo = data.videos && data.videos.length > 1 ? [...data.videos].sort((a, b) => {
    const parseViews = (v: string) => {
      if (!v) return 0;
      if (v.includes('M')) return parseFloat(v) * 1_000_000;
      if (v.includes('K')) return parseFloat(v) * 1_000;
      return parseFloat(v) || 0;
    };
    return parseViews(b.views) - parseViews(a.views);
  })[0] : null;

  // Filtrar lista para la cuadrícula
  let displayedVideos = data.videos;
  if (activeTab === 'stories') {
    displayedVideos = [];
  }

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
      
      {/* Barra superior de navegación */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al buscador</span>
        </button>

        <a
          href={`https://www.tiktok.com/@${data.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <span>Abrir en TikTok</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Cabecera del Perfil */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
        
        {/* Avatar con Anillo de Historia */}
        <div 
          onClick={() => {
            if (hasStories) {
              handleVideoClick(activeStories[0]);
            }
          }}
          className={`relative group shrink-0 ${hasStories ? 'cursor-pointer' : ''}`}
          title={hasStories ? 'Toca para ver historia activa' : 'Foto de perfil'}
        >
          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] shadow-md transition-transform duration-300 ${
            hasStories 
              ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-pulse hover:scale-105' 
              : 'bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-600'
          }`}>
            <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-slate-800">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center relative">
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
                  <User className="w-12 h-12 text-slate-400" />
                )}
                {hasStories && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-7 h-7 text-white fill-current drop-shadow-md" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Badge de Historia Activa o Verificado */}
          {hasStories ? (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md border border-white dark:border-slate-800 shrink-0 whitespace-nowrap">
              Historia
            </span>
          ) : !data.is_private ? (
            <span className="absolute bottom-1 right-1 bg-green-500 border-2 border-white dark:border-slate-800 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" title="Perfil Público">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          ) : null}
        </div>

        {/* Datos del Creador */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.nickname || data.username}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 self-center sm:self-auto">
              TikTok Creator
            </span>
          </div>

          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-4">
            @{data.username}
          </p>

          {/* Estadísticas */}
          <div className="flex items-center justify-center sm:justify-start gap-6 text-sm">
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                {data.video_count || data.videos.length}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Publicaciones</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                {hasStories ? `${activeStories.length} activa${activeStories.length > 1 ? 's' : ''}` : 'Sin historias'}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Historias (24h)</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                {data.is_private ? 'Privada' : 'Pública'}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Visibilidad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido: Si es privado */}
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
          {/* SECCIÓN ESTILO INSTAGRAM: HISTORIAS DESTACADAS & ACTIVAS */}
          <div className="py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasStories ? 'bg-pink-400 opacity-75' : 'bg-blue-400 opacity-50'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasStories ? 'bg-pink-500' : 'bg-blue-500'}`}></span>
                </span>
                <span>{hasStories ? 'Historias Activas (24h)' : 'Historias & Destacadas'}</span>
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Toca un círculo para ver y descargar
              </span>
            </div>

            {/* Fila Horizontal de Burbujas / Círculos de Historias */}
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
              
              {/* 1. Historias activas del usuario (si tiene en las últimas 24h) */}
              {hasStories && activeStories.map((story, idx) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => handleVideoClick(story)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none text-left"
                >
                  <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:scale-105 group-active:scale-95 transition-transform duration-200 shadow-md">
                    <div className="p-[2px] bg-white dark:bg-slate-800 rounded-full">
                      <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden bg-slate-900 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={story.thumbnail || data.avatar}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-current drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                    {/* Badge Nueva / HD */}
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-extrabold text-[8px] rounded-full shadow-sm border border-white dark:border-slate-800">
                      NUEVA
                    </span>
                  </div>
                  <div className="text-center max-w-[76px]">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block group-hover:text-pink-500">
                      {activeStories.length > 1 ? `Historia ${idx + 1}` : 'Historia 24h'}
                    </span>
                    <span className="text-[10px] text-pink-500 dark:text-pink-400 font-medium block">
                      {story.duration || '0:15'}
                    </span>
                  </div>
                </button>
              ))}

              {/* 2. Destacada: Más visto del perfil */}
              {mostViewedVideo && (
                <button
                  type="button"
                  onClick={() => handleVideoClick(mostViewedVideo)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                >
                  <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 group-hover:scale-105 group-active:scale-95 transition-transform duration-200 shadow-sm">
                    <div className="p-[2px] bg-white dark:bg-slate-800 rounded-full">
                      <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden bg-slate-900 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mostViewedVideo.thumbnail || data.avatar}
                          alt={mostViewedVideo.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-current drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-[8px] rounded-full shadow-sm border border-white dark:border-slate-800 flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      TOP
                    </span>
                  </div>
                  <div className="text-center max-w-[76px]">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block group-hover:text-orange-500">
                      Más Visto
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      {mostViewedVideo.views} vistas
                    </span>
                  </div>
                </button>
              )}

              {/* 3. Destacada: Última publicación reciente */}
              {topVideo && topVideo.id !== mostViewedVideo?.id && (
                <button
                  type="button"
                  onClick={() => handleVideoClick(topVideo)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                >
                  <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 group-hover:scale-105 group-active:scale-95 transition-transform duration-200 shadow-sm">
                    <div className="p-[2px] bg-white dark:bg-slate-800 rounded-full">
                      <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden bg-slate-900 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={topVideo.thumbnail || data.avatar}
                          alt={topVideo.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-current drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-[8px] rounded-full shadow-sm border border-white dark:border-slate-800">
                      NUEVO
                    </span>
                  </div>
                  <div className="text-center max-w-[76px]">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block group-hover:text-blue-500">
                      Reciente
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      {topVideo.duration || 'Video'}
                    </span>
                  </div>
                </button>
              )}

            </div>
          </div>

          {/* Barra de pestañas y filtro de contenido */}
          <div className="mt-6 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Publicaciones ({data.videos.length})
              </button>

              {hasStories && (
                <button
                  type="button"
                  onClick={() => setActiveTab('stories')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'stories'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 border border-pink-200/50 dark:border-pink-800/40'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Historias ({activeStories.length})</span>
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Descarga directa en Full HD 1080p
            </span>
          </div>

          {/* VISTA SI SELECCIONA LA PESTAÑA HISTORIAS */}
          {activeTab === 'stories' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {activeStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleVideoClick(story)}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 border-2 border-pink-500/80 cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {story.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.thumbnail}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  {/* Badge de Historia Activa */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-rose-600 font-extrabold text-[10px] text-white shadow-md">
                    HISTORIA
                  </span>

                  {story.duration && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white">
                      {story.duration}
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-white text-[11px] font-medium">
                    <div className="flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" />
                      <span>{story.views || '80+'}</span>
                    </div>
                    {story.likes && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <Heart className="w-3 h-3 fill-current text-rose-500" />
                        <span>{story.likes}</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-pink-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="px-3 py-2 rounded-lg bg-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                      {downloadingId === story.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Cargando...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Historia HD</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* VISTA DE TODAS LAS PUBLICACIONES */
            displayedVideos.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                Este usuario no tiene publicaciones públicas recientes.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {displayedVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handleVideoClick(video)}
                    className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Portada / Miniatura */}
                    {video.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                        <Film className="w-8 h-8" />
                      </div>
                    )}

                    {/* Duración (Top Right) */}
                    {video.duration && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white">
                        {video.duration}
                      </span>
                    )}

                    {/* Overlay gradiente inferior con vistas y likes */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-white text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" />
                        <span>{video.views}</span>
                      </div>
                      {video.likes && video.likes !== '0' && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <Heart className="w-3 h-3 fill-current text-rose-500" />
                          <span>{video.likes}</span>
                        </div>
                      )}
                    </div>

                    {/* Overlay de hover con botón Descargar */}
                    <div className="absolute inset-0 bg-blue-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                        {downloadingId === video.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Cargando...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar HD</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
