import yt_dlp
import json
import os
import subprocess

url = "https://www.tiktok.com/@peliculas202500/video/7326623549412756741"
ydl_opts = {}
if os.path.exists("www.tiktok.com_cookies.txt"):
    ydl_opts['cookiefile'] = "www.tiktok.com_cookies.txt"

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(url, download=False)
    formats = info.get('formats', [])

print(f"Found {len(formats)} formats. Probing each by downloading first 2MB...")

for f in formats:
    fid = f.get('format_id')
    stream_url = f.get('url')
    if not stream_url:
        print(f"Format {fid}: No URL found")
        continue
        
    headers = f.get('http_headers', {})
    headers_str = "".join([f"{k}: {v}\r\n" for k, v in headers.items()])
    
    # Download first 2MB of the stream using curl
    output_temp = f"temp_{fid}.mp4"
    if os.path.exists(output_temp):
        os.remove(output_temp)
        
    print(f"Downloading {fid}...")
    
    # Construct curl command with headers and range limit
    curl_cmd = ["curl", "-s", "-L", "-r", "0-2097152"]
    for k, v in headers.items():
        curl_cmd.extend(["-H", f"{k}: {v}"])
    curl_cmd.extend([stream_url, "-o", output_temp])
    
    subprocess.run(curl_cmd)
    
    if not os.path.exists(output_temp) or os.path.getsize(output_temp) < 1000:
        print(f"Format {fid}: Download failed or empty file")
        continue
        
    # Probe the downloaded file using ffprobe
    ffprobe_cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", output_temp]
    res = subprocess.run(ffprobe_cmd, capture_output=True, text=True)
    
    try:
        data = json.loads(res.stdout)
        streams = data.get('streams', [])
        codecs = [s.get('codec_name') for s in streams]
        print(f"Format {fid}: Size={os.path.getsize(output_temp)} bytes, Codecs={codecs}")
    except Exception as e:
        print(f"Format {fid}: Probe failed: {e}")
        
    # Clean up
    if os.path.exists(output_temp):
        os.remove(output_temp)
