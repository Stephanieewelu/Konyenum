"""
AURA Pipeline — Config
Load from .env or environment variables
"""
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")
TIKTOK_COOKIES_PATH = os.getenv("TIKTOK_COOKIES_PATH", "cookies.json")

# TTS voice — Microsoft Edge neural voices (free, no API key)
TTS_VOICE = os.getenv("TTS_VOICE", "en-GB-SoniaNeural")   # British female
# Other great voices:
#   en-US-AriaNeural    — American female
#   en-US-GuyNeural     — American male
#   en-GB-RyanNeural    — British male
#   en-AU-NatashaNeural — Australian female

# Output directories
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output")
AUDIO_DIR = f"{OUTPUT_DIR}/audio"
FOOTAGE_DIR = f"{OUTPUT_DIR}/footage"
VIDEO_DIR = f"{OUTPUT_DIR}/videos"

def ensure_dirs():
    for d in [OUTPUT_DIR, AUDIO_DIR, FOOTAGE_DIR, VIDEO_DIR]:
        os.makedirs(d, exist_ok=True)
