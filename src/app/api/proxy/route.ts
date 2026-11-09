import { NextResponse } from 'next/server';
import { sendTelegramAlert, extractClientMeta } from '@/lib/telegram';

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let fileUrl: string = searchParams.get('url') || '';
    const filename = searchParams.get('filename') || 'media_file.mp4';
    const requestedFormat = searchParams.get('format') || '';

    if (!fileUrl) {
      return new Response('URL parameter is required', { status: 400 });
    }

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
      const isMp3 = requestedFormat === 'mp3' || filename.toLowerCase().endsWith('.mp3');
      const isPhoto = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg') || filename.toLowerCase().endsWith('.png');

      try {
        // Consultar motor backend EC2 para extracción nativa Full HD 1080p en H.264
        const ec2Res = await fetch('http://3.19.208.2:8000/api/extract-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: fileUrl, format_preference: 'h264' }),
          cache: 'no-store'
        });

        if (ec2Res.ok) {
          const ec2Data = await ec2Res.json();
          if (ec2Data.success && ec2Data.videoUrl) {
            fileUrl = ec2Data.videoUrl;
          }
        }
      } catch (e) {
        console.error('EC2 extract in proxy error:', e);
      }

      // Si EC2 no devolvió URL directa, consultar TikWM con HD
      if (fileUrl.includes('tiktok.com/@') || fileUrl.includes('/video/') || fileUrl.includes('/photo/')) {
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
              if (isMp3 && d.music) {
                fileUrl = d.music.startsWith('http') ? d.music : `https://tikwm.com${d.music}`;
              } else if (isPhoto && d.images && d.images.length > 0) {
                fileUrl = d.images[0];
              } else if (d.hdplay || d.play) {
                const vid = d.hdplay || d.play;
                fileUrl = vid.startsWith('http') ? vid : `https://tikwm.com${vid}`;
              }
            }
          }
        } catch (e) {
          console.error('TikWM extract in proxy error:', e);
        }
      }
    }

    // 2. Notificar en tiempo real al bot de Telegram de la descarga
    try {
      const clientMeta = extractClientMeta(request);
      const isStory = filename.toLowerCase().includes('historia');
      const isPhoto = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.png') || filename.toLowerCase().endsWith('.webp');
      const isAudio = filename.toLowerCase().endsWith('.mp3');
      const action = isAudio ? 'DESCARGA_VIDEO' : (isStory ? 'DESCARGA_HISTORIA' : (isPhoto ? 'DESCARGA_FOTO' : 'DESCARGA_VIDEO'));
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

    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': referer,
    };

    // Propagar Range si el cliente lo solicita (soporte de streaming en iPhone y Windows Media Player)
    const clientRange = request.headers.get('range');
    if (clientRange) {
      fetchHeaders['Range'] = clientRange;
    }

    const response = await fetch(fileUrl, {
      cache: 'no-store',
      headers: fetchHeaders
    });

    if (!response.ok && response.status !== 206) {
      return new Response('Error retrieving the file from backend', { status: response.status });
    }

    const upstreamContentType = (response.headers.get('Content-Type') || '').toLowerCase();

    // Si la respuesta fue HTML pero se esperaba archivo multimedia, rechazar para evitar archivos corruptos de 411KB
    if (upstreamContentType.includes('text/html') && !filename.endsWith('.html')) {
      return new Response('El contenido no pudo ser extraído en formato de video/foto válido.', { status: 422 });
    }

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    // Detección precisa de Content-Type compatible con Windows Media Player, Paint y móviles
    let contentType = response.headers.get('Content-Type');
    const lowerFilename = filename.toLowerCase();

    if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (lowerFilename.endsWith('.png')) {
      contentType = 'image/png';
    } else if (lowerFilename.endsWith('.gif')) {
      contentType = 'image/gif';
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
    return new Response('Internal Server Error during download proxying', { status: 500 });
  }
}
