import { NextResponse } from 'next/server';

export const maxDuration = 60;

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
      const dur = item.duration || 0;
      const durStr = dur ? `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}` : '';
      return {
        id: item.video_id,
        url: `https://www.tiktok.com/@${username}/video/${item.video_id}`,
        title: item.title || `Video de @${username}`,
        thumbnail: item.cover || item.origin_cover || '',
        duration: durStr,
        views: formatCountHelper(item.play_count),
        likes: formatCountHelper(item.digg_count),
        raw_views: item.play_count || 0,
        raw_likes: item.digg_count || 0,
        timestamp: item.create_time || 0
      };
    });

    // 2. Historias activas si es la primera página
    let stories: any[] = [];
    if (start === 1) {
      try {
        const storyRes = await fetch(`https://tikwm.com/api/user/story?unique_id=${encodeURIComponent(username)}`);
        if (storyRes.ok) {
          const storyData = await storyRes.json();
          if (storyData.code === 0 && storyData.data?.videos) {
            stories = storyData.data.videos.map((s: any) => {
              const sDur = s.duration || 15;
              return {
                id: s.video_id,
                url: `https://www.tiktok.com/@${username}/video/${s.video_id}`,
                title: s.title || `Historia de @${username}`,
                thumbnail: s.cover || s.origin_cover || '',
                duration: `${Math.floor(sDur / 60)}:${(sDur % 60).toString().padStart(2, '0')}`,
                views: formatCountHelper(s.play_count),
                likes: formatCountHelper(s.digg_count),
                created_at: s.create_time || 0,
                is_story: true,
                download_url: s.play ? (s.play.startsWith('http') ? s.play : `https://tikwm.com${s.play}`) : ''
              };
            });
          }
        }
      } catch (e) {
        console.error('TikWM story fallback error:', e);
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

    // Extraer el username limpio (ej: @aydnsarpy o https://www.tiktok.com/@aydnsarpy)
    let username = url.trim();
    if (username.includes('tiktok.com')) {
      // Si el enlace apunta a un video, foto o historia específico, alertar
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
          errorMsg = `El usuario @${username} no existe, es privado o no tiene videos públicos disponibles.`;
        }
        return NextResponse.json({
          success: false,
          error: errorMsg
        }, { status: resp.status });
      }
    } catch (err: any) {
      console.error('Profile backend fetch error:', err);
      // Fallback si EC2 está temporalmente inaccesible
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
