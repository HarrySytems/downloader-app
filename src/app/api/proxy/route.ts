import { NextResponse } from 'next/server';
import { sendTelegramAlert, extractClientMeta } from '@/lib/telegram';

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let fileUrl: string = searchParams.get('url') || '';
    const filename = searchParams.get('filename') || 'media_file.mp4';
    const requestedFormat = searchParams.get('format') || '';
    const isMute = searchParams.get('mute') === '1' || searchParams.get('mute') === 'true';
    const isLiveParam = searchParams.get('live') === '1' || searchParams.get('live') === 'true';
    let audioMuxUrl: string = searchParams.get('audio') || '';

    if (!fileUrl) {
      return new Response('URL parameter is required', { status: 400 });
    }

    const lowerFilename = filename.toLowerCase();
    const isPhoto = lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg') || lowerFilename.endsWith('.png') || lowerFilename.endsWith('.webp');
    const isMp3 = requestedFormat === 'mp3' || lowerFilename.endsWith('.mp3');

    // 1. Detectar si fileUrl es una página web de TikTok en vez de un stream directo
    const isTikTokWebUrl = (
      fileUrl.includes('tiktok.com/@') || 
      fileUrl.includes('tiktok.com/t/') || 
      fileUrl.includes('vm.tiktok.com') || 
      fileUrl.includes('vt.tiktok.com') ||
      fileUrl.includes('/video/') || 
      fileUrl.includes('/photo/') ||
      fileUrl.includes('/story/') ||
      fileUrl.includes('/stories/')
    ) && !fileUrl.includes('.mp4') && 
       !fileUrl.includes('.jpg') && 
       !fileUrl.includes('.jpeg') && 
       !fileUrl.includes('.webp') && 
       !fileUrl.includes('.png') && 
       !fileUrl.includes('.mp3') && 
       !fileUrl.includes('download-stream') && 
       !fileUrl.includes('tikwm.com/video') && 
       !fileUrl.includes('tiktokcdn');

    if (isTikTokWebUrl) {
      if (isPhoto) {
        // Para fotos: extraer la imagen original de TikTok
        try {
          const twRes = await fetch('https://tikwm.com/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ url: fileUrl })
          });
          if (twRes.ok) {
            const twData = await twRes.json();
            if (twData.code === 0 && twData.data) {
              const d = twData.data;
              if (d.images && d.images.length > 0) {
                fileUrl = d.images[0];
              } else if (d.cover) {
                fileUrl = d.cover;
              }
            }
          }
        } catch (e) {
          console.error('TikWM photo extract in proxy error:', e);
        }
      } else {
        // Para videos, Fotos Animadas (live_images) o audios: extraer stream real H.264
        try {
          const twRes = await fetch('https://tikwm.com/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ url: fileUrl, hd: '1' })
          });
          if (twRes.ok) {
            const twData = await twRes.json();
            if (twData.code === 0 && twData.data) {
              const d = twData.data;
              const resolveTw = (u: string) => (u ? (u.startsWith('http') ? u : `https://tikwm.com${u}`) : '');
              const liveArr = (d.live_images || []).map((x: string) => resolveTw(x)).filter(Boolean);
              const musicRes = resolveTw(d.music || '');
              const isAudioUrl = (u?: string) => Boolean(
                u && (u.includes('mime_type=audio') || u.includes('ies-music') || (d.music && u === d.music))
              );

              if (isMp3 && musicRes) {
                fileUrl = musicRes;
              } else if (liveArr.length > 0) {
                // LIVE PHOTO DETECTADA: SIEMPRE usar el clip animado en movimiento + guardar música para muxing
                fileUrl = liveArr[0];
                if (musicRes && !audioMuxUrl && !isMute) {
                  audioMuxUrl = musicRes;
                }
              } else if (d.play && !isAudioUrl(d.play)) {
                // SIEMPRE H.264 UNIVERSAL (avc1) cuando play es video real
                fileUrl = resolveTw(d.play);
              } else if (d.hdplay && !isAudioUrl(d.hdplay)) {
                fileUrl = resolveTw(d.hdplay);
              } else if (d.images && d.images.length > 0) {
                fileUrl = d.images[0];
              }
            }
          }
        } catch (e) {
          console.error('TikWM extract in proxy error:', e);
        }
      }
    } else if (isPhoto && (fileUrl.includes('.webp') || fileUrl.includes('photomode'))) {
      // Red de seguridad infalible para fotos: si se solicita un JPG pero la URL es un WebP del CDN,
      // extraer el ID del post y resolver automáticamente el JPEG Full HD original para compatibilidad con Paint
      const idMatch = filename.match(/(\d{18,20})/) || fileUrl.match(/(\d{18,20})/);
      if (idMatch) {
        try {
          const twRes = await fetch('https://tikwm.com/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ url: `https://www.tiktok.com/@tiktok/photo/${idMatch[1]}` })
          });
          if (twRes.ok) {
            const twData = await twRes.json();
            if (twData.code === 0 && twData.data?.images && twData.data.images.length > 0) {
              fileUrl = twData.data.images[0];
            }
          }
        } catch (e) {
          console.error('Auto-upgrade WebP to JPEG error in proxy:', e);
        }
      }
    }

    // 2. Notificar en tiempo real al bot de Telegram de la descarga
    try {
      const clientMeta = extractClientMeta(request);
      const isStory = lowerFilename.includes('historia');
      const action = isMp3 ? 'DESCARGA_VIDEO' : (isStory ? 'DESCARGA_HISTORIA' : (isPhoto ? 'DESCARGA_FOTO' : 'DESCARGA_VIDEO'));
      sendTelegramAlert({
        action,
        detail: filename,
        ...clientMeta
      }).catch(() => {});
    } catch {}

    // 3. Cabecera Referer según plataforma para evitar bloqueos del CDN
    let referer = 'https://www.tiktok.com/';
    if (fileUrl.includes('twimg.com') || fileUrl.includes('twitter.com') || fileUrl.includes('x.com')) {
      referer = 'https://twitter.com/';
    } else if (fileUrl.includes('tokcdn.com') || fileUrl.includes('snapcdn.app')) {
      referer = 'https://tikvid.io/';
    }

    const clientRange = request.headers.get('range');
    let response: Response | null = null;

    // Si es Live Photo (para muxing de audio original / H.264) o video con Mute real, procesar en EC2
    const shouldProcessMuxOrMute = !isPhoto && !isMp3 && (isMute || isLiveParam || Boolean(audioMuxUrl));
    if (shouldProcessMuxOrMute) {
      try {
        const muxUrl = `http://3.19.208.2:8000/api/mux-live?video_url=${encodeURIComponent(fileUrl)}&audio_url=${encodeURIComponent(isMute ? '' : audioMuxUrl)}&mute=${isMute ? 'true' : 'false'}&filename=${encodeURIComponent(filename)}`;
        const muxHeaders: HeadersInit = {};
        if (clientRange) muxHeaders['Range'] = clientRange;
        const muxRes = await fetch(muxUrl, {
          cache: 'no-store',
          headers: muxHeaders
        });
        if (muxRes.ok || muxRes.status === 206) {
          response = muxRes;
        }
      } catch (muxErr) {
        console.error('EC2 mux_live fallback triggered:', muxErr);
      }
    }

    if (!response) {
      const fetchHeaders: HeadersInit = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': referer,
      };

      // Propagar Range si el cliente lo solicita (soporte de streaming en iPhone y Windows Media Player)
      if (clientRange && !isPhoto) {
        fetchHeaders['Range'] = clientRange;
      }

      response = await fetch(fileUrl, {
        cache: 'no-store',
        headers: fetchHeaders
      });
    }

    if (!response.ok && response.status !== 206) {
      return new Response('Error al recuperar el archivo multimedia', { status: response.status });
    }

    const upstreamContentType = (response.headers.get('Content-Type') || '').toLowerCase();

    // Si la respuesta fue HTML pero se esperaba archivo multimedia, rechazar para evitar archivos corruptos de 411KB
    if (upstreamContentType.includes('text/html') && !filename.endsWith('.html')) {
      return new Response('El contenido no pudo ser extraído en formato de video/foto válido.', { status: 422 });
    }

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    let contentType = response.headers.get('Content-Type');
    if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (lowerFilename.endsWith('.png')) {
      contentType = 'image/png';
    } else if (lowerFilename.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (lowerFilename.endsWith('.mp4')) {
      contentType = 'video/mp4';
    } else if (!contentType || contentType === 'application/octet-stream') {
      contentType = 'video/mp4';
    }

    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      headers.set('Content-Range', contentRange);
      headers.set('Accept-Ranges', 'bytes');
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    });

  } catch (error) {
    console.error('Download Proxy Error:', error);
    return new Response('Error interno del servidor durante la descarga', { status: 500 });
  }
}
