import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'media_file.mp4';

    if (!fileUrl) {
      return new Response('URL parameter is required', { status: 400 });
    }

    // Detectar si el backend especificó codec=hevc y si el cliente quiere transcodificar
    let isHevc = false;
    const shouldTranscode = searchParams.get('transcode') !== 'false';
    try {
      const fileUrlObj = new URL(fileUrl);
      if (fileUrlObj.searchParams.get('codec') === 'hevc' && shouldTranscode) {
        isHevc = true;
      }
    } catch (e) {
      // Ignorar errores
    }

    // Cambiar la cabecera Referer según la plataforma para evitar bloqueos del CDN
    let referer = 'https://www.tiktok.com/';
    if (fileUrl.includes('twimg.com') || fileUrl.includes('twitter.com') || fileUrl.includes('x.com')) {
      referer = 'https://twitter.com/';
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

    if (isHevc) {
      console.log(`[Local Transcoder] Transcodificando HEVC a H.264 para el archivo: ${filename}`);
      
      // Iniciar el FFmpeg local
      const ffmpeg = spawn('ffmpeg', [
        '-y', '-i', 'pipe:0',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24',
        '-map', '0:v', '-map', '0:a?', '-c:a', 'aac',
        '-f', 'mp4', '-movflags', 'frag_keyframe+empty_moov',
        'pipe:1'
      ]);

      // Evitar que errores en stdin crasheen el servidor Node (ej: EPIPE si ffmpeg cierra la entrada temprano)
      ffmpeg.stdin.on('error', (err) => {
        console.error('[FFmpeg Local Stdin Error]:', err);
      });

      // Alimentar stdin de ffmpeg con la respuesta del backend
      if (response.body) {
        const reader = response.body.getReader();
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                ffmpeg.stdin.end();
                break;
              }
              // Verificar si stdin sigue abierto antes de escribir
              if (ffmpeg.stdin.writable) {
                ffmpeg.stdin.write(Buffer.from(value));
              } else {
                break;
              }
            }
          } catch (err) {
            console.error('Error feeding local ffmpeg stdin:', err);
            ffmpeg.stdin.destroy();
            ffmpeg.kill();
          }
        })();
      }

      // Convertir stdout de ffmpeg a un Stream Web
      const webStream = new ReadableStream({
        start(controller) {
          ffmpeg.stdout.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          ffmpeg.stdout.on('end', () => {
            controller.close();
          });
          ffmpeg.stdout.on('error', (err) => {
            controller.error(err);
          });
          ffmpeg.on('error', (err) => {
            controller.error(err);
          });
        },
        cancel() {
          ffmpeg.kill();
        }
      });

      // Retornar respuesta transcodificada sin Content-Length (para evitar descargas truncadas)
      return new Response(webStream, {
        status: 200,
        headers,
      });

    } else {
      // Transmisión directa
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        headers.set('Content-Length', contentLength);
      }
      return new Response(response.body, {
        status: 200,
        headers,
      });
    }

  } catch (error) {
    console.error('Download Proxy Error:', error);
    return new Response('Internal Server Error during download proxying', { status: 500 });
  }
}
