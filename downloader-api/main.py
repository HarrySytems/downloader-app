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
import json

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
    format_preference: str = "best"

async def clean_tiktok_url(url: str) -> str:
    url = url.strip()
    if "tiktok.com" in url:
        # Resolver enlaces acortados (vm.tiktok.com, vt.tiktok.com, /t/)
        if "vm.tiktok.com" in url or "vt.tiktok.com" in url or "v.tiktok.com" in url or "/t/" in url:
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                }
                async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=8.0) as client:
                    resp = await client.get(url)
                    url = str(resp.url)
            except Exception as e:
                print(f"Error resolving TikTok redirect: {e}")
        if "/photo/" in url:
            url = url.replace("/photo/", "/video/")
        if "/story/" in url:
            url = url.replace("/story/", "/video/")
        if "/stories/" in url:
            url = url.replace("/stories/", "/video/")
        if "?" in url:
            url = url.split("?")[0]
    return url

def delete_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Archivo temporal eliminado: {file_path}")
    except Exception as e:
        print(f"Error al eliminar archivo temporal {file_path}: {e}")

def format_count_helper(n):
    if not n:
        return '0'
    try:
        n = int(n)
    except Exception:
        return str(n)
    if n >= 1_000_000:
        return f'{n / 1_000_000:.1f}M'.replace('.0M', 'M')
    if n >= 1_000:
        return f'{n / 1_000:.1f}K'.replace('.0K', 'K')
    return str(n)

async def fetch_user_meta(uname: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
    }
    url = f"https://www.tiktok.com/@{uname}"
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                ud_match = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', resp.text)
                if ud_match:
                    data = json.loads(ud_match.group(1))
                    scope = data.get("__DEFAULT_SCOPE__", {})
                    user_detail = scope.get("webapp.user-detail", {}).get("userInfo", {})
                    user = user_detail.get("user", {})
                    stats = user_detail.get("stats", {})
                    return {
                        "nickname": user.get("nickname") or uname,
                        "avatar": user.get("avatarLarger") or user.get("avatarMedium") or "",
                        "signature": user.get("signature") or "",
                        "verified": user.get("verified", False),
                        "followers": stats.get("followerCount", 0),
                        "following": stats.get("followingCount", 0),
                        "likes": stats.get("heartCount", 0),
                        "total_videos": stats.get("videoCount", 0),
                        "sec_uid": user.get("secUid", ""),
                        "is_private": user.get("privateAccount", False)
                    }
    except Exception as e:
        print(f"fetch_user_meta error for @{uname}: {e}")
        
    # Fallback si TikTok bloqueó el scraping directo de HTML
    try:
        async with httpx.AsyncClient(timeout=6.0) as tw_client:
            tw_info = await tw_client.get(f"https://tikwm.com/api/user/info?unique_id={uname}")
            if tw_info.status_code == 200:
                tw_json = tw_info.json()
                if tw_json.get("code") == 0 and tw_json.get("data", {}).get("user"):
                    u = tw_json["data"]["user"]
                    s = tw_json["data"].get("stats", {})
                    return {
                        "nickname": u.get("nickname") or uname,
                        "avatar": u.get("avatarLarger") or u.get("avatarMedium") or "",
                        "signature": u.get("signature") or "",
                        "verified": u.get("verified", False),
                        "followers": s.get("followerCount") or u.get("follower_count", 0),
                        "following": s.get("followingCount") or u.get("following_count", 0),
                        "likes": s.get("heartCount") or u.get("heart_count", 0),
                        "total_videos": s.get("videoCount") or u.get("video_count", 0),
                        "sec_uid": u.get("secUid", ""),
                        "is_private": False
                    }
    except Exception as tw_e:
        print(f"fetch_user_meta tikwm fallback error for @{uname}: {tw_e}")
        
    return {}

# ----------------- RUTA CLÁSICA (DESCARGA LOCAL) -----------------

@app.post("/api/extract")
async def extract_info(req: ExtractRequest, background_tasks: BackgroundTasks):
    url = await clean_tiktok_url(req.url)
    
    fmt_str = 'bestvideo+bestaudio/best' if req.format_preference == 'best' else 'bestvideo[vcodec*=h264]+bestaudio/best[vcodec*=h264]/best'
    
    unique_id = str(uuid.uuid4())
    temp_dir = "/tmp" if os.name != 'nt' else os.environ.get("TEMP", "C:\\temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file = os.path.join(temp_dir, f"{unique_id}.%(ext)s")
    final_output_file = os.path.join(temp_dir, f"{unique_id}.mp4")

    ydl_opts = {
        'format': fmt_str,
        'outtmpl': temp_file,
        'merge_output_format': 'mp4',
        'quiet': True,
        'no_warnings': True,
    }
    
    if os.path.exists("master_cookies.txt"):
        ydl_opts['cookiefile'] = "master_cookies.txt"

    try:
        def run_ydl():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=True)
        info = await asyncio.to_thread(run_ydl)
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        raise HTTPException(status_code=400, detail=f"No se pudo extraer información del video. Error: {error_msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

    if not os.path.exists(final_output_file):
        base_path = os.path.join(temp_dir, unique_id)
        for ext in ['.mp4', '.mkv', '.webm']:
            if os.path.exists(base_path + ext):
                final_output_file = base_path + ext
                break
        else:
            raise HTTPException(status_code=500, detail="El archivo de video no pudo ser generado localmente.")

    background_tasks.add_task(delete_file, final_output_file)
    
    return FileResponse(
        final_output_file, 
        filename="ByteDownloader_Video.mp4", 
        media_type="video/mp4"
    )

# ----------------- RUTA BASADA EN TRANSMISIÓN EN VIVO (BRIDGE & STREAM) -----------------

@app.post("/api/extract-stream")
async def extract_info_stream(req: ExtractRequest, background_tasks: BackgroundTasks, request: Request):
    raw_original_url = req.url
    url = await clean_tiktok_url(req.url)
    
    is_story = "/story/" in raw_original_url or "/stories/" in raw_original_url
    
    # 1. Puente Hugging Face Space si es TikTok
    if "tiktok.com" in url:
        try:
            print("TikTok URL detected. Querying Hugging Face Space bridge...")
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
                        match = re.search(r'/download-stream/([^?]+)', hf_video_url)
                        if match:
                            hf_stream_id = match.group(1)
                            codec_match = re.search(r'codec=([^&]+)', hf_video_url)
                            codec = codec_match.group(1) if codec_match else "h264"
                            
                            stream_id = str(uuid.uuid4())
                            stream_cache[stream_id] = {
                                "url": f"https://veterano901-servidorpropio.hf.space/download-stream/{hf_stream_id}?codec={codec}",
                                "headers": {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                },
                                "filename": f"{hf_data.get('title', 'Video_TikTok')}.mp4"
                            }
                            
                            loop = asyncio.get_running_loop()
                            loop.call_later(1800, lambda: stream_cache.pop(stream_id, None))
                            
                            base_url = str(request.base_url).rstrip('/')
                            download_link = f"{base_url}/download-stream/{stream_id}?codec={codec}"
                            
                            format_label = "Historia de TikTok" if is_story else "Video Full HD (1080p)"
                            media_type = "story" if is_story else "video"
                            
                            return {
                                "success": True,
                                "platform": "tiktok",
                                "title": hf_data.get("title", "Video de TikTok"),
                                "thumbnail": hf_data.get("thumbnail", ""),
                                "videoUrl": download_link,
                                "needs_processing": False,
                                "media_type": media_type,
                                "format_label": format_label,
                                "is_story": is_story
                            }
                print(f"Hugging Face space responded with status {hf_resp.status_code}, falling back to direct EC2 extraction...")
        except Exception as e:
            print(f"Hugging Face Bridge exception: {e}, falling back to direct EC2 extraction...")
            
    # 2. Extracción directa desde EC2
    fmt_str = 'bestvideo+bestaudio/best' if req.format_preference == 'best' else 'bestvideo[vcodec*=h264]+bestaudio/best[vcodec*=h264]/best'
    ydl_opts = {
        'format': fmt_str,
        'quiet': True,
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
        
        w = info.get('width') or 0
        h = info.get('height') or 0
        is_fhd = (w >= 1080 or h >= 1080)
        
        format_label = "Historia de TikTok" if is_story else ("Video Full HD (1080p)" if is_fhd else "Video HD")
        media_type = "story" if is_story else "video"
        
        return {
            "success": True,
            "platform": platform,
            "title": title,
            "thumbnail": thumbnail,
            "videoUrl": download_link,
            "needs_processing": False,
            "author": info.get('uploader') or info.get('channel') or "",
            "media_type": media_type,
            "format_label": format_label,
            "width": w,
            "height": h,
            "duration": info.get('duration') or 0,
            "is_story": is_story
        }
        
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        # 3. Fallback de emergencia a TikWM HD
        if "tiktok.com" in url or "douyin.com" in url:
            try:
                print(f"Direct yt-dlp failed ({error_msg}), attempting TikWM HD fallback...")
                async with httpx.AsyncClient(timeout=10.0) as tw_client:
                    tw_resp = await tw_client.post("https://tikwm.com/api/", data={"url": url, "hd": "1"})
                    if tw_resp.status_code == 200:
                        tw_data = tw_resp.json()
                        if tw_data.get("code") == 0 and tw_data.get("data"):
                            d = tw_data["data"]
                            images = d.get("images") or []
                            live_images = d.get("live_images") or []
                            has_live = any(bool(x) for x in live_images) or (len(images) == 1 and bool(d.get("play") or d.get("hdplay")))
                            is_gallery = len(images) > 1 and not has_live
                            
                            media_type = "live_photo" if has_live else ("gallery" if is_gallery else ("story" if is_story else "video"))
                            format_label = "Foto Animada (Live Photo · 3s)" if has_live else (f"Galería de Fotos ({len(images)})" if is_gallery else ("Historia de TikTok" if is_story else "Video HD"))
                            
                            v_url = (live_images[0] if has_live and live_images[0] else None) or d.get("hdplay") or d.get("play")
                            if v_url:
                                if not v_url.startswith("http"):
                                    v_url = "https://tikwm.com" + v_url
                                stream_id = str(uuid.uuid4())
                                stream_cache[stream_id] = {
                                    "url": v_url,
                                    "headers": {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                    },
                                    "filename": f"{d.get('title', 'Video_TikTok')}.mp4"
                                }
                                loop = asyncio.get_running_loop()
                                loop.call_later(1800, lambda: stream_cache.pop(stream_id, None))
                                base_url = str(request.base_url).rstrip('/')
                                return {
                                    "success": True,
                                    "platform": "tiktok",
                                    "title": d.get("title", "Video de TikTok"),
                                    "thumbnail": d.get("cover", ""),
                                    "videoUrl": f"{base_url}/download-stream/{stream_id}?codec=h264",
                                    "needs_processing": False,
                                    "images": images,
                                    "liveImages": live_images,
                                    "isLivePhoto": has_live,
                                    "isStory": is_story,
                                    "media_type": media_type,
                                    "format_label": format_label,
                                    "author": d.get("author", {}).get("nickname") or d.get("author", {}).get("unique_id") or ""
                                }
            except Exception as tw_err:
                print(f"TikWM emergency fallback error: {tw_err}")
        raise HTTPException(status_code=400, detail=f"No se pudo extraer información del video. Error: {error_msg}")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# ----------------- RUTA DE PERFILES (TODOS LOS USUARIOS) -----------------

class ProfileRequest(BaseModel):
    url: str
    start: int = 1
    count: int = 35

profile_cache = {}

@app.post("/api/profile")
async def extract_profile_endpoint(req: ProfileRequest):
    raw_url = req.url.strip()
    username = raw_url
    if "tiktok.com" in username:
        m = re.search(r'@([a-zA-Z0-9_.-]+)', username)
        if m:
            username = m.group(1)
        else:
            m2 = re.search(r'tiktok\.com\/([a-zA-Z0-9_.-]+)', username)
            if m2:
                username = m2.group(1)
    username = username.lstrip('@').split('?')[0].split('/')[0].strip()
    
    if not username:
        raise HTTPException(status_code=400, detail="Por favor ingresa un nombre de usuario o enlace de perfil válido.")
        
    start_idx = max(1, req.start)
    count = min(50, max(1, req.count))
    end_idx = start_idx + count - 1
    
    cache_key = f"{username.lower()}_{start_idx}_{count}"
    if cache_key in profile_cache:
        return profile_cache[cache_key]
        
    # Extraer metadatos de usuario (avatar 1080p, bio, seguidores, likes) en paralelo
    user_meta = {}
    if start_idx == 1:
        try:
            user_meta = await fetch_user_meta(username)
        except Exception as e:
            print(f"Meta error for @{username}: {e}")

    # Si es cuenta privada detectada desde la página oficial
    if user_meta.get("is_private"):
        return {
            "success": True,
            "is_private": True,
            "username": username,
            "nickname": user_meta.get("nickname") or username,
            "avatar": user_meta.get("avatar") or "",
            "signature": user_meta.get("signature") or "",
            "verified": user_meta.get("verified", False),
            "followers": format_count_helper(user_meta.get("followers", 0)),
            "following": format_count_helper(user_meta.get("following", 0)),
            "total_likes": format_count_helper(user_meta.get("likes", 0)),
            "total_videos": 0,
            "message": "Esta cuenta es privada. Solo los seguidores aprobados pueden ver su contenido.",
            "videos": [],
            "has_more": False,
            "next_start": 0
        }

    # yt-dlp sin cookies para evitar bloqueos por sesión
    ydl_opts = {
        'extract_flat': 'in_playlist',
        'playlist_items': f'{start_idx}:{end_idx}',
        'quiet': True,
    }
    
    target_endpoint = f"https://www.tiktok.com/@{username}"
    def get_info(endpoint):
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(endpoint, download=False)
            
    try:
        info = await asyncio.to_thread(get_info, target_endpoint)
    except yt_dlp.utils.DownloadError as e:
        err = str(e).lower()
        if "private" in err:
            return {
                "success": True,
                "is_private": True,
                "username": username,
                "nickname": user_meta.get("nickname") or username,
                "avatar": user_meta.get("avatar") or "",
                "signature": user_meta.get("signature") or "",
                "verified": user_meta.get("verified", False),
                "followers": format_count_helper(user_meta.get("followers", 0)),
                "following": format_count_helper(user_meta.get("following", 0)),
                "total_likes": format_count_helper(user_meta.get("likes", 0)),
                "total_videos": 0,
                "message": "Esta cuenta es privada. Solo los seguidores aprobados pueden ver su contenido.",
                "videos": [],
                "has_more": False,
                "next_start": 0
            }
        # Si falló, intentar con sec_uid si se obtuvo
        # Fallback ultra-confiable a TikWM API para perfiles
        try:
            print(f"yt-dlp profile failed for @{username} ({err}), attempting TikWM fallback...")
            async with httpx.AsyncClient(timeout=10.0) as tw_client:
                tw_res = await tw_client.get(f"https://tikwm.com/api/user/posts?unique_id={username}&count={count}")
                if tw_res.status_code == 200:
                    tw_data = tw_res.json()
                    if tw_data.get("code") == 0 and tw_data.get("data"):
                        tw_vids = tw_data["data"].get("videos") or []
                        entries = []
                        for tv in tw_vids:
                            entries.append({
                                'id': tv.get('video_id'),
                                'url': f"https://www.tiktok.com/@{username}/video/{tv.get('video_id')}",
                                'title': tv.get('title') or f"Video de @{username}",
                                'thumbnails': [{'id': 'cover', 'url': tv.get('cover') or tv.get('origin_cover') or ''}],
                                'duration': tv.get('duration') or 0,
                                'view_count': tv.get('play_count') or 0,
                                'like_count': tv.get('digg_count') or 0,
                                'timestamp': tv.get('create_time') or 0
                            })
                        info = {'entries': entries}
                    else:
                        raise HTTPException(status_code=400, detail=f"El perfil @{username} no existe, es privado o no tiene publicaciones públicas.")
                else:
                    raise HTTPException(status_code=400, detail=f"El perfil @{username} no existe, es privado o no tiene publicaciones públicas.")
        except HTTPException as he:
            raise he
        except Exception as tw_e:
            print(f"TikWM profile fallback error: {tw_e}")
            raise HTTPException(status_code=400, detail=f"El perfil @{username} no existe, es privado o no tiene publicaciones públicas.")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
        
    entries = info.get('entries') or []
    videos = []
    nickname = user_meta.get("nickname") or username
    avatar = user_meta.get("avatar") or ""
    
    for item in entries:
        if not item:
            continue
        v_id = item.get('id')
        v_url = item.get('url') or f"https://www.tiktok.com/@{username}/video/{v_id}"
        if not nickname or nickname == username:
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
            "raw_views": view_cnt,
            "raw_likes": like_cnt,
            "timestamp": item.get('timestamp') or 0
        })
        
    stories = []
    if start_idx == 1:
        # Extraer historias activas (24h) del usuario
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                st_res = await client.get(f'https://tikwm.com/api/user/story?unique_id={username}')
                if st_res.status_code == 200:
                    st_data = st_res.json()
                    if st_data.get('code') == 0 and st_data.get('data', {}).get('videos'):
                        for s in st_data['data']['videos']:
                            s_id = s.get('video_id')
                            if not s_id:
                                continue
                            s_url = f"https://www.tiktok.com/@{username}/video/{s_id}"
                            s_dur = s.get('duration') or 15
                            s_dur_str = f"{int(s_dur // 60)}:{int(s_dur % 60):02d}" if s_dur else "0:15"
                            s_cover = s.get('cover') or s.get('origin_cover') or s.get('ai_dynamic_cover') or ""
                            if not avatar:
                                avatar = s.get('author', {}).get('avatar') or avatar
                            if not nickname or nickname == username:
                                nickname = s.get('author', {}).get('nickname') or nickname
                            stories.append({
                                "id": s_id,
                                "url": s_url,
                                "title": s.get('title') or f"Historia de @{username}",
                                "thumbnail": s_cover,
                                "duration": s_dur_str,
                                "views": format_count_helper(s.get('play_count', 0)),
                                "likes": format_count_helper(s.get('digg_count', 0)),
                                "created_at": s.get('create_time', 0),
                                "is_story": True,
                                "download_url": s.get('play') or ""
                            })
        except Exception as e:
            print(f"Error fetching stories for {username}: {e}")
            
    res = {
        "success": True,
        "is_private": False,
        "username": username,
        "nickname": nickname,
        "avatar": avatar,
        "signature": user_meta.get("signature", ""),
        "verified": user_meta.get("verified", False),
        "followers": format_count_helper(user_meta.get("followers", 0)),
        "following": format_count_helper(user_meta.get("following", 0)),
        "total_likes": format_count_helper(user_meta.get("likes", 0)),
        "total_videos": user_meta.get("total_videos", len(videos)),
        "video_count": len(videos),
        "has_active_story": len(stories) > 0 if start_idx == 1 else False,
        "stories": stories if start_idx == 1 else [],
        "videos": videos,
        "has_more": len(videos) >= count,
        "next_start": start_idx + len(videos)
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
