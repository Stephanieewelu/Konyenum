"use client";

import { useState, useCallback } from "react";
import ImageUpload from "@/components/ImageUpload";
import StyleSelector from "@/components/StyleSelector";
import GeneratedGallery from "@/components/GeneratedGallery";

type Tab = "twin" | "avatar" | "content" | "fix";

interface GalleryImage {
  src: string;
  caption?: string;
  scene?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("twin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [twinPrompt, setTwinPrompt] = useState("");
  const [twinStyle, setTwinStyle] = useState("luxury");
  const [twinResults, setTwinResults] = useState<GalleryImage[]>([]);

  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("luxury");
  const [avatarResults, setAvatarResults] = useState<GalleryImage[]>([]);

  const [contentAvatar, setContentAvatar] = useState<string | null>(null);
  const [contentType, setContentType] = useState("brand-lifestyle");
  const [contentNiche, setContentNiche] = useState("");
  const [contentTone, setContentTone] = useState("confident");
  const [contentCount, setContentCount] = useState(4);
  const [contentResults, setContentResults] = useState<GalleryImage[]>([]);

  const [fixImage, setFixImage] = useState<string | null>(null);
  const [fixPrompt, setFixPrompt] = useState("");
  const [fixResults, setFixResults] = useState<GalleryImage[]>([]);

  const tabs: Array<{ id: Tab; label: string; tag: string }> = [
    { id: "twin", label: "TWIN", tag: "Digital Clone" },
    { id: "avatar", label: "FORGE", tag: "Build Avatar" },
    { id: "content", label: "SIGNAL", tag: "Content Engine" },
    { id: "fix", label: "REPAIR", tag: "AI Fix" },
  ];

  const generateTwin = useCallback(async () => {
    if (!referenceImage) { setError("Upload a reference photo first"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: twinPrompt, referenceImage, style: twinStyle, mode: "twin" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.images?.length) {
        setTwinResults(prev => [...data.images.map((src: string) => ({ src, caption: data.text })), ...prev]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally { setLoading(false); }
  }, [referenceImage, twinPrompt, twinStyle]);

  const generateAvatar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: avatarPrompt || "A powerful, mysterious figure with commanding presence", style: avatarStyle, mode: "custom" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.images?.length) {
        setAvatarResults(prev => [...data.images.map((src: string) => ({ src, caption: data.text })), ...prev]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally { setLoading(false); }
  }, [avatarPrompt, avatarStyle]);

  const generateContent = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarImage: contentAvatar, contentType, niche: contentNiche, tone: contentTone, count: contentCount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.content?.length) {
        setContentResults(prev => [...data.content.map((c: { image: string; caption: string; scene: string }) => ({ src: c.image, caption: c.caption, scene: c.scene })), ...prev]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally { setLoading(false); }
  }, [contentAvatar, contentType, contentNiche, contentTone, contentCount]);

  const fixAIImage = useCallback(async () => {
    if (!fixImage) { setError("Upload an image to fix"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: fixImage, editPrompt: fixPrompt || "Fix AI artifacts, improve realism and quality" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.images?.length) {
        setFixResults(prev => [...data.images.map((src: string) => ({ src, caption: data.text })), ...prev]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fix failed");
    } finally { setLoading(false); }
  }, [fixImage, fixPrompt]);

  const handleEditImage = (imageSrc: string) => {
    setFixImage(imageSrc);
    setActiveTab("fix");
  };

  return (
    <div className="relative min-h-screen" style={{ zIndex: 1 }}>

      {/* Ambient orbs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)", zIndex: 0 }} />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,0,168,0.05) 0%, transparent 70%)", zIndex: 0 }} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: "rgba(0,240,255,0.1)", background: "rgba(0,0,5,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border border-[#00f0ff] rotate-45"
                style={{ boxShadow: "0 0 10px rgba(0,240,255,0.4)", opacity: 0.8 }} />
              <div className="absolute inset-[3px] border border-[#ff00a8] rotate-45"
                style={{ boxShadow: "0 0 6px rgba(255,0,168,0.4)", opacity: 0.6 }} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-[0.2em] glow-cyan">AURA</h1>
              <p className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                Your Identity. Your Frequency.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="pulse-glow w-1.5 h-1.5 rounded-full bg-[#00f0ff]"
              style={{ boxShadow: "0 0 6px #00f0ff" }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(0,240,255,0.6)" }}>
              Gemini Live
            </span>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-6 py-8" style={{ zIndex: 1 }}>

        {/* ── Tab nav ── */}
        <div className="flex gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(""); }}
              className={`flex-1 py-3 px-2 rounded border transition-all ${activeTab === tab.id ? "tab-active border-[#00f0ff]" : "border-transparent glass hover:border-[rgba(0,240,255,0.2)]"}`}
            >
              <div className={`text-xs font-black tracking-[0.2em] ${activeTab === tab.id ? "text-[#00f0ff]" : "text-white/40"}`}>
                {tab.label}
              </div>
              <div className={`text-[9px] tracking-[0.1em] mt-0.5 ${activeTab === tab.id ? "text-[rgba(0,240,255,0.6)]" : "text-white/20"}`}>
                {tab.tag}
              </div>
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded border border-[#ff00a8]/30 text-sm flex items-center justify-between"
            style={{ background: "rgba(255,0,168,0.06)", color: "#ff6eb8" }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError("")} className="opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* ══════ TWIN ══════ */}
        {activeTab === "twin" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Panel title="TWIN" subtitle="Replicate yourself across any dimension">
                <ImageUpload onImageSelect={img => setReferenceImage(img || null)} currentImage={referenceImage} label="Reference Photo" />
                <StyleSelector selected={twinStyle} onSelect={setTwinStyle} />
                <NeonTextarea value={twinPrompt} onChange={setTwinPrompt} placeholder="Describe the scene, look, or mood... e.g. boardroom, rooftop city, editorial shoot" />
                <NeonButton onClick={generateTwin} loading={loading} disabled={!referenceImage}>
                  {loading ? "GENERATING TWIN..." : "GENERATE TWIN"}
                </NeonButton>
              </Panel>
            </div>
            <div className="lg:col-span-2">
              {loading && twinResults.length === 0 && <Skeleton />}
              <GeneratedGallery images={twinResults} onEdit={handleEditImage} />
              {!loading && twinResults.length === 0 && <Empty label="TWIN" msg="Upload a photo to begin replication" />}
            </div>
          </div>
        )}

        {/* ══════ FORGE ══════ */}
        {activeTab === "avatar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Panel title="FORGE" subtitle="Design an original entity from void">
                <NeonTextarea
                  value={avatarPrompt}
                  onChange={setAvatarPrompt}
                  placeholder="Describe your entity... e.g. a sharp-eyed woman with silver locs, dark skin, regal presence — cyberpunk fashion"
                  rows={5}
                />
                <StyleSelector selected={avatarStyle} onSelect={setAvatarStyle} />
                <NeonButton onClick={generateAvatar} loading={loading}>
                  {loading ? "FORGING..." : "FORGE AVATAR"}
                </NeonButton>
              </Panel>
            </div>
            <div className="lg:col-span-2">
              {loading && avatarResults.length === 0 && <Skeleton />}
              <GeneratedGallery images={avatarResults} onEdit={handleEditImage} />
              {!loading && avatarResults.length === 0 && <Empty label="FORGE" msg="Describe your avatar to begin forging" />}
            </div>
          </div>
        )}

        {/* ══════ SIGNAL ══════ */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Panel title="SIGNAL" subtitle="Broadcast your presence — batch content in one pulse">
                <ImageUpload onImageSelect={img => setContentAvatar(img || null)} currentImage={contentAvatar} label="Your Avatar / Twin (optional)" />

                <div className="space-y-2">
                  <Label>Content Format</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "brand-lifestyle", label: "Lifestyle" },
                      { id: "product-promo", label: "Product" },
                      { id: "motivation", label: "Mindset" },
                      { id: "social-media", label: "Social" },
                    ].map(ct => (
                      <button key={ct.id} onClick={() => setContentType(ct.id)}
                        className={`py-2 px-3 rounded border text-[10px] tracking-widest uppercase font-bold transition-all ${contentType === ct.id ? "tab-active border-[#00f0ff]" : "glass border-transparent hover:border-[rgba(0,240,255,0.2)] text-white/40"}`}>
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Niche / Domain</Label>
                  <input type="text" value={contentNiche} onChange={e => setContentNiche(e.target.value)}
                    placeholder="e.g. fitness, crypto, real estate, beauty..."
                    className="input-neon w-full rounded px-4 py-2.5 text-sm" />
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["confident", "warm", "bold", "elegant", "playful", "raw"].map(t => (
                      <button key={t} onClick={() => setContentTone(t)}
                        className={`py-1.5 rounded border text-[10px] tracking-widest uppercase font-bold transition-all capitalize ${contentTone === t ? "tab-active border-[#00f0ff]" : "glass border-transparent hover:border-[rgba(0,240,255,0.2)] text-white/40"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Batch Size — <span className="text-[#00f0ff]">{contentCount} images</span></Label>
                  <input type="range" min={1} max={8} value={contentCount} onChange={e => setContentCount(Number(e.target.value))}
                    className="w-full accent-[#00f0ff]" />
                </div>

                <NeonButton onClick={generateContent} loading={loading}>
                  {loading ? `TRANSMITTING ${contentCount}...` : `BROADCAST ${contentCount} SIGNALS`}
                </NeonButton>
              </Panel>
            </div>
            <div className="lg:col-span-2">
              {loading && contentResults.length === 0 && <Skeleton count={contentCount} />}
              <GeneratedGallery images={contentResults} onEdit={handleEditImage} />
              {!loading && contentResults.length === 0 && <Empty label="SIGNAL" msg="Configure your broadcast and transmit" />}
            </div>
          </div>
        )}

        {/* ══════ REPAIR ══════ */}
        {activeTab === "fix" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Panel title="REPAIR" subtitle="Reconstruct corrupted outputs — fix hands, artifacts, noise">
                <ImageUpload onImageSelect={img => setFixImage(img || null)} currentImage={fixImage} label="Damaged Image" />
                <NeonTextarea value={fixPrompt} onChange={setFixPrompt}
                  placeholder="What needs fixing... e.g. fix the hands, sharpen face, remove blur, fix unnatural skin" />
                <NeonButton onClick={fixAIImage} loading={loading} disabled={!fixImage}>
                  {loading ? "RECONSTRUCTING..." : "RECONSTRUCT"}
                </NeonButton>
              </Panel>
            </div>
            <div className="lg:col-span-2">
              {loading && fixResults.length === 0 && <Skeleton />}
              <GeneratedGallery images={fixResults} />
              {!loading && fixResults.length === 0 && <Empty label="REPAIR" msg="Upload a damaged image to begin reconstruction" />}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="relative border-t mt-20 py-8" style={{ borderColor: "rgba(0,240,255,0.08)", zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.3em] uppercase glow-cyan font-black">AURA</span>
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>
            Identity is a signal. Amplify yours.
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-6 space-y-5 corner-bracket" style={{ borderColor: "rgba(0,240,255,0.12)" }}>
      <div>
        <h2 className="text-sm font-black tracking-[0.3em] glow-cyan">{title}</h2>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(0,240,255,0.7)" }}>
      {children}
    </label>
  );
}

function NeonTextarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label>Directive</Label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="input-neon w-full rounded px-4 py-3 text-sm resize-none" />
    </div>
  );
}

function NeonButton({ children, onClick, loading, disabled }: { children: React.ReactNode; onClick: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading || disabled} className="btn-primary w-full py-3.5 rounded tracking-widest">
      {children}
    </button>
  );
}

function Skeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="gallery-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-neon aspect-square rounded-lg" />
      ))}
    </div>
  );
}

function Empty({ label, msg }: { label: string; msg: string }) {
  return (
    <div className="flex items-center justify-center h-72 rounded-xl border" style={{ borderColor: "rgba(0,240,255,0.08)", background: "rgba(0,240,255,0.01)" }}>
      <div className="text-center space-y-3">
        <div className="text-[10px] tracking-[0.4em] uppercase glow-cyan font-black opacity-30">{label}</div>
        <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>{msg}</p>
      </div>
    </div>
  );
}
