import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, editPrompt } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Edit this image with the following instruction: ${editPrompt || "Fix any AI artifacts, improve quality, make it look more photorealistic and professional"}

Requirements:
- Maintain the person's identity and likeness
- Keep the same composition unless asked to change it
- Improve quality, lighting, and realism
- Remove any AI distortions, extra fingers, blurriness
- Make it look like a real professional photograph
- Output should be premium, high-quality`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      },
      { text: prompt },
    ]);

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
    console.error("Image edit error:", error);
    const message = error instanceof Error ? error.message : "Failed to edit image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
