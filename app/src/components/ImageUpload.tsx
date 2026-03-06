"use client";

import { useCallback, useState, DragEvent, ChangeEvent } from "react";

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  currentImage?: string | null;
  label?: string;
}

export default function ImageUpload({
  onImageSelect,
  currentImage,
  label = "Upload a reference photo",
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageSelect(result);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#c9a96e]">
        {label}
      </label>

      {currentImage ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Reference"
            className="w-full max-w-xs rounded-lg border border-[#2a2a2a] object-cover aspect-square"
          />
          <button
            onClick={() => onImageSelect("")}
            className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`drop-zone rounded-lg p-8 text-center cursor-pointer ${
            dragOver ? "drag-over" : ""
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <div className="text-[#7a756e] space-y-2">
            <svg
              className="mx-auto h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Drag & drop your photo here or click to browse</p>
            <p className="text-xs text-[#555]">PNG, JPG up to 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
