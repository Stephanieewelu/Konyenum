"use client";

import { useCallback, useState, DragEvent, ChangeEvent } from "react";

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  currentImage?: string | null;
  label?: string;
}

export default function ImageUpload({ onImageSelect, currentImage, label = "Upload" }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => onImageSelect(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(0,240,255,0.7)" }}>
        {label}
      </label>

      {currentImage ? (
        <div className="relative group">
          <img src={currentImage} alt="Reference"
            className="w-full max-w-[200px] rounded-lg object-cover aspect-square"
            style={{ border: "1px solid rgba(0,240,255,0.3)", boxShadow: "0 0 12px rgba(0,240,255,0.15)" }} />
          <button onClick={() => onImageSelect("")}
            className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,0,168,0.4)", color: "#ff00a8" }}>
            ×
          </button>
          <div className="mt-1 text-[9px] tracking-widest uppercase" style={{ color: "rgba(0,240,255,0.4)" }}>
            ◈ LOADED
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("aura-file-input")?.click()}
          className={`drop-zone rounded-lg p-6 text-center cursor-pointer ${dragOver ? "drag-over" : ""}`}
        >
          <input id="aura-file-input" type="file" accept="image/*" onChange={handleChange} className="hidden" />
          <div className="space-y-2">
            {/* Upload icon */}
            <svg className="mx-auto h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="rgba(0,240,255,0.4)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(0,240,255,0.4)" }}>
              Drop image or click to upload
            </p>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>PNG · JPG · up to 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
