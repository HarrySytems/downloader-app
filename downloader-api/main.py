from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import asyncio
import urllib.parse
import httpx
import http.cookiejar
import re

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

# Eliminar el video temporal del servidor después de descargarlo
def delete_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted temp file: {file_path}")
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")


# ----------------- RUTA BASADA EN DISCO -----------------

@app.post("/api/extract")
async def extract_info(req: ExtractRequest, background_tasks: BackgroundTasks, request: Request):
    url = await clean_tiktok_url(req.url)
    
    file_id = str(uuid.uuid4())
    output_filename = f"video_{file_id}.mp4"
    
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
        
        vcodec = info.get('vcodec', '').lower()
        codec = "hevc" if ("h265" in vcodec or "hevc" in vcodec or "hvc1" in vcodec) else "h264"
        
        base_url = str(request.base_url).rstrip('/')
        download_link = f"{base_url}/download/{output_filename}?codec={codec}"
        
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


# ----------------- RUTA BASADA EN TRANSMISIÓN EN VIVO (BRIDGE & STREAM) -----------------

@app.post("/api/extract-stream")
async def extract_info_stream(req: ExtractRequest, background_tasks: BackgroundTasks, request: Request):
    url = await clean_tiktok_url(req.url)
    
    # Si es TikTok, usar el puente de Hugging Face
    if "tiktok.com" in url:
        try:
            print(f"TikTok URL detected. Querying Hugging Face Space bridge...")
            async with httpx.AsyncClient() as client:
                hf_resp = await client.post(
                    "https://veterano901-servidorpropio.hf.space/api/extract-stream",
                    json={"url": url, "format_preference": req.format_preference},
                    timeout=20.0
                )
                if hf_resp.status_code == 200:
                    hf_data = hf_resp.json()
                    hf_video_url = hf_data.get("videoUrl")
                    
                    if hf_video_url:
                        # Extraer el ID del stream de Hugging Face
                        match = re.search(r'/download-stream/([^?]+)', hf_video_url)
                        if match:
                            hf_stream_id = match.group(1)
                            codec_match = re.search(r'codec=([^&]+)', hf_video_url)
                            codec = codec_match.group(1) if codec_match else "h264"
                            
                            # Registrar en la caché de AWS apuntando al streaming de Hugging Face
                            stream_id = str(uuid.uuid4())
                            stream_cache[stream_id] = {
                                "url": f"https://veterano901-servidorpropio.hf.space/download-stream/{hf_stream_id}?codec={codec}",
                                "headers": {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                },
                                "filename": f"{hf_data.get('title', 'Video_TikTok')}.mp4"
                            }
                            
                            # Expirar en 30 minutos
                            loop = asyncio.get_running_loop()
                            loop.call_later(1800, lambda: stream_cache.pop(stream_id, None))
                            
                            base_url = str(request.base_url).rstrip('/')
                            download_link = f"{base_url}/download-stream/{stream_id}?codec={codec}"
                            
                            return {
                                "success": True,
                                "platform": "tiktok",
                                "title": hf_data.get("title", "Video de TikTok"),
                                "thumbnail": hf_data.get("thumbnail", ""),
                                "videoUrl": download_link,
                                "needs_processing": False
                            }
                print(f"Hugging Face space responded with status {hf_resp.status_code}: {hf_resp.text}")
                raise HTTPException(status_code=400, detail="El puente de Hugging Face devolvió un error. Intenta de nuevo.")
        except Exception as e:
            print(f"Hugging Face Bridge exception: {e}")
            raise HTTPException(status_code=500, detail=f"Error en el puente de consulta: {str(e)}")
            
    # Para Twitter y otras plataformas, extracción directa desde AWS sin proxies
    fmt_str = 'bestvideo+bestaudio/best' if req.format_preference == 'best' else 'bestvideo[vcodec*=h264]+bestaudio/best[vcodec*=h264]/best'
    ydl_opts = {
        'format': fmt_str,
    }
    
    if os.path.exists("master_cookies.txt"):
        ydl_opts['cookiefile'] = "master_cookies.txt"
    
    try:
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
        
        stream_cache[stream_id] = {
            "url": stream_url,
            "headers": http_headers,
            "filename": f"{title}.mp4"
        }
        
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


class ProfileRequest(BaseModel):
    url: str

profile_cache = {}

def format_count_helper(n):
    if not n:
        return '0'
    if n >= 1_000_000:
        return f'{n / 1_000_000:.1f}M'.replace('.0M', 'M')
    if n >= 1_000:
        return f'{n / 1_000:.1f}K'.replace('.0K', 'K')
    return str(n)

@app.post("/api/profile")
async def extract_profile_endpoint(req: ProfileRequest):
    raw_url = req.url.strip()
    username = raw_url
    if "tiktok.com" in username:
        m = re.search(r'@([a-zA-Z0-9_.-]+)', username)
        if m:
            username = m.group(1)
    username = username.lstrip('@').split('?')[0].split('/')[0]
    
    if not username:
        raise HTTPException(status_code=400, detail="Por favor ingresa un nombre de usuario o enlace de perfil válido.")
        
    cache_key = username.lower()
    if cache_key in profile_cache:
        return profile_cache[cache_key]
        
    ydl_opts = {
        'extract_flat': 'in_playlist',
        'playlist_items': '1:18',
        'quiet': True,
    }
    if os.path.exists("master_cookies.txt"):
        ydl_opts['cookiefile'] = "master_cookies.txt"
    elif os.path.exists("www.tiktok.com_cookies.txt"):
        ydl_opts['cookiefile'] = "www.tiktok.com_cookies.txt"
        
    def get_info():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(f"https://www.tiktok.com/@{username}", download=False)
            
    try:
        info = await asyncio.to_thread(get_info)
    except yt_dlp.utils.DownloadError as e:
        err = str(e).lower()
        if "private" in err:
            return {
                "success": True,
                "is_private": True,
                "username": username,
                "nickname": username,
                "avatar": "",
                "message": "Esta cuenta es privada. Solo los seguidores aprobados pueden ver su contenido.",
                "videos": []
            }
        raise HTTPException(status_code=400, detail=f"No se pudo cargar el perfil: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
        
    entries = info.get('entries') or []
    videos = []
    nickname = username
    avatar = ""
    
    for item in entries:
        if not item:
            continue
        v_id = item.get('id')
        v_url = item.get('url') or f"https://www.tiktok.com/@{username}/video/{v_id}"
        nickname = item.get('channel') or item.get('uploader') or nickname
        
        thumbs = item.get('thumbnails') or []
        thumb_url = ""
        for t in thumbs:
            if t.get('id') in ['cover', 'originCover', 'dynamicCover'] and t.get('url'):
                thumb_url = t.get('url')
                break
        if not thumb_url and thumbs:
            thumb_url = thumbs[0].get('url', '')
            
        dur = item.get('duration') or 0
        dur_str = f"{int(dur // 60)}:{int(dur % 60):02d}" if dur else ""
        
        view_cnt = item.get('view_count') or 0
        like_cnt = item.get('like_count') or 0
        
        videos.append({
            "id": v_id,
            "url": v_url,
            "title": item.get('title') or f"Video de @{username}",
            "thumbnail": thumb_url,
            "duration": dur_str,
            "views": format_count_helper(view_cnt),
            "likes": format_count_helper(like_cnt),
        })
        
    if videos:
        try:
            async with httpx.AsyncClient() as client:
                tw_res = await client.post('https://tikwm.com/api/', data={'url': videos[0]['url']}, timeout=5.0)
                if tw_res.status_code == 200:
                    tw_data = tw_res.json().get('data', {})
                    avatar = tw_data.get('author', {}).get('avatar') or ""
                    if not nickname or nickname == username:
                        nickname = tw_data.get('author', {}).get('nickname') or nickname
        except Exception:
            pass
            
    res = {
        "success": True,
        "is_private": False,
        "username": username,
        "nickname": nickname,
        "avatar": avatar,
        "video_count": len(videos),
        "videos": videos
    }
    
    profile_cache[cache_key] = res
    loop = asyncio.get_running_loop()
    loop.call_later(600, lambda: profile_cache.pop(cache_key, None))
    return res

@app.get("/download-stream/{stream_id}")
async def serve_stream_file(stream_id: str, request: Request):
    if stream_id not in stream_cache:
        raise HTTPException(status_code=404, detail="El enlace de descarga ya expiró o no existe.")
        
    stream_info = stream_cache[stream_id]
    stream_url = stream_info["url"]
    headers = stream_info["headers"]
    filename = stream_info["filename"]
    
    req_headers = {k: v for k, v in headers.items()}
    if "range" in request.headers:
        req_headers["range"] = request.headers["range"]
        
    if "tokcdn.com" in stream_url or "snapcdn.app" in stream_url:
        req_headers["Referer"] = "https://tikvid.io/"
        
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
