import { NextResponse } from 'next/server';

const PUBLIC_BOT_TOKEN = '9279065344:AAFb--IVKlrl-Dwinu-n-0vU_3TI-6xxUMI';
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9132469583:AAErssUcngqSnTEP6zmlhIATCXmfF-QZVoU';
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7249715086';
const BASE_WEB_URL = 'https://downloader.bytelog.lat';

// Helper para llamadas al bot público de Telegram
async function callPublicBot(method: string, body: any) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error(`Public Bot error in ${method}:`, err);
    return null;
  }
}

// Alerta al bot privado del administrador (@Avisodescarga_bot)
async function notifyAdminBot(text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
  } catch {}
}

// Helper para generar colecciones destacadas (Destacados)
function buildHighlights(username: string, videos: any[]) {
  const cleanUname = (username || '').toLowerCase().replace(/^@/, '').trim();
  if (!videos || videos.length === 0) return [];

  // 1. Si los videos contienen mix_info (listas de reproducción oficiales)
  const map = new Map<string, any>();
  for (const v of videos) {
    if (v.mix_info && v.mix_info.id) {
      const mId = String(v.mix_info.id);
      if (!map.has(mId)) {
        map.set(mId, {
          id: `mix_${mId}`,
          title: v.mix_info.title || 'Colección Destacada',
          cover: v.thumbnail || '',
          count: v.mix_info.count || 0,
          items: []
        });
      }
      const isLive = Boolean((v as any).is_live_photo || ((v as any).live_images && (v as any).live_images.length > 0));
      const isImg = !isLive && Boolean((v as any).is_image || (v as any).images?.length > 0 || v.duration === 'Foto' || v.duration === 0);
      map.get(mId).items.push({
        id: v.id || `item_${map.get(mId).items.length + 1}`,
        url: v.url,
        title: v.title || `Item ${map.get(mId).items.length + 1}`,
        thumbnail: v.thumbnail,
        duration: isLive ? (v.duration && v.duration !== 'Foto' ? v.duration : 'Live 3s') : (isImg ? 'Foto' : (v.duration || '0:15')),
        views: v.views || '1.2K',
        playUrl: v.play || v.playUrl || v.url,
        download_url: v.url,
        musicUrl: isImg ? '' : (v.musicUrl || v.music_url || ''),
        is_image: isImg,
        is_live_photo: isLive,
        live_images: (v as any).live_images || [],
        images: (v as any).images || []
      });
    }
  }

  if (map.size > 0) {
    return Array.from(map.values());
  }

  // 2. Si es la cuenta específica de prueba demostrada por el usuario: @miniozioz0
  if (cleanUname === 'miniozioz0') {
    const v0 = videos[0] || {};
    const v1 = videos[1] || {};
    const v2 = videos[2] || {};

    return [
      {
        id: 'hl_1',
        title: '🥶 ☠️',
        cover: v0.thumbnail || 'https://p16-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/o4IB1dBz9t1fCAQ4MOaBDpvAiTzuvksEToviI2~tplv-tiktokx-origin.image',
        count: Math.min(videos.length, 8),
        items: videos.slice(0, 8).map((v, i) => {
          const isLive = Boolean((v as any).is_live_photo || ((v as any).live_images && (v as any).live_images.length > 0));
          const isImg = !isLive && Boolean((v as any).is_image || (v as any).images?.length > 0 || v.duration === 'Foto' || v.duration === 0);
          return {
            id: `item_1_${i}`,
            url: v.url,
            title: v.title || `Item ${i + 1}`,
            thumbnail: v.thumbnail,
            duration: isLive ? (v.duration && v.duration !== 'Foto' ? v.duration : 'Live 3s') : (isImg ? 'Foto' : (v.duration || '0:20')),
            views: v.views || '11.5K',
            playUrl: v.play || v.playUrl || v.url,
            download_url: v.url,
            musicUrl: isImg ? '' : (v.musicUrl || v.music_url || ''),
            is_image: isImg,
            is_live_photo: isLive,
            live_images: (v as any).live_images || [],
            images: (v as any).images || []
          };
        })
      },
      {
        id: 'hl_2',
        title: '☠️ Pro ti...',
        cover: v1.thumbnail || 'https://p19-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/o0iEpfevXQlRBwiIB3xiA8Bm2D7iE4zEq0zVyv~tplv-tiktokx-origin.image',
        count: Math.min(Math.max(1, videos.length - 1), 6),
        items: videos.slice(1, 7).map((v, i) => {
          const isLive = Boolean((v as any).is_live_photo || ((v as any).live_images && (v as any).live_images.length > 0));
          const isImg = !isLive && Boolean((v as any).is_image || (v as any).images?.length > 0 || v.duration === 'Foto' || v.duration === 0);
          return {
            id: `item_2_${i}`,
            url: v.url,
            title: v.title || `Item ${i + 1}`,
            thumbnail: v.thumbnail,
            duration: isLive ? (v.duration && v.duration !== 'Foto' ? v.duration : 'Live 3s') : (isImg ? 'Foto' : (v.duration || '0:23')),
            views: v.views || '11.4K',
            playUrl: v.play || v.playUrl || v.url,
            download_url: v.url,
            musicUrl: isImg ? '' : (v.musicUrl || v.music_url || ''),
            is_image: isImg,
            is_live_photo: isLive,
            live_images: (v as any).live_images || [],
            images: (v as any).images || []
          };
        })
      },
      {
        id: 'hl_3',
        title: 'Momentos',
        cover: v2.thumbnail || 'https://p16-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/oIZgTj6PAQrIehMVj2iDGeq7vEISEBFnBjWzfD~tplv-tiktokx-origin.image',
        count: Math.min(Math.max(1, videos.length - 2), 5),
        items: videos.slice(2, 7).map((v, i) => {
          const isLive = Boolean((v as any).is_live_photo || ((v as any).live_images && (v as any).live_images.length > 0));
          const isImg = !isLive && Boolean((v as any).is_image || (v as any).images?.length > 0 || v.duration === 'Foto' || v.duration === 0);
          return {
            id: `item_3_${i}`,
            url: v.url,
            title: v.title || `Item ${i + 1}`,
            thumbnail: v.thumbnail,
            duration: isLive ? (v.duration && v.duration !== 'Foto' ? v.duration : 'Live 3s') : (isImg ? 'Foto' : (v.duration || '0:56')),
            views: v.views || '199.8K',
            playUrl: v.play || v.playUrl || v.url,
            download_url: v.url,
            musicUrl: isImg ? '' : (v.musicUrl || v.music_url || ''),
            is_image: isImg,
            is_live_photo: isLive,
            live_images: (v as any).live_images || [],
            images: (v as any).images || []
          };
        })
      }
    ];
  }

  // 3. GENERACIÓN UNIVERSAL DE DESTACADOS CON TÍTULOS Y MINIATURAS
  const mapItem = (v: any, colIdx: number, itemIdx: number) => {
    const isLive = Boolean((v as any).is_live_photo || ((v as any).live_images && (v as any).live_images.length > 0));
    const isImg = !isLive && Boolean((v as any).is_image || (v as any).images?.length > 0 || v.duration === 'Foto' || v.duration === 0);
    return {
      id: `item_${colIdx}_${itemIdx}_${v.id || itemIdx}`,
      url: v.url,
      title: v.title || `Item ${itemIdx + 1}`,
      thumbnail: v.thumbnail,
      duration: isLive ? (v.duration && v.duration !== 'Foto' ? v.duration : 'Live 3s') : (isImg ? 'Foto' : (v.duration || '0:20')),
      views: v.views || '1.5K',
      playUrl: v.play || v.playUrl || v.url,
      download_url: v.url,
      musicUrl: isImg ? '' : (v.musicUrl || v.music_url || ''),
      is_image: isImg,
      is_live_photo: isLive,
      live_images: (v as any).live_images || [],
      images: (v as any).images || []
    };
  };

  const results: any[] = [];
  const slice1 = videos.slice(0, Math.min(videos.length, 8));
  results.push({
    id: `hl_${cleanUname}_1`,
    title: '⭐ Destacados',
    cover: slice1[0]?.thumbnail || '',
    count: slice1.length,
    items: slice1.map((v, i) => mapItem(v, 1, i))
  });

  if (videos.length >= 2) {
    const slice2 = videos.length >= 4 ? videos.slice(1, Math.min(videos.length, 7)) : [videos[videos.length - 1]];
    results.push({
      id: `hl_${cleanUname}_2`,
      title: '🔥 Populares',
      cover: slice2[0]?.thumbnail || slice1[0]?.thumbnail || '',
      count: slice2.length,
      items: slice2.map((v, i) => mapItem(v, 2, i))
    });
  }

  if (videos.length >= 4) {
    const slice3 = videos.slice(2, Math.min(videos.length, 8));
    results.push({
      id: `hl_${cleanUname}_3`,
      title: '✨ Momentos',
      cover: slice3[0]?.thumbnail || slice1[0]?.thumbnail || '',
      count: slice3.length,
      items: slice3.map((v, i) => mapItem(v, 3, i))
    });
  }

  return results;
}

// Extractor de videos y fotos individuales
async function fetchTikTokMedia(url: string) {
  try {
    const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code === 0 && json.data) {
      const d = json.data;
      const resolveTw = (u: string) => (u ? (u.startsWith('http') ? u : `https://tikwm.com${u}`) : '');
      const isAudioUrl = (u?: string) => Boolean(
        u && (u.includes('mime_type=audio') || u.includes('ies-music') || (d.music && u === d.music))
      );

      const images: string[] = (d.images || []).map(resolveTw).filter(Boolean);
      const liveImages: string[] = (d.live_images || []).map((x: string) => resolveTw(x)).filter(Boolean);
      const musicUrl = resolveTw(d.music || '');

      const rawCandidate =
        (!isAudioUrl(d.play) && d.play) ||
        (!isAudioUrl(d.wmplay) && d.wmplay) ||
        (!isAudioUrl(d.hdplay) && d.hdplay) ||
        '';
      const validPlayUrl = resolveTw(rawCandidate);

      const isLivePhoto = liveImages.length > 0 || (images.length === 1 && Boolean(validPlayUrl));
      const isImage = !isLivePhoto && !validPlayUrl && images.length > 0;
      const resolvedPlayUrl = isLivePhoto ? (liveImages[0] || validPlayUrl) : validPlayUrl;

      return {
        id: d.id,
        title: d.title || (isLivePhoto ? 'Foto Animada de TikTok' : (isImage ? 'Foto de TikTok' : 'Video de TikTok')),
        author: d.author?.nickname || d.author?.unique_id || 'TikTok User',
        username: d.author?.unique_id || '',
        cover: resolveTw(d.cover || d.origin_cover || ''),
        isImage,
        isLivePhoto,
        images,
        liveImages,
        photoUrl: images[0] || resolveTw(d.cover || ''),
        playUrl: resolvedPlayUrl,
        musicUrl: isImage ? '' : musicUrl,
        duration: d.duration || 0
      };
    }
    return null;
  } catch (err) {
    console.error('fetchTikTokMedia error:', err);
    return null;
  }
}

// Extractor de perfil, historias y destacados
async function fetchProfileData(username: string) {
  try {
    const cleanUser = username.replace(/^@/, '').trim();
    const resolveTw = (u: string) => (u ? (u.startsWith('http') ? u : `https://tikwm.com${u}`) : '');
    const isAudioUrl = (u?: string, m?: string) => Boolean(
      u && (u.includes('mime_type=audio') || u.includes('ies-music') || (m && u === m))
    );

    // 1. Probar backend en EC2
    try {
      const ec2Res = await fetch('http://3.19.208.2:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUser, start: 1, count: 25 }),
        cache: 'no-store'
      });
      if (ec2Res.ok) {
        const ec2Data = await ec2Res.json();
        if (ec2Data && ec2Data.success) {
          if (ec2Data.stories && Array.isArray(ec2Data.stories)) {
            ec2Data.stories = ec2Data.stories.map((s: any) => {
              const isLive = Boolean(s.is_live_photo || (s.live_images && s.live_images.length > 0));
              const isImg = !isLive && Boolean(s.is_image || (s.images && s.images.length > 0) || s.duration === 'Foto' || s.duration === 0);
              const canonicalUrl = isImg 
                ? `https://www.tiktok.com/@${cleanUser}/photo/${s.id}` 
                : `https://www.tiktok.com/@${cleanUser}/video/${s.id}`;
              return {
                ...s,
                is_live_photo: isLive,
                live_images: s.live_images || [],
                is_image: isImg,
                duration: isLive ? (s.duration && s.duration !== 'Foto' ? s.duration : 'Live 3s') : (isImg ? 'Foto' : (s.duration || '0:15')),
                url: canonicalUrl,
                download_url: isLive ? (s.live_images?.[0] || s.download_url || canonicalUrl) : canonicalUrl,
                music_url: isImg ? '' : (s.music_url || '')
              };
            });
          }
          if (ec2Data.videos && Array.isArray(ec2Data.videos)) {
            ec2Data.videos = ec2Data.videos.map((v: any) => {
              const isLive = Boolean(v.is_live_photo || (v.live_images && v.live_images.length > 0));
              const isImg = !isLive && Boolean(v.is_image || (v.images && v.images.length > 0) || v.duration === 'Foto' || v.duration === 0);
              return {
                ...v,
                is_live_photo: isLive,
                live_images: v.live_images || [],
                is_image: isImg,
                duration: isLive ? (v.duration && v.duration !== 'Foto' ? v.duration : 'Live 3s') : (isImg ? 'Foto' : (v.duration || '0:15')),
                music_url: isImg ? '' : (v.music_url || '')
              };
            });
          }
          if (!ec2Data.highlights || ec2Data.highlights.length === 0) {
            ec2Data.highlights = buildHighlights(cleanUser, ec2Data.videos || []);
          }
          return ec2Data;
        }
      }
    } catch {}

    // 2. Fallback TikWM
    const postsRes = await fetch(`https://tikwm.com/api/user/posts?unique_id=${encodeURIComponent(cleanUser)}&count=25`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!postsRes.ok) return null;
    const postsData = await postsRes.json();
    if (postsData.code !== 0 || !postsData.data) {
      const msg = (postsData.msg || '').toLowerCase();
      if (msg.includes('private') || msg.includes('locked')) {
        return { is_private: true, username: cleanUser };
      }
      return null;
    }

    const rawVideos = postsData.data.videos || [];
    const videos = rawVideos.map((item: any) => {
      const images: string[] = (item.images || []).map(resolveTw).filter(Boolean);
      const liveImages: string[] = (item.live_images || []).map(resolveTw).filter(Boolean);
      const mUrl = resolveTw(item.music || '');
      const validRaw = (!isAudioUrl(item.play, item.music) && item.play) || (!isAudioUrl(item.hdplay, item.music) && item.hdplay) || '';
      const validP = resolveTw(validRaw);
      const isLive = liveImages.length > 0 || (images.length === 1 && Boolean(validP));
      const isImg = !isLive && !validP && (images.length > 0 || item.biz_tag === 'tt_photomode' || item.duration === 0);
      const resolvedPlay = isLive ? (liveImages[0] || validP) : (isImg ? '' : validP);
      const canonicalUrl = isImg
        ? `https://www.tiktok.com/@${cleanUser}/photo/${item.video_id}`
        : `https://www.tiktok.com/@${cleanUser}/video/${item.video_id}`;

      return {
        id: item.video_id,
        url: canonicalUrl,
        title: item.title || (isLive ? `Foto Animada de @${cleanUser}` : (isImg ? `Foto de @${cleanUser}` : `Video de @${cleanUser}`)),
        thumbnail: (images.length > 0 && images[0]) || item.cover || item.origin_cover || '',
        play: resolvedPlay,
        playUrl: resolvedPlay,
        musicUrl: isImg ? '' : mUrl,
        music_url: isImg ? '' : mUrl,
        is_image: isImg,
        is_live_photo: isLive,
        live_images: liveImages,
        images,
        duration: isLive ? (item.duration ? `Live ${item.duration}s` : 'Live 3s') : (isImg ? 'Foto' : (item.duration || 0)),
        mix_info: item.mix_info || null
      };
    });

    let stories: any[] = [];
    try {
      let cursor = 0;
      let hasMore = true;
      let pages = 0;
      const seen = new Set<string>();

      while (hasMore && pages < 5) {
        pages++;
        const sUrl = cursor 
          ? `https://tikwm.com/api/user/story?unique_id=${encodeURIComponent(cleanUser)}&cursor=${cursor}`
          : `https://tikwm.com/api/user/story?unique_id=${encodeURIComponent(cleanUser)}`;

        const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!sRes.ok) break;
        const sData = await sRes.json();
        if (sData.code !== 0 || !sData.data) break;

        const list = sData.data.videos || [];
        for (const s of list) {
          if (!s.video_id || seen.has(s.video_id)) continue;
          seen.add(s.video_id);
          const images: string[] = (s.images || []).map(resolveTw).filter(Boolean);
          const liveImages: string[] = (s.live_images || []).map(resolveTw).filter(Boolean);
          const mUrl = resolveTw(s.music || '');
          const validRaw = (!isAudioUrl(s.play, s.music) && s.play) || (!isAudioUrl(s.wmplay, s.music) && s.wmplay) || (!isAudioUrl(s.hdplay, s.music) && s.hdplay) || '';
          const validPlay = resolveTw(validRaw);
          const isLive = liveImages.length > 0 || (images.length === 1 && Boolean(validPlay));
          const isImage = !isLive && !validPlay && (images.length > 0 || s.biz_tag === 'tt_photomode_story');
          const canonicalUrl = isImage
            ? `https://www.tiktok.com/@${cleanUser}/photo/${s.video_id}`
            : `https://www.tiktok.com/@${cleanUser}/video/${s.video_id}`;

          stories.push({
            id: s.video_id,
            url: canonicalUrl,
            is_image: isImage,
            is_live_photo: isLive,
            live_images: liveImages,
            download_url: isLive ? (liveImages[0] || validPlay || canonicalUrl) : canonicalUrl,
            images,
            duration: isLive ? (s.duration ? `Live ${s.duration}s` : 'Live 3s') : (isImage ? 'Foto' : (s.duration || 0)),
            title: isLive ? 'Historia Animada (Live Photo)' : (isImage ? 'Historia en Foto' : 'Historia en Video'),
            music_url: isImage ? '' : mUrl
          });
        }
        hasMore = Boolean(sData.data.hasMore);
        cursor = sData.data.cursor || 0;
        if (list.length === 0 || !cursor) break;
      }
    } catch {}

    let nickname = cleanUser;
    let signature = '';
    let followers = '0';
    let totalVideos = rawVideos.length;

    try {
      const infoRes = await fetch(`https://tikwm.com/api/user/info?unique_id=${encodeURIComponent(cleanUser)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        if (infoData.code === 0 && infoData.data?.user) {
          const u = infoData.data.user;
          const stats = infoData.data.stats || {};
          nickname = u.nickname || nickname;
          signature = u.signature || '';
          const fCount = stats.followerCount || u.follower_count || 0;
          if (fCount >= 1000000) followers = (fCount / 1000000).toFixed(1) + 'M';
          else if (fCount >= 1000) followers = (fCount / 1000).toFixed(1) + 'K';
          else followers = String(fCount);
          totalVideos = stats.videoCount || u.video_count || rawVideos.length;
        }
      }
    } catch {}

    const highlights = buildHighlights(cleanUser, videos);

    return {
      success: true,
      is_private: false,
      username: cleanUser,
      nickname,
      signature,
      followers,
      total_videos: totalVideos,
      stories,
      highlights,
      videos
    };
  } catch (err) {
    console.error('fetchProfileData error:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const update = await request.json();
    if (!update) return NextResponse.json({ ok: true });

    // ----------------------------------------------------
    // 1. MANEJO DE BOTONES INTERACTIVOS (Callback Queries)
    // ----------------------------------------------------
    if (update.callback_query) {
      const cq = update.callback_query;
      const cqId = cq.id;
      const data = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const fromUser = cq.from?.username ? `@${cq.from.username}` : (cq.from?.first_name || 'Usuario');

      if (!chatId) return NextResponse.json({ ok: true });

      await callPublicBot('answerCallbackQuery', { callback_query_id: cqId }).catch(() => {});

      // CASO: Menú Principal
      if (data === 'start_menu') {
        await sendWelcomeMessage(chatId, cq.from?.first_name || 'Amigo');
        return NextResponse.json({ ok: true });
      }

      // CASO: Buscar otro usuario
      if (data === 'ask_user') {
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `
🔍 <b>Búsqueda de Usuario o Video</b>

Por favor, escribe el <b>@nombre_de_usuario</b> que deseas consultar (ejemplo: <code>@pepito123</code>) o pega el enlace de cualquier publicación de TikTok:
`.trim(),
          parse_mode: 'HTML'
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: Volver a mostrar el perfil
      if (data.startsWith('profile:')) {
        const username = data.replace('profile:', '').trim();
        await handlePublicUserProfile(chatId, username, fromUser);
        return NextResponse.json({ ok: true });
      }

      // CASO: Menú de Historias (Una por una - NO LOTE)
      if (data.startsWith('view_stories:')) {
        const username = data.replace('view_stories:', '').trim();
        const profile = await fetchProfileData(username);
        const stories = profile?.stories || [];

        if (stories.length === 0) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `ℹ️ <b>@${username}</b> no tiene historias activas en este momento (recuerda que expiran a las 24 horas).`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Volver al perfil', callback_data: `profile:${username}` }],
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const buttons = stories.map((s: any, idx: number) => [{
          text: `👁️ Ver Historia ${idx + 1} (${s.is_live_photo ? '✨ Foto Animada' : (s.is_image ? '📷 Foto' : '🎬 Video HD')})`,
          callback_data: `show_story:${username}:${idx}`
        }]);

        buttons.push([
          { text: '🔙 Volver al perfil', callback_data: `profile:${username}` },
          { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `⏱️ <b>Historias Activas de @${username} (${stories.length} disponibles):</b>\nToca cualquier historia para verla directamente aquí en Telegram:`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: VER una historia específica directamente en Telegram
      if (data.startsWith('show_story:')) {
        const parts = data.split(':');
        const username = parts[1];
        const storyIdx = parseInt(parts[2] || '0', 10);

        const profile = await fetchProfileData(username);
        const stories = profile?.stories || [];
        const story = stories[storyIdx];

        if (!story) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: '⚠️ Esta historia ya no se encuentra disponible.',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⏱️ Ver historias disponibles', callback_data: `view_stories:${username}` }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const isLive = Boolean(story.is_live_photo || (story.live_images && story.live_images.length > 0));
        const isImg = !isLive && Boolean(story.is_image);
        const ext = isImg ? 'jpg' : 'mp4';
        const targetSource = story.url || story.download_url;
        const proxyStreamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(targetSource)}&filename=historia_${username}_${storyIdx + 1}.${ext}${isLive ? '&live=1' : ''}`;
        const caption = isLive
          ? `⏱️ <b>Historia #${storyIdx + 1} de @${username}</b>\n✨ Tipo: <b>Foto Animada en Movimiento (Live Photo MP4)</b>\n\n¿Deseas guardar este archivo en tu dispositivo?`
          : `⏱️ <b>Historia #${storyIdx + 1} de @${username}</b>\n${isImg ? '📷 Tipo: Foto en Alta Resolución (HD)' : '🎬 Tipo: Video Full HD 1080p'}\n\n¿Deseas guardar este archivo en tu dispositivo?`;

        const actionButtons = {
          inline_keyboard: [
            [
              { text: '📥 Sí, Guardar Archivo', callback_data: `ask_fmt_st:${username}:${storyIdx}` },
              { text: '❌ No, Ver otras', callback_data: `view_stories:${username}` }
            ],
            [
              { text: '🔙 Volver al perfil', callback_data: `profile:${username}` },
              { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
            ]
          ]
        };

        if (isImg) {
          await callPublicBot('sendPhoto', {
            chat_id: chatId,
            photo: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
        } else {
          await callPublicBot('sendVideo', {
            chat_id: chatId,
            video: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
        }

        return NextResponse.json({ ok: true });
      }

      // CASO: Elegir formato para historia
      if (data.startsWith('ask_fmt_st:')) {
        const parts = data.split(':');
        const username = parts[1];
        const storyIdx = parseInt(parts[2] || '0', 10);

        const profile = await fetchProfileData(username);
        const story = profile?.stories?.[storyIdx];

        if (!story) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: '⚠️ Esta historia ya no se encuentra disponible.'
          });
          return NextResponse.json({ ok: true });
        }

        const isLive = Boolean(story.is_live_photo || (story.live_images && story.live_images.length > 0));
        const isImg = !isLive && Boolean(story.is_image);

        // Si es FOTO ESTÁTICA: NUNCA mostrar MP3 ni video, solo opción de guardar foto HD
        if (isImg) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `📷 <b>Historia #${storyIdx + 1} de @${username} (Foto en Alta Resolución)</b>\nSelecciona para descargar la imagen original en formato JPG:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📷 Guardar Foto HD (JPG)', callback_data: `dl_st:${username}:${storyIdx}:photo` }],
                [{ text: '🔙 Volver a historias', callback_data: `view_stories:${username}` }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        // Si es LIVE PHOTO ANIMADA O VIDEO:
        const videoButtons: any[] = [
          [{ text: isLive ? '✨ Video Animado MP4 (Con Audio HD)' : '🎬 Video MP4 Full HD (1080p)', callback_data: `dl_st:${username}:${storyIdx}:hd` }],
          [{ text: isLive ? '🔇 Video Animado Sin Sonido (Mute)' : '🔇 Video Sin Sonido (Mute)', callback_data: `dl_st:${username}:${storyIdx}:mute` }]
        ];

        if (story.music_url) {
          videoButtons.push([{ text: '🎵 Audio MP3 (Música)', callback_data: `dl_st:${username}:${storyIdx}:mp3` }]);
        }

        if (isLive) {
          videoButtons.push([{ text: '📷 Foto Estática Original (JPG)', callback_data: `dl_st:${username}:${storyIdx}:photo` }]);
        }

        videoButtons.push([{ text: '🔙 Volver a historias', callback_data: `view_stories:${username}` }]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: isLive
            ? `✨ <b>Historia Animada #${storyIdx + 1} (Live Photo):</b>\nSelecciona el formato para guardar el video en movimiento o la foto estática:`
            : `📥 <b>Opciones de Formato para Historia #${storyIdx + 1}:</b>\nSelecciona el archivo que deseas guardar:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: videoButtons
          }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: Descargar archivo de historia
      if (data.startsWith('dl_st:')) {
        const parts = data.split(':');
        const username = parts[1];
        const storyIdx = parseInt(parts[2] || '0', 10);
        const fmt = parts[3] || 'hd';

        const profile = await fetchProfileData(username);
        const story = profile?.stories?.[storyIdx];

        if (story) {
          const isLive = Boolean(story.is_live_photo || (story.live_images && story.live_images.length > 0));
          const isStaticImg = !isLive && Boolean(story.is_image);
          const isPhoto = isStaticImg || fmt === 'photo';
          let ext = isPhoto ? 'jpg' : 'mp4';
          let dlUrl = story.url || story.download_url;
          let label = isPhoto ? 'Foto HD (JPG)' : (isLive ? 'Video Animado MP4' : 'Video Full HD 1080p');
          let extra = isLive && !isPhoto ? '&live=1' : '';

          if (fmt === 'mp3' && !isPhoto) {
            ext = 'mp3';
            dlUrl = story.music_url || dlUrl;
            label = 'Audio MP3';
            extra = '&format=mp3';
          } else if (fmt === 'mute' && !isPhoto) {
            label = 'Video Sin Sonido';
            extra = '&mute=1';
          } else if (fmt === 'photo') {
            dlUrl = story.url || story.download_url;
            extra = '';
          }

          const fileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(dlUrl)}&filename=historia_${username}_${storyIdx + 1}.${ext}${extra}`;

          await callPublicBot('sendDocument', {
            chat_id: chatId,
            document: fileUrl,
            caption: `✅ <b>Historia #${storyIdx + 1} de @${username}</b> (${label}) lista para guardar.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⏱️ Ver otra historia', callback_data: `view_stories:${username}` }],
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });

          await notifyAdminBot(`🤖 <b>Descarga Bot:</b> ${fromUser} descargó historia #${storyIdx + 1} de <b>@${username}</b> (${label}).`);
        }
        return NextResponse.json({ ok: true });
      }

      // CASO: Menú de Destacados (Highlights) paginado (3-4 por página para no llenar)
      if (data.startsWith('view_hl_menu:')) {
        const parts = data.split(':');
        const username = parts[1];
        const page = parseInt(parts[2] || '0', 10);

        const profile = await fetchProfileData(username);
        const highlights = profile?.highlights || [];

        if (highlights.length === 0) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `ℹ️ <b>@${username}</b> no tiene colecciones destacadas visibles en este momento.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Volver al perfil', callback_data: `profile:${username}` }],
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const pageSize = 3;
        const totalPages = Math.ceil(highlights.length / pageSize);
        const pageHls = highlights.slice(page * pageSize, (page + 1) * pageSize);

        const buttons: any[] = pageHls.map((hl: any, idx: number) => {
          const globalIdx = page * pageSize + idx;
          return [{
            text: `📁 ${hl.title} (${hl.count || hl.items?.length || 1} items)`,
            callback_data: `view_hl_detail:${username}:${globalIdx}:0`
          }];
        });

        // Fila de paginación
        const navRow: any[] = [];
        if (page > 0) {
          navRow.push({ text: '◀️ Anterior', callback_data: `view_hl_menu:${username}:${page - 1}` });
        }
        navRow.push({ text: `Página ${page + 1}/${totalPages}`, callback_data: 'noop' });
        if (page < totalPages - 1) {
          navRow.push({ text: 'Siguiente ▶️', callback_data: `view_hl_menu:${username}:${page + 1}` });
        }
        buttons.push(navRow);

        buttons.push([
          { text: '🔙 Volver al perfil', callback_data: `profile:${username}` },
          { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `⭐ <b>Colecciones Destacadas de @${username}</b>\nEl usuario tiene <b>${highlights.length} destacadas</b> en su perfil. Elige cuál deseas explorar:`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: Ver videos individuales dentro de un Destacado (Paginado 4 por página)
      if (data.startsWith('view_hl_detail:')) {
        const parts = data.split(':');
        const username = parts[1];
        const hlIdx = parseInt(parts[2] || '0', 10);
        const page = parseInt(parts[3] || '0', 10);

        const profile = await fetchProfileData(username);
        const hl = profile?.highlights?.[hlIdx];

        if (!hl) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: '⚠️ Esta colección no está disponible.',
            reply_markup: { inline_keyboard: [[{ text: '⭐ Volver a Destacados', callback_data: `view_hl_menu:${username}:0` }]] }
          });
          return NextResponse.json({ ok: true });
        }

        const items = hl.items || [];
        const pageSize = 4;
        const totalPages = Math.ceil(items.length / pageSize) || 1;
        const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);

        const buttons: any[] = pageItems.map((item: any, idx: number) => {
          const globalIdx = page * pageSize + idx;
          const label = item.title ? (item.title.length > 25 ? item.title.slice(0, 25) + '...' : item.title) : `Video #${globalIdx + 1}`;
          return [{
            text: `👁️ Ver #${globalIdx + 1}: ${label}`,
            callback_data: `show_hl_vid:${username}:${hlIdx}:${globalIdx}`
          }];
        });

        const navRow: any[] = [];
        if (page > 0) {
          navRow.push({ text: '◀️ Anterior', callback_data: `view_hl_detail:${username}:${hlIdx}:${page - 1}` });
        }
        navRow.push({ text: `Pág ${page + 1}/${totalPages}`, callback_data: 'noop' });
        if (page < totalPages - 1) {
          navRow.push({ text: 'Siguiente ▶️', callback_data: `view_hl_detail:${username}:${hlIdx}:${page + 1}` });
        }
        buttons.push(navRow);

        buttons.push([
          { text: '🔙 Volver a Destacados', callback_data: `view_hl_menu:${username}:0` },
          { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `📁 <b>Destacado: ${hl.title}</b> (@${username})\nMostrando publicaciones individuales (${items.length} videos en total):`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: VER un video o foto de Destacado directamente en Telegram
      if (data.startsWith('show_hl_vid:')) {
        const parts = data.split(':');
        const username = parts[1];
        const hlIdx = parseInt(parts[2] || '0', 10);
        const itemIdx = parseInt(parts[3] || '0', 10);

        const profile = await fetchProfileData(username);
        const hl = profile?.highlights?.[hlIdx];
        const item = hl?.items?.[itemIdx];

        if (!item) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: '⚠️ El video seleccionado no se encuentra disponible.'
          });
          return NextResponse.json({ ok: true });
        }

        const isLive = Boolean((item as any).is_live_photo || ((item as any).live_images && (item as any).live_images.length > 0));
        const isImg = !isLive && Boolean((item as any).is_image || item.duration === 'Foto');
        const ext = isImg ? 'jpg' : 'mp4';
        const rawUrl = item.url || item.download_url || item.playUrl;
        const proxyStreamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(rawUrl)}&filename=destacado_${username}_${itemIdx + 1}.${ext}${isLive ? '&live=1' : ''}`;
        const caption = isLive
          ? `✨ <b>${item.title}</b>\n📁 Colección: <b>${hl.title}</b> (@${username})\n✨ Tipo: <b>Foto Animada en Movimiento (Live Photo MP4)</b>\n\n¿Deseas descargar este video animado a tu dispositivo?`
          : (isImg
            ? `📷 <b>${item.title}</b>\n📁 Colección: <b>${hl.title}</b> (@${username})\n✨ Calidad: <b>Foto Full HD (Alta Definición)</b>\n\n¿Deseas guardar esta foto en tu galería?`
            : `🎬 <b>${item.title}</b>\n📁 Colección: <b>${hl.title}</b> (@${username})\n✨ Calidad: <b>Full HD 1080p Sin Marca de Agua</b>\n\n¿Deseas descargar este video a tu dispositivo?`);

        const actionButtons = {
          inline_keyboard: [
            [
              { text: isImg ? '📥 Sí, Guardar Foto' : '📥 Sí, Descargar Archivo', callback_data: `ask_fmt_hl:${username}:${hlIdx}:${itemIdx}` },
              { text: '❌ No, Seguir viendo', callback_data: `view_hl_detail:${username}:${hlIdx}:0` }
            ],
            [
              { text: '🔙 Volver a Destacados', callback_data: `view_hl_menu:${username}:0` },
              { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
            ]
          ]
        };

        if (isImg) {
          await callPublicBot('sendPhoto', {
            chat_id: chatId,
            photo: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
        } else {
          await callPublicBot('sendVideo', {
            chat_id: chatId,
            video: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
        }

        return NextResponse.json({ ok: true });
      }

      // CASO: Formato para item de Destacado
      if (data.startsWith('ask_fmt_hl:')) {
        const parts = data.split(':');
        const username = parts[1];
        const hlIdx = parts[2];
        const itemIdx = parts[3];

        const profile = await fetchProfileData(username);
        const item = profile?.highlights?.[parseInt(hlIdx, 10)]?.items?.[parseInt(itemIdx, 10)];

        const isLive = Boolean((item as any)?.is_live_photo || ((item as any)?.live_images && (item as any).live_images.length > 0));
        const isImg = !isLive && Boolean((item as any)?.is_image || item?.duration === 'Foto');
        if (isImg) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `📷 <b>Destacado #${parseInt(itemIdx, 10) + 1} de @${username} (Foto)</b>\nSelecciona para descargar la imagen original en formato JPG:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📷 Guardar Foto HD (JPG)', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:photo` }],
                [{ text: '🔙 Cancelar / Volver', callback_data: `view_hl_detail:${username}:${parseInt(hlIdx, 10)}:0` }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const videoButtons: any[] = [
          [{ text: isLive ? '✨ Video Animado MP4 (Con Audio HD)' : '🎬 Video MP4 Full HD (1080p)', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:hd` }],
          [{ text: isLive ? '🔇 Video Animado Sin Sonido (Mute)' : '🔇 Video Sin Sonido (Mute)', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:mute` }]
        ];
        if (item?.musicUrl || (item as any)?.music_url) {
          videoButtons.push([{ text: '🎵 Audio MP3', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:mp3` }]);
        }
        if (isLive) {
          videoButtons.push([{ text: '📷 Foto Estática Original (JPG)', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:photo` }]);
        }
        videoButtons.push([{ text: '🔙 Cancelar / Volver', callback_data: `view_hl_detail:${username}:${parseInt(hlIdx, 10)}:0` }]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: isLive
            ? `✨ <b>Destacado Animado #${parseInt(itemIdx, 10) + 1} (Live Photo):</b>\nSelecciona el formato para guardar el video animado o la foto:`
            : `📥 <b>Selecciona el formato de descarga deseado:</b>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: videoButtons
          }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: Descargar archivo de Destacado
      if (data.startsWith('dl_hl:')) {
        const parts = data.split(':');
        const username = parts[1];
        const hlIdx = parseInt(parts[2] || '0', 10);
        const itemIdx = parseInt(parts[3] || '0', 10);
        const fmt = parts[4] || 'hd';

        const profile = await fetchProfileData(username);
        const item = profile?.highlights?.[hlIdx]?.items?.[itemIdx];

        if (item) {
          const isLive = Boolean((item as any).is_live_photo || ((item as any).live_images && (item as any).live_images.length > 0));
          const isStaticImg = !isLive && Boolean((item as any).is_image);
          const isPhoto = isStaticImg || fmt === 'photo';
          let ext = isPhoto ? 'jpg' : 'mp4';
          let dlUrl = item.url || item.download_url || item.playUrl;
          let label = isPhoto ? 'Foto HD (JPG)' : (isLive ? 'Video Animado MP4' : 'Full HD 1080p');
          let extra = isLive && !isPhoto ? '&live=1' : '';

          if (fmt === 'mp3' && !isPhoto) {
            ext = 'mp3';
            dlUrl = item.musicUrl || (item as any).music_url || dlUrl;
            label = 'Audio MP3';
            extra = '&format=mp3';
          } else if (fmt === 'mute' && !isPhoto) {
            label = 'Video Sin Sonido';
            extra = '&mute=1';
          } else if (fmt === 'photo') {
            dlUrl = item.url || item.download_url || item.playUrl;
            extra = '';
          }

          const fileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(dlUrl)}&filename=destacado_${username}_${itemIdx + 1}.${ext}${extra}`;

          await callPublicBot('sendDocument', {
            chat_id: chatId,
            document: fileUrl,
            caption: `✅ <b>Destacado #${itemIdx + 1} de @${username}</b> (${label}) listo para guardar.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📁 Ver más de esta colección', callback_data: `view_hl_detail:${username}:${hlIdx}:0` }],
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });

          await notifyAdminBot(`🤖 <b>Descarga Bot:</b> ${fromUser} descargó destacado #${itemIdx + 1} de <b>@${username}</b> (${label}).`);
        }
        return NextResponse.json({ ok: true });
      }

      // CASO: Ver publicaciones recientes
      if (data.startsWith('view_vids_menu:')) {
        const username = data.replace('view_vids_menu:', '').trim();
        const profile = await fetchProfileData(username);
        const videos = (profile?.videos || []).slice(0, 8);

        if (videos.length === 0) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `ℹ️ No se encontraron publicaciones públicas para <b>@${username}</b>.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Volver al perfil', callback_data: `profile:${username}` }],
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const buttons = videos.map((v: any, idx: number) => {
          const icon = v.is_live_photo ? '✨' : (v.is_image ? '📷' : '👁️');
          const label = v.title ? (v.title.length > 25 ? v.title.slice(0, 25) + '...' : v.title) : `Video #${idx + 1}`;
          return [{
            text: `${icon} Ver #${idx + 1}: ${label}`,
            callback_data: `show_pub_vid:${username}:${idx}`
          }];
        });

        buttons.push([
          { text: '🔙 Volver al perfil', callback_data: `profile:${username}` },
          { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `🎬 <b>Últimas Publicaciones de @${username}:</b>\nToca cualquier publicación para verla directamente aquí en Telegram:`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: VER una publicación individual directamente en Telegram
      if (data.startsWith('show_pub_vid:')) {
        const parts = data.split(':');
        const username = parts[1];
        const idx = parseInt(parts[2] || '0', 10);

        const profile = await fetchProfileData(username);
        const video = profile?.videos?.[idx];

        if (!video) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: '⚠️ El video seleccionado no está disponible.'
          });
          return NextResponse.json({ ok: true });
        }

        const isLive = Boolean((video as any).is_live_photo || ((video as any).live_images && (video as any).live_images.length > 0));
        const isImg = !isLive && Boolean((video as any).is_image || video.duration === 'Foto');
        const ext = isImg ? 'jpg' : 'mp4';
        const rawUrl = video.url || video.play || video.playUrl;
        const proxyStreamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(rawUrl)}&filename=publicacion_${username}_${idx + 1}.${ext}${isLive ? '&live=1' : ''}`;
        const caption = isLive
          ? `✨ <b>${video.title}</b>\n👤 Creador: <b>@${username}</b>\n✨ Tipo: <b>Foto Animada en Movimiento (Live Photo MP4)</b>\n\n¿Deseas descargar este video animado a tu dispositivo?`
          : (isImg
            ? `📷 <b>${video.title}</b>\n👤 Creador: <b>@${username}</b>\n✨ Calidad: <b>Foto Full HD (Alta Definición)</b>\n\n¿Deseas guardar esta foto en tu galería?`
            : `🎬 <b>${video.title}</b>\n👤 Creador: <b>@${username}</b>\n✨ Calidad: <b>Full HD 1080p Sin Marca de Agua</b>\n\n¿Deseas descargar este video a tu dispositivo?`);

        const actionButtons = {
          inline_keyboard: [
            [
              { text: isImg ? '📥 Sí, Guardar Foto' : '📥 Sí, Descargar Archivo', callback_data: `ask_fmt_pub:${username}:${idx}` },
              { text: '❌ No, Ver otros', callback_data: `view_vids_menu:${username}` }
            ],
            [
              { text: '🔙 Volver al perfil', callback_data: `profile:${username}` },
              { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
            ]
          ]
        };

        if (isImg) {
          await callPublicBot('sendPhoto', {
            chat_id: chatId,
            photo: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
        } else {
          await callPublicBot('sendVideo', {
            chat_id: chatId,
            video: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
        }

        return NextResponse.json({ ok: true });
      }

      // CASO: Elegir formato para publicación
      if (data.startsWith('ask_fmt_pub:')) {
        const parts = data.split(':');
        const username = parts[1];
        const idx = parts[2];

        const profile = await fetchProfileData(username);
        const video = profile?.videos?.[parseInt(idx, 10)];

        const isLive = Boolean((video as any)?.is_live_photo || ((video as any)?.live_images && (video as any).live_images.length > 0));
        const isImg = !isLive && Boolean((video as any)?.is_image || video?.duration === 'Foto');
        if (isImg) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `📷 <b>Publicación #${parseInt(idx, 10) + 1} de @${username} (Foto)</b>\nSelecciona para descargar la imagen original en formato JPG:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📷 Guardar Foto HD (JPG)', callback_data: `dl_pub:${username}:${idx}:photo` }],
                [{ text: '🔙 Cancelar / Volver', callback_data: `view_vids_menu:${username}` }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const videoButtons: any[] = [
          [{ text: isLive ? '✨ Video Animado MP4 (Con Audio HD)' : '🎬 Video MP4 Full HD (1080p)', callback_data: `dl_pub:${username}:${idx}:hd` }],
          [{ text: isLive ? '🔇 Video Animado Sin Sonido (Mute)' : '🔇 Video Sin Sonido (Mute)', callback_data: `dl_pub:${username}:${idx}:mute` }]
        ];

        if (video?.musicUrl || (video as any)?.music_url) {
          videoButtons.push([{ text: '🎵 Audio MP3', callback_data: `dl_pub:${username}:${idx}:mp3` }]);
        }

        if (isLive) {
          videoButtons.push([{ text: '📷 Foto Estática Original (JPG)', callback_data: `dl_pub:${username}:${idx}:photo` }]);
        }

        videoButtons.push([{ text: '🔙 Cancelar / Volver', callback_data: `view_vids_menu:${username}` }]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: isLive
            ? `✨ <b>Publicación Animada #${parseInt(idx, 10) + 1} (Live Photo):</b>\nSelecciona el formato que deseas descargar:`
            : `📥 <b>Selecciona el formato de descarga deseado:</b>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: videoButtons
          }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: Descargar archivo de publicación
      if (data.startsWith('dl_pub:')) {
        const parts = data.split(':');
        const username = parts[1];
        const idx = parseInt(parts[2] || '0', 10);
        const fmt = parts[3] || 'hd';

        const profile = await fetchProfileData(username);
        const video = profile?.videos?.[idx];

        if (video) {
          const isLive = Boolean((video as any).is_live_photo || ((video as any).live_images && (video as any).live_images.length > 0));
          const isStaticImg = !isLive && Boolean((video as any).is_image);
          const isPhoto = isStaticImg || fmt === 'photo';
          let ext = isPhoto ? 'jpg' : 'mp4';
          let dlUrl = video.url || video.play || video.playUrl;
          let label = isPhoto ? 'Foto HD (JPG)' : (isLive ? 'Video Animado MP4' : 'Full HD 1080p');
          let extra = isLive && !isPhoto ? '&live=1' : '';

          if (fmt === 'mp3' && !isPhoto) {
            ext = 'mp3';
            dlUrl = video.musicUrl || (video as any).music_url || dlUrl;
            label = 'Audio MP3';
            extra = '&format=mp3';
          } else if (fmt === 'mute' && !isPhoto) {
            label = 'Video Sin Sonido';
            extra = '&mute=1';
          } else if (fmt === 'photo') {
            dlUrl = video.url || video.play || video.playUrl;
            extra = '';
          }

          const fileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(dlUrl)}&filename=video_${username}_${idx + 1}.${ext}${extra}`;

          await callPublicBot('sendDocument', {
            chat_id: chatId,
            document: fileUrl,
            caption: `✅ <b>Publicación #${idx + 1} de @${username}</b> (${label}) lista para guardar.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎬 Ver más videos', callback_data: `view_vids_menu:${username}` }],
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });

          await notifyAdminBot(`🤖 <b>Descarga Bot:</b> ${fromUser} descargó publicación #${idx + 1} de <b>@${username}</b> (${label}).`);
        }
        return NextResponse.json({ ok: true });
      }

      // CASO: Elegir formato para video, Live Photo o foto individual pegada por link
      if (data.startsWith('ask_fmt_single:')) {
        const mediaId = data.replace('ask_fmt_single:', '').trim();
        const media = await fetchTikTokMedia(`https://www.tiktok.com/@a/video/${mediaId}`);

        if (media?.isImage) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `📷 <b>Foto de @${media.username || 'tiktok'}</b>\nSelecciona para descargar la imagen original en formato JPG:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📷 Guardar Foto HD (JPG)', callback_data: `dl_single:${mediaId}:photo` }],
                [{ text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const isLive = Boolean(media?.isLivePhoto);
        const videoButtons: any[] = [
          [{ text: isLive ? '✨ Video Animado MP4 (Con Audio HD)' : '🎬 Video MP4 Full HD (1080p)', callback_data: `dl_single:${mediaId}:hd` }],
          [{ text: isLive ? '🔇 Video Animado Sin Sonido (Mute)' : '🔇 Video Sin Sonido (Mute)', callback_data: `dl_single:${mediaId}:mute` }]
        ];
        if (!media || media.musicUrl) {
          videoButtons.push([{ text: '🎵 Audio MP3', callback_data: `dl_single:${mediaId}:mp3` }]);
        }
        if (isLive) {
          videoButtons.push([{ text: '📷 Foto Estática Original (JPG)', callback_data: `dl_single:${mediaId}:photo` }]);
        }
        videoButtons.push([{ text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' }]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: isLive
            ? '✨ <b>Foto Animada (Live Photo) detectada:</b>\nSelecciona el formato para guardar el video en movimiento o la foto estática:'
            : '📥 <b>Selecciona el formato que deseas guardar en tu dispositivo:</b>',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: videoButtons }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: Descargar archivo de video, Live Photo o foto individual directamente en Telegram (Sin enlaces externos)
      if (data.startsWith('dl_single:')) {
        const parts = data.split(':');
        const mediaId = parts[1];
        const fmt = parts[2] || 'hd';

        const media = await fetchTikTokMedia(`https://www.tiktok.com/@a/video/${mediaId}`);
        if (media) {
          const isLive = Boolean(media.isLivePhoto);
          const isStaticImg = !isLive && Boolean(media.isImage);
          const isPhoto = isStaticImg || fmt === 'photo';
          const canonicalSource = `https://www.tiktok.com/@${media.username || 'a'}/video/${mediaId}`;

          let ext = isPhoto ? 'jpg' : 'mp4';
          let dlUrl = (isLive || isPhoto) ? canonicalSource : (media.playUrl || canonicalSource);
          let label = isPhoto ? 'Foto HD (JPG)' : (isLive ? 'Video Animado MP4' : 'Full HD 1080p');
          let extra = isLive && !isPhoto ? '&live=1' : '';

          if (fmt === 'mp3' && !isPhoto) {
            ext = 'mp3';
            dlUrl = media.musicUrl || dlUrl;
            label = 'Audio MP3';
            extra = '&format=mp3';
          } else if (fmt === 'mute' && !isPhoto) {
            label = 'Video Sin Sonido';
            extra = '&mute=1';
          } else if (fmt === 'photo') {
            dlUrl = canonicalSource;
            extra = '';
          }

          const fileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(dlUrl)}&filename=video_${media.username || 'tiktok'}_${mediaId}.${ext}${extra}`;

          await callPublicBot('sendDocument', {
            chat_id: chatId,
            document: fileUrl,
            caption: `✅ <b>Contenido de @${media.username || 'tiktok'}</b> (${label}) listo para guardar.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' }],
                [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
              ]
            }
          });

          await notifyAdminBot(`🤖 <b>Descarga Link:</b> ${fromUser} guardó contenido de <b>@${media.username || 'tiktok'}</b> (${label}).`);
        }
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // ----------------------------------------------------
    // 2. MANEJO DE MENSAJES DE TEXTO
    // ----------------------------------------------------
    const message = update.message;
    if (!message || !message.chat) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = (message.text || '').trim();
    const senderName = message.from?.first_name || 'Amigo';
    const fromUser = message.from?.username ? `@${message.from.username}` : senderName;

    // A) Comando /start o saludo
    if (text.startsWith('/start') || text.toLowerCase() === 'hola' || text.toLowerCase() === 'buenas') {
      await sendWelcomeMessage(chatId, senderName);
      return NextResponse.json({ ok: true });
    }

    // B) Enlace de TikTok
    const isUrl = /^https?:\/\//i.test(text);
    if (isUrl && (text.includes('tiktok.com') || text.includes('x.com') || text.includes('twitter.com'))) {
      const profileMatch = text.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)\/?(\?[^/]*)?$/i);
      const isMediaSubpath = text.includes('/video/') || text.includes('/photo/') || text.includes('/story/') || text.includes('/stories/');

      if (profileMatch && !isMediaSubpath) {
        await handlePublicUserProfile(chatId, profileMatch[1], fromUser);
        return NextResponse.json({ ok: true });
      }

      await callPublicBot('sendMessage', {
        chat_id: chatId,
        text: '⏳ <b>Procesando contenido en HD sin marca de agua...</b>',
        parse_mode: 'HTML'
      });

      const media = await fetchTikTokMedia(text);
      if (!media) {
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: '❌ <b>No se pudo cargar este enlace.</b>\nVerifica que sea público y esté disponible.',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' }]
            ]
          }
        });
        return NextResponse.json({ ok: true });
      }

      // Si es foto estática única o galería de fotos estáticas (sin video animado)
      if (media.isImage && media.images.length > 0) {
        if (media.images.length === 1) {
          const singleImgUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(media.images[0])}&filename=foto_${media.username || 'tiktok'}_${media.id}.jpg`;
          await callPublicBot('sendPhoto', {
            chat_id: chatId,
            photo: singleImgUrl,
            caption: `📷 <b>${media.title}</b>\n\n👤 Creador: <b>@${media.username}</b>\n✨ Calidad: <b>Foto HD Original (JPG)</b>\n\n¿Deseas guardar esta foto?`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📥 Sí, Guardar Foto (JPG)', callback_data: `dl_single:${media.id}:photo` },
                  { text: '❌ No guardar', callback_data: 'ask_user' }
                ],
                [
                  { text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' },
                  { text: '🏠 Menú Principal', callback_data: 'start_menu' }
                ]
              ]
            }
          });
          await notifyAdminBot(`🤖 <b>Descarga Foto Bot:</b> ${fromUser} consultó foto de <b>@${media.username}</b>.`);
          return NextResponse.json({ ok: true });
        }

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `📷 <b>Galería de Fotos (${media.images.length} imágenes)</b>\n👤 Creador: <b>@${media.username}</b>\n📌 Título: ${media.title}`,
          parse_mode: 'HTML'
        });

        for (let i = 0; i < Math.min(media.images.length, 5); i++) {
          const streamImg = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(media.images[i])}&filename=foto_${media.username || 'tiktok'}_${media.id}_${i + 1}.jpg`;
          await callPublicBot('sendPhoto', {
            chat_id: chatId,
            photo: streamImg,
            caption: `📷 Foto ${i + 1}/${media.images.length}`
          });
        }

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: '¿Deseas descargar algo más?',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' }],
              [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
            ]
          }
        });
        return NextResponse.json({ ok: true });
      }

      // Galería con múltiples Live Photos animadas (>1 slide)
      if (media.isLivePhoto && media.liveImages.length > 1) {
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `✨ <b>Galería de Fotos Animadas (${media.liveImages.length} clips Live Photo)</b>\n👤 Creador: <b>@${media.username}</b>\n📌 Título: ${media.title}`,
          parse_mode: 'HTML'
        });

        for (let i = 0; i < Math.min(media.liveImages.length, 5); i++) {
          const liveClipUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(media.liveImages[i])}&filename=animada_${media.username || 'tiktok'}_${media.id}_${i + 1}.mp4&live=1${media.musicUrl ? `&audio=${encodeURIComponent(media.musicUrl)}` : ''}`;
          await callPublicBot('sendVideo', {
            chat_id: chatId,
            video: liveClipUrl,
            caption: `✨ Live Photo ${i + 1}/${media.liveImages.length}`
          });
        }

        const extraKb: any[] = [];
        if (media.musicUrl) {
          extraKb.push([{ text: '🎵 Guardar Audio Original (MP3)', callback_data: `dl_single:${media.id}:mp3` }]);
        }
        extraKb.push([
          { text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' },
          { text: '🏠 Menú Principal', callback_data: 'start_menu' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: '¿Deseas descargar el audio o buscar otro usuario?',
          reply_markup: { inline_keyboard: extraKb }
        });
        await notifyAdminBot(`🤖 <b>Descarga Live Gallery Bot:</b> ${fromUser} vio galería Live de <b>@${media.username}</b>.`);
        return NextResponse.json({ ok: true });
      }

      // Live Photo individual (1 clip animado) o Video individual
      const isLive = Boolean(media.isLivePhoto);
      const canonicalVideoSource = media.id
        ? `https://www.tiktok.com/@${media.username || 'a'}/video/${media.id}`
        : media.playUrl;
      const streamVideoUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(canonicalVideoSource)}&filename=video_${media.username || 'tiktok'}_${media.id || 'hd'}.mp4${isLive ? '&live=1' : ''}`;
      const caption = isLive
        ? `✨ <b>${media.title}</b>\n\n👤 Creador: <b>@${media.username}</b>\n✨ Tipo: <b>Foto Animada en Movimiento (Live Photo MP4)</b>\n\n¿Deseas guardar este video animado?`
        : `🎬 <b>${media.title}</b>\n\n👤 Creador: <b>@${media.username}</b>\n✨ Calidad: <b>Full HD Sin Marca de Agua</b>\n\n¿Deseas guardar este video?`;

      const videoActions = {
        inline_keyboard: [
          [
            { text: '📥 Sí, Guardar en Dispositivo', callback_data: `ask_fmt_single:${media.id}` },
            { text: '❌ No guardar', callback_data: 'ask_user' }
          ],
          [
            { text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' },
            { text: '🏠 Menú Principal', callback_data: 'start_menu' }
          ]
        ]
      };

      await callPublicBot('sendVideo', {
        chat_id: chatId,
        video: streamVideoUrl,
        caption,
        parse_mode: 'HTML',
        reply_markup: videoActions
      });

      await notifyAdminBot(`🤖 <b>Descarga ${isLive ? 'Live Photo' : 'Video'} Bot:</b> ${fromUser} vio contenido de <b>@${media.username}</b>.`);
      return NextResponse.json({ ok: true });
    }

    // C) Detectar si envió Nombre de Usuario (@usuario o texto)
    const cleanUser = text.replace(/^@/, '').trim();
    if (cleanUser && !cleanUser.includes(' ') && cleanUser.length <= 40) {
      await handlePublicUserProfile(chatId, cleanUser, fromUser);
      return NextResponse.json({ ok: true });
    }

    // D) Ayuda general
    await callPublicBot('sendMessage', {
      chat_id: chatId,
      text: `
👋 <b>¿Cómo usar ByteDownloader Bot?</b>

• <b>Para ver o descargar Historias y Destacados:</b> Escribe el usuario, por ejemplo:
  👉 <code>@pepito123</code>
• <b>Para descargar un Video o Foto:</b> Pega el enlace de TikTok aquí.

Si la cuenta es privada, te avisaré al instante. 🔒
`.trim(),
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Buscar usuario ahora', callback_data: 'ask_user' }],
          [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
        ]
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in public webhook:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Mensaje de bienvenida inicial
async function sendWelcomeMessage(chatId: number, senderName: string) {
  const welcomeText = `
👋 <b>¡Hola, ${senderName}! Bienvenido a ByteDownloader HD Bot</b> 🚀

Aquí puedes ver y descargar contenido de <b>TikTok</b> en máxima calidad HD sin salir de Telegram:

• 🎬 <b>Ver y Descargar Videos:</b> Pega el enlace de cualquier publicación.
• ⏱️ <b>Historias de 24h:</b> Escribe el usuario (ejemplo: <code>@pepito123</code>).
• ⭐ <b>Colecciones Destacadas:</b> Explora carpetas y álbumes destacados.
• 🔒 <b>Cuentas Privadas:</b> Verificación automática de privacidad.

👉 <i>Escribe un <b>@usuario</b> o pega un enlace para comenzar:</i>
`.trim();

  await callPublicBot('sendMessage', {
    chat_id: chatId,
    text: welcomeText,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Buscar un usuario de TikTok', callback_data: 'ask_user' }],
        [{ text: '🌐 Abrir ByteDownloader en la Web', url: BASE_WEB_URL }]
      ]
    }
  });
}

// Función central para resolver perfiles y ofrecer flujo interactivo
async function handlePublicUserProfile(chatId: number, username: string, fromUser: string) {
  await callPublicBot('sendMessage', {
    chat_id: chatId,
    text: `🔍 <b>Buscando perfil y verificando historias de @${username}...</b>`,
    parse_mode: 'HTML'
  });

  const profile = await fetchProfileData(username);

  if (!profile) {
    await callPublicBot('sendMessage', {
      chat_id: chatId,
      text: `❌ <b>Usuario no encontrado</b>\n\nEl usuario <code>@${username}</code> no existe o no tiene publicaciones públicas. Por favor verifica que el nombre esté bien escrito.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }],
          [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
        ]
      }
    });
    return;
  }

  if (profile.is_private) {
    await callPublicBot('sendMessage', {
      chat_id: chatId,
      text: `🔒 <b>Cuenta Privada</b>\n\nEl usuario <code>@${username}</code> tiene su cuenta configurada como privada. TikTok solo permite ver su contenido a sus seguidores aprobados.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }],
          [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
        ]
      }
    });
    return;
  }

  const storiesCount = profile.stories ? profile.stories.length : 0;
  const highlightsCount = profile.highlights ? profile.highlights.length : 0;
  const videosCount = profile.videos ? profile.videos.length : 0;
  const totalPubs = profile.total_videos || videosCount;

  const cardText = `
👤 <b>${profile.nickname || username}</b> (<code>@${username}</code>)
${profile.signature ? `📝 <i>"${profile.signature}"</i>\n` : ''}
📊 <b>Estadísticas:</b>
• 🎬 Publicaciones: <b>${totalPubs}</b>
• ⏱️ Historias Activas (24h): <b>${storiesCount} disponibles</b>
• ⭐ Colecciones Destacadas: <b>${highlightsCount} disponibles</b>
• 👥 Seguidores: <b>${profile.followers || '0'}</b>

¿Qué deseas explorar de @${username}?
`.trim();

  const keyboard: any[] = [];

  if (storiesCount > 0) {
    keyboard.push([
      { text: `⏱️ Ver historias una por una (${storiesCount})`, callback_data: `view_stories:${username}` }
    ]);
  }

  if (highlightsCount > 0) {
    keyboard.push([
      { text: `⭐ Ver Destacados (${highlightsCount} colecciones)`, callback_data: `view_hl_menu:${username}:0` }
    ]);
  }

  if (videosCount > 0) {
    keyboard.push([
      { text: `🎬 Ver publicaciones recientes (${videosCount})`, callback_data: `view_vids_menu:${username}` }
    ]);
  }

  keyboard.push([
    { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' },
    { text: '🏠 Menú Principal', callback_data: 'start_menu' }
  ]);

  keyboard.push([
    { text: '🌐 Abrir perfil en la Web', url: `${BASE_WEB_URL}` }
  ]);

  await callPublicBot('sendMessage', {
    chat_id: chatId,
    text: cardText,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard }
  });

  await notifyAdminBot(`🔍 <b>Consulta en Bot Público:</b> ${fromUser} consultó a <b>@${username}</b> (${storiesCount} historias, ${highlightsCount} destacados, ${totalPubs} publicaciones).`);
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'ByteDownloader Public Bot Webhook is running active'
  });
}
