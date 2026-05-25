import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'media_file.mp4';

    if (!fileUrl) {
      return new Response('URL parameter is required', { status: 400 });
    }

    // Cambiar la cabecera Referer según la plataforma para evitar bloqueos del CDN
    let referer = 'https://www.tiktok.com/';
    if (fileUrl.includes('twimg.com') || fileUrl.includes('twitter.com') || fileUrl.includes('x.com')) {
      referer = 'https://twitter.com/';
    } else if (fileUrl.includes('tokcdn.com') || fileUrl.includes('snapcdn.app')) {
      referer = 'https://tikvid.io/';
    }

    const response = await fetch(fileUrl, {
      cache: 'no-store', // IMPORTANTE: Desactivar caché para evitar buffering de Next.js
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer,
      }
    });

    if (!response.ok) {
      return new Response('Error retrieving the file from backend', { status: response.status });
    }

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set('Content-Type', 'video/mp4');
    headers.set('Access-Control-Allow-Origin', '*');

    // Transmisión directa (sin transcodificar localmente en Vercel para evitar caídas por falta de FFmpeg)
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    return new Response(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Download Proxy Error:', error);
    return new Response('Internal Server Error during download proxying', { status: 500 });
  }
}
