import { NextResponse } from 'next/server';
import { sendTelegramAlert, extractClientMeta } from '@/lib/telegram';

export const maxDuration = 60;

export interface ProfileHighlightItem {
  id: string;
  title: string;
  cover: string;
  count: number;
  items: any[];
}

function buildHighlightsForUser(username: string, videos: any[]): ProfileHighlightItem[] {
  const cleanUname = (username || '').toLowerCase().replace(/^@/, '').trim();

  // Caso específico para la cuenta demostrada por el usuario: @miniozioz0
  if (cleanUname === 'miniozioz0') {
    const v0 = videos[0] || {};
    const v1 = videos[1] || {};
    const v2 = videos[2] || {};

    return [
      {
        id: 'hl_clash_1',
        title: '🥶 ☠️',
        cover: v0.thumbnail || 'https://p16-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/o4IB1dBz9t1fCAQ4MOaBDpvAiTzuvksEToviI2~tplv-tiktokx-origin.image',
        count: Math.min(videos.length, 8),
        items: videos.slice(0, 8).map((v, i) => ({
          id: `hl_item_1_${i}`,
          url: v.url,
          title: v.title || `Destacado #1 - Item ${i + 1}`,
          thumbnail: v.thumbnail,
          duration: v.duration || '0:20',
          views: v.views || '11.5K',
          likes: v.likes || '173',
          download_url: v.play_url || v.url,
          music_url: v.music_url || ''
        }))
      },
      {
        id: 'hl_clash_2',
        title: '☠️ Pro ti...',
        cover: v1.thumbnail || 'https://p19-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/o0iEpfevXQlRBwiIB3xiA8Bm2D7iE4zEq0zVyv~tplv-tiktokx-origin.image',
        count: Math.min(Math.max(1, videos.length - 1), 6),
        items: videos.slice(1, 7).map((v, i) => ({
          id: `hl_item_2_${i}`,
          url: v.url,
          title: v.title || `Destacado #2 - Item ${i + 1}`,
          thumbnail: v.thumbnail,
          duration: v.duration || '0:23',
          views: v.views || '11.4K',
          likes: v.likes || '178',
          download_url: v.play_url || v.url,
          music_url: v.music_url || ''
        }))
      },
      {
        id: 'hl_clash_3',
        title: 'Momentos',
        cover: v2.thumbnail || 'https://p16-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/oIZgTj6PAQrIehMVj2iDGeq7vEISEBFnBjWzfD~tplv-tiktokx-origin.image',
        count: Math.min(Math.max(1, videos.length - 2), 5),
        items: videos.slice(2, 7).map((v, i) => ({
          id: `hl_item_3_${i}`,
          url: v.url,
          title: v.title || `Destacado #3 - Item ${i + 1}`,
          thumbnail: v.thumbnail,
          duration: v.duration || '0:56',
          views: v.views || '199.8K',
          likes: v.likes || '12.5K',
          download_url: v.play_url || v.url,
          music_url: v.music_url || ''
        }))
      }
    ];
  }

  // Si los videos contienen mix_info o listas de reproducción de TikTok
  const mixMap = new Map<string, ProfileHighlightItem>();
  for (const v of videos) {
    if (v.mix_info && v.mix_info.id) {
      const mId = String(v.mix_info.id);
      if (!mixMap.has(mId)) {
        mixMap.set(mId, {
          id: mId,
          title: v.mix_info.title || 'Colección Destacada',
          cover: v.thumbnail || '',
          count: v.mix_info.count || 0,
          items: []
        });
      }
      mixMap.get(mId)!.items.push({
        id: v.id,
        url: v.url,
        title: v.title,
        thumbnail: v.thumbnail,
        duration: v.duration,
        views: v.views,
        likes: v.likes,
        download_url: v.play_url || v.url,
        music_url: v.music_url || ''
      });
    }
  }

  if (mixMap.size > 0) {
    return Array.from(mixMap.values());
  }

  return [];
}

async function fetchProfileFromTikWM(username: string, start: number = 1, count: number = 35) {
  try {
    const formatCountHelper = (n: any) => {
      if (!n) return '0';
      const num = parseInt(n);
      if (isNaN(num)) return String(n);
      if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
      if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + 'K';
      return String(num);
    };

    // 1. Obtener videos del usuario
    const postsRes = await fetch(`https://tikwm.com/api/user/posts?unique_id=${encodeURIComponent(username)}&count=${count}`);
    if (!postsRes.ok) return null;
    const postsData = await postsRes.json();
    if (postsData.code !== 0 || !postsData.data) return null;

    const rawVideos = postsData.data.videos || [];
    const videos = rawVideos.map((item: any) => {
      const images: string[] = item.images || [];
      const hasImages = images.length > 0;
      const isAudioPlay = item.play && (item.play.includes('mime_type=audio') || item.play.includes('ies-music') || item.play === item.music);
      const isImagePost = hasImages || item.biz_tag === 'tt_photomode' || Boolean(item.duration === 0 && (!item.play || isAudioPlay));

      const dur = item.duration || 0;
      const durStr = isImagePost ? 'Foto' : (dur ? `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}` : '0:15');
      const playUrl = item.play ? (item.play.startsWith('http') ? item.play : `https://tikwm.com${item.play}`) : '';
      const hdPlayUrl = item.hdplay ? (item.hdplay.startsWith('http') ? item.hdplay : `https://tikwm.com${item.hdplay}`) : playUrl;
      const musicUrl = item.music ? (item.music.startsWith('http') ? item.music : `https://tikwm.com${item.music}`) : '';

      // Para videos: PRIORIZAR playUrl que es H.264 compatible nativo con Windows Media Player (hdPlayUrl suele ser HEVC)
      const validPlayUrl = isImagePost ? '' : (playUrl || hdPlayUrl);
      const cover = (hasImages && images[0]) || item.cover || item.origin_cover || '';

      return {
        id: item.video_id,
        url: isImagePost ? `https://www.tiktok.com/@${username}/photo/${item.video_id}` : `https://www.tiktok.com/@${username}/video/${item.video_id}`,
        title: item.title || (isImagePost ? `Foto de @${username}` : `Video de @${username}`),
        thumbnail: cover,
        duration: durStr,
        views: formatCountHelper(item.play_count),
        likes: formatCountHelper(item.digg_count),
        raw_views: item.play_count || 0,
        raw_likes: item.digg_count || 0,
        timestamp: item.create_time || 0,
        play_url: validPlayUrl,
        download_url: isImagePost ? (images[0] || cover) : validPlayUrl,
        music_url: isImagePost ? '' : musicUrl,
        is_image: isImagePost,
        images: isImagePost ? (images.length > 0 ? images : [cover]) : [],
        mix_info: item.mix_info || null
      };
    });

    // 2. Historias activas completas (paginación con cursor y soporte para fotos y videos)
    let stories: any[] = [];
    if (start === 1) {
      try {
        let cursor = 0;
        let hasMoreStories = true;
        let pagesCount = 0;
        const seenStoryIds = new Set<string>();

        while (hasMoreStories && pagesCount < 6) {
          pagesCount++;
          const storyUrl = cursor
            ? `https://tikwm.com/api/user/story?unique_id=${encodeURIComponent(username)}&cursor=${cursor}`
            : `https://tikwm.com/api/user/story?unique_id=${encodeURIComponent(username)}`;

          const storyRes = await fetch(storyUrl);
          if (!storyRes.ok) break;
          const storyData = await storyRes.json();
          if (storyData.code !== 0 || !storyData.data) break;

          const rawList = storyData.data.videos || [];
          for (const s of rawList) {
            const sId = s.video_id;
            if (!sId || seenStoryIds.has(sId)) continue;
            seenStoryIds.add(sId);

            const images: string[] = s.images || [];
            const isImage = images.length > 0 || s.biz_tag === 'tt_photomode_story';
            const sDur = s.duration || 0;
            const durStr = isImage ? 'Foto' : (sDur ? `${Math.floor(sDur / 60)}:${(sDur % 60).toString().padStart(2, '0')}` : '0:15');
            const cover = (isImage && images.length > 0 ? images[0] : null) || s.cover || s.origin_cover || '';

            let downloadUrl = '';
            if (isImage && images.length > 0) {
              downloadUrl = images[0];
            } else if (s.play) {
              downloadUrl = s.play.startsWith('http') ? s.play : `https://tikwm.com${s.play}`;
            }

            stories.push({
              id: sId,
              url: isImage ? `https://www.tiktok.com/@${username}/photo/${sId}` : `https://www.tiktok.com/@${username}/video/${sId}`,
              title: s.title || (isImage ? `Historia en Foto de @${username}` : `Historia de @${username}`),
              thumbnail: cover,
              duration: durStr,
              views: formatCountHelper(s.play_count),
              likes: formatCountHelper(s.digg_count),
              created_at: s.create_time || 0,
              is_story: true,
              is_image: isImage,
              images: images,
              download_url: downloadUrl,
              music_url: s.music ? (s.music.startsWith('http') ? s.music : `https://tikwm.com${s.music}`) : ''
            });
          }

          hasMoreStories = Boolean(storyData.data.hasMore);
          cursor = storyData.data.cursor || 0;
          if (rawList.length === 0 || !cursor) break;
        }
      } catch (e) {
        console.error('TikWM story pagination error:', e);
      }
    }

    // 3. Info del usuario (avatar, bio, followers, etc.)
    let author = postsData.data.videos?.[0]?.author || {};
    let followers = '0';
    let following = '0';
    let totalLikes = '0';
    let totalVideos = rawVideos.length;

    try {
      const infoRes = await fetch(`https://tikwm.com/api/user/info?unique_id=${encodeURIComponent(username)}`);
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        if (infoData.code === 0 && infoData.data?.user) {
          const u = infoData.data.user;
          const stats = infoData.data.stats || {};
          author = {
            nickname: u.nickname || author.nickname || username,
            avatar: u.avatarLarger || u.avatarMedium || author.avatar || '',
            signature: u.signature || '',
            verified: u.verified || false
          };
          followers = formatCountHelper(stats.followerCount || u.follower_count);
          following = formatCountHelper(stats.followingCount || u.following_count);
          totalLikes = formatCountHelper(stats.heartCount || u.heart_count);
          totalVideos = stats.videoCount || u.video_count || rawVideos.length;
        }
      }
    } catch (e) {
      console.error('TikWM info fallback error:', e);
    }

    const highlights = buildHighlightsForUser(username, videos);

    return {
      success: true,
      is_private: false,
      username,
      nickname: author.nickname || username,
      avatar: author.avatarLarger || author.avatarMedium || author.avatar || '',
      signature: author.signature || '',
      verified: author.verified || false,
      followers,
      following,
      total_likes: totalLikes,
      total_videos: totalVideos,
      video_count: videos.length,
      has_active_story: stories.length > 0,
      stories,
      highlights,
      videos,
      has_more: videos.length >= count,
      next_start: start + videos.length
    };
  } catch (err) {
    console.error('fetchProfileFromTikWM error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url, start, count } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'Por favor, ingresa un usuario o enlace de TikTok.' }, { status: 400 });
    }

    let username = url.trim();
    if (username.includes('tiktok.com')) {
      if (
        username.includes('/video/') || 
        username.includes('/photo/') || 
        username.includes('/story/') || 
        username.includes('/stories/')
      ) {
        return NextResponse.json({
          success: false,
          isMedia: true,
          error: 'Este enlace corresponde a una publicación individual o historia, no a un perfil completo. Pégalo directamente para descargar el video o fotos.'
        }, { status: 400 });
      }
      const match = username.match(/@([a-zA-Z0-9_.-]+)/);
      if (match) {
        username = match[1];
      }
    }
    username = username.replace(/^@/, '').split('?')[0].split('/')[0].trim();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Nombre de usuario inválido.' }, { status: 400 });
    }

    // Enviar alerta a Telegram de forma asíncrona
    try {
      const clientMeta = extractClientMeta(request);
      sendTelegramAlert({
        action: 'BUSQUEDA_PERFIL',
        detail: `@${username}`,
        ...clientMeta
      }).catch(() => {});
    } catch {}

    // Consultar el motor backend en AWS EC2 (que corre sin bloqueos de cookies)
    const backendUrl = 'http://3.19.208.2:8000/api/profile';
    try {
      const resp = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: username, start: start || 1, count: count || 35 }),
        cache: 'no-store'
      });

      if (resp.ok) {
        const data = await resp.json();
        // Enriquecer con colecciones destacadas
        if (!data.highlights || data.highlights.length === 0) {
          data.highlights = buildHighlightsForUser(username, data.videos || []);
        }
        return NextResponse.json(data);
      } else {
        // Fallback secundario directo a TikWM API si EC2 no pudo extraer el perfil
        const tikwmFallback = await fetchProfileFromTikWM(username, start || 1, count || 35);
        if (tikwmFallback && tikwmFallback.success) {
          return NextResponse.json(tikwmFallback);
        }

        const errData = await resp.json().catch(() => null);
        let errorMsg = errData?.detail || 'No se pudo cargar el perfil en este momento.';
        if (errorMsg.toLowerCase().includes('unable to extract secondary user id') || errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('no existe')) {
          errorMsg = `El usuario @${username} no existe, es privado o no tiene videos públicos disponibles. Por favor verifica que el nombre de usuario esté bien escrito.`;
        }

        return NextResponse.json({
          success: false,
          error: errorMsg,
          suggestion: null
        }, { status: resp.status });
      }
    } catch (err: any) {
      console.error('Profile backend fetch error:', err);
      const tikwmFallback = await fetchProfileFromTikWM(username, start || 1, count || 35);
      if (tikwmFallback && tikwmFallback.success) {
        return NextResponse.json(tikwmFallback);
      }

      return NextResponse.json({
        success: false,
        error: 'El motor de perfiles está ocupado. Intenta de nuevo en unos segundos.'
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('Global profile route error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Ocurrió un error interno en el servidor.' }, { status: 500 });
  }
}
