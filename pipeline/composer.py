"""
AURA Pipeline — Video Composer
Uses MoviePy to assemble: stock footage + voiceover + animated captions
Output: vertical 9:16 TikTok-ready video
"""
import os
import textwrap
from moviepy.editor import (
    VideoFileClip,
    AudioFileClip,
    CompositeVideoClip,
    concatenate_videoclips,
    ColorClip,
    TextClip,
)
from config import VIDEO_DIR, ensure_dirs


TIKTOK_WIDTH = 1080
TIKTOK_HEIGHT = 1920


def _make_caption_clip(
    text: str,
    start_time: float,
    duration: float,
    style: str = "neon",
) -> TextClip:
    """Create a single animated caption clip."""

    styles = {
        "neon": {
            "fontsize": 72,
            "color": "white",
            "stroke_color": "#00f0ff",
            "stroke_width": 3,
            "font": "Impact",
        },
        "clean": {
            "fontsize": 68,
            "color": "white",
            "stroke_color": "black",
            "stroke_width": 4,
            "font": "Arial-Bold",
        },
        "bold": {
            "fontsize": 80,
            "color": "#00f0ff",
            "stroke_color": "black",
            "stroke_width": 5,
            "font": "Impact",
        },
    }

    s = styles.get(style, styles["neon"])

    # Wrap long lines
    wrapped = "\n".join(textwrap.wrap(text.upper(), width=18))

    clip = (
        TextClip(
            wrapped,
            fontsize=s["fontsize"],
            color=s["color"],
            stroke_color=s["stroke_color"],
            stroke_width=s["stroke_width"],
            font=s["font"],
            method="caption",
            size=(TIKTOK_WIDTH - 80, None),
            align="center",
        )
        .set_start(start_time)
        .set_duration(duration)
        .set_position(("center", 0.65), relative=True)
    )

    # Fade in/out
    clip = clip.crossfadein(0.15).crossfadeout(0.1)
    return clip


def compose_video(
    audio_path: str,
    footage_paths: list[str],
    caption_lines: list[str],
    output_filename: str = "output",
    caption_style: str = "neon",
    fps: int = 30,
) -> str:
    """
    Compose the final TikTok video.

    Args:
        audio_path: Path to voiceover .mp3
        footage_paths: List of stock video clip paths
        caption_lines: Lines of text to animate as captions
        output_filename: Name for output file (no extension)
        caption_style: "neon" | "clean" | "bold"
        fps: Output FPS (30 is fine for TikTok)

    Returns:
        Path to the composed video file
    """
    ensure_dirs()

    # Load audio
    audio = AudioFileClip(audio_path)
    total_duration = audio.duration
    print(f"[AURA] Audio duration: {total_duration:.1f}s")

    # Prepare and loop footage to match audio length
    clips = []
    current_duration = 0.0

    while current_duration < total_duration:
        for footage_path in footage_paths:
            if current_duration >= total_duration:
                break
            try:
                clip = VideoFileClip(footage_path)

                # Resize to TikTok vertical format (crop center)
                clip = _resize_to_tiktok(clip)

                # Trim if this clip would overshoot
                remaining = total_duration - current_duration
                if clip.duration > remaining:
                    clip = clip.subclip(0, remaining)

                clips.append(clip)
                current_duration += clip.duration

            except Exception as e:
                print(f"[AURA] Warning: could not load {footage_path}: {e}")

        if not clips:
            # Fallback: solid dark background
            clips.append(
                ColorClip(size=(TIKTOK_WIDTH, TIKTOK_HEIGHT), color=(5, 5, 15))
                .set_duration(total_duration)
            )
            break

    # Concatenate footage
    background = concatenate_videoclips(clips, method="compose")
    background = background.set_audio(audio)

    # Build caption timeline
    caption_clips = []
    if caption_lines:
        time_per_line = total_duration / len(caption_lines)
        for i, line in enumerate(caption_lines):
            if not line.strip():
                continue
            start = i * time_per_line
            duration = time_per_line * 0.85  # slight gap between captions
            caption_clips.append(
                _make_caption_clip(line, start, duration, style=caption_style)
            )

    # Compose final video
    layers = [background] + caption_clips
    final = CompositeVideoClip(layers, size=(TIKTOK_WIDTH, TIKTOK_HEIGHT))
    final = final.set_duration(total_duration)

    output_path = os.path.join(VIDEO_DIR, f"{output_filename}.mp4")
    print(f"[AURA] Rendering video to {output_path}...")

    final.write_videofile(
        output_path,
        fps=fps,
        codec="libx264",
        audio_codec="aac",
        temp_audiofile=os.path.join(VIDEO_DIR, "_temp_audio.aac"),
        remove_temp=True,
        logger=None,
        preset="fast",
    )

    print(f"[AURA] Video ready: {output_path}")
    return output_path


def _resize_to_tiktok(clip: VideoFileClip) -> VideoFileClip:
    """Crop and resize a clip to TikTok's 9:16 vertical format."""
    target_ratio = TIKTOK_WIDTH / TIKTOK_HEIGHT  # 0.5625

    w, h = clip.size
    clip_ratio = w / h

    if clip_ratio > target_ratio:
        # Clip is wider than needed — crop sides
        new_w = int(h * target_ratio)
        x_center = w / 2
        clip = clip.crop(
            x1=x_center - new_w / 2,
            x2=x_center + new_w / 2,
        )
    else:
        # Clip is taller — crop top/bottom
        new_h = int(w / target_ratio)
        y_center = h / 2
        clip = clip.crop(
            y1=y_center - new_h / 2,
            y2=y_center + new_h / 2,
        )

    return clip.resize((TIKTOK_WIDTH, TIKTOK_HEIGHT))
