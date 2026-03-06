"use client";

import { useState, useCallback } from "react";

interface ScriptData {
  hook: string;
  script: string;
  caption_lines: string[];
  tiktok_description: string;
  hashtags: string[];
  pexels_search_query: string;
  estimated_duration: number;
}

interface FootageClip {
  id: number;
  url: string;
  width: number;
  height: number;
  duration: number;
  thumbnail: string;
  photographer: string;
}

type Step = "config" | "script" | "footage" | "compose" | "publish";

const STEPS: Array<{ id: Step; label: string; num: string }> = [
  { id: "config", label: "CONFIGURE", num: "01" },
  { id: "script", label: "SCRIPT", num: "02" },
  { id: "footage", label: "FOOTAGE", num: "03" },
  { id: "compose", label: "COMPOSE", num: "04" },
  { id: "publish", label: "BROADCAST", num: "05" },
];

const CONTENT_TYPES = [
  { id: "motivation", label: "MOTIVATION", desc: "Raw truth, mindset shifts" },
  { id: "educational", label: "EDUCATION", desc: "Teach something valuable" },
  { id: "storytelling", label: "STORY", desc: "Hook with narrative" },
  { id: "niche-facts", label: "FACTS", desc: "Surprising, rewatchable" },
];

const VOICES = [
  { id: "en-GB-SoniaNeural", label: "Sonia", desc: "British Female" },
  { id: "en-GB-RyanNeural", label: "Ryan", desc: "British Male" },
  { id: "en-US-AriaNeural", label: "Aria", desc: "American Female" },
  { id: "en-US-GuyNeural", label: "Guy", desc: "American Male" },
  { id: "en-AU-NatashaNeural", label: "Natasha", desc: "Australian Female" },
];

export default function BroadcastPipeline() {
  const [step, setStep] = useState<Step>("config");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Config
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("motivation");
  const [tone, setTone] = useState("direct and powerful");
  const [duration, setDuration] = useState(30);
  const [niche, setNiche] = useState("");
  const [voice, setVoice] = useState("en-GB-SoniaNeural");
  const [captionStyle, setCaptionStyle] = useState("neon");

  // Pipeline state
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [footage, setFootage] = useState<FootageClip[]>([]);
  const [selectedFootage, setSelectedFootage] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const copyCaption = () => {
    if (!scriptData) return;
    const text = `${scriptData.tiktok_description}\n\n${scriptData.hashtags.map(h => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateScript = useCallback(async () => {
    if (!topic.trim()) { setError("Enter a topic first"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tiktok/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content_type: contentType, tone, duration_seconds: duration, niche }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScriptData(data.script);
      setStep("script");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Script generation failed");
    } finally { setLoading(false); }
  }, [topic, contentType, tone, duration, niche]);

  const searchFootage = useCallback(async () => {
    if (!scriptData) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tiktok/footage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: scriptData.pexels_search_query, count: 6 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFootage(data.videos);
      setSelectedFootage(data.videos.slice(0, 3).map((v: FootageClip) => v.id));
      setStep("footage");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Footage search failed");
    } finally { setLoading(false); }
  }, [scriptData]);

  const toggleFootage = (id: number) => {
    setSelectedFootage(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => {
                if (s.id === "config") setStep("config");
                if (s.id === "script" && scriptData) setStep("script");
                if (s.id === "footage" && footage.length) setStep("footage");
              }}
              className={`flex-1 py-2 px-1 text-center transition-all border-b-2 ${
                step === s.id
                  ? "border-[#00f0ff] text-[#00f0ff]"
                  : s.id === "config" || (s.id === "script" && scriptData) || (s.id === "footage" && footage.length)
                    ? "border-[rgba(0,240,255,0.2)] text-white/40 hover:text-white/60"
                    : "border-transparent text-white/15 cursor-default"
              }`}
            >
              <div className="text-[9px] font-black tracking-widest">{s.num}</div>
              <div className="text-[9px] tracking-wider mt-0.5">{s.label}</div>
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-px h-6 mx-1" style={{ background: "rgba(0,240,255,0.1)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded border text-sm flex justify-between"
          style={{ borderColor: "rgba(255,0,168,0.3)", background: "rgba(255,0,168,0.06)", color: "#ff6eb8" }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError("")} className="opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      {/* ══ CONFIGURE ══ */}
      {step === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <CyberLabel>Topic / Idea</CyberLabel>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Most people will never be rich because of this one belief..."
              rows={3}
              className="input-neon w-full rounded px-4 py-3 text-sm resize-none"
            />

            <CyberLabel>Content Format</CyberLabel>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setContentType(ct.id)}
                  className={`p-3 rounded border text-left transition-all ${contentType === ct.id ? "tab-active border-[#00f0ff]" : "glass border-transparent hover:border-[rgba(0,240,255,0.15)]"}`}>
                  <div className={`text-[10px] font-black tracking-widest ${contentType === ct.id ? "text-[#00f0ff]" : "text-white/50"}`}>{ct.label}</div>
                  <div className={`text-[9px] mt-0.5 ${contentType === ct.id ? "text-[rgba(0,240,255,0.5)]" : "text-white/25"}`}>{ct.desc}</div>
                </button>
              ))}
            </div>

            <CyberLabel>Tone</CyberLabel>
            <input type="text" value={tone} onChange={e => setTone(e.target.value)}
              placeholder="e.g. raw and brutally honest, energetic, calm authority"
              className="input-neon w-full rounded px-4 py-2.5 text-sm" />
          </div>

          <div className="space-y-4">
            <CyberLabel>Duration — <span className="text-[#00f0ff]">{duration}s</span></CyberLabel>
            <input type="range" min={15} max={60} value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-[#00f0ff]" />
            <div className="flex justify-between text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              <span>15s</span><span>30s</span><span>45s</span><span>60s</span>
            </div>

            <CyberLabel>Niche (optional)</CyberLabel>
            <input type="text" value={niche} onChange={e => setNiche(e.target.value)}
              placeholder="e.g. personal finance, fitness, crypto, real estate"
              className="input-neon w-full rounded px-4 py-2.5 text-sm" />

            <CyberLabel>Voice</CyberLabel>
            <div className="grid grid-cols-1 gap-1.5">
              {VOICES.map(v => (
                <button key={v.id} onClick={() => setVoice(v.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded border transition-all ${voice === v.id ? "tab-active border-[#00f0ff]" : "glass border-transparent hover:border-[rgba(0,240,255,0.15)]"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${voice === v.id ? "bg-[#00f0ff]" : "bg-white/20"}`}
                    style={voice === v.id ? { boxShadow: "0 0 6px #00f0ff" } : {}} />
                  <span className={`text-[10px] font-black tracking-wider flex-1 text-left ${voice === v.id ? "text-[#00f0ff]" : "text-white/50"}`}>{v.label}</span>
                  <span className="text-[9px] text-white/25">{v.desc}</span>
                </button>
              ))}
            </div>

            <CyberLabel>Caption Style</CyberLabel>
            <div className="flex gap-2">
              {["neon", "clean", "bold"].map(s => (
                <button key={s} onClick={() => setCaptionStyle(s)}
                  className={`flex-1 py-2 rounded border text-[10px] font-black tracking-widest uppercase transition-all ${captionStyle === s ? "tab-active border-[#00f0ff]" : "glass border-transparent hover:border-[rgba(0,240,255,0.15)] text-white/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <button onClick={generateScript} disabled={loading || !topic.trim()}
              className="btn-primary w-full py-4 rounded tracking-widest text-sm">
              {loading ? "GENERATING SCRIPT..." : "GENERATE SCRIPT →"}
            </button>
          </div>
        </div>
      )}

      {/* ══ SCRIPT ══ */}
      {step === "script" && scriptData && (
        <div className="space-y-5">
          {/* Hook */}
          <div className="p-4 rounded border corner-bracket" style={{ borderColor: "rgba(0,240,255,0.3)", background: "rgba(0,240,255,0.04)" }}>
            <CyberLabel>Hook</CyberLabel>
            <p className="text-white font-bold text-lg mt-2 leading-snug">{scriptData.hook}</p>
          </div>

          {/* Full script */}
          <div className="space-y-2">
            <CyberLabel>Full Script ({scriptData.estimated_duration}s · Voice: {VOICES.find(v => v.id === voice)?.label})</CyberLabel>
            <div className="p-4 rounded border text-sm leading-7 whitespace-pre-line"
              style={{ borderColor: "rgba(0,240,255,0.1)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.75)" }}>
              {scriptData.script}
            </div>
          </div>

          {/* Caption lines preview */}
          <div className="space-y-2">
            <CyberLabel>Animated Captions ({scriptData.caption_lines.length} lines)</CyberLabel>
            <div className="flex flex-wrap gap-2">
              {scriptData.caption_lines.map((line, i) => (
                <span key={i} className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase"
                  style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.15)", color: "rgba(0,240,255,0.8)" }}>
                  {line}
                </span>
              ))}
            </div>
          </div>

          {/* Post caption */}
          <div className="p-4 rounded border space-y-3" style={{ borderColor: "rgba(0,240,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
            <CyberLabel>Post Caption + Hashtags</CyberLabel>
            <p className="text-sm text-white/70">{scriptData.tiktok_description}</p>
            <div className="flex flex-wrap gap-1">
              {scriptData.hashtags.map((h, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded"
                  style={{ background: "rgba(255,0,168,0.08)", border: "1px solid rgba(255,0,168,0.2)", color: "#ff6eb8" }}>
                  #{h}
                </span>
              ))}
            </div>
            <button onClick={copyCaption}
              className="text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: copied ? "#00f0ff" : "rgba(0,240,255,0.4)" }}>
              {copied ? "✓ COPIED" : "COPY CAPTION + TAGS"}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("config")}
              className="btn-neon px-6 py-3 rounded text-xs">
              ← BACK
            </button>
            <button onClick={searchFootage} disabled={loading}
              className="btn-primary flex-1 py-3 rounded tracking-widest text-xs">
              {loading ? "FETCHING FOOTAGE..." : "FETCH FOOTAGE →"}
            </button>
          </div>
        </div>
      )}

      {/* ══ FOOTAGE ══ */}
      {step === "footage" && footage.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <CyberLabel>Select Clips — query: "{scriptData?.pexels_search_query}"</CyberLabel>
            <span className="text-[9px] tracking-widest" style={{ color: "rgba(0,240,255,0.4)" }}>
              {selectedFootage.length} selected
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {footage.map(clip => (
              <div key={clip.id}
                onClick={() => toggleFootage(clip.id)}
                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border ${
                  selectedFootage.includes(clip.id)
                    ? "border-[#00f0ff]"
                    : "border-[rgba(0,240,255,0.08)] hover:border-[rgba(0,240,255,0.25)]"
                }`}
                style={selectedFootage.includes(clip.id) ? { boxShadow: "0 0 12px rgba(0,240,255,0.25)" } : {}}>
                <img src={clip.thumbnail} alt="" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between p-2"
                  style={{ background: selectedFootage.includes(clip.id) ? "rgba(0,240,255,0.08)" : "rgba(0,0,0,0.4)" }}>
                  <div className="flex justify-end">
                    {selectedFootage.includes(clip.id) && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ background: "#00f0ff", color: "#000" }}>✓</div>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.6)" }}>
                      {clip.duration}s
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded text-[10px] tracking-wider" style={{ background: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.1)", color: "rgba(0,240,255,0.5)" }}>
            VIDEO COMPOSITION — requires Python pipeline server running on port 8000.
            Clips are looped and composited with your voiceover + animated captions.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("script")} className="btn-neon px-6 py-3 rounded text-xs">
              ← BACK
            </button>
            <button onClick={() => setStep("compose")} disabled={selectedFootage.length === 0}
              className="btn-primary flex-1 py-3 rounded tracking-widest text-xs">
              PROCEED TO COMPOSE →
            </button>
          </div>
        </div>
      )}

      {/* ══ COMPOSE ══ */}
      {step === "compose" && (
        <div className="space-y-5">
          <div className="p-5 rounded border corner-bracket space-y-4"
            style={{ borderColor: "rgba(0,240,255,0.2)", background: "rgba(0,240,255,0.03)" }}>
            <CyberLabel>Composition Summary</CyberLabel>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Stat label="TOPIC" value={topic} />
              <Stat label="DURATION" value={`${duration}s`} />
              <Stat label="VOICE" value={VOICES.find(v => v.id === voice)?.label || voice} />
              <Stat label="CAPTION STYLE" value={captionStyle.toUpperCase()} />
              <Stat label="FOOTAGE CLIPS" value={`${selectedFootage.length} selected`} />
              <Stat label="CAPTION LINES" value={`${scriptData?.caption_lines.length || 0} lines`} />
            </div>
          </div>

          <div className="p-4 rounded border space-y-3" style={{ borderColor: "rgba(255,0,168,0.2)", background: "rgba(255,0,168,0.04)" }}>
            <div className="text-[10px] font-black tracking-widest text-[#ff00a8]">REQUIREMENTS</div>
            <div className="space-y-1 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <div className="flex items-center gap-2"><span className="text-[#ff00a8]">◈</span> Python pipeline server running: <code className="text-[#00f0ff]">cd pipeline && uvicorn server:app --port 8000</code></div>
              <div className="flex items-center gap-2"><span className="text-[#ff00a8]">◈</span> Python deps installed: <code className="text-[#00f0ff]">pip install -r requirements.txt</code></div>
              <div className="flex items-center gap-2"><span className="text-[#ff00a8]">◈</span> ImageMagick installed for text captions: <code className="text-[#00f0ff]">apt install imagemagick</code></div>
            </div>
          </div>

          <div className="p-3 rounded text-[10px] tracking-wider space-y-1"
            style={{ background: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            <div className="text-[#00f0ff] font-bold">OR USE CLI DIRECTLY:</div>
            <code className="block mt-1" style={{ color: "rgba(0,240,255,0.7)" }}>
              python main.py --topic &quot;{topic}&quot; --type {contentType} --duration {duration} --draft
            </code>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("footage")} className="btn-neon px-6 py-3 rounded text-xs">
              ← BACK
            </button>
            <button onClick={() => setStep("publish")} className="btn-primary flex-1 py-3 rounded tracking-widest text-xs">
              PROCEED TO BROADCAST →
            </button>
          </div>
        </div>
      )}

      {/* ══ PUBLISH ══ */}
      {step === "publish" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                mode: "draft",
                title: "DRAFT",
                desc: "Save to TikTok drafts. Review and post manually. Recommended for new accounts.",
                accent: "#00f0ff",
                tag: "SAFE",
              },
              {
                mode: "publish",
                title: "PUBLISH NOW",
                desc: "Post directly and publicly. Use only once you've reviewed the video.",
                accent: "#ff00a8",
                tag: "LIVE",
              },
              {
                mode: "schedule",
                title: "AUTOPILOT",
                desc: "Run the CLI scheduler to post 3x/day automatically on rotation.",
                accent: "#a855f7",
                tag: "AUTO",
              },
            ].map(option => (
              <div key={option.mode} className="p-5 rounded border corner-bracket space-y-3 transition-all hover:border-opacity-60"
                style={{ borderColor: `${option.accent}33`, background: `${option.accent}08` }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest" style={{ color: option.accent }}>{option.title}</span>
                  <span className="text-[8px] px-2 py-0.5 rounded font-bold tracking-widest"
                    style={{ border: `1px solid ${option.accent}44`, color: option.accent }}>{option.tag}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{option.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded border space-y-3" style={{ borderColor: "rgba(0,240,255,0.15)", background: "rgba(0,240,255,0.03)" }}>
            <CyberLabel>TikTok Cookies Setup</CyberLabel>
            <div className="space-y-2 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              <div>1. Install &quot;Cookie-Editor&quot; extension in your browser</div>
              <div>2. Go to tiktok.com and log in</div>
              <div>3. Open Cookie-Editor → Export → save as <code className="text-[#00f0ff]">pipeline/cookies.json</code></div>
              <div>4. Set <code className="text-[#00f0ff]">TIKTOK_COOKIES_PATH=cookies.json</code> in your <code className="text-[#00f0ff]">pipeline/.env</code></div>
            </div>
          </div>

          <div className="p-3 rounded text-[10px] font-bold tracking-wider"
            style={{ background: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.1)", color: "rgba(0,240,255,0.5)" }}>
            TIP — Start with --draft mode. TikTok can flag accounts that post fully automated content.
            Draft mode keeps you in control and your account safe.
          </div>

          <button onClick={() => setStep("config")} className="btn-neon w-full py-3 rounded tracking-widest text-xs">
            ← START NEW VIDEO
          </button>
        </div>
      )}
    </div>
  );
}

function CyberLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(0,240,255,0.7)" }}>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "rgba(0,240,255,0.4)" }}>{label}</div>
      <div className="text-sm font-medium mt-0.5 text-white/80">{value}</div>
    </div>
  );
}
