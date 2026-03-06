"""
AURA Pipeline — TikTok Uploader
Uses tiktok-uploader (browser cookie auth — no official API needed)
Supports: direct publish, draft mode (recommended for new accounts)
"""
import os
import json
from datetime import datetime
from config import TIKTOK_COOKIES_PATH


def upload_to_tiktok(
    video_path: str,
    description: str,
    hashtags: list[str],
    as_draft: bool = True,
    schedule_time: datetime | None = None,
) -> dict:
    """
    Upload a video to TikTok.

    Args:
        video_path: Path to the composed .mp4 file
        description: Post caption/description
        hashtags: List of hashtags (without #)
        as_draft: If True, saves as draft for manual review (RECOMMENDED)
        schedule_time: If set, schedule for future posting

    Returns:
        dict with upload status and details
    """
    try:
        from tiktok_uploader.upload import upload_video
        from tiktok_uploader.auth import AuthBackend
    except ImportError:
        return {
            "success": False,
            "error": "tiktok-uploader not installed. Run: pip install tiktok-uploader",
        }

    if not os.path.exists(video_path):
        return {"success": False, "error": f"Video not found: {video_path}"}

    if not os.path.exists(TIKTOK_COOKIES_PATH):
        return {
            "success": False,
            "error": f"TikTok cookies not found at {TIKTOK_COOKIES_PATH}. Export cookies from your browser.",
            "help": "Use a browser extension like 'Cookie-Editor' to export cookies.json from tiktok.com",
        }

    # Build full caption with hashtags
    tags = " ".join(f"#{tag.lstrip('#')}" for tag in hashtags)
    full_caption = f"{description}\n\n{tags}"[:2200]  # TikTok caption limit

    try:
        auth = AuthBackend(cookies=TIKTOK_COOKIES_PATH)

        result = upload_video(
            filename=video_path,
            description=full_caption,
            auth=auth,
            schedule=schedule_time,
            draft=as_draft,
        )

        return {
            "success": True,
            "draft": as_draft,
            "scheduled": schedule_time.isoformat() if schedule_time else None,
            "caption": full_caption,
            "video_path": video_path,
            "result": str(result),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def simulate_upload(
    video_path: str,
    description: str,
    hashtags: list[str],
) -> dict:
    """Dry-run — log what would be posted without actually uploading."""
    tags = " ".join(f"#{tag.lstrip('#')}" for tag in hashtags)
    full_caption = f"{description}\n\n{tags}"

    print("\n" + "═" * 50)
    print("  [AURA SIMULATION] — Not actually uploading")
    print("═" * 50)
    print(f"  Video: {video_path}")
    print(f"  Caption:\n{full_caption}")
    print("═" * 50 + "\n")

    return {
        "success": True,
        "simulated": True,
        "caption": full_caption,
        "video_path": video_path,
    }
