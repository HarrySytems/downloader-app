import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'Por favor, ingresa un usuario o enlace de TikTok.' }, { status: 400 });
    }

    // Extraer el username limpio (ej: @aydnsarpy o https://www.tiktok.com/@aydnsarpy)
    let username = url.trim();
    if (username.includes('tiktok.com')) {
      const match = username.match(/@([a-zA-Z0-9_.-]+)/);
      if (match) {
        username = match[1];
      }
    }
    username = username.replace(/^@/, '').split('?')[0].split('/')[0];

    if (!username) {
      return NextResponse.json({ success: false, error: 'Nombre de usuario inválido.' }, { status: 400 });
    }

    // Probar consultar TikWM User Info API desde Vercel
    try {
      const tikwmUrl = `https://tikwm.com/api/user/info?unique_id=${encodeURIComponent(username)}`;
      const resp = await fetch(tikwmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://tikwm.com/',
        },
        cache: 'no-store'
      });

      const text = await resp.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Si devolvió HTML de Cloudflare
        return NextResponse.json({
          success: false,
          isCloudflare: true,
          preview: text.slice(0, 300)
        });
      }

      return NextResponse.json({
        success: true,
        tikwmData: data
      });

    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
