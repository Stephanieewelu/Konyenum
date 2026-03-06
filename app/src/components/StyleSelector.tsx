"use client";

interface StyleSelectorProps {
  selected: string;
  onSelect: (style: string) => void;
}

const styles = [
  { id: "luxury", label: "LUXURY", desc: "Opulent & aspirational" },
  { id: "editorial", label: "EDITORIAL", desc: "Fashion-forward, dramatic" },
  { id: "professional", label: "EXEC", desc: "Clean corporate power" },
  { id: "glamour", label: "GLAM", desc: "Full red carpet" },
  { id: "streetwear", label: "STREET", desc: "Urban, bold, raw" },
  { id: "minimalist", label: "VOID", desc: "Pure negative space" },
  { id: "anime", label: "ANIME", desc: "Japanese art style" },
  { id: "3d-render", label: "3D CGI", desc: "Rendered character" },
];

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(0,240,255,0.7)" }}>
        Style Matrix
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {styles.map(style => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`p-2.5 rounded border text-left transition-all ${
              selected === style.id
                ? "tab-active border-[#00f0ff]"
                : "glass border-transparent hover:border-[rgba(0,240,255,0.15)] hover:bg-[rgba(0,240,255,0.02)]"
            }`}
          >
            <div className={`text-[10px] font-black tracking-widest ${selected === style.id ? "text-[#00f0ff]" : "text-white/50"}`}>
              {style.label}
            </div>
            <div className={`text-[9px] mt-0.5 ${selected === style.id ? "text-[rgba(0,240,255,0.5)]" : "text-white/20"}`}>
              {style.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
