import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, referenceImage, style, mode } = body;

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

    let fullPrompt: string;

    if (mode === "twin" && referenceImage) {
      // Digital twin mode — generate based on reference photo
      fullPrompt = buildTwinPrompt(prompt, style);
    } else {
      // Custom avatar mode — generate from scratch
      fullPrompt = buildAvatarPrompt(prompt, style);
    }

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: fullPrompt },
    ];

    if (referenceImage) {
      const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, "");
      parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = result.response;

    const images: string[] = [];
    let textResponse = "";

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(
            `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          );
        } else if (part.text) {
          textResponse += part.text;
        }
      }
    }

    return NextResponse.json({ images, text: textResponse });
  } catch (error: unknown) {
    console.error("Avatar generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildTwinPrompt(userPrompt: string, style: string): string {
  const styleGuides: Record<string, string> = {
    luxury:
      "Ultra high-end luxury aesthetic. Think Vogue editorial, designer outfits, gold jewelry, soft cinematic lighting, rich color palette. The person looks wealthy, polished, and aspirational.",
    professional:
      "Clean, professional corporate look. Crisp attire, confident posture, neutral background, studio-quality lighting. Suitable for LinkedIn, business branding.",
    editorial:
      "High-fashion editorial style. Dramatic lighting, bold poses, artistic composition, magazine-cover quality. Striking and memorable.",
    streetwear:
      "Modern streetwear aesthetic. Trendy urban fashion, graffiti or city backdrop, bold colors, youthful energy. Instagram-ready.",
    glamour:
      "Full glam aesthetic. Perfect makeup, elegant hair styling, sparkling accessories, soft bokeh background. Red carpet energy.",
    minimalist:
      "Clean minimalist aesthetic. Simple solid backgrounds, understated elegance, muted tones, focus on the face and expression.",
  };

  const styleDesc = styleGuides[style] || styleGuides.luxury;

  return `You are a professional digital twin creator. Based on the reference photo provided, generate a NEW high-quality portrait image of this SAME person with the following requirements:

CRITICAL: The generated person must look like the SAME person in the reference photo — same facial features, skin tone, face shape, and recognizable identity.

Style: ${styleDesc}

User request: ${userPrompt || "Create a stunning, scroll-stopping portrait"}

Requirements:
- Photorealistic quality, not illustrated or cartoonish
- Professional studio-grade lighting
- High resolution, crisp details
- The face must be clearly visible and flawless
- No distortions, extra limbs, or AI artifacts
- Suitable for social media, brand content, or marketing`;
}

function buildAvatarPrompt(userPrompt: string, style: string): string {
  const styleGuides: Record<string, string> = {
    luxury:
      "Ultra luxurious aesthetic. Designer fashion, gold accents, cinematic lighting, aspirational lifestyle backdrop.",
    professional:
      "Corporate professional look. Clean, polished, studio lighting, neutral background.",
    editorial:
      "High-fashion editorial. Dramatic, artistic, magazine-quality composition.",
    streetwear:
      "Urban streetwear. Trendy, colorful, city backdrop, youthful energy.",
    glamour:
      "Full Hollywood glamour. Red carpet ready, sparkling, elegant.",
    minimalist:
      "Clean and minimal. Solid backgrounds, understated elegance.",
    anime:
      "High-quality anime/manga art style. Vibrant, expressive, detailed.",
    "3d-render":
      "Polished 3D rendered character. Pixar/Disney quality, stylized but appealing.",
  };

  const styleDesc = styleGuides[style] || styleGuides.luxury;

  return `Create a stunning, original avatar character portrait with these specifications:

Style: ${styleDesc}

User description: ${userPrompt || "A confident, attractive person with a commanding presence suitable for a premium personal brand"}

Requirements:
- High quality, visually striking
- Perfect for social media profile pictures and brand content
- Clear face, expressive eyes, polished look
- No distortions or AI artifacts
- Professional composition and lighting
- Scroll-stopping quality — this should make people pause their feed`;
}
