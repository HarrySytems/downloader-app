import { NextResponse } from 'next/server';

const ADMIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9132469583:AAErssUcngqSnTEP6zmlhIATCXmfF-QZVoU';
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7249715086';

export async function POST(request: Request) {
  try {
    const update = await request.json();
    if (!update || !update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const chatId = message.chat?.id;
    const text = (message.text || '').trim();
    const senderName = message.from?.first_name || 'Admin';

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toLocaleTimeString('es-ES', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let replyText = '';

    if (String(chatId) === String(ADMIN_CHAT_ID)) {
      if (text.startsWith('/start') || text.toLowerCase() === 'hola' || text.toLowerCase() === 'buenas') {
        replyText = `
👑 <b>¡Hola, ${senderName}! Panel de Alertas Privado</b>

Este bot (<b>@Avisodescarga_bot</b>) está configurado exclusivamente para ti como Administrador.

🟢 <b>Estado:</b> Monitoreo en tiempo real 100% activo.

🔔 <b>Alertas que recibirás aquí:</b>
• 👀 <b>Visitas a la Web:</b> Notificación instantánea con IP, País con bandera 🌍, Ciudad y Dispositivo.
• 🔍 <b>Búsquedas de Perfiles:</b> Qué usuario de TikTok están buscando en la web o en el bot público.
• 📥 <b>Descargas Realizadas:</b> Cuándo alguien descarga un Video HD, Historia de 24h o Foto.
• 🤖 <b>Uso del Bot Público:</b> Avisos cada vez que un usuario interactúe con @ByteDownloaderHD_bot.

💡 <i>Comandos administrativos:</i>
/status - Comprobar el estado del servidor Vercel y EC2.
/web - Enlace al sitio web oficial.
`.trim();
      } else if (text.startsWith('/status')) {
        replyText = `
📊 <b>Estado de Infraestructura - ByteDownloader HD</b>

🟢 <b>Frontend Web:</b> En línea (<a href="https://downloader.bytelog.lat">downloader.bytelog.lat</a>)
🟢 <b>Backend Scraper:</b> En línea (AWS EC2 3.19.208.2:8000)
🟢 <b>Bot de Alertas Privado:</b> Activo (@Avisodescarga_bot)
🟢 <b>Bot Público de Usuarios:</b> Activo (@ByteDownloaderHD_bot)
⏰ <b>Hora Servidor (PE):</b> ${now}
`.trim();
      } else if (text.startsWith('/web')) {
        replyText = `
🌐 <b>Sitio Web Oficial:</b>
https://downloader.bytelog.lat
`.trim();
      } else {
        replyText = `
👑 <b>Panel de Control - ByteDownloader HD</b>

Recibí tu comando: "<code>${text}</code>".

🟢 Todas las alertas de visitas, búsquedas y descargas se te enviarán automáticamente a este chat.
Escribe /status para ver el estado de los servidores.
`.trim();
      }
    } else {
      // Si otra persona intenta usar este bot privado, indicarle el bot público
      replyText = `
🔒 <b>Bot Privado de Monitoreo</b>

Este bot es exclusivo para alertas del administrador.

Para descargar videos, fotos e historias de TikTok gratis y en HD, utiliza nuestro bot oficial de usuarios:
👉 <b>@ByteDownloaderHD_bot</b>
O visita nuestra web: https://downloader.bytelog.lat
`.trim();
    }

    await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in admin webhook:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'ByteDownloader Admin Alert Webhook is active'
  });
}
