"use client";

import { useState } from "react";

interface GeneratedGalleryProps {
  images: Array<{
    src: string;
    caption?: string;
    scene?: string;
  }>;
  onEdit?: (image: string) => void;
}

export default function GeneratedGallery({ images, onEdit }: GeneratedGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const downloadImage = (src: string, index: number) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `secondme-${Date.now()}-${index}.png`;
    link.click();
  };

  const copyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#c9a96e]">
          Generated ({images.length})
        </h3>
        {images.length > 1 && (
          <button
            onClick={() => {
              images.forEach((img, i) => {
                setTimeout(() => downloadImage(img.src, i), i * 200);
              });
            }}
            className="text-xs text-[#7a756e] hover:text-[#c9a96e] transition-colors"
          >
            Download All
          </button>
        )}
      </div>

      <div className="gallery-grid">
        {images.map((img, i) => (
          <div
            key={i}
            className="group relative bg-[#141414] rounded-lg overflow-hidden border border-[#2a2a2a] hover:border-[#c9a96e]/30 transition-all"
          >
            <img
              src={img.src}
              alt={img.caption || `Generated ${i + 1}`}
              className="w-full aspect-square object-cover cursor-pointer"
              onClick={() => setSelectedIndex(i)}
            />

            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
              <div className="w-full p-3 flex gap-2">
                <button
                  onClick={() => downloadImage(img.src, i)}
                  className="flex-1 bg-[#c9a96e] text-black text-xs font-medium py-2 rounded hover:bg-[#e0c48a] transition-colors"
                >
                  Download
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(img.src)}
                    className="flex-1 bg-white/10 text-white text-xs font-medium py-2 rounded hover:bg-white/20 transition-colors"
                  >
                    Edit / Fix
                  </button>
                )}
              </div>
            </div>

            {/* Caption */}
            {img.caption && (
              <div className="p-3 border-t border-[#2a2a2a]">
                <p className="text-xs text-[#7a756e] line-clamp-2">{img.caption}</p>
                <button
                  onClick={() => copyCaption(img.caption!)}
                  className="text-[10px] text-[#c9a96e] mt-1 hover:underline"
                >
                  Copy caption
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[selectedIndex].src}
              alt=""
              className="max-h-[85vh] rounded-lg object-contain"
            />
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-black"
            >
              x
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
              <div className="flex gap-2">
                <button
                  onClick={() => downloadImage(images[selectedIndex].src, selectedIndex)}
                  className="bg-[#c9a96e] text-black text-sm font-medium px-4 py-2 rounded hover:bg-[#e0c48a]"
                >
                  Download
                </button>
                {selectedIndex > 0 && (
                  <button
                    onClick={() => setSelectedIndex(selectedIndex - 1)}
                    className="bg-white/10 text-white text-sm px-3 py-2 rounded hover:bg-white/20"
                  >
                    Prev
                  </button>
                )}
                {selectedIndex < images.length - 1 && (
                  <button
                    onClick={() => setSelectedIndex(selectedIndex + 1)}
                    className="bg-white/10 text-white text-sm px-3 py-2 rounded hover:bg-white/20"
                  >
                    Next
                  </button>
                )}
              </div>
              {images[selectedIndex].caption && (
                <p className="text-sm text-[#ccc] mt-3">
                  {images[selectedIndex].caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
