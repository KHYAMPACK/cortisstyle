"use client";

import type { TrProductColor } from "@/types/tr-marketplace";

interface TrProductColorPickerProps {
  colors: TrProductColor[];
  selectedColor: TrProductColor | null;
  onChange: (color: TrProductColor) => void;
  /** Boutique theme accent; defaults to marketplace brand primary. */
  accentColor?: string;
}

const BRAND_PRIMARY = "#1F6B63";

export function TrProductColorPicker({
  colors,
  selectedColor,
  onChange,
  accentColor = BRAND_PRIMARY,
}: TrProductColorPickerProps) {
  if (colors.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium tracking-[0.12em] text-neutral-800 uppercase">
        Renk
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {colors.map((color) => {
          const isSelected = selectedColor?.hex === color.hex;

          return (
            <button
              key={`${color.name}-${color.hex}`}
              type="button"
              title={color.name}
              aria-label={color.name}
              aria-pressed={isSelected}
              onClick={() => onChange(color)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-105"
              style={{
                backgroundColor: color.hex,
                borderColor: isSelected ? accentColor : "transparent",
                outline: isSelected ? `1px solid ${accentColor}` : undefined,
                outlineOffset: "2px",
              }}
            />
          );
        })}
      </div>
      {selectedColor ? (
        <p className="mt-2 text-[11px] text-neutral-600">{selectedColor.name}</p>
      ) : null}
    </div>
  );
}
