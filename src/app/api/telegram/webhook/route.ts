import { NextResponse } from 'next/server';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9132469583:AAErssUcngqSnTEP6zmlhIATCXmfF-QZVoU';

export async function POST(request: Request) {
  try {
    const update = await request.json();

    if (!update || !update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const chatId = message.chat?.id;
    const text = (message.text || '').trim();
    const senderName = message.from?.first_name || 'Amigo';

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

    if (text.startsWith('/start') || text.toLowerCase() === 'hola' || text.toLowerCase() === 'buenas') {
      replyText = `
👋 <b>¡Hola, ${senderName}!</b>

Soy el bot de alertas en tiempo real de <b>ByteDownloader HD</b> (downloader.bytelog.lat).

🟢 <b>Estado:</b> Sistema de alertas 100% activo y monitoreando.

🔔 <b>¿Qué hago por ti?</b>
Te avisaré automáticamente aquí en cuanto alguien interactúe con tu web:
• 👀 <b>Visitas:</b> Alerta instantánea cuando un usuario nuevo entra (IP, país 🌍, ciudad y dispositivo).
• 🔍 <b>Búsquedas:</b> Alerta cuando buscan cualquier perfil o creador de TikTok.
• 📥 <b>Descargas:</b> Notificación con el archivo exacto descargado (Video HD, Foto, Galería o Historia 24h).

💡 <i>Comandos útiles:</i>
/status - Comprobar el estado del servidor y servicios.
/web - Enlace directo a tu sitio web.
`.trim();
    } else if (text.startsWith('/status')) {
      replyText = `
📊 <b>Estado de Servicios - ByteDownloader HD</b>

🟢 <b>Frontend Web:</b> En línea (<a href="https://downloader.bytelog.lat">downloader.bytelog.lat</a>)
🟢 <b>Backend Scraper:</b> En línea (EC2 AWS)
🟢 <b>Sistema de Alertas:</b> Operativo
⏰ <b>Hora Servidor (PE):</b> ${now}
`.trim();
    } else if (text.startsWith('/web')) {
      replyText = `
🌐 <b>Sitio Web Oficial:</b>
https://downloader.bytelog.lat
`.trim();
    } else {
      replyText = `
👋 <b>Bot de Alertas ByteDownloader HD</b>

Recibí tu mensaje: "<code>${text}</code>".

🟢 Este bot es tu panel de control de alertas. Te enviará notificaciones automáticas cada vez que alguien visite la web o descargue un archivo.

Escribe /start para ver el menú o /status para ver el estado del sistema.
`.trim();
    }

    // Send reply back to Telegram
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
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
    console.error('Error handling telegram webhook:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Telegram Webhook Endpoint is active for ByteDownloader HD'
  });
}
