"""
AURA Pipeline — Footage Fetcher
Uses Pexels API (free: 200 req/hour, 20,000 req/month)
Gets high-quality stock video clips matching the script topic
"""
import os
import requests
import json
from config import PEXELS_API_KEY, FOOTAGE_DIR, ensure_dirs

PEXELS_VIDEO_ENDPOINT = "https://api.pexels.com/videos/search"


def search_footage(
    query: str,
    count: int = 5,
    orientation: str = "portrait",  # portrait = vertical, 9:16 for TikTok
    min_duration: int = 5,
    max_duration: int = 30,
) -> list[dict]:
    """
    Search Pexels for stock video clips.
    Returns list of video metadata dicts.
    """
    headers = {"Authorization": PEXELS_API_KEY}
    params = {
        "query": query,
        "per_page": min(count * 2, 20),  # fetch extra in case some don't meet criteria
        "orientation": orientation,
        "size": "large",
    }

    response = requests.get(PEXELS_VIDEO_ENDPOINT, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()

    results = []
    for video in data.get("videos", []):
        duration = video.get("duration", 0)
        if not (min_duration <= duration <= max_duration):
            continue

        # Get the best quality video file (prefer HD)
        files = video.get("video_files", [])
        best_file = None
        for f in sorted(files, key=lambda x: x.get("width", 0), reverse=True):
            if f.get("width", 0) <= 1080:  # don't grab 4K, too large
                best_file = f
                break

        if best_file:
            results.append({
                "id": video["id"],
                "url": best_file["link"],
                "width": best_file["width"],
                "height": best_file["height"],
                "duration": duration,
                "photographer": video.get("user", {}).get("name", "Unknown"),
                "pexels_url": video.get("url", ""),
            })

        if len(results) >= count:
            break

    print(f"[AURA] Found {len(results)} footage clips for: '{query}'")
    return results


def download_footage(videos: list[dict], prefix: str = "clip") -> list[str]:
    """
    Download video clips to local storage.
    Returns list of local file paths.
    """
    ensure_dirs()
    paths = []

    for i, video in enumerate(videos):
        ext = "mp4"
        filename = f"{prefix}_{i+1}.{ext}"
        output_path = os.path.join(FOOTAGE_DIR, filename)

        if os.path.exists(output_path):
            print(f"[AURA] Clip already cached: {output_path}")
            paths.append(output_path)
            continue

        print(f"[AURA] Downloading clip {i+1}/{len(videos)}...")
        response = requests.get(video["url"], stream=True, timeout=60)
        response.raise_for_status()

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"[AURA] Saved: {output_path}")
        paths.append(output_path)

    return paths


if __name__ == "__main__":
    videos = search_footage("city lights night", count=3)
    for v in videos:
        print(f"  [{v['duration']}s] {v['width']}x{v['height']} — {v['photographer']}")
    paths = download_footage(videos, prefix="test")
    print(f"\nDownloaded: {paths}")
