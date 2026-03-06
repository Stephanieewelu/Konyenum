import { NextRequest, NextResponse } from "next/server";

const PIPELINE_SERVER = process.env.PIPELINE_SERVER_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Try to hit the Python FastAPI server
    const res = await fetch(`${PIPELINE_SERVER}/pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Pipeline server error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    // Pipeline server not running — return helpful error
    const message = err instanceof Error ? err.message : "Pipeline server unavailable";
    return NextResponse.json({
      error: message,
      hint: "Start the Python pipeline server: cd pipeline && uvicorn server:app --port 8000",
    }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");

  if (!jobId) return NextResponse.json({ error: "job_id required" }, { status: 400 });

  try {
    const res = await fetch(`${PIPELINE_SERVER}/pipeline/${jobId}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Pipeline server unavailable" }, { status: 503 });
  }
}
