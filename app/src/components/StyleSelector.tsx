"use client";

interface StyleSelectorProps {
  selected: string;
  onSelect: (style: string) => void;
  styles?: Array<{ id: string; label: string; desc: string }>;
}

const defaultStyles = [
  { id: "luxury", label: "Luxury", desc: "High-end, editorial, aspirational" },
  { id: "professional", label: "Professional", desc: "Clean, corporate, polished" },
  { id: "editorial", label: "Editorial", desc: "Fashion-forward, dramatic" },
  { id: "glamour", label: "Glamour", desc: "Full glam, red carpet energy" },
  { id: "streetwear", label: "Streetwear", desc: "Urban, trendy, bold" },
  { id: "minimalist", label: "Minimalist", desc: "Clean, understated, elegant" },
  { id: "anime", label: "Anime", desc: "Japanese art style, vibrant" },
  { id: "3d-render", label: "3D Render", desc: "Pixar/Disney quality character" },
];

export default function StyleSelector({
  selected,
  onSelect,
  styles = defaultStyles,
}: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#c9a96e]">
        Style Preset
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selected === style.id
                ? "border-[#c9a96e] bg-[#c9a96e]/10 text-white"
                : "border-[#2a2a2a] bg-[#141414] text-[#7a756e] hover:border-[#3a3a3a]"
            }`}
          >
            <div className="text-sm font-medium">{style.label}</div>
            <div className="text-xs mt-0.5 opacity-70">{style.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
