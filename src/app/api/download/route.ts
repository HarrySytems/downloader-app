import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow Vercel to wait up to 60s for Hugging Face transcoding

interface TikVidResult {
  videoUrl: string;
  thumbnail: string;
  title: string;
}

async function fetchTikVidHD(tiktokUrl: string): Promise<TikVidResult | null> {
  try {
    const apiResponse = await fetch('https://tikvid.io/api/ajaxSearch', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://tikvid.io',
        'Referer': 'https://tikvid.io/en'
      },
      body: new URLSearchParams({
        q: tiktokUrl,
        lang: 'en'
      })
    });

    if (!apiResponse.ok) return null;
    const result = await apiResponse.json();
    if (result.status !== 'ok' || !result.data) return null;

    const htmlData = result.data;
    
    // Extract thumbnail
    const imgMatch = htmlData.match(/<img[^>]+src="([^"]+)"/);
    const thumbnail = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : '';

    // Extract title
    const titleMatch = htmlData.match(/<h3>([^<]+)<\/h3>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Video de TikTok';

    // Extract tokens from href="https://dl.snapcdn.app/get?token=..."
    const regex = /href="https:\/\/dl\.snapcdn\.app\/get\?token=([^"]+)"/g;
    let match;
    let hdUrl: string | null = null;
    let regularUrl: string | null = null;

    while ((match = regex.exec(htmlData)) !== null) {
      const token = match[1];
      try {
        const payloadParts = token.split('.');
        if (payloadParts.length >= 2) {
          const payloadJson = Buffer.from(payloadParts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          if (payload.filename && payload.filename.includes('-hd.mp4')) {
            hdUrl = payload.url;
            break;
          } else if (payload.filename && payload.filename.endsWith('.mp4')) {
            regularUrl = payload.url;
          }
        }
      } catch (err) {
        console.error('Error decoding TikVid token:', err);
      }
    }

    const videoUrl = hdUrl || regularUrl;
    if (!videoUrl) return null;

    return {
      videoUrl,
      thumbnail,
      title
    };
  } catch (err) {
    console.error('TikVid API scrape failed:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    let { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Por favor, ingresa una URL válida.' },
        { status: 400 }
      );
    }
    // We preserve the original URL so TikWM can detect if it's a photo slideshow
    // and return the exact images instead of a converted video/audio file.
    let platform = 'unknown';
    const lowerUrl = url.toLowerCase().trim();

    if (lowerUrl.includes('tiktok.com')) {
      platform = 'tiktok';
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      platform = 'twitter';
    }

    if (platform === 'unknown') {
      return NextResponse.json(
        { success: false, error: 'Plataforma no soportada. Solo TikTok (Videos/Historias) y X (Twitter).' },
        { status: 400 }
      );
    }

    const resolveUrl = (path: string) => {
      if (!path) return '';
      return path.startsWith('http') ? path : `https://tikwm.com${path}`;
    };

    // 1. TikTok Handler (Comentado para forzar la alta calidad de Hugging Face siempre)
    // Anteriormente usaba TikWM, pero este limita la calidad a 540p/720p. 
    // Ahora todo va a Hugging Face para obtener el archivo original Full HD 1080p.
    
    // Check if we already have a response from TikWM or if it failed/fell through
    // If it fell through (e.g. TikWM failed on a Story), platform will still be 'tiktok'

    // 2. X (Twitter) Handler (using vxtwitter public API)
    if (platform === 'twitter') {
      try {
        // Extraer el ID del tweet de la URL
        const match = url.match(/\/status\/(\d+)/);
        if (!match) {
          return NextResponse.json({ success: false, error: 'URL de X (Twitter) inválida.' }, { status: 400 });
        }
        const tweetId = match[1];
        
        const response = await fetch(`https://api.vxtwitter.com/Twitter/status/${tweetId}`);
        const result = await response.json();
        
        if (result && result.media_extended && result.media_extended.length > 0) {
          const videoMedia = result.media_extended.find((m: any) => m.type === 'video');
          if (videoMedia) {
            return NextResponse.json({
              success: true,
              platform,
              title: result.text || 'Video de X (Twitter)',
              thumbnail: videoMedia.thumbnail_url || '',
              videoUrl: videoMedia.url,
              audioUrl: '' // vxtwitter usually doesn't separate audio
            });
          } else {
             return NextResponse.json({ success: false, error: 'No se encontró ningún video en este Tweet. Asegúrate de que contenga multimedia.' }, { status: 400 });
          }
        } else {
           return NextResponse.json({ success: false, error: 'No se encontraron medios en este Tweet.' }, { status: 400 });
        }
      } catch (err) {
        console.error('X/Twitter API Error:', err);
        return NextResponse.json({ success: false, error: 'Error al procesar el enlace de X. Reinténtalo más tarde.' }, { status: 500 });
      }
    }

    // 3. TikTok Handler (Detecta fotos vía TikWM, descarga videos en Full HD vía Hugging Face)
    if (platform === 'tiktok') {
      try {
        const tikwmResponse = await fetch('https://tikwm.com/api/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            url: url,
            hd: '1'
          })
        });

        if (tikwmResponse.ok) {
          const tikwmData = await tikwmResponse.json();
          if (tikwmData.code === 0 && tikwmData.data) {
            const data = tikwmData.data;
            // Si el post contiene un listado de imágenes, es un slideshow. Devolvemos las fotos directamente.
            if (data.images && data.images.length > 0) {
              return NextResponse.json({
                success: true,
                platform,
                title: data.title || 'Galería de fotos de TikTok',
                thumbnail: data.cover || '',
                videoUrl: '',
                audioUrl: resolveUrl(data.music),
                images: data.images.map(resolveUrl)
              });
            }
          }
        }
      } catch (err) {
        console.error('TikWM slideshow check error:', err);
      }

      // Intentar obtener el video de alta calidad (Original HD) usando TikVid
      const tikvidRes = await fetchTikVidHD(url);
      if (tikvidRes) {
        return NextResponse.json({
          success: true,
          platform,
          title: tikvidRes.title,
          thumbnail: tikvidRes.thumbnail,
          videoUrl: tikvidRes.videoUrl,
          audioUrl: ''
        });
      }

      // Fallback: Si es un video normal o si TikWM falla, usamos el motor en Hugging Face (Full HD)
      try {
        const hfApiUrl = 'https://veterano901-servidorpropio.hf.space/api/extract-stream';
        
        // Detectar si el usuario está en móvil o tablet para elegir el formato ideal
        const userAgent = request.headers.get('user-agent') || '';
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
        const formatPreference = isMobile ? 'best' : 'h264';
        
        const response = await fetch(hfApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url,
            format_preference: formatPreference
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return NextResponse.json(
            { success: false, error: errorData.detail || 'La historia o video es privado o no existe.' },
            { status: response.status }
          );
        }

        const result = await response.json();
        
        return NextResponse.json({
          success: true,
          platform: result.platform || platform,
          title: result.title || `Historia de TikTok`,
          thumbnail: result.thumbnail || '',
          videoUrl: result.videoUrl, // Enlace directo desde Hugging Face
          audioUrl: '', // El audio ya está acoplado en Hugging Face
        });
        
      } catch (err) {
        console.error('Hugging Face API Error:', err);
        return NextResponse.json(
          { success: false, error: 'El motor de rescate está saturado. Intenta de nuevo en 30 segundos.' },
          { status: 500 }
        );
      }
    }

  } catch (error: any) {
    console.error('Global API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error interno en el servidor.' },
      { status: 500 }
    );
  }
}
