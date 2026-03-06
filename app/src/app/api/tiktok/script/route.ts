import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const BLUEPRINTS: Record<string, { hook_style: string; structure: string; vibe: string }> = {
  motivation: {
    hook_style: "Bold statement or shocking truth that stops the scroll",
    structure: "Hook → Painful truth → Shift in perspective → Actionable insight → CTA",
    vibe: "Raw, direct, no fluff. Speaks to people who are tired of mediocre advice.",
  },
  educational: {
    hook_style: "Question or fact that makes the viewer feel like they're missing something",
    structure: "Hook → Context → 3 key points → Summary → Follow for more",
    vibe: "Clear, confident, authoritative. Each line teaches something.",
  },
  storytelling: {
    hook_style: "Start mid-story or with an unexpected outcome",
    structure: "In medias res → Build tension → Reveal → Lesson → Reflection",
    vibe: "Conversational, vivid, emotionally resonant.",
  },
  "niche-facts": {
    hook_style: "Counter-intuitive fact or 'did you know' reveal",
    structure: "Surprising fact → Why it matters → Deeper context → Mind-blowing connection → CTA",
    vibe: "Fast-paced, snappy. Every line is rewatchable.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { topic, content_type = "motivation", tone = "direct and powerful", duration_seconds = 30, niche = "" } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const blueprint = BLUEPRINTS[content_type] || BLUEPRINTS.motivation;
    const targetWords = Math.floor(duration_seconds * 2.5);

    const prompt = `You are a viral TikTok scriptwriter. Your scripts regularly hit 500K+ views.

TOPIC: ${topic}
${niche ? `NICHE: ${niche}` : ""}
CONTENT TYPE: ${content_type}
TONE: ${tone}
TARGET DURATION: ${duration_seconds} seconds (~${targetWords} words spoken)

BLUEPRINT:
- Hook style: ${blueprint.hook_style}
- Structure: ${blueprint.structure}
- Vibe: ${blueprint.vibe}

RULES:
1. The hook must be the first line — make it impossible to scroll past
2. Every line must earn its place — cut anything weak
3. Write for TEXT-TO-SPEECH: no abbreviations, spell out numbers, no emojis in body
4. Short punchy sentences. Max 12 words per sentence.
5. No filler words: "so", "basically", "you know", "like", "right"
6. End with ONE clear call to action

Return ONLY this JSON, nothing else:
{
  "hook": "Opening line (10 words max, scroll-stopper)",
  "script": "Full spoken script (~${targetWords} words). Newline between sentences.",
  "caption_lines": ["Line 1 for animated captions", "Line 2", "..."],
  "tiktok_description": "Post caption 150 chars max",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "pexels_search_query": "2-3 word footage search",
  "estimated_duration": ${duration_seconds}
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse script from Gemini response");

    const scriptData = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, script: scriptData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Script generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
