"""
AURA Pipeline — FastAPI Server
Exposes the pipeline as an HTTP API so the Next.js frontend can drive it.
Run: uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""
import os
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from config import ensure_dirs, GEMINI_API_KEY, PEXELS_API_KEY
from script_gen import generate_script
from voice_gen import generate_voice, get_available_voices
from footage import search_footage, download_footage
from composer import compose_video
from uploader import upload_to_tiktok, simulate_upload

app = FastAPI(title="AURA Pipeline API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job tracker
jobs: dict[str, dict] = {}


# ── Request / Response Models ─────────────────────────────────────

class ScriptRequest(BaseModel):
    topic: str
    content_type: str = "motivation"
    tone: str = "direct and powerful"
    duration_seconds: int = 30
    niche: str = ""

class VoiceRequest(BaseModel):
    script: str
    filename: str = "voiceover"
    voice: str = "en-GB-SoniaNeural"
    rate: str = "+5%"

class FootageRequest(BaseModel):
    query: str
    count: int = 4

class ComposeRequest(BaseModel):
    audio_path: str
    footage_paths: list[str]
    caption_lines: list[str]
    output_filename: str = "output"
    caption_style: str = "neon"

class UploadRequest(BaseModel):
    video_path: str
    description: str
    hashtags: list[str]
    as_draft: bool = True
    simulate: bool = False

class FullPipelineRequest(BaseModel):
    topic: str
    content_type: str = "motivation"
    tone: str = "direct and powerful"
    duration_seconds: int = 30
    niche: str = ""
    voice: str = "en-GB-SoniaNeural"
    caption_style: str = "neon"
    as_draft: bool = True
    simulate: bool = True


# ── Health ────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "AURA Pipeline API",
        "status": "live",
        "gemini": bool(GEMINI_API_KEY),
        "pexels": bool(PEXELS_API_KEY),
    }


# ── Step endpoints ────────────────────────────────────────────────

@app.post("/script")
def api_generate_script(req: ScriptRequest):
    """Step 1: Generate TikTok script with Gemini."""
    if not GEMINI_API_KEY:
        raise HTTPException(400, "GEMINI_API_KEY not configured")
    try:
        ensure_dirs()
        result = generate_script(
            topic=req.topic,
            content_type=req.content_type,
            tone=req.tone,
            duration_seconds=req.duration_seconds,
            niche=req.niche,
        )
        return {"success": True, "script": result}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/voice")
def api_generate_voice(req: VoiceRequest):
    """Step 2: Generate TTS voiceover with Edge TTS."""
    try:
        ensure_dirs()
        path = generate_voice(
            script=req.script,
            filename=req.filename,
            voice=req.voice,
            rate=req.rate,
        )
        return {"success": True, "audio_path": path}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/footage/search")
def api_search_footage(req: FootageRequest):
    """Step 3a: Search Pexels for stock footage."""
    if not PEXELS_API_KEY:
        raise HTTPException(400, "PEXELS_API_KEY not configured")
    try:
        results = search_footage(query=req.query, count=req.count)
        return {"success": True, "videos": results}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/footage/download")
def api_download_footage(videos: list[dict], prefix: str = "clip"):
    """Step 3b: Download selected footage clips."""
    try:
        ensure_dirs()
        paths = download_footage(videos, prefix=prefix)
        return {"success": True, "footage_paths": paths}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/compose")
def api_compose_video(req: ComposeRequest):
    """Step 4: Compose final video with MoviePy."""
    try:
        ensure_dirs()
        path = compose_video(
            audio_path=req.audio_path,
            footage_paths=req.footage_paths,
            caption_lines=req.caption_lines,
            output_filename=req.output_filename,
            caption_style=req.caption_style,
        )
        return {"success": True, "video_path": path}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/upload")
def api_upload(req: UploadRequest):
    """Step 5: Upload to TikTok (draft or publish)."""
    try:
        if req.simulate:
            result = simulate_upload(req.video_path, req.description, req.hashtags)
        else:
            result = upload_to_tiktok(
                video_path=req.video_path,
                description=req.description,
                hashtags=req.hashtags,
                as_draft=req.as_draft,
            )
        return result
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/voices")
def api_get_voices():
    """List available TTS voices."""
    return {"voices": get_available_voices()}


# ── Full pipeline (background job) ───────────────────────────────

@app.post("/pipeline")
def api_full_pipeline(req: FullPipelineRequest, background_tasks: BackgroundTasks):
    """Run the full pipeline as a background job. Poll /pipeline/{job_id} for status."""
    import uuid
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {"status": "queued", "progress": 0, "result": None, "error": None}
    background_tasks.add_task(_run_pipeline_job, job_id, req)
    return {"job_id": job_id, "status": "queued"}


@app.get("/pipeline/{job_id}")
def api_pipeline_status(job_id: str):
    """Poll pipeline job status."""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[job_id]


def _run_pipeline_job(job_id: str, req: FullPipelineRequest):
    """Background pipeline execution."""
    import json

    jobs[job_id]["status"] = "running"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"{req.topic[:20].lower().replace(' ', '_')}_{timestamp}"

    try:
        ensure_dirs()

        # Step 1
        jobs[job_id].update({"step": "script", "progress": 10})
        script_data = generate_script(req.topic, req.content_type, req.tone, req.duration_seconds, req.niche)

        # Step 2
        jobs[job_id].update({"step": "voice", "progress": 30})
        audio_path = generate_voice(script_data["script"], filename=name, voice=req.voice)

        # Step 3
        jobs[job_id].update({"step": "footage", "progress": 50})
        query = script_data.get("pexels_search_query", req.topic[:30])
        videos = search_footage(query=query, count=4)
        footage_paths = download_footage(videos, prefix=name)

        # Step 4
        jobs[job_id].update({"step": "compose", "progress": 75})
        video_path = compose_video(audio_path, footage_paths, script_data.get("caption_lines", []), name, req.caption_style)

        # Step 5
        jobs[job_id].update({"step": "upload", "progress": 90})
        if req.simulate:
            upload_result = simulate_upload(video_path, script_data["tiktok_description"], script_data["hashtags"])
        else:
            upload_result = upload_to_tiktok(video_path, script_data["tiktok_description"], script_data["hashtags"], req.as_draft)

        jobs[job_id].update({
            "status": "done",
            "progress": 100,
            "result": {
                "script": script_data,
                "audio": audio_path,
                "footage": footage_paths,
                "video": video_path,
                "upload": upload_result,
            }
        })

    except Exception as e:
        jobs[job_id].update({"status": "error", "error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
