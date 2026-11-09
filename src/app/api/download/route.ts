import { NextResponse } from 'next/server';
import { sendTelegramAlert, extractClientMeta } from '@/lib/telegram';

export const maxDuration = 60; // Allow Vercel to wait up to 60s for Hugging Face/EC2 transcoding

export async function POST(request: Request) {
  try {
    let { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Por favor, ingresa una URL válida.' },
        { status: 400 }
      );
    }

    let cleanUrl = url.trim();

    // 1. Resolver enlaces acortados (vm.tiktok.com, vt.tiktok.com, /t/)
    if (
      cleanUrl.includes('vm.tiktok.com') || 
      cleanUrl.includes('vt.tiktok.com') || 
      cleanUrl.includes('v.tiktok.com') ||
      cleanUrl.includes('tiktok.com/t/')
    ) {
      try {
        const headRes = await fetch(cleanUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          }
        });
        if (headRes.url) {
          cleanUrl = headRes.url;
        }
      } catch (e) {
        console.error('Error resolving shortened TikTok URL redirect:', e);
      }
    }

    // 2. Detectar si el enlace es en realidad un perfil completo
    const profileMatch = cleanUrl.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)\/?(\?[^/]*)?$/i);
    const hasMediaSubpath = cleanUrl.includes('/video/') || cleanUrl.includes('/photo/') || cleanUrl.includes('/story/') || cleanUrl.includes('/stories/');
    if (profileMatch && !hasMediaSubpath) {
      return NextResponse.json({
        success: false,
        isProfile: true,
        username: profileMatch[1],
        error: `Este enlace corresponde al perfil de @${profileMatch[1]}. Cargando su perfil...`
      }, { status: 400 });
    }

    let platform = 'unknown';
    const lowerUrl = cleanUrl.toLowerCase();

    if (lowerUrl.includes('tiktok.com')) {
      platform = 'tiktok';
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      platform = 'twitter';
    }

    if (platform === 'unknown') {
      return NextResponse.json(
        { success: false, error: 'Plataforma no soportada. Solo TikTok (Videos, Historias, Fotos) y X (Twitter).' },
        { status: 400 }
      );
    }

    const resolveUrl = (path: string) => {
      if (!path) return '';
      return path.startsWith('http') ? path : `https://tikwm.com${path}`;
    };

    // Detectar si es historia por URL
    const isStoryUrl = lowerUrl.includes('/story/') || lowerUrl.includes('/stories/');

    // Notificar al bot de Telegram
    try {
      const clientMeta = extractClientMeta(request);
      sendTelegramAlert({
        action: isStoryUrl ? 'DESCARGA_HISTORIA' : 'DESCARGA_VIDEO',
        detail: cleanUrl,
        ...clientMeta
      }).catch(() => {});
    } catch {}

    // 3. X (Twitter) Handler
    if (platform === 'twitter') {
      try {
        const match = cleanUrl.match(/\/status\/(\d+)/);
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
              audioUrl: '',
              mediaType: 'video',
              formatLabel: 'Video de X (Twitter)'
            });
          } else {
             return NextResponse.json({ success: false, error: 'No se encontró ningún video en este Tweet.' }, { status: 400 });
          }
        } else {
           return NextResponse.json({ success: false, error: 'No se encontraron medios en este Tweet.' }, { status: 400 });
        }
      } catch (err) {
        console.error('X/Twitter API Error:', err);
        return NextResponse.json({ success: false, error: 'Error al procesar el enlace de X. Reinténtalo más tarde.' }, { status: 500 });
      }
    }

    // 4. TikTok Handler (Detección precisa: Fotos animadas Live, Galerías, Historias y Videos Full HD)
    if (platform === 'tiktok') {
      let tikwmData: any = null;

      try {
        const tikwmResponse = await fetch('https://tikwm.com/api/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            url: cleanUrl,
            hd: '1'
          })
        });

        if (tikwmResponse.ok) {
          const res = await tikwmResponse.json();
          if (res.code === 0 && res.data) {
            tikwmData = res.data;
          }
        }
      } catch (err) {
        console.error('TikWM request error:', err);
      }

      if (tikwmData) {
        const data = tikwmData;
        const images = (data.images || []).map(resolveUrl);
        const liveImages = (data.live_images || []).map((p: any) => resolveUrl(p)).filter(Boolean);
        const hasLiveImagesArray = liveImages.length > 0;
        const authorName = data.author?.nickname || data.author?.unique_id || '';
        
        // TikTok play URL: en fotos TikWM devuelve el audio en play. Verificar si es audio o video real:
        const rawPlay = data.play || data.wmplay || '';
        const isAudioPlay = Boolean(
          rawPlay.includes('mime_type=audio') || 
          rawPlay.includes('ies-music') || 
          (data.music && rawPlay === data.music)
        );

        // Selección de Calidad Máxima:
        // Priorizar hdplay para obtener la resolución más alta (1080p / 720p Full HD)
        const bestVideoUrl = isAudioPlay ? '' : resolveUrl(data.hdplay || data.play || data.wmplay);
        const validVideoUrl = bestVideoUrl;

        // CASO 1: FOTO ESTÁTICA ÚNICA (Foto normal de historia o publicación)
        // Regla: una foto normal NO debe tener opción de MP3 ni de video
        if (images.length === 1 && !hasLiveImagesArray && !validVideoUrl) {
          return NextResponse.json({
            success: true,
            platform,
            title: data.title || (isStoryUrl ? 'Historia en Foto de TikTok' : 'Foto de TikTok'),
            thumbnail: images[0] || data.cover || '',
            videoUrl: '', // No es video
            audioUrl: '', // NO tiene MP3 porque es una foto normal
            photoUrl: images[0],
            images: images,
            liveImages: [],
            isLivePhoto: false,
            isStory: isStoryUrl,
            mediaType: 'photo',
            formatLabel: isStoryUrl ? 'Historia en Foto (HD)' : 'Foto en Alta Definición (HD)',
            author: authorName
          });
        }

        // CASO 2: FOTO ANIMADA (Live Photo / clip corto de 3s en movimiento con audio)
        if (hasLiveImagesArray || (images.length === 1 && validVideoUrl)) {
          const primaryLiveVideo = liveImages[0] || validVideoUrl;
          return NextResponse.json({
            success: true,
            platform,
            title: data.title || 'Foto Animada de TikTok',
            thumbnail: data.cover || images[0] || '',
            videoUrl: primaryLiveVideo, // Video MP4 animado H.264
            audioUrl: resolveUrl(data.music),
            photoUrl: images[0] || '',
            images: images,
            liveImages: liveImages.length > 0 ? liveImages : [primaryLiveVideo],
            isLivePhoto: true,
            isStory: isStoryUrl,
            mediaType: 'live_photo',
            formatLabel: 'Foto Animada (Live Photo · 3s)',
            author: authorName
          });
        }

        // CASO 3: GALERÍA DE FOTOS (Slideshow de 2 o más fotos)
        if (images.length > 1) {
          return NextResponse.json({
            success: true,
            platform,
            title: data.title || 'Galería de fotos de TikTok',
            thumbnail: data.cover || images[0] || '',
            videoUrl: validVideoUrl, // Video compilado si existe
            audioUrl: resolveUrl(data.music),
            photoUrl: images[0],
            images: images,
            liveImages: [],
            isLivePhoto: false,
            isStory: isStoryUrl,
            mediaType: 'gallery',
            formatLabel: `Galería de Fotos (${images.length} fotos)`,
            author: authorName
          });
        }

        // CASO 4: VIDEO DE TIKTOK (Extraído en máxima resolución disponible)
        if (validVideoUrl) {
          const sizeBytes = Math.max(data.size || 0, data.hd_size || 0);
          let label = 'Video Full HD (1080p)';
          if (sizeBytes > 2_500_000) {
            label = 'Video Full HD (1080p)';
          } else if (sizeBytes > 1_400_000 || data.hdplay) {
            label = 'Video HD (720p)';
          } else {
            label = 'Video Original TikTok (540p)';
          }
          if (isStoryUrl) {
            label = `Historia (Máxima Calidad · 24h)`;
          }

          return NextResponse.json({
            success: true,
            platform,
            title: data.title || (isStoryUrl ? 'Historia de TikTok' : 'Video de TikTok'),
            thumbnail: data.cover || '',
            videoUrl: validVideoUrl,
            audioUrl: resolveUrl(data.music),
            photoUrl: '',
            images: [],
            liveImages: [],
            isLivePhoto: false,
            isStory: isStoryUrl,
            mediaType: isStoryUrl ? 'story' : 'video',
            formatLabel: label,
            author: authorName,
            duration: data.duration || 0,
            fileSize: sizeBytes
          });
        }
      }

      // CASO 5: VIDEO O HISTORIA VÍA EC2 (Forzando códec H.264 universal)
      try {
        const hfApiUrl = 'http://3.19.208.2:8000/api/extract-stream';
        const response = await fetch(hfApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url: cleanUrl,
            format_preference: 'h264'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return NextResponse.json(
            { success: false, error: errorData.detail || 'La publicación o historia es privada o no existe.' },
            { status: response.status }
          );
        }

        const result = await response.json();
        
        const isFhd = (result.width && result.width >= 1080) || (result.height && result.height >= 1080);
        const isStory = isStoryUrl || result.is_story || Boolean(result.media_type === 'story');
        const formatLabel = isStory ? 'Historia de TikTok' : (isFhd ? 'Video Full HD (1080p H.264)' : 'Video HD (H.264)');
        const mediaType = isStory ? 'story' : (result.media_type || 'video');
        
        return NextResponse.json({
          success: true,
          platform: result.platform || platform,
          title: result.title || (isStory ? 'Historia de TikTok' : 'Video de TikTok'),
          thumbnail: result.thumbnail || (tikwmData?.cover || ''),
          videoUrl: result.videoUrl,
          audioUrl: resolveUrl(tikwmData?.music) || '',
          author: result.author || tikwmData?.author?.nickname || tikwmData?.author?.unique_id || '',
          mediaType,
          formatLabel,
          isStory,
          width: result.width,
          height: result.height,
          duration: result.duration
        });
        
      } catch (err) {
        console.error('Backend extraction error:', err);
        const fbPlay = tikwmData?.play || tikwmData?.hdplay || tikwmData?.wmplay;
        if (tikwmData && fbPlay) {
          const vUrl = resolveUrl(fbPlay);
          return NextResponse.json({
            success: true,
            platform,
            title: tikwmData.title || (isStoryUrl ? 'Historia de TikTok' : 'Video de TikTok'),
            thumbnail: tikwmData.cover || '',
            videoUrl: vUrl,
            audioUrl: resolveUrl(tikwmData.music),
            author: tikwmData.author?.nickname || tikwmData.author?.unique_id || '',
            mediaType: isStoryUrl ? 'story' : 'video',
            formatLabel: isStoryUrl ? 'Historia de TikTok (24h)' : 'Video HD (H.264)',
            isStory: isStoryUrl,
            duration: tikwmData.duration || 0
          });
        }
        return NextResponse.json(
          { success: false, error: 'El servidor de descargas está ocupado. Intenta de nuevo en unos segundos.' },
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
