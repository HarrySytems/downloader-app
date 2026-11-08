export function extractClientMeta(request: Request) {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (headers.get('x-real-ip') || 'N/A');
  const country = headers.get('x-vercel-ip-country') || '';
  const rawCity = headers.get('x-vercel-ip-city') || '';
  let city = '';
  try {
    city = rawCity ? decodeURIComponent(rawCity) : '';
  } catch {
    city = rawCity;
  }
  const userAgent = headers.get('user-agent') || '';
  
  let device = 'Navegador Web';
  if (/android/i.test(userAgent)) device = 'Android 📱';
  else if (/iphone|ipad|ipod/i.test(userAgent)) device = 'iPhone/iOS 🍏';
  else if (/windows/i.test(userAgent)) device = 'Windows PC 💻';
  else if (/macintosh|mac os x/i.test(userAgent)) device = 'Mac 🖥️';
  else if (/linux/i.test(userAgent)) device = 'Linux 🐧';

  return { ip, country, city, device };
}

export async function sendTelegramAlert(data: {
  action: 'VISITA' | 'DESCARGA_VIDEO' | 'DESCARGA_HISTORIA' | 'DESCARGA_FOTO' | 'BUSQUEDA_PERFIL';
  detail: string;
  ip?: string;
  country?: string;
  city?: string;
  device?: string;
  extra?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN || '9132469583:AAErssUcngqSnTEP6zmlhIATCXmfF-QZVoU';
  const chatId = process.env.TELEGRAM_CHAT_ID || '7249715086';

  if (!chatId) return;

  const flagEmoji = (code?: string) => {
    if (!code || code.length !== 2) return '🌐';
    const offset = 127397;
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + offset));
  };

  const actionEmoji = {
    VISITA: '👀',
    DESCARGA_VIDEO: '🎬',
    DESCARGA_HISTORIA: '⏱️',
    DESCARGA_FOTO: '📷',
    BUSQUEDA_PERFIL: '🔍'
  }[data.action] || '📥';

  const actionTitle = {
    VISITA: 'Nueva Visita en la Web',
    DESCARGA_VIDEO: 'Descarga de Video HD',
    DESCARGA_HISTORIA: 'Descarga de Historia (24h)',
    DESCARGA_FOTO: 'Descarga de Foto/Galería',
    BUSQUEDA_PERFIL: 'Búsqueda de Perfil Completo'
  }[data.action] || 'Actividad en ByteDownloader';

  const locationStr = data.country 
    ? `${data.city ? `${data.city}, ` : ''}${data.country} ${flagEmoji(data.country)}`
    : (data.ip || 'Desconocida');

  const now = new Date().toLocaleTimeString('es-ES', { 
    timeZone: 'America/Lima',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  const message = `
${actionEmoji} <b>${actionTitle}</b>

📌 <b>Detalle:</b> <code>${data.detail}</code>
📍 <b>Ubicación:</b> ${locationStr}
🌐 <b>IP:</b> <code>${data.ip || 'N/A'}</code>
📱 <b>Dispositivo:</b> ${data.device || 'Navegador Web'}
⏰ <b>Hora (PE):</b> ${now}
${data.extra ? `ℹ️ <b>Extra:</b> ${data.extra}` : ''}
`.trim();

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
  } catch (err) {
    console.error('Error sending telegram alert:', err);
  }
}
