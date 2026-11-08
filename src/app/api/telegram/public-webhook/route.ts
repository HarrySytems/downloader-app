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

      return {
        id: d.id,
        title: d.title || 'Video de TikTok',
        author: d.author?.nickname || d.author?.unique_id || 'TikTok User',
        username: d.author?.unique_id || '',
        cover: d.cover || d.origin_cover || '',
        isImage,
        images,
        playUrl: hdPlayUrl || playUrl,
        musicUrl,
        duration: d.duration || 0
      };
    }
    return null;
  } catch (err) {
    console.error('fetchTikTokMedia error:', err);
    return null;
  }
}

// Extractor de perfil y de historias activas completas (cursor multi-página)
async function fetchProfileData(username: string) {
  try {
    const cleanUser = username.replace(/^@/, '').trim();

    // 1. Probar backend en EC2
    try {
      const ec2Res = await fetch('http://3.19.208.2:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUser, start: 1, count: 20 }),
        cache: 'no-store'
      });
      if (ec2Res.ok) {
        const ec2Data = await ec2Res.json();
        if (ec2Data && ec2Data.success) {
          return ec2Data;
        }
      }
    } catch {}

    // 2. Fallback a TikWM posts + info + stories
    const postsRes = await fetch(`https://tikwm.com/api/user/posts?unique_id=${encodeURIComponent(cleanUser)}&count=20`, {
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
    const videos = rawVideos.map((item: any) => ({
      id: item.video_id,
      url: `https://www.tiktok.com/@${cleanUser}/video/${item.video_id}`,
      title: item.title || `Video de @${cleanUser}`,
      thumbnail: item.cover || item.origin_cover || '',
      play: item.play ? (item.play.startsWith('http') ? item.play : `https://tikwm.com${item.play}`) : ''
    }));

    // Historias activas con soporte de cursor completo
    let stories: any[] = [];
    try {
      let cursor = 0;
      let hasMore = true;
      let pages = 0;
      const seen = new Set<string>();

      while (hasMore && pages < 6) {
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
            title: isImage ? 'Historia en Foto' : 'Historia en Video'
          });
        }
        hasMore = Boolean(sData.data.hasMore);
        cursor = sData.data.cursor || 0;
        if (list.length === 0 || !cursor) break;
      }
    } catch {}

    // Metadatos del perfil
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
          followers = fCount >= 1000 ? `${(fCount / 1000).toFixed(1)}K` : String(fCount);
          totalVideos = stats.videoCount || u.video_count || totalVideos;
        }
      }
    } catch {}

    return {
      success: true,
      is_private: false,
      username: cleanUser,
      nickname,
      signature,
      followers,
      total_videos: totalVideos,
      stories,
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

      await callPublicBot('answerCallbackQuery', { callback_query_id: cqId });

      // CASO: Menú Principal
      if (data === 'start_menu') {
        await sendWelcomeMessage(chatId, cq.from?.first_name || 'Amigo');
        return NextResponse.json({ ok: true });
      }

      // CASO: Solicitar nuevo usuario para buscar (bucle sin fin)
      if (data === 'ask_user') {
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `
🔍 <b>Búsqueda de Usuario o Video</b>

Por favor, escribe el <b>@nombre_de_usuario</b> que deseas consultar (ejemplo: <code>@jaimeedwalker</code>) o pega el enlace de cualquier video de TikTok:
`.trim(),
          parse_mode: 'HTML'
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: Volver a mostrar la tarjeta del perfil
      if (data.startsWith('view_profile:')) {
        const username = data.replace('view_profile:', '').trim();
        await handlePublicUserProfile(chatId, username, fromUser);
        return NextResponse.json({ ok: true });
      }

      // CASO: Menú para ver historias una por una
      if (data.startsWith('view_stories_menu:')) {
        const username = data.replace('view_stories_menu:', '').trim();
        const profile = await fetchProfileData(username);
        const stories = profile?.stories || [];

        if (stories.length === 0) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `ℹ️ <b>@${username}</b> no tiene historias activas en este momento (recuerda que expiran a las 24 horas).`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }],
                [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        // Botones para VER cada historia directamente en Telegram
        const buttons = stories.map((s: any, idx: number) => {
          return [{
            text: `👁️ Ver Historia ${idx + 1} (${s.is_image ? '📷 Foto' : '🎬 Video'})`,
            callback_data: `show_story:${username}:${idx}`
          }];
        });

        buttons.push([
          { text: `📥 Descargar todas (${stories.length})`, callback_data: `dl_all_stories:${username}` }
        ]);
        buttons.push([
          { text: '🔙 Volver al perfil', callback_data: `view_profile:${username}` },
          { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `⏱️ <b>Historias Activas de @${username} (${stories.length}):</b>\n\nElige una historia para verla aquí mismo en Telegram:`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
        return NextResponse.json({ ok: true });
      }

      // CASO: VER una historia específica directamente en Telegram (sin mandarlo afuera)
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
                [{ text: '⏱️ Ver historias disponibles', callback_data: `view_stories_menu:${username}` }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        // Usamos nuestro proxy para que Telegram descargue el archivo sin bloqueos
        const proxyStreamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(story.download_url)}`;
        const caption = `⏱️ <b>Historia ${storyIdx + 1} de ${stories.length}</b> de <b>@${username}</b>\n${story.is_image ? '📷 Tipo: Foto' : '🎬 Tipo: Video HD'}\n\n¿Deseas descargarla como archivo a tu dispositivo?`;

        const actionButtons = {
          inline_keyboard: [
            [
              { text: '📥 Sí, descargar archivo', callback_data: `dl_file_story:${username}:${storyIdx}` },
              { text: '❌ No, ver otras', callback_data: `view_stories_menu:${username}` }
            ],
            [
              { text: '🔙 Volver al perfil', callback_data: `view_profile:${username}` },
              { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
            ]
          ]
        };

        let sentSuccess = false;

        // Si es foto, se envía con sendPhoto
        if (story.is_image) {
          const resPhoto = await callPublicBot('sendPhoto', {
            chat_id: chatId,
            photo: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
          if (resPhoto?.ok) sentSuccess = true;
        } else {
          // Si es video, se envía con sendVideo
          const resVid = await callPublicBot('sendVideo', {
            chat_id: chatId,
            video: proxyStreamUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: actionButtons
          });
          if (resVid?.ok) sentSuccess = true;
        }

        // Fallback si la API de Telegram no pudo descargar directamente el stream
        if (!sentSuccess) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `${caption}\n\n👇 Haz clic abajo para ver o guardar:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📥 Descargar en HD', url: `${proxyStreamUrl}&filename=historia_${username}_${storyIdx + 1}.${story.is_image ? 'jpg' : 'mp4'}` }],
                [{ text: '⏱️ Ver otras historias', callback_data: `view_stories_menu:${username}` }],
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });
        }

        return NextResponse.json({ ok: true });
      }

      // CASO: DESCARGAR una historia como archivo (Document)
      if (data.startsWith('dl_file_story:')) {
        const parts = data.split(':');
        const username = parts[1];
        const storyIdx = parseInt(parts[2] || '0', 10);

        const profile = await fetchProfileData(username);
        const stories = profile?.stories || [];
        const story = stories[storyIdx];

        if (story) {
          const ext = story.is_image ? 'jpg' : 'mp4';
          const proxyFileUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(story.download_url)}&filename=historia_${username}_${storyIdx + 1}.${ext}`;

          await callPublicBot('sendDocument', {
            chat_id: chatId,
            document: proxyFileUrl,
            caption: `✅ <b>Historia ${storyIdx + 1} de @${username}</b> lista para guardar en tu galería.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⏱️ Ver otra historia', callback_data: `view_stories_menu:${username}` },
                  { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
                ],
                [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
              ]
            }
          }).catch(async () => {
            // Fallback con botón de descarga directa
            await callPublicBot('sendMessage', {
              chat_id: chatId,
              text: `📥 <b>Descarga Directa:</b>`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Guardar Archivo HD', url: proxyFileUrl }],
                  [{ text: '⏱️ Ver otra historia', callback_data: `view_stories_menu:${username}` }]
                ]
              }
            });
          });

          await notifyAdminBot(`🤖 <b>Descarga Bot:</b> ${fromUser} descargó la historia #${storyIdx + 1} de <b>@${username}</b>.`);
        }
        return NextResponse.json({ ok: true });
      }

      // CASO: DESCARGAR TODAS LAS HISTORIAS
      if (data.startsWith('dl_all_stories:')) {
        const username = data.replace('dl_all_stories:', '').trim();
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `⏳ <b>Enviando todas las historias de @${username} a tu chat...</b>`,
          parse_mode: 'HTML'
        });

        const profile = await fetchProfileData(username);
        const stories = profile?.stories || [];

        if (stories.length === 0) {
          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `ℹ️ No hay historias activas disponibles para @${username}.`,
            parse_mode: 'HTML'
          });
        } else {
          for (let i = 0; i < stories.length; i++) {
            const st = stories[i];
            const streamUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(st.download_url)}`;
            const caption = `⏱️ <b>Historia ${i + 1}/${stories.length}</b> de @${username}`;

            if (st.is_image) {
              await callPublicBot('sendPhoto', {
                chat_id: chatId,
                photo: streamUrl,
                caption,
                parse_mode: 'HTML'
              });
            } else {
              await callPublicBot('sendVideo', {
                chat_id: chatId,
                video: streamUrl,
                caption,
                parse_mode: 'HTML'
              });
            }
          }

          await callPublicBot('sendMessage', {
            chat_id: chatId,
            text: `✅ <b>¡Completado!</b> Se enviaron las ${stories.length} historias activas de <b>@${username}</b> a tu Telegram.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🔙 Volver al perfil', callback_data: `view_profile:${username}` },
                  { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
                ],
                [{ text: '🏠 Menú Principal', callback_data: 'start_menu' }]
              ]
            }
          });

          await notifyAdminBot(`🤖 <b>Descarga Masiva:</b> ${fromUser} descargó las ${stories.length} historias de <b>@${username}</b>.`);
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
            text: `ℹ️ No se encontraron videos públicos para <b>@${username}</b>.`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }]
              ]
            }
          });
          return NextResponse.json({ ok: true });
        }

        const buttons = videos.map((v: any, idx: number) => {
          const label = v.title ? (v.title.length > 28 ? v.title.slice(0, 28) + '...' : v.title) : `Video #${idx + 1}`;
          const proxyUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(v.play)}&filename=video_${username}_${idx + 1}.mp4`;
          return [{
            text: `🎬 ${idx + 1}. ${label}`,
            url: proxyUrl
          }];
        });

        buttons.push([
          { text: '🔙 Volver al perfil', callback_data: `view_profile:${username}` },
          { text: '🔍 Buscar otro usuario', callback_data: 'ask_user' }
        ]);

        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `🎬 <b>Últimas Publicaciones de @${username}:</b>\nToca cualquier video para descargarlo en HD:`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
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

    // B) Si el usuario envió un enlace de TikTok (Media o Perfil)
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

      // Si es video individual: se envía el video directamente en Telegram
      const streamVideoUrl = `${BASE_WEB_URL}/api/proxy?url=${encodeURIComponent(media.playUrl)}`;
      const caption = `🎬 <b>${media.title}</b>\n\n👤 Creador: <b>@${media.username}</b>\n✨ Calidad: <b>Full HD Sin Marca de Agua</b>`;

      const videoActions = {
        inline_keyboard: [
          [
            { text: '📥 Guardar como Archivo HD', url: `${streamVideoUrl}&filename=video_${media.username}.mp4` }
          ],
          [
            { text: '🔍 Buscar otro usuario o video', callback_data: 'ask_user' },
            { text: '🏠 Menú Principal', callback_data: 'start_menu' }
          ]
        ]
      };

      let vidSent = false;
      if (media.playUrl) {
        const vidRes = await callPublicBot('sendVideo', {
          chat_id: chatId,
          video: streamVideoUrl,
          caption,
          parse_mode: 'HTML',
          reply_markup: videoActions
        });
        if (vidRes?.ok) vidSent = true;
      }

      if (!vidSent) {
        await callPublicBot('sendMessage', {
          chat_id: chatId,
          text: `${caption}\n\n👇 Haz clic abajo para descargarlo:`,
          parse_mode: 'HTML',
          reply_markup: videoActions
        });
      }

      await notifyAdminBot(`🤖 <b>Descarga Video Bot:</b> ${fromUser} descargó el video de <b>@${media.username}</b>.`);
      return NextResponse.json({ ok: true });
    }

    // C) Detectar si el usuario envió un Nombre de Usuario (@usuario o texto)
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

• <b>Para ver o descargar Historias:</b> Escribe el usuario, por ejemplo:
  👉 <code>@jaimeedwalker</code>
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

• 🎬 <b>Ver y Descargar Videos:</b> Pega aquí el enlace de cualquier publicación.
• ⏱️ <b>Ver Historias de 24h:</b> Escribe el nombre de usuario (ejemplo: <code>@jaimeedwalker</code>).
• 🔒 <b>Cuentas Privadas:</b> Te informaré de inmediato si la cuenta es privada o accesible.

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

  // Si no se encuentra
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

  // Si es cuenta privada
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
  const videosCount = profile.videos ? profile.videos.length : 0;
  const totalPubs = profile.total_videos || videosCount;

  const cardText = `
👤 <b>${profile.nickname || username}</b> (<code>@${username}</code>)
${profile.signature ? `📝 <i>"${profile.signature}"</i>\n` : ''}
📊 <b>Estadísticas:</b>
• 🎬 Publicaciones: <b>${totalPubs}</b>
• ⏱️ Historias Activas (24h): <b>${storiesCount} disponibles</b>
• 👥 Seguidores: <b>${profile.followers || '0'}</b>

¿Qué deseas hacer con el contenido de @${username}?
`.trim();

  const keyboard: any[] = [];

  if (storiesCount > 0) {
    keyboard.push([
      { text: `⏱️ Ver historias una por una (${storiesCount})`, callback_data: `view_stories_menu:${username}` }
    ]);
    keyboard.push([
      { text: `📥 Descargar todas las historias (${storiesCount})`, callback_data: `dl_all_stories:${username}` }
    ]);
  } else {
    keyboard.push([
      { text: `⏱️ Sin historias activas (expiradas)`, callback_data: `view_stories_menu:${username}` }
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

  await notifyAdminBot(`🔍 <b>Consulta en Bot Público:</b> ${fromUser} consultó a <b>@${username}</b> (${storiesCount} historias, ${totalPubs} publicaciones).`);
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'ByteDownloader Public Bot Webhook is running active'
  });
}
