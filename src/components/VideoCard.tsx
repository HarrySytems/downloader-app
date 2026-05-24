'use client';

import React, { useState } from 'react';
import { Download, Music, Image as ImageIcon, User, ExternalLink, Film, Check } from 'lucide-react';

interface VideoData {
  platform: string;
  title: string;
  thumbnail?: string;
  author?: string;
  videoUrl?: string;
  audioUrl?: string;
  images?: string[];
}

interface VideoCardProps {
  data: VideoData;
  originalUrl: string;
}

export default function VideoCard({ data, originalUrl }: VideoCardProps) {
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState(false);

  const cleanFilename = (title: string, ext: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 50) + `.${ext}`;
  };

  const getPlatformColors = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return {
          bg: 'bg-white dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          badge: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
          gradient: 'from-slate-700 to-slate-900 shadow-slate-200 dark:from-slate-600 dark:to-slate-800'
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
          gradient: 'from-blue-600 to-blue-700 shadow-blue-100 dark:from-blue-500 dark:to-blue-600'
        };
    }
  };

  const colors = getPlatformColors(data.platform);
  const isImages = data.images && data.images.length > 0;

  // Generate thumbnail fallback if empty
  const getThumbnailSrc = () => {
    if (data.thumbnail) return data.thumbnail;
    
    return ''; // Will trigger fallback icon UI
  };

  const thumbnailSrc = getThumbnailSrc();

  // Helper to trigger direct download via proxy
  const handleDownload = async (url: string, filename: string, setLoader: (val: boolean) => void) => {
    try {
      setLoader(true);
      
      // Let's create the proxy download link
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      // Create a temporary link element and click it
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Keep loader for a short time to simulate transition
      setTimeout(() => setLoader(false), 2000);
    } catch (err) {
      console.error('Download click error:', err);
      setLoader(false);
      // Fallback: Open in new tab
      window.open(url, '_blank');
    }
  };


  return (
    <div className={`w-full bg-white dark:bg-slate-800 rounded-xl p-5 md:p-6 border ${colors.border} shadow-sm overflow-hidden`}>
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Media Preview / Thumbnail */}
        <div className="w-full md:w-48 h-48 md:h-36 shrink-0 relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
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
            <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
              <Film className="w-12 h-12 stroke-[1.5]" />
              <span className="text-xs font-medium">Sin Vista Previa</span>
            </div>
          )}
          
          {/* Platform Badge Overlay */}
          <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${colors.badge}`}>
            {data.platform}
          </span>
        </div>
 
        {/* Content Details */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 md:line-clamp-1 mb-2">
              {data.title || 'Video descargado'}
            </h3>
            
            {data.author && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">{data.author}</span>
              </div>
            )}
          </div>

          {/* Download options */}
          {!isImages ? (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {data.videoUrl && (
                <button
                  onClick={() => handleDownload(data.videoUrl!, cleanFilename(data.title || 'video', 'mp4'), setDownloadingVideo)}
                  disabled={downloadingVideo}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-white bg-gradient-to-r ${colors.gradient} hover:opacity-90 shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-75`}
                >
                  {downloadingVideo ? (
                    <>
                      <div className="spinner !w-4 !h-4 !border-t-white" />
                      <span>Descargando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Descargar Video (HD)</span>
                    </>
                  )}
                </button>
              )}

              {data.audioUrl && (
                <button
                  onClick={() => handleDownload(data.audioUrl!, cleanFilename(data.title || 'audio', 'mp3'), setDownloadingAudio)}
                  disabled={downloadingAudio}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-200 active:scale-95 disabled:opacity-75"
                >
                  {downloadingAudio ? (
                    <>
                      <div className="spinner !w-4 !h-4 !border-t-slate-700" />
                      <span>Descargando...</span>
                    </>
                  ) : (
                    <>
                      <Music className="w-5 h-5 text-slate-650 dark:text-slate-400" />
                      <span>Descargar MP3</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 font-medium">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <span>Esta publicación contiene imágenes ({data.images?.length}). Descárgalas a continuación.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of images for TikTok slideshows */}
      {isImages && data.images && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-5">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Fotos de la Galería
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data.images.map((img, idx) => (
              <div 
                key={idx} 
                className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={img} 
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => handleDownload(img, cleanFilename(`${data.title || 'image'}_${idx + 1}`, 'jpg'), () => {})}
                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg active:scale-90"
                    title="Descargar imagen"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 dark:bg-slate-800/90 text-[10px] text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 shadow-sm">
                  Foto {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative direct link for safety */}
      <div className="mt-4 flex justify-end">
        <a 
          href={data.videoUrl || data.images?.[0] || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-1"
        >
          <span>Enlace CDN directo</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
