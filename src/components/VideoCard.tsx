'use client';

import React, { useState } from 'react';
import { Download, Music, Image as ImageIcon, User, ExternalLink, Film, Sparkles, Play } from 'lucide-react';

export interface VideoData {
  platform: string;
  title: string;
  thumbnail?: string;
  author?: string;
  videoUrl?: string;
  audioUrl?: string;
  images?: string[];
  liveImages?: string[];
  isLivePhoto?: boolean;
}

interface VideoCardProps {
  data: VideoData;
  originalUrl: string;
}

export default function VideoCard({ data, originalUrl }: VideoCardProps) {
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [downloadingPhoto, setDownloadingPhoto] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<{ [key: string]: boolean }>({});

  const cleanFilename = (title: string, ext: string) => {
    return (title || 'tiktok')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50) + `.${ext}`;
  };

  const getPlatformColors = (platform: string, isLive?: boolean) => {
    if (isLive) {
      return {
        bg: 'bg-white dark:bg-slate-800',
        border: 'border-pink-300 dark:border-pink-500/40',
        badge: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/20 font-bold',
        gradient: 'from-pink-500 via-rose-500 to-purple-600 shadow-pink-200 dark:from-pink-600 dark:to-purple-700'
      };
    }
    switch (platform) {
      case 'tiktok':
        return {
          bg: 'bg-white dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          badge: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
          gradient: 'from-sky-500 to-blue-600 shadow-sky-100 dark:from-sky-600 dark:to-blue-700'
        };
      case 'twitter':
        return {
          bg: 'bg-white dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          badge: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
          gradient: 'from-blue-500 to-blue-600 shadow-blue-100 dark:from-blue-600 dark:to-blue-700'
        };
      default:
        return {
          bg: 'bg-white dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          badge: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
          gradient: 'from-sky-500 to-blue-600 shadow-sky-100 dark:from-sky-600 dark:to-blue-700'
        };
    }
  };

  const isLive = Boolean(data.isLivePhoto || (data.liveImages && data.liveImages.length > 0));
  const colors = getPlatformColors(data.platform, isLive);
  const isImages = Boolean(data.images && data.images.length > 0);
  const hasMultipleImages = Boolean(data.images && data.images.length > 1);

  // Fallback thumbnail
  const thumbnailSrc = data.thumbnail || (data.images && data.images[0]) || '';

  // Helper de descarga vía proxy local
  const handleDownload = async (url: string, filename: string, setLoader?: (val: boolean) => void, key?: string) => {
    try {
      if (setLoader) setLoader(true);
      if (key) setDownloadingIndex(prev => ({ ...prev, [key]: true }));
      
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        if (setLoader) setLoader(false);
        if (key) setDownloadingIndex(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Download click error:', err);
      if (setLoader) setLoader(false);
      if (key) setDownloadingIndex(prev => ({ ...prev, [key]: false }));
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`w-full bg-[#0b1328]/95 dark:bg-[#0b1328]/95 bg-white text-slate-900 dark:text-white rounded-2xl p-5 md:p-6 border ${colors.border} shadow-xl overflow-hidden transition-all duration-300`}>
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Media Preview / Thumbnail */}
        <div className="w-full md:w-52 h-56 md:h-44 shrink-0 relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 flex items-center justify-center shadow-inner">
          {thumbnailSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={thumbnailSrc} 
              alt={data.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Film className="w-12 h-12 stroke-[1.5]" />
              <span className="text-xs font-medium">Sin Vista Previa</span>
            </div>
          )}
          
          {/* Badge Overlay */}
          <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.badge} flex items-center gap-1`}>
            {isLive ? (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Foto Animada (3s)</span>
              </>
            ) : isImages ? (
              <>
                <ImageIcon className="w-3 h-3" />
                <span>Galería ({data.images?.length})</span>
              </>
            ) : (
              <span>{data.platform}</span>
            )}
          </span>

          {/* Icono de play si es video animado */}
          {(data.videoUrl || isLive) && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          )}
        </div>
 
        {/* Detalles del Contenido */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white line-clamp-2 mb-2 tracking-tight">
              {data.title || (isLive ? 'Foto animada de TikTok' : 'Video descargado')}
            </h3>
            
            {data.author && (
              <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400 text-sm mb-4 font-semibold">
                <User className="w-4 h-4 text-sky-400" />
                <span>@{data.author}</span>
              </div>
            )}

            {isLive && (
              <div className="mb-4 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs text-pink-400 flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  Esta publicación es una <strong>Foto Animada (Live Photo)</strong>. Puedes descargar el video animado en movimiento de 3 segundos o la foto estática.
                </span>
              </div>
            )}
          </div>

          {/* Botones de Descarga */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            
            {/* 1. Botón Video (Animado o Normal) */}
            {data.videoUrl && (
              <button
                type="button"
                onClick={() => handleDownload(
                  data.videoUrl!, 
                  cleanFilename(data.title || (isLive ? 'live_photo_video' : 'video'), 'mp4'), 
                  setDownloadingVideo
                )}
                disabled={downloadingVideo}
                className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${colors.gradient} hover:opacity-95 shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-75 transition-all`}
              >
                {downloadingVideo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Descargando Video...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>{isLive ? 'Descargar Video Animado (HD)' : 'Descargar Video (HD)'}</span>
                  </>
                )}
              </button>
            )}

            {/* 2. Botón Descargar Foto Estática (si es Live Photo individual o tiene foto) */}
            {isLive && data.images && data.images.length > 0 && (
              <button
                type="button"
                onClick={() => handleDownload(
                  data.images![0], 
                  cleanFilename(data.title || 'foto', 'jpg'), 
                  setDownloadingPhoto
                )}
                disabled={downloadingPhoto}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 disabled:opacity-75 transition-all"
              >
                {downloadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    <span>Descargando Foto...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    <span>Descargar Foto (JPG)</span>
                  </>
                )}
              </button>
            )}

            {/* 3. Botón Descargar Audio MP3 */}
            {data.audioUrl && (
              <button
                type="button"
                onClick={() => handleDownload(
                  data.audioUrl!, 
                  cleanFilename(data.title || 'audio', 'mp3'), 
                  setDownloadingAudio
                )}
                disabled={downloadingAudio}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 disabled:opacity-75 transition-all"
              >
                {downloadingAudio ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    <span>Descargando...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 text-emerald-400" />
                    <span>Descargar MP3</span>
                  </>
                )}
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Galería de Fotos / Slideshows */}
      {isImages && hasMultipleImages && data.images && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>Fotos de la Galería ({data.images.length})</span>
            </h4>
            <span className="text-xs text-slate-400">
              {isLive ? 'Toca cada elemento para descargar su foto o su video animado' : 'Descarga las fotos individualmente'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {data.images.map((img, idx) => {
              const liveVideo = data.liveImages && data.liveImages[idx];
              const isImgLoading = downloadingIndex[`img_${idx}`];
              const isVideoLoading = downloadingIndex[`vid_${idx}`];

              return (
                <div 
                  key={idx} 
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-sm flex flex-col justify-between"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={img} 
                    alt={`Slide ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Badge de número */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-white font-bold border border-white/10 shadow-sm">
                    #{idx + 1}
                  </span>

                  {/* Botones de acción flotantes en la parte inferior */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-1.5">
                    
                    {/* Botón Descargar Foto JPG */}
                    <button
                      type="button"
                      onClick={() => handleDownload(
                        img, 
                        cleanFilename(`${data.title || 'foto'}_${idx + 1}`, 'jpg'), 
                        undefined, 
                        `img_${idx}`
                      )}
                      disabled={isImgLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md text-xs font-bold transition-all shadow active:scale-95 disabled:opacity-50"
                    >
                      {isImgLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Foto JPG</span>
                        </>
                      )}
                    </button>

                    {/* Botón Descargar Video Animado MP4 (si esta slide tiene live_image) */}
                    {liveVideo && (
                      <button
                        type="button"
                        onClick={() => handleDownload(
                          liveVideo, 
                          cleanFilename(`${data.title || 'live_clip'}_${idx + 1}`, 'mp4'), 
                          undefined, 
                          `vid_${idx}`
                        )}
                        disabled={isVideoLoading}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95 disabled:opacity-50"
                      >
                        {isVideoLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Video Animado</span>
                          </>
                        )}
                      </button>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enlace directo */}
      <div className="mt-4 flex justify-end">
        <a 
          href={data.videoUrl || data.images?.[0] || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 font-medium"
        >
          <span>Abrir multimedia en CDN directo</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
