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

  // Twin builder state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [twinPrompt, setTwinPrompt] = useState("");
  const [twinStyle, setTwinStyle] = useState("luxury");
  const [twinResults, setTwinResults] = useState<GalleryImage[]>([]);

  // Avatar builder state
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("luxury");
  const [avatarResults, setAvatarResults] = useState<GalleryImage[]>([]);

  // Content generator state
  const [contentAvatar, setContentAvatar] = useState<string | null>(null);
  const [contentType, setContentType] = useState("brand-lifestyle");
  const [contentNiche, setContentNiche] = useState("");
  const [contentTone, setContentTone] = useState("confident");
  const [contentCount, setContentCount] = useState(4);
  const [contentResults, setContentResults] = useState<GalleryImage[]>([]);

  // Image fixer state
  const [fixImage, setFixImage] = useState<string | null>(null);
  const [fixPrompt, setFixPrompt] = useState("");
  const [fixResults, setFixResults] = useState<GalleryImage[]>([]);

  const tabs: Array<{ id: Tab; label: string; desc: string }> = [
    { id: "twin", label: "Digital Twin", desc: "Clone yourself from a photo" },
    { id: "avatar", label: "Custom Avatar", desc: "Build from scratch" },
    { id: "content", label: "Content Engine", desc: "Batch-generate content" },
    { id: "fix", label: "AI Fixer", desc: "Fix bad AI images" },
  ];

  const generateTwin = useCallback(async () => {
    if (!referenceImage) {
      setError("Upload a reference photo first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: twinPrompt,
          referenceImage,
          style: twinStyle,
          mode: "twin",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.images?.length) {
        setTwinResults((prev) => [
          ...data.images.map((src: string) => ({ src, caption: data.text })),
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [referenceImage, twinPrompt, twinStyle]);

  const generateAvatar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: avatarPrompt || "A confident, attractive person perfect for a luxury personal brand",
          style: avatarStyle,
          mode: "custom",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.images?.length) {
        setAvatarResults((prev) => [
          ...data.images.map((src: string) => ({ src, caption: data.text })),
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [avatarPrompt, avatarStyle]);

  const generateContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarImage: contentAvatar,
          contentType,
          niche: contentNiche,
          tone: contentTone,
          count: contentCount,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.content?.length) {
        setContentResults((prev) => [
          ...data.content.map(
            (c: { image: string; caption: string; scene: string }) => ({
              src: c.image,
              caption: c.caption,
              scene: c.scene,
            })
          ),
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [contentAvatar, contentType, contentNiche, contentTone, contentCount]);

  const fixAIImage = useCallback(async () => {
    if (!fixImage) {
      setError("Upload an image to fix");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: fixImage,
          editPrompt: fixPrompt || "Fix AI artifacts, improve realism and quality",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.images?.length) {
        setFixResults((prev) => [
          ...data.images.map((src: string) => ({ src, caption: data.text })),
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fix failed");
    } finally {
      setLoading(false);
    }
  }, [fixImage, fixPrompt]);

  const handleEditImage = (imageSrc: string) => {
    setFixImage(imageSrc);
    setActiveTab("fix");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="text-[#c9a96e]">Second Me</span> Academy
            </h1>
            <p className="text-xs text-[#7a756e] mt-0.5">
              Digital Twin & Avatar Builder
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-[#7a756e]">Gemini API</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-[#141414] rounded-xl p-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError("");
              }}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#c9a96e] text-black"
                  : "text-[#7a756e] hover:text-white hover:bg-[#1e1e1e]"
              }`}
            >
              <div>{tab.label}</div>
              <div
                className={`text-[10px] mt-0.5 ${
                  activeTab === tab.id ? "text-black/60" : "opacity-50"
                }`}
              >
                {tab.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400/60 hover:text-red-400">
              x
            </button>
          </div>
        )}

        {/* DIGITAL TWIN TAB */}
        {activeTab === "twin" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a] space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Build Your Digital Twin</h2>
                  <p className="text-xs text-[#7a756e]">
                    Upload your photo and generate new versions of yourself in any style, outfit, or setting.
                  </p>
                </div>

                <ImageUpload
                  onImageSelect={(img) => setReferenceImage(img || null)}
                  currentImage={referenceImage}
                  label="Your reference photo"
                />

                <StyleSelector selected={twinStyle} onSelect={setTwinStyle} />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#c9a96e]">
                    Describe the look (optional)
                  </label>
                  <textarea
                    value={twinPrompt}
                    onChange={(e) => setTwinPrompt(e.target.value)}
                    placeholder="e.g., In a luxury office wearing a designer suit, golden hour lighting..."
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a96e] resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={generateTwin}
                  disabled={loading || !referenceImage}
                  className="w-full py-3 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#e0c48a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {loading ? "Generating your twin..." : "Generate Digital Twin"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              {loading && twinResults.length === 0 && <LoadingSkeleton />}
              <GeneratedGallery images={twinResults} onEdit={handleEditImage} />
              {!loading && twinResults.length === 0 && (
                <EmptyState message="Upload a photo and generate your first digital twin" />
              )}
            </div>
          </div>
        )}

        {/* CUSTOM AVATAR TAB */}
        {activeTab === "avatar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a] space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Create Custom Avatar</h2>
                  <p className="text-xs text-[#7a756e]">
                    Design a brand-new character from scratch. No photos needed — describe the look you want.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#c9a96e]">
                    Describe your avatar
                  </label>
                  <textarea
                    value={avatarPrompt}
                    onChange={(e) => setAvatarPrompt(e.target.value)}
                    placeholder="e.g., A confident Black woman in her 30s with locs, wearing a tailored blazer, warm brown skin, radiant smile..."
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a96e] resize-none"
                    rows={4}
                  />
                </div>

                <StyleSelector selected={avatarStyle} onSelect={setAvatarStyle} />

                <button
                  onClick={generateAvatar}
                  disabled={loading}
                  className="w-full py-3 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#e0c48a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {loading ? "Creating avatar..." : "Generate Avatar"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              {loading && avatarResults.length === 0 && <LoadingSkeleton />}
              <GeneratedGallery images={avatarResults} onEdit={handleEditImage} />
              {!loading && avatarResults.length === 0 && (
                <EmptyState message="Describe the avatar you want and hit generate" />
              )}
            </div>
          </div>
        )}

        {/* CONTENT ENGINE TAB */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a] space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Content Engine</h2>
                  <p className="text-xs text-[#7a756e]">
                    Generate weeks of on-brand images + captions in one batch. Upload your twin or avatar for consistency.
                  </p>
                </div>

                <ImageUpload
                  onImageSelect={(img) => setContentAvatar(img || null)}
                  currentImage={contentAvatar}
                  label="Your avatar/twin (optional)"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#c9a96e]">
                    Content type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "brand-lifestyle", label: "Brand & Lifestyle" },
                      { id: "product-promo", label: "Product Promo" },
                      { id: "motivation", label: "Motivation" },
                      { id: "social-media", label: "Social Media" },
                    ].map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => setContentType(ct.id)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          contentType === ct.id
                            ? "border-[#c9a96e] bg-[#c9a96e]/10 text-white"
                            : "border-[#2a2a2a] text-[#7a756e] hover:border-[#3a3a3a]"
                        }`}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#c9a96e]">
                    Your niche (optional)
                  </label>
                  <input
                    type="text"
                    value={contentNiche}
                    onChange={(e) => setContentNiche(e.target.value)}
                    placeholder="e.g., fitness coaching, real estate, beauty..."
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a96e]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#c9a96e]">
                    Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["confident", "warm", "bold", "elegant", "playful", "authoritative"].map(
                      (t) => (
                        <button
                          key={t}
                          onClick={() => setContentTone(t)}
                          className={`p-2 rounded-lg border text-xs capitalize transition-all ${
                            contentTone === t
                              ? "border-[#c9a96e] bg-[#c9a96e]/10 text-white"
                              : "border-[#2a2a2a] text-[#7a756e] hover:border-[#3a3a3a]"
                          }`}
                        >
                          {t}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#c9a96e]">
                    Number of images: {contentCount}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={contentCount}
                    onChange={(e) => setContentCount(Number(e.target.value))}
                    className="w-full accent-[#c9a96e]"
                  />
                  <div className="flex justify-between text-xs text-[#555]">
                    <span>1</span>
                    <span>8</span>
                  </div>
                </div>

                <button
                  onClick={generateContent}
                  disabled={loading}
                  className="w-full py-3 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#e0c48a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {loading
                    ? `Generating ${contentCount} images...`
                    : `Generate ${contentCount} Content Pieces`}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              {loading && contentResults.length === 0 && <LoadingSkeleton count={contentCount} />}
              <GeneratedGallery images={contentResults} onEdit={handleEditImage} />
              {!loading && contentResults.length === 0 && (
                <EmptyState message="Set your preferences and generate a batch of content" />
              )}
            </div>
          </div>
        )}

        {/* AI FIXER TAB */}
        {activeTab === "fix" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a] space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Fix Bad AI Images</h2>
                  <p className="text-xs text-[#7a756e]">
                    Upload any AI-generated image and fix artifacts, weird hands, blurriness, or add improvements.
                  </p>
                </div>

                <ImageUpload
                  onImageSelect={(img) => setFixImage(img || null)}
                  currentImage={fixImage}
                  label="Image to fix"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#c9a96e]">
                    What to fix or improve
                  </label>
                  <textarea
                    value={fixPrompt}
                    onChange={(e) => setFixPrompt(e.target.value)}
                    placeholder="e.g., Fix the hands, make the lighting warmer, remove background blur, improve face details..."
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a96e] resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={fixAIImage}
                  disabled={loading || !fixImage}
                  className="w-full py-3 bg-[#c9a96e] text-black font-semibold rounded-lg hover:bg-[#e0c48a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {loading ? "Fixing image..." : "Fix & Enhance"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              {loading && fixResults.length === 0 && <LoadingSkeleton />}
              <GeneratedGallery images={fixResults} />
              {!loading && fixResults.length === 0 && (
                <EmptyState message="Upload a bad AI image and let the fixer clean it up" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] mt-16 py-8 text-center">
        <p className="text-xs text-[#7a756e]">
          <span className="text-[#c9a96e]">Second Me Academy</span> — Build
          assets. Stack leverage. Get paid.
        </p>
      </footer>
    </div>
  );
}

function LoadingSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="gallery-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer aspect-square rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64 border border-dashed border-[#2a2a2a] rounded-xl">
      <div className="text-center space-y-2">
        <div className="text-3xl opacity-20">&#9670;</div>
        <p className="text-sm text-[#7a756e]">{message}</p>
      </div>
    </div>
  );
}
