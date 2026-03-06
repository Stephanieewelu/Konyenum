"use client";

import { useState } from "react";

interface GeneratedGalleryProps {
  images: Array<{ src: string; caption?: string; scene?: string }>;
  onEdit?: (image: string) => void;
}

export default function GeneratedGallery({ images, onEdit }: GeneratedGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  if (images.length === 0) return null;

  const download = (src: string, i: number) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `aura-${Date.now()}-${i}.png`;
    a.click();
  };

  const copyCaption = (caption: string, i: number) => {
    navigator.clipboard.writeText(caption);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase glow-cyan">OUTPUT</span>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)", color: "rgba(0,240,255,0.7)" }}>
            {images.length}
          </span>
        </div>
        {images.length > 1 && (
          <button onClick={() => images.forEach((img, i) => setTimeout(() => download(img.src, i), i * 150))}
            className="text-[10px] tracking-widest uppercase transition-colors"
            style={{ color: "rgba(0,240,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00f0ff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,240,255,0.4)")}>
            ↓ Download All
          </button>
        )}
      </div>

      <div className="gallery-grid">
        {images.map((img, i) => (
          <div key={i} className="group relative rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(0,240,255,0.1)", background: "rgba(0,0,0,0.4)" }}>
            <img src={img.src} alt={img.caption || `Output ${i + 1}`}
              className="w-full aspect-square object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => setSelectedIndex(i)} />

            {/* Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end"
              style={{ background: "linear-gradient(to top, rgba(0,0,5,0.95) 0%, transparent 50%)" }}>
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => download(img.src, i)}
                    className="flex-1 py-2 rounded text-[10px] font-black tracking-widest uppercase transition-all"
                    style={{ border: "1px solid #00f0ff", color: "#00f0ff", background: "rgba(0,240,255,0.08)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,240,255,0.18)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,240,255,0.08)"; }}>
                    ↓ Save
                  </button>
                  {onEdit && (
                    <button onClick={() => onEdit(img.src)}
                      className="flex-1 py-2 rounded text-[10px] font-black tracking-widest uppercase transition-all"
                      style={{ border: "1px solid rgba(255,0,168,0.4)", color: "#ff00a8", background: "rgba(255,0,168,0.06)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,0,168,0.14)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,0,168,0.06)"; }}>
                      Repair
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Corner scan line accent */}
            <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none"
              style={{ borderTop: "1px solid rgba(0,240,255,0.4)", borderLeft: "1px solid rgba(0,240,255,0.4)" }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
              style={{ borderBottom: "1px solid rgba(0,240,255,0.4)", borderRight: "1px solid rgba(0,240,255,0.4)" }} />

            {/* Caption */}
            {img.caption && (
              <div className="px-3 py-2 border-t" style={{ borderColor: "rgba(0,240,255,0.08)" }}>
                <p className="text-[10px] line-clamp-2" style={{ color: "rgba(255,255,255,0.35)" }}>{img.caption}</p>
                <button onClick={() => copyCaption(img.caption!, i)}
                  className="text-[9px] mt-1 tracking-widest uppercase transition-colors"
                  style={{ color: copied === i ? "#00f0ff" : "rgba(0,240,255,0.3)" }}>
                  {copied === i ? "✓ COPIED" : "COPY CAPTION"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,5,0.95)", backdropFilter: "blur(20px)" }}
          onClick={() => setSelectedIndex(null)}>
          <div className="relative max-w-3xl max-h-[90vh] corner-bracket" onClick={e => e.stopPropagation()}>
            <img src={images[selectedIndex].src} alt=""
              className="max-h-[85vh] rounded-lg object-contain"
              style={{ border: "1px solid rgba(0,240,255,0.2)", boxShadow: "0 0 40px rgba(0,240,255,0.15)" }} />
            <button onClick={() => setSelectedIndex(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded flex items-center justify-center text-lg transition-all"
              style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,0,168,0.3)", color: "#ff00a8" }}>
              ×
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 rounded-b-lg flex flex-wrap gap-2"
              style={{ background: "linear-gradient(to top, rgba(0,0,5,0.95), transparent)" }}>
              <button onClick={() => download(images[selectedIndex].src, selectedIndex)}
                className="btn-neon px-4 py-2 rounded text-[10px]">
                ↓ Download
              </button>
              {selectedIndex > 0 && (
                <button onClick={() => setSelectedIndex(selectedIndex - 1)}
                  className="px-3 py-2 rounded text-[10px] tracking-widest uppercase"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  ← Prev
                </button>
              )}
              {selectedIndex < images.length - 1 && (
                <button onClick={() => setSelectedIndex(selectedIndex + 1)}
                  className="px-3 py-2 rounded text-[10px] tracking-widest uppercase"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
