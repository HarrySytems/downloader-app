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
        items: videos.slice(0, 8).map((v, i) => ({
          id: `item_1_${i}`,
          url: v.url,
          title: v.title || `Item ${i + 1}`,
          thumbnail: v.thumbnail,
          duration: v.duration || '0:20',
          views: v.views || '11.5K',
          playUrl: v.play || v.playUrl || v.url,
          musicUrl: v.musicUrl || ''
        }))
      },
      {
        id: 'hl_2',
        title: '☠️ Pro ti...',
        cover: v1.thumbnail || 'https://p19-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/o0iEpfevXQlRBwiIB3xiA8Bm2D7iE4zEq0zVyv~tplv-tiktokx-origin.image',
        count: Math.min(Math.max(1, videos.length - 1), 6),
        items: videos.slice(1, 7).map((v, i) => ({
          id: `item_2_${i}`,
          url: v.url,
          title: v.title || `Item ${i + 1}`,
          thumbnail: v.thumbnail,
          duration: v.duration || '0:23',
          views: v.views || '11.4K',
          playUrl: v.play || v.playUrl || v.url,
          musicUrl: v.musicUrl || ''
        }))
      },
      {
        id: 'hl_3',
        title: 'Momentos',
        cover: v2.thumbnail || 'https://p16-common-sign.tiktokcdn-us.com/tos-useast2a-p-0037-euttp/oIZgTj6PAQrIehMVj2iDGeq7vEISEBFnBjWzfD~tplv-tiktokx-origin.image',
        count: Math.min(Math.max(1, videos.length - 2), 5),
        items: videos.slice(2, 7).map((v, i) => ({
          id: `item_3_${i}`,
          url: v.url,
          title: v.title || `Item ${i + 1}`,
          thumbnail: v.thumbnail,
          duration: v.duration || '0:56',
          views: v.views || '199.8K',
          playUrl: v.play || v.playUrl || v.url,
          musicUrl: v.musicUrl || ''
        }))
      }
    ];
  }

  // Si los videos contienen mix_info
  const map = new Map<string, any>();
  for (const v of videos) {
    if (v.mix_info && v.mix_info.id) {
      const mId = String(v.mix_info.id);
      if (!map.has(mId)) {
        map.set(mId, {
          id: mId,
          title: v.mix_info.title || 'Colección Destacada',
          cover: v.thumbnail || '',
          count: v.mix_info.count || 0,
          items: []
        });
      }
      map.get(mId).items.push({
        id: v.id,
        url: v.url,
        title: v.title,
        thumbnail: v.thumbnail,
        duration: v.duration,
        views: v.views,
        playUrl: v.play || v.playUrl || v.url,
        musicUrl: v.musicUrl || ''
      });
    }
  }

  return Array.from(map.values());
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
      const images: string[] = d.images || [];
      const isImage = images.length > 0;
      const playUrl = d.play ? (d.play.startsWith('http') ? d.play : `https://tikwm.com${d.play}`) : '';
      const hdPlayUrl = d.hdplay ? (d.hdplay.startsWith('http') ? d.hdplay : `https://tikwm.com${d.hdplay}`) : playUrl;
      const musicUrl = d.music ? (d.music.startsWith('http') ? d.music : `https://tikwm.com${d.music}`) : '';

      const isAudioPlay = d.play && (d.play.includes('mime_type=audio') || d.play.includes('ies-music') || d.play === d.music);
      const validPlayUrl = isAudioPlay ? '' : (playUrl || hdPlayUrl);

      return {
        id: d.id,
        title: d.title || 'Video de TikTok',
        author: d.author?.nickname || d.author?.unique_id || 'TikTok User',
        username: d.author?.unique_id || '',
        cover: d.cover || d.origin_cover || '',
        isImage,
        images,
        playUrl: validPlayUrl,
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
              const isImg = Boolean(s.is_image || (s.images && s.images.length > 0) || s.duration === 'Foto' || s.duration === 0);
              const canonicalUrl = isImg 
                ? `https://www.tiktok.com/@${cleanUser}/photo/${s.id}` 
                : `https://www.tiktok.com/@${cleanUser}/video/${s.id}`;
              return {
                ...s,
                is_image: isImg,
                duration: isImg ? 'Foto' : (s.duration || '0:15'),
                url: canonicalUrl,
                download_url: canonicalUrl,
                music_url: isImg ? '' : (s.music_url || '')
              };
            });
          }
          if (ec2Data.videos && Array.isArray(ec2Data.videos)) {
            ec2Data.videos = ec2Data.videos.map((v: any) => {
              const isImg = Boolean(v.is_image || (v.images && v.images.length > 0) || v.duration === 'Foto' || v.duration === 0);
              return {
                ...v,
                is_image: isImg,
                duration: isImg ? 'Foto' : (v.duration || '0:15'),
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
      const pUrl = item.play ? (item.play.startsWith('http') ? item.play : `https://tikwm.com${item.play}`) : '';
      const hdpUrl = item.hdplay ? (item.hdplay.startsWith('http') ? item.hdplay : `https://tikwm.com${item.hdplay}`) : pUrl;
      const mUrl = item.music ? (item.music.startsWith('http') ? item.music : `https://tikwm.com${item.music}`) : '';
      const isAud = pUrl.includes('mime_type=audio') || pUrl.includes('ies-music') || pUrl === mUrl;
      const validP = isAud ? '' : (pUrl || hdpUrl);

      return {
        id: item.video_id,
        url: `https://www.tiktok.com/@${cleanUser}/video/${item.video_id}`,
        title: item.title || `Video de @${cleanUser}`,
        thumbnail: item.cover || item.origin_cover || '',
        play: validP,
        playUrl: validP,
        musicUrl: mUrl,
        duration: item.duration || 0,
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
          const images: string[] = s.images || [];
          const isImage = images.length > 0 || s.biz_tag === 'tt_photomode_story';
          const downloadUrl = (isImage && images.length > 0) 
            ? images[0] 
            : (s.play ? (s.play.startsWith('http') ? s.play : `https://tikwm.com${s.play}`) : '');

          stories.push({
            id: s.video_id,
            is_image: isImage,
            download_url: downloadUrl,
            images,
            duration: s.duration || 0,
            title: isImage ? 'Historia en Foto' : 'Historia en Video',
            music_url: s.music ? (s.music.startsWith('http') ? s.music : `https://tikwm.com${s.music}`) : ''
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
          text: `👁️ Ver Historia ${idx + 1} (${s.is_image ? '📷 Foto' : '🎬 Video HD'})`,
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

        const ext = story.is_image ? 'jpg' : 'mp4';
        const proxyStreamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(story.download_url)}&filename=historia_${username}_${storyIdx + 1}.${ext}`;
        const caption = `⏱️ <b>Historia #${storyIdx + 1} de @${username}</b>\n${story.is_image ? '📷 Tipo: Foto en Alta Resolución (HD)' : '🎬 Tipo: Video Full HD 1080p'}\n\n¿Deseas guardar este archivo en tu dispositivo?`;

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

        if (story.is_image) {
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

        // Si es una FOTO: NUNCA mostrar MP3 ni video, solo opción de guardar foto HD
        if (story.is_image) {
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

        // Si es un VIDEO:
        const videoButtons: any[] = [
          [{ text: '🎬 Video MP4 Full HD (1080p)', callback_data: `dl_st:${username}:${storyIdx}:hd` }],
          [{ text: '🔇 Video Sin Sonido (Mute)', callback_data: `dl_st:${username}:${storyIdx}:mute` }]
        ];

        if (story.music_url) {
          videoButtons.push([{ text: '🎵 Audio MP3 (Música)', callback_data: `dl_st:${username}:${storyIdx}:mp3` }]);
        }

        videoButtons.push([{ text: '🔙 Volver a historias', callback_data: `view_stories:${username}` }]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `📥 <b>Opciones de Formato para Historia #${storyIdx + 1}:</b>\nSelecciona el archivo que deseas guardar:`,
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
          const isPhoto = story.is_image || fmt === 'photo';
          let ext = isPhoto ? 'jpg' : 'mp4';
          let dlUrl = story.url || story.download_url;
          let label = isPhoto ? 'Foto HD (JPG)' : 'Video Full HD 1080p';

          if (fmt === 'mp3' && !isPhoto) {
            ext = 'mp3';
            dlUrl = story.music_url || dlUrl;
            label = 'Audio MP3';
          } else if (fmt === 'mute' && !isPhoto) {
            label = 'Video Sin Sonido';
          }

          const fileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(dlUrl)}&filename=historia_${username}_${storyIdx + 1}.${ext}${fmt === 'mp3' ? '&format=mp3' : ''}`;

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

      // CASO: VER un video de Destacado directamente en Telegram
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

        const isImg = Boolean((item as any).is_image || item.duration === 'Foto');
        const ext = isImg ? 'jpg' : 'mp4';
        const rawUrl = item.url || item.playUrl || item.download_url;
        const proxyStreamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(rawUrl)}&filename=destacado_${username}_${itemIdx + 1}.${ext}`;
        const caption = isImg 
          ? `📷 <b>${item.title}</b>\n📁 Colección: <b>${hl.title}</b> (@${username})\n✨ Calidad: <b>Foto Full HD (Alta Definición)</b>\n\n¿Deseas guardar esta foto en tu galería?`
          : `🎬 <b>${item.title}</b>\n📁 Colección: <b>${hl.title}</b> (@${username})\n✨ Calidad: <b>Full HD 1080p Sin Marca de Agua</b>\n\n¿Deseas descargar este video a tu dispositivo?`;

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

        const isImg = Boolean((item as any)?.is_image || item?.duration === 'Foto');
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
          [{ text: '🎬 Video MP4 Full HD (1080p)', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:hd` }],
          [{ text: '🔇 Video Sin Sonido (Mute)', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:mute` }]
        ];
        if (item?.musicUrl || (item as any)?.music_url) {
          videoButtons.push([{ text: '🎵 Audio MP3', callback_data: `dl_hl:${username}:${hlIdx}:${itemIdx}:mp3` }]);
        }
        videoButtons.push([{ text: '🔙 Cancelar / Volver', callback_data: `view_hl_detail:${username}:${parseInt(hlIdx, 10)}:0` }]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `📥 <b>Selecciona el formato de descarga deseado:</b>`,
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
          const isPhoto = Boolean((item as any).is_image || fmt === 'photo');
          let ext = isPhoto ? 'jpg' : 'mp4';
          let dlUrl = item.url || item.playUrl || item.download_url;
          let label = isPhoto ? 'Foto HD (JPG)' : 'Full HD 1080p';

          if (fmt === 'mp3' && !isPhoto) {
            ext = 'mp3';
            dlUrl = item.musicUrl || (item as any).music_url || dlUrl;
            label = 'Audio MP3';
          } else if (fmt === 'mute' && !isPhoto) {
            label = 'Video Sin Sonido';
          }

          const fileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(dlUrl)}&filename=destacado_${username}_${itemIdx + 1}.${ext}${fmt === 'mp3' ? '&format=mp3' : ''}`;

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
          const label = v.title ? (v.title.length > 25 ? v.title.slice(0, 25) + '...' : v.title) : `Video #${idx + 1}`;
          return [{
            text: `👁️ Ver #${idx + 1}: ${label}`,
            callback_data: `show_pub_vid:${username}:${idx}`
          }];
        });

        buttons.push([
          { text: '🔙 Volver al perfil', callback_data: `profile:${username}` },
          { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `🎬 <b>Últimas Publicaciones de @${username}:</b>\nToca cualquier video para verlo directamente aquí en Telegram:`,
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

        const isImg = Boolean((video as any).is_image || video.duration === 'Foto');
        const ext = isImg ? 'jpg' : 'mp4';
        const rawUrl = video.url || video.play || video.playUrl;
        const proxyStreamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(rawUrl)}&filename=publicacion_${username}_${idx + 1}.${ext}`;
        const caption = isImg
          ? `📷 <b>${video.title}</b>\n👤 Creador: <b>@${username}</b>\n✨ Calidad: <b>Foto Full HD (Alta Definición)</b>\n\n¿Deseas guardar esta foto en tu galería?`
          : `🎬 <b>${video.title}</b>\n👤 Creador: <b>@${username}</b>\n✨ Calidad: <b>Full HD 1080p Sin Marca de Agua</b>\n\n¿Deseas descargar este video a tu dispositivo?`;

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

        const isImg = Boolean((video as any)?.is_image || video?.duration === 'Foto');
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
          [{ text: '🎬 Video MP4 Full HD (1080p)', callback_data: `dl_pub:${username}:${idx}:hd` }],
          [{ text: '🔇 Video Sin Sonido (Mute)', callback_data: `dl_pub:${username}:${idx}:mute` }]
        ];

        if (video?.musicUrl || (video as any)?.music_url) {
          videoButtons.push([{ text: '🎵 Audio MP3', callback_data: `dl_pub:${username}:${idx}:mp3` }]);
        }

        videoButtons.push([{ text: '🔙 Cancelar / Volver', callback_data: `view_vids_menu:${username}` }]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `📥 <b>Selecciona el formato de descarga deseado:</b>`,
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
          const isPhoto = Boolean((video as any).is_image || fmt === 'photo');
          let ext = isPhoto ? 'jpg' : 'mp4';
          let dlUrl = video.url || video.play || video.playUrl;
          let label = isPhoto ? 'Foto HD (JPG)' : 'Full HD 1080p';

          if (fmt === 'mp3' && !isPhoto) {
            ext = 'mp3';
            dlUrl = video.musicUrl || (video as any).music_url || dlUrl;
            label = 'Audio MP3';
          } else if (fmt === 'mute' && !isPhoto) {
            label = 'Video Sin Sonido';
          }

          const fileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(dlUrl)}&filename=video_${username}_${idx + 1}.${ext}${fmt === 'mp3' ? '&format=mp3' : ''}`;

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
        text: '⏳ <b>Procesando video en HD sin marca de agua...</b>',
        parse_mode: 'HTML'
      });

      const media = await fetchTikTokMedia(text);
      if (!media) {
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: '❌ <b>No se pudo cargar este video.</b>\nVerifica que sea público y esté disponible.',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' }]
            ]
          }
        });
        return NextResponse.json({ ok: true });
      }

      // Si es galería de fotos
      if (media.isImage && media.images.length > 0) {
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `📷 <b>Galería de Fotos (${media.images.length} imágenes)</b>\n👤 Creador: <b>@${media.username}</b>\n📌 Título: ${media.title}`,
          parse_mode: 'HTML'
        });

        for (let i = 0; i < Math.min(media.images.length, 5); i++) {
          const streamImg = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(media.images[i])}`;
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

      // Video individual
      const streamVideoUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(media.playUrl)}`;
      const caption = `🎬 <b>${media.title}</b>\n\n👤 Creador: <b>@${media.username}</b>\n✨ Calidad: <b>Full HD Sin Marca de Agua</b>\n\n¿Deseas guardar este video?`;

      const videoActions = {
        inline_keyboard: [
          [
            { text: '🎬 Guardar MP4 Full HD', url: `${streamVideoUrl}&filename=video_${media.username}.mp4` }
          ],
          [
            { text: '🎵 Guardar Audio MP3', url: `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(media.musicUrl || media.playUrl)}&filename=audio_${media.username}.mp3` }
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

      await notifyAdminBot(`🤖 <b>Descarga Video Bot:</b> ${fromUser} descargó el video de <b>@${media.username}</b>.`);
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
