from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import asyncio
import urllib.parse
import httpx
import http.cookiejar
import requests
import re
import base64
import json

def fetch_tikvid_hd_py(tiktok_url: str) -> dict:
    try:
        api_url = "https://tikvid.io/api/ajaxSearch"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "https://tikvid.io",
            "Referer": "https://tikvid.io/en"
        }
        data = {
            "q": tiktok_url,
            "lang": "en"
        }
        resp = requests.post(api_url, headers=headers, data=data, timeout=10)
        if resp.status_code != 200:
            print(f"TikVid Python scrape failed with status: {resp.status_code}")
            return None
            
        res_json = resp.json()
        if res_json.get("status") != "ok" or not res_json.get("data"):
            print("TikVid response status not ok")
            return None
            
        html_data = res_json.get("data", "")
        
        # Extract thumbnail
        img_match = re.search(r'<img[^>]+src="([^"]+)"', html_data)
        thumbnail = img_match.group(1).replace('&amp;', '&') if img_match else ""
        
        # Extract title
        title_match = re.search(r'<h3>([^<]+)</h3>', html_data)
        title = title_match.group(1).strip() if title_match else "Video de TikTok"
        
        # Extract tokens from href="https://dl.snapcdn.app/get?token=..."
        tokens = re.findall(r'href="https://dl\.snapcdn\.app/get\?token=([^"]+)"', html_data)
        
        hd_url = None
        regular_url = None
        
        for token in tokens:
            try:
                # Decode JWT payload (second part of token)
                payload_parts = token.split('.')
                if len(payload_parts) >= 2:
                    payload_b64 = payload_parts[1]
                    missing_padding = len(payload_b64) % 4
                    if missing_padding:
                        payload_b64 += '=' * (4 - missing_padding)
                    payload_json = base64.b64decode(payload_b64.encode('utf-8')).decode('utf-8')
                    payload = json.loads(payload_json)
                    
                    filename = payload.get('filename', '')
                    url_val = payload.get('url')
                    if filename and '-hd.mp4' in filename:
                        hd_url = url_val
                        break
                    elif filename and filename.endswith('.mp4'):
                        regular_url = url_val
            except Exception as e:
                print(f"Error decoding TikVid token in python: {e}")
                
        video_url = hd_url or regular_url
        if not video_url:
            return None
            
        return {
            "videoUrl": video_url,
            "thumbnail": thumbnail,
            "title": title
        }
    except Exception as e:
        print(f"TikVid scrape exception: {e}")
        return None

app = FastAPI(title="ByteDownloader API Engine")

# Permitir CORS para que la web en Next.js se conecte directamente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caché global en memoria para guardar las URLs de transmisión ilimitada
stream_cache = {}

@app.on_event("startup")
async def startup_event():
    # Unir todas las cookies en un solo archivo master cuando el servidor inicia
    cookie_files = ["www.tiktok.com_cookies.txt"]
    master_cookie_content = "# Netscape HTTP Cookie File\n"
    
    cookies_found = False
    for cf in cookie_files:
        if os.path.exists(cf):
            cookies_found = True
            with open(cf, 'r', encoding='utf-8') as f:
                master_cookie_content += f.read() + "\n"
                
    if cookies_found:
        with open("master_cookies.txt", 'w', encoding='utf-8') as f:
            f.write(master_cookie_content)
        print("Master cookies file generated successfully!")

class ExtractRequest(BaseModel):
    url: str
    format_preference: str = "h264"

async def clean_tiktok_url(url: str) -> str:
    url = url.strip()
    if "tiktok.com" in url:
        if "/photo/" in url:
            url = url.replace("/photo/", "/video/")
        if "vm.tiktok.com" in url or "vt.tiktok.com" in url or "v.tiktok.com" in url:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, follow_redirects=True, headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    })
                    url = str(resp.url)
            except Exception as e:
                print(f"Error resolving TikTok redirect: {e}")
        if "?" in url:
            url = url.split("?")[0]
    return url

# ----------------- RUTA ESTABLE DE SIEMPRE (BASADA EN DISCO) -----------------

# Eliminar el video temporal del servidor después de descargarlo
def delete_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted temp file: {file_path}")
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")

@app.post("/api/extract")
async def extract_info(req: ExtractRequest, background_tasks: BackgroundTasks, request: Request):
    url = await clean_tiktok_url(req.url)
    
    file_id = str(uuid.uuid4())
    output_filename = f"video_{file_id}.mp4"
    
    # Seleccionar formato según la preferencia de calidad
    fmt_str = 'bestvideo+bestaudio/best' if req.format_preference == 'best' else 'bestvideo[vcodec*=h264]+bestaudio/best[vcodec*=h264]/best'
    
    ydl_opts = {
        'format': fmt_str,
        'outtmpl': output_filename,
        'merge_output_format': 'mp4',
    }
    
    if os.path.exists("master_cookies.txt"):
        ydl_opts['cookiefile'] = "master_cookies.txt"
    
    try:
        def download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=True)
                
        info = await asyncio.to_thread(download)
        
        platform = info.get('extractor', 'unknown').lower()
        title = info.get('title', 'Video')
        thumbnail = info.get('thumbnail', '')
        
        # Detectar el codec original (para saber si es H.264 o H.265)
        vcodec = info.get('vcodec', '').lower()
        codec = "hevc" if ("h265" in vcodec or "hevc" in vcodec or "hvc1" in vcodec) else "h264"
        
        # Generar el enlace hacia el endpoint del servidor
        base_url = str(request.base_url).rstrip('/')
        download_link = f"{base_url}/download/{output_filename}?codec={codec}"
        
        # Programar la eliminación del video en 30 minutos (1800 segundos) para liberar espacio
        loop = asyncio.get_running_loop()
        loop.call_later(1800, delete_file, output_filename)
        
        return {
            "success": True,
            "platform": platform,
            "title": title,
            "thumbnail": thumbnail,
            "videoUrl": download_link,
            "needs_processing": False
        }
        
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        raise HTTPException(status_code=400, detail=f"No se pudo descargar el video. Asegúrate de que el enlace sea público. Error: {error_msg}")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del motor: {str(e)}")

@app.get("/download/{filename}")
async def serve_file(filename: str, background_tasks: BackgroundTasks):
    if not os.path.exists(filename):
        raise HTTPException(status_code=404, detail="El archivo ya expiró o no existe.")
    return FileResponse(
        path=filename, 
        filename="ByteDownloader_Video.mp4", 
        media_type="video/mp4"
    )


# ----------------- NUEVA RUTA DE PRUEBA (ILIMITADA Y CON COOKIES) -----------------

@app.post("/api/extract-stream")
async def extract_info_stream(req: ExtractRequest, background_tasks: BackgroundTasks, request: Request):
    url = await clean_tiktok_url(req.url)
    
    # Si es un enlace de TikTok, intentar extraer el original HD de TikVid
    if "tiktok.com" in url:
        tikvid_res = await asyncio.to_thread(fetch_tikvid_hd_py, url)
        if tikvid_res:
            stream_id = str(uuid.uuid4())
            # Guardar en memoria
            stream_cache[stream_id] = {
                "url": tikvid_res["videoUrl"],
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "filename": f"{tikvid_res['title']}.mp4"
            }
            # Eliminar de memoria en 30 minutos
            loop = asyncio.get_running_loop()
            loop.call_later(1800, lambda: stream_cache.pop(stream_id, None))
            
            base_url = str(request.base_url).rstrip('/')
            codec = "hevc" if "original.mp4" in tikvid_res["videoUrl"] else "h264"
            download_link = f"{base_url}/download-stream/{stream_id}?codec={codec}"
            
            return {
                "success": True,
                "platform": "tiktok",
                "title": tikvid_res["title"],
                "thumbnail": tikvid_res["thumbnail"],
                "videoUrl": download_link,
                "needs_processing": False
            }
            
    # Seleccionar formato según la preferencia de calidad
    fmt_str = 'bestvideo+bestaudio/best' if req.format_preference == 'best' else 'bestvideo[vcodec*=h264]+bestaudio/best[vcodec*=h264]/best'
    
    ydl_opts = {
        'format': fmt_str,
    }
    
    if os.path.exists("master_cookies.txt"):
        ydl_opts['cookiefile'] = "master_cookies.txt"
    
    try:
        # Extraer información sin descargar
        def get_info():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
                
        info = await asyncio.to_thread(get_info)
        
        stream_url = info.get('url')
        http_headers = info.get('http_headers', {})
        
        if not stream_url:
            raise HTTPException(status_code=400, detail="No se pudo extraer la URL directa del video.")
            
        platform = info.get('extractor', 'unknown').lower()
        title = info.get('title', 'Video')
        thumbnail = info.get('thumbnail', '')
        
        vcodec = info.get('vcodec', '').lower()
        codec = "hevc" if ("h265" in vcodec or "hevc" in vcodec or "hvc1" in vcodec) else "h264"
        
        stream_id = str(uuid.uuid4())
        
        # Guardar en memoria
        stream_cache[stream_id] = {
            "url": stream_url,
            "headers": http_headers,
            "filename": f"{title}.mp4"
        }
        
        # Eliminar de memoria en 30 minutos
        loop = asyncio.get_running_loop()
        loop.call_later(1800, lambda: stream_cache.pop(stream_id, None))
        
        base_url = str(request.base_url).rstrip('/')
        download_link = f"{base_url}/download-stream/{stream_id}?codec={codec}"
        
        return {
            "success": True,
            "platform": platform,
            "title": title,
            "thumbnail": thumbnail,
            "videoUrl": download_link,
            "needs_processing": False
        }
        
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        raise HTTPException(status_code=400, detail=f"No se pudo extraer información del video. Error: {error_msg}")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.get("/download-stream/{stream_id}")
async def serve_stream_file(stream_id: str, request: Request):
    if stream_id not in stream_cache:
        raise HTTPException(status_code=404, detail="El enlace de descarga ya expiró o no existe.")
        
    stream_info = stream_cache[stream_id]
    stream_url = stream_info["url"]
    headers = stream_info["headers"]
    filename = stream_info["filename"]
    
    # Soporte para Range Requests
    req_headers = {k: v for k, v in headers.items()}
    if "range" in request.headers:
        req_headers["range"] = request.headers["range"]
        
    # Spoof Referer to bypass hotlink block for TikVid CDN URLs
    if "tokcdn.com" in stream_url or "snapcdn.app" in stream_url:
        req_headers["Referer"] = "https://tikvid.io/"
        
    # Cargar las cookies desde master_cookies.txt si existe
    cookies = None
    if os.path.exists("master_cookies.txt"):
        try:
            jar = http.cookiejar.MozillaCookieJar("master_cookies.txt")
            jar.load(ignore_discard=True, ignore_expires=True)
            cookies = jar
        except Exception as e:
            print(f"Error cargando cookies para streaming: {e}")
            
    client = httpx.AsyncClient(cookies=cookies)
    
    try:
        # Iniciar la transmisión y copiar headers
        response = await client.send(
            client.build_request("GET", stream_url, headers=req_headers),
            stream=True,
            follow_redirects=True
        )
        
        res_headers = {}
        if "content-length" in response.headers:
            res_headers["content-length"] = response.headers["content-length"]
        if "content-range" in response.headers:
            res_headers["content-range"] = response.headers["content-range"]
        if "accept-ranges" in response.headers:
            res_headers["accept-ranges"] = response.headers["accept-ranges"]
            
        res_headers["content-disposition"] = f'attachment; filename="{urllib.parse.quote(filename)}"'
        res_headers["content-type"] = "video/mp4"
        res_headers["access-control-allow-origin"] = "*"
        
        async def stream_generator():
            try:
                async for chunk in response.aiter_bytes(chunk_size=65536):
                    yield chunk
            finally:
                await response.aclose()
                await client.aclose()
                
        return StreamingResponse(
            stream_generator(),
            status_code=response.status_code,
            headers=res_headers
        )
    except Exception as e:
        await client.aclose()
        raise HTTPException(status_code=500, detail=f"Error en streaming: {e}")


# ----------------- DIAGNOSTICOS E INFO -----------------

@app.get("/api/debug-audio")
async def debug_audio(url: str):
    import subprocess
    import json
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    if os.path.exists("master_cookies.txt"):
        ydl_opts['cookiefile'] = "master_cookies.txt"
        
    try:
        def get_info():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
        info = await asyncio.to_thread(get_info)
        formats = info.get('formats', [])
        
        results = []
        for f in formats:
            fid = f.get('format_id')
            url_stream = f.get('url')
            if not url_stream:
                continue
                
            headers = f.get('http_headers', {})
            headers_str = "".join([f"{k}: {v}\r\n" for k, v in headers.items()])
            
            cmd = ["ffprobe", "-headers", headers_str, "-v", "quiet", "-print_format", "json", "-show_streams", url_stream]
            def run_ffprobe():
                return subprocess.run(cmd, capture_output=True, text=True)
            res = await asyncio.to_thread(run_ffprobe)
            
            try:
                streams_info = json.loads(res.stdout)
                streams = streams_info.get('streams', [])
                codecs = [s.get('codec_name') for s in streams]
                results.append({
                    "format_id": fid,
                    "vcodec": f.get('vcodec'),
                    "acodec": f.get('acodec'),
                    "filesize": f.get('filesize'),
                    "probe_codecs": codecs
                })
            except Exception as e:
                results.append({
                    "format_id": fid,
                    "error": str(e),
                    "raw_stdout": res.stdout[:200],
                    "raw_stderr": res.stderr[:200]
                })
        return results
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/test-ffmpeg")
async def test_ffmpeg():
    import subprocess
    try:
        res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        return {
            "installed": True,
            "stdout": res.stdout[:500],
            "stderr": res.stderr[:500]
        }
    except Exception as e:
        return {
            "installed": False,
            "error": str(e)
        }

@app.get("/")
def read_root():
    return {"status": "ByteDownloader API Engine is running 🚀"}
