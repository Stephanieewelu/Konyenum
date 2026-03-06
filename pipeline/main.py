"""
AURA Pipeline — CLI Entry Point
Usage:
  python main.py --topic "Your topic" --type motivation --draft
  python main.py --topic "Your topic" --type educational --publish
  python main.py --schedule  # run 3x/day auto-scheduler
"""
import argparse
import json
import sys
import time
from datetime import datetime

from config import ensure_dirs, GEMINI_API_KEY, PEXELS_API_KEY
from script_gen import generate_script
from voice_gen import generate_voice
from footage import search_footage, download_footage
from composer import compose_video
from uploader import upload_to_tiktok, simulate_upload

BANNER = """
╔═══════════════════════════════════════╗
║                                       ║
║    ██████╗ ██╗   ██╗██████╗  █████╗   ║
║   ██╔══██╗██║   ██║██╔══██╗██╔══██╗  ║
║   ███████║██║   ██║██████╔╝███████║  ║
║   ██╔══██║██║   ██║██╔══██╗██╔══██║  ║
║   ██║  ██║╚██████╔╝██║  ██║██║  ██║  ║
║   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ║
║                                       ║
║   TikTok AutoPoster Pipeline v1.0    ║
║   Your Identity. Your Frequency.      ║
╚═══════════════════════════════════════╝
"""

SAMPLE_TOPICS = {
    "motivation": [
        "Most people will never be rich because of this one belief",
        "Stop waiting for the right time — this is why you stay stuck",
        "The difference between people who succeed and people who don't",
        "Why broke people stay broke (it's not what you think)",
        "Everything changes when you stop caring what people think",
    ],
    "educational": [
        "3 things about money schools never taught you",
        "Why the 9-5 is designed to keep you dependent",
        "How compound interest works and why you need to start today",
        "The psychology behind why people overspend",
        "What high earners do differently in the morning",
    ],
    "niche-facts": [
        "The dark truth about the influencer economy",
        "Why most small businesses fail in the first year",
        "What social media does to your brain's dopamine system",
        "The real reason luxury brands are so expensive",
        "Why most diets fail and what actually works",
    ],
}


def run_pipeline(
    topic: str,
    content_type: str,
    tone: str,
    duration: int,
    niche: str,
    voice: str,
    caption_style: str,
    as_draft: bool,
    simulate: bool,
    output_name: str | None = None,
) -> dict:
    """Run the full pipeline for one video."""

    print(f"\n[AURA] Starting pipeline for: '{topic}'")
    print(f"       Type: {content_type} | Duration: {duration}s | Voice: {voice}\n")

    ensure_dirs()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = topic[:30].lower().replace(" ", "_").replace("'", "")
    name = output_name or f"{slug}_{timestamp}"

    # ── Step 1: Generate Script ──────────────────────────
    print("[1/4] Generating script with Gemini...")
    script_data = generate_script(
        topic=topic,
        content_type=content_type,
        tone=tone,
        duration_seconds=duration,
        niche=niche,
    )
    print(f"      Hook: {script_data['hook']}")

    # ── Step 2: Generate Voiceover ───────────────────────
    print("[2/4] Generating voiceover with Edge TTS...")
    audio_path = generate_voice(
        script=script_data["script"],
        filename=name,
        voice=voice,
    )

    # ── Step 3: Fetch Stock Footage ──────────────────────
    print("[3/4] Fetching footage from Pexels...")
    query = script_data.get("pexels_search_query", topic[:30])
    videos = search_footage(query=query, count=4)

    if not videos:
        print(f"      No footage for '{query}', trying fallback...")
        videos = search_footage(query="cinematic city", count=4)

    footage_paths = download_footage(videos, prefix=name)

    # ── Step 4: Compose Video ────────────────────────────
    print("[4/4] Composing final video with captions...")
    video_path = compose_video(
        audio_path=audio_path,
        footage_paths=footage_paths,
        caption_lines=script_data.get("caption_lines", []),
        output_filename=name,
        caption_style=caption_style,
    )

    # ── Upload / Draft / Simulate ────────────────────────
    if simulate:
        print("\n[AURA] Simulation mode — not uploading")
        upload_result = simulate_upload(
            video_path=video_path,
            description=script_data["tiktok_description"],
            hashtags=script_data["hashtags"],
        )
    else:
        mode = "draft" if as_draft else "publishing"
        print(f"\n[AURA] Uploading to TikTok ({mode})...")
        upload_result = upload_to_tiktok(
            video_path=video_path,
            description=script_data["tiktok_description"],
            hashtags=script_data["hashtags"],
            as_draft=as_draft,
        )

    result = {
        "topic": topic,
        "script": script_data,
        "audio": audio_path,
        "footage": footage_paths,
        "video": video_path,
        "upload": upload_result,
    }

    # Save metadata
    meta_path = video_path.replace(".mp4", "_meta.json")
    with open(meta_path, "w") as f:
        json.dump(result, f, indent=2, default=str)
    print(f"\n[AURA] Metadata saved: {meta_path}")

    return result


def run_scheduler(content_type: str, niche: str, voice: str, as_draft: bool):
    """Auto-generate and post 3 videos per day with random topics."""
    import random
    topics = SAMPLE_TOPICS.get(content_type, SAMPLE_TOPICS["motivation"])

    print(f"[AURA] Scheduler running — posting 3x/day")
    print(f"       Press Ctrl+C to stop\n")

    interval = 8 * 3600  # 8 hours between posts

    while True:
        topic = random.choice(topics)
        print(f"\n{'='*50}")
        print(f"[AURA] Scheduled post: {datetime.now().strftime('%H:%M')}")
        print(f"{'='*50}")

        try:
            run_pipeline(
                topic=topic,
                content_type=content_type,
                tone="direct and powerful",
                duration=30,
                niche=niche,
                voice=voice,
                caption_style="neon",
                as_draft=as_draft,
                simulate=False,
            )
        except Exception as e:
            print(f"[AURA] Pipeline error: {e}")

        print(f"\n[AURA] Next post in {interval//3600}h. Waiting...")
        time.sleep(interval)


def main():
    print(BANNER)

    # Validate API keys
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not set. Get a free key at aistudio.google.com")
        sys.exit(1)
    if not PEXELS_API_KEY:
        print("ERROR: PEXELS_API_KEY not set. Get a free key at pexels.com/api")
        sys.exit(1)

    parser = argparse.ArgumentParser(description="AURA TikTok AutoPoster Pipeline")

    parser.add_argument("--topic", type=str, help="Video topic or idea")
    parser.add_argument("--type", type=str, default="motivation",
                        choices=["motivation", "educational", "storytelling", "niche-facts"],
                        help="Content type")
    parser.add_argument("--tone", type=str, default="direct and powerful",
                        help="Delivery tone e.g. 'raw and honest', 'energetic', 'calm'")
    parser.add_argument("--duration", type=int, default=30,
                        help="Target duration in seconds (15-60)")
    parser.add_argument("--niche", type=str, default="",
                        help="Your content niche e.g. 'personal finance', 'fitness'")
    parser.add_argument("--voice", type=str, default="en-GB-SoniaNeural",
                        help="Edge TTS voice name")
    parser.add_argument("--caption-style", type=str, default="neon",
                        choices=["neon", "clean", "bold"],
                        help="Caption text style")

    # Mode flags
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument("--draft", action="store_true",
                            help="Generate video and save as TikTok draft (recommended)")
    mode_group.add_argument("--publish", action="store_true",
                            help="Generate and publish directly to TikTok")
    mode_group.add_argument("--simulate", action="store_true",
                            help="Run full pipeline without uploading (testing)")
    mode_group.add_argument("--schedule", action="store_true",
                            help="Run auto-scheduler (posts 3x/day)")

    args = parser.parse_args()

    if args.schedule:
        run_scheduler(
            content_type=args.type,
            niche=args.niche,
            voice=args.voice,
            as_draft=args.draft,
        )
    else:
        if not args.topic:
            parser.error("--topic is required unless using --schedule")

        result = run_pipeline(
            topic=args.topic,
            content_type=args.type,
            tone=args.tone,
            duration=args.duration,
            niche=args.niche,
            voice=args.voice,
            caption_style=args.caption_style,
            as_draft=args.draft,
            simulate=args.simulate,
        )

        print("\n" + "═" * 50)
        print("  [AURA] PIPELINE COMPLETE")
        print("═" * 50)
        print(f"  Video:  {result['video']}")
        print(f"  Hook:   {result['script']['hook']}")
        print(f"  Upload: {'Success' if result['upload'].get('success') else 'Failed'}")
        print("═" * 50 + "\n")


if __name__ == "__main__":
    main()
