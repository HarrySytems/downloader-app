import { NextResponse } from 'next/server';

export const maxDuration = 60;

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

    // 1. Consultar el motor backend en AWS EC2 (que corre extract_flat sin baneos)
    const backendUrl = 'http://3.19.208.2:8000/api/profile';
    try {
      const resp = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: username }),
        cache: 'no-store'
      });

      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data);
      } else {
        const errData = await resp.json().catch(() => null);
        let errorMsg = errData?.detail || 'No se pudo cargar el perfil en este momento.';
        if (errorMsg.toLowerCase().includes('unable to extract secondary user id') || errorMsg.toLowerCase().includes('not found')) {
          errorMsg = `El usuario @${username} no existe, es privado o no tiene videos públicos disponibles.`;
        }
        return NextResponse.json({
          success: false,
          error: errorMsg
        }, { status: resp.status });
      }
    } catch (err: any) {
      console.error('Profile backend fetch error:', err);
      return NextResponse.json({
        success: false,
        error: 'El motor de perfiles está ocupado. Intenta de nuevo en unos segundos.'
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('Global profile route error:', err);
    return NextResponse.json({ success: false, error: 'Ocurrió un error interno en el servidor.' }, { status: 500 });
  }
}
