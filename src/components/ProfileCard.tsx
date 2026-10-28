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
  Sparkles
} from 'lucide-react';

export interface ProfileVideoItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
}

export interface ProfileData {
  success: boolean;
  is_private: boolean;
  username: string;
  nickname: string;
  avatar?: string;
  video_count?: number;
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

  const handleVideoClick = (video: ProfileVideoItem) => {
    setDownloadingId(video.id);
    onSelectVideo(video.url);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
      {/* Botón Volver */}
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <span>Abrir en TikTok</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Cabecera del Perfil */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-600 shadow-md">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
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
            </div>
          </div>

          {!data.is_private && (
            <span className="absolute bottom-1 right-1 bg-green-500 border-2 border-white dark:border-slate-800 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" title="Perfil Público">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          )}
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
        /* Contenido: Si es público (Grid de Videos e Historias) */
        <div className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-500" />
              <span>Publicaciones disponibles ({data.videos.length})</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Toca un video para descargarlo en HD
            </span>
          </div>

          {data.videos.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              Este usuario no tiene publicaciones públicas recientes.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {data.videos.map((video) => (
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
          )}
        </div>
      )}
    </div>
  );
}
