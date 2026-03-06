import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { avatarImage, contentType, count, niche, tone } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const scenes = getScenes(contentType, niche, tone, count || 4);
    const results: Array<{ image: string; caption: string; scene: string }> = [];

    for (const scene of scenes) {
      const prompt = buildContentPrompt(scene, contentType, niche, tone);

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: prompt },
      ];

      if (avatarImage) {
        const base64Data = avatarImage.replace(/^data:image\/\w+;base64,/, "");
        parts.unshift({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        });
      }

      try {
        const result = await model.generateContent(parts);
        const response = result.response;

        if (response.candidates && response.candidates[0]?.content?.parts) {
          let image = "";
          let caption = "";

          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            } else if (part.text) {
              caption = part.text;
            }
          }

          if (image) {
            results.push({ image, caption, scene });
          }
        }
      } catch (sceneError) {
        console.error(`Error generating scene "${scene}":`, sceneError);
      }
    }

    return NextResponse.json({ content: results });
  } catch (error: unknown) {
    console.error("Content generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getScenes(
  contentType: string,
  niche: string,
  _tone: string,
  count: number
): string[] {
  const sceneLibrary: Record<string, string[]> = {
    "brand-lifestyle": [
      "Working from a luxury home office with a MacBook and coffee",
      "Walking confidently through a modern city street",
      "Sitting in a high-end café reviewing notes",
      "Standing on a balcony overlooking a city skyline at golden hour",
      "In a cozy setup with books, candles, and a journal",
      "At a beautiful restaurant table, candlelit dinner",
      "In an elegant car interior, backseat energy",
      "On stage or at a podium, speaking to an audience",
    ],
    "product-promo": [
      "Holding a product elegantly against a clean background",
      "Unboxing something luxurious with excitement",
      "Using a laptop showing a product/course on screen",
      "Pointing at a whiteboard with key benefits listed",
      "Sitting with the product casually, lifestyle shot",
      "Close-up reaction shot, looking impressed",
    ],
    motivation: [
      "Looking directly at camera with a confident expression",
      "Sitting in meditation pose in a peaceful setting",
      "Writing in a journal at a beautiful desk",
      "Standing with arms crossed, power pose, clean background",
      "Walking through nature, serene and reflective",
      "Celebrating a win, joyful expression",
    ],
    "social-media": [
      "Selfie-style shot in great lighting",
      "Mirror selfie in a stylish outfit",
      "Flat lay with accessories, phone, and coffee from above",
      "Outfit of the day, full body in a trendy location",
      "Close-up portrait, soft natural lighting",
      "Group or duo shot energy, looking like a boss",
    ],
  };

  const scenes = sceneLibrary[contentType] || sceneLibrary["brand-lifestyle"];
  const nicheScenes = scenes.map((s) =>
    niche ? `${s} — context: ${niche}` : s
  );

  // Shuffle and take requested count
  const shuffled = nicheScenes.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function buildContentPrompt(
  scene: string,
  contentType: string,
  niche: string,
  tone: string
): string {
  return `You are a premium content creation AI. Generate a high-quality image AND a short social media caption.

SCENE: ${scene}
CONTENT TYPE: ${contentType}
NICHE: ${niche || "personal brand / digital entrepreneurship"}
TONE: ${tone || "confident, aspirational, luxury"}

IMAGE REQUIREMENTS:
- The person in the generated image must match the reference photo if provided
- Photorealistic, high-end quality
- Professional lighting and composition
- Scroll-stopping — this needs to make people pause their feed
- No AI artifacts or distortions
- Social media optimized (works for Instagram, TikTok, LinkedIn)

CAPTION: Write a short, engaging social media caption (2-3 sentences max) that fits this image. Include 3-5 relevant hashtags. The caption should sound human, not robotic.

Generate the image first, then provide the caption text.`;
}
