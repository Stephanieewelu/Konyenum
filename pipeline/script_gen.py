"""
AURA Pipeline — Script Generator
Uses Gemini 2.0 Flash (free tier: 15 req/min, 1500 req/day)
"""
import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

CONTENT_BLUEPRINTS = {
    "motivation": {
        "hook_style": "Bold statement or shocking truth that stops the scroll",
        "structure": "Hook → Painful truth → Shift in perspective → Actionable insight → CTA",
        "vibe": "Raw, direct, no fluff. Speaks to people who are tired of mediocre advice.",
    },
    "educational": {
        "hook_style": "Question or fact that makes the viewer feel like they're missing something",
        "structure": "Hook → Context → 3 key points → Summary → Follow for more",
        "vibe": "Clear, confident, authoritative. Each line teaches something.",
    },
    "storytelling": {
        "hook_style": "Start mid-story or with an unexpected outcome",
        "structure": "In medias res → Build tension → Reveal → Lesson → Reflection",
        "vibe": "Conversational, vivid, emotionally resonant.",
    },
    "niche-facts": {
        "hook_style": "Counter-intuitive fact or 'did you know' reveal",
        "structure": "Surprising fact → Why it matters → Deeper context → Mind-blowing connection → CTA",
        "vibe": "Fast-paced, snappy. Every line is rewatchable.",
    },
}


def generate_script(
    topic: str,
    content_type: str = "motivation",
    tone: str = "direct and powerful",
    duration_seconds: int = 30,
    niche: str = "",
) -> dict:
    """
    Generate a TikTok script with hook, body, captions, hashtags, and description.
    Returns a structured dict ready for the pipeline.
    """
    blueprint = CONTENT_BLUEPRINTS.get(content_type, CONTENT_BLUEPRINTS["motivation"])
    words_per_second = 2.5  # average spoken TTS pace
    target_words = int(duration_seconds * words_per_second)

    prompt = f"""You are a viral TikTok scriptwriter. Your scripts regularly hit 500K+ views.

TOPIC: {topic}
{f"NICHE: {niche}" if niche else ""}
CONTENT TYPE: {content_type}
TONE: {tone}
TARGET DURATION: {duration_seconds} seconds (~{target_words} words spoken)

BLUEPRINT:
- Hook style: {blueprint["hook_style"]}
- Structure: {blueprint["structure"]}
- Vibe: {blueprint["vibe"]}

RULES:
1. The hook must be the first line — make it impossible to scroll past
2. Every single line must earn its place — cut anything weak
3. Write for TEXT-TO-SPEECH: no abbreviations, spell out numbers, no emojis in body
4. Short punchy sentences. Max 12 words per sentence.
5. No filler words: "so", "basically", "you know", "like", "right"
6. End with ONE clear call to action (follow, comment, or share)

OUTPUT FORMAT (return exactly this JSON, nothing else):
{{
  "hook": "The first line / opening statement (10 words max, must be a scroll-stopper)",
  "script": "Full spoken script (~{target_words} words). Line breaks between sentences.",
  "caption_lines": ["Line 1 for animated captions", "Line 2", "..."],
  "tiktok_description": "Short caption for the post (150 chars max, punchy)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "pexels_search_query": "2-3 word search query for relevant stock footage",
  "estimated_duration": {duration_seconds}
}}"""

    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    text = response.text.strip()

    # Parse JSON from response
    import json
    import re
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        return json.loads(json_match.group())

    raise ValueError(f"Could not parse script response: {text[:200]}")


if __name__ == "__main__":
    result = generate_script(
        topic="Most people will never be rich because of this one mindset",
        content_type="motivation",
        tone="raw and brutally honest",
        duration_seconds=30,
    )
    import json
    print(json.dumps(result, indent=2))
