import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, count = 4 } = await req.json();

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "PEXELS_API_KEY not configured" }, { status: 500 });
    }

    const params = new URLSearchParams({
      query,
      per_page: String(Math.min(count * 2, 20)),
      orientation: "portrait",
      size: "large",
    });

    const res = await fetch(`https://api.pexels.com/videos/search?${params}`, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
    const data = await res.json();

    const results = [];
    for (const video of data.videos || []) {
      const duration = video.duration || 0;
      if (duration < 5 || duration > 30) continue;

      const files: Array<{ width: number; link: string; height: number }> = video.video_files || [];
      const best = files
        .filter((f) => f.width <= 1080)
        .sort((a, b) => b.width - a.width)[0];

      if (best) {
        results.push({
          id: video.id,
          url: best.link,
          width: best.width,
          height: best.height,
          duration,
          thumbnail: video.image,
          photographer: video.user?.name || "Pexels",
        });
      }

      if (results.length >= count) break;
    }

    return NextResponse.json({ success: true, videos: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Footage search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
