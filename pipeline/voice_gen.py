"""
AURA Pipeline — Voice Generator
Uses Microsoft Edge TTS (completely free, no API key needed)
Neural voices: natural, expressive, human-sounding
"""
import asyncio
import os
import edge_tts
from config import TTS_VOICE, AUDIO_DIR, ensure_dirs

AVAILABLE_VOICES = {
    "en-GB-SoniaNeural": "British Female — warm, authoritative",
    "en-GB-RyanNeural": "British Male — deep, commanding",
    "en-US-AriaNeural": "American Female — bright, energetic",
    "en-US-GuyNeural": "American Male — confident, clear",
    "en-AU-NatashaNeural": "Australian Female — friendly, engaging",
    "en-US-JennyNeural": "American Female — conversational, relatable",
    "en-US-DavisNeural": "American Male — smooth, professional",
}


async def _generate_voice_async(
    script: str,
    output_path: str,
    voice: str = TTS_VOICE,
    rate: str = "+5%",   # slightly faster than default for TikTok pacing
    volume: str = "+10%",
) -> str:
    """Async voice generation using edge-tts."""
    communicate = edge_tts.Communicate(script, voice, rate=rate, volume=volume)
    await communicate.save(output_path)
    return output_path


def generate_voice(
    script: str,
    filename: str = "voiceover",
    voice: str = TTS_VOICE,
    rate: str = "+5%",
) -> str:
    """
    Generate TTS voiceover from script.
    Returns path to the generated .mp3 file.
    """
    ensure_dirs()
    output_path = os.path.join(AUDIO_DIR, f"{filename}.mp3")
    asyncio.run(_generate_voice_async(script, output_path, voice, rate))
    print(f"[AURA] Voice generated: {output_path}")
    return output_path


def get_available_voices() -> dict:
    return AVAILABLE_VOICES


if __name__ == "__main__":
    path = generate_voice(
        script="Most people stay broke their entire lives. Not because they lack talent. Because they never learned how money actually works. Here's what the wealthy figured out early.",
        filename="test_voice",
    )
    print(f"Generated: {path}")
