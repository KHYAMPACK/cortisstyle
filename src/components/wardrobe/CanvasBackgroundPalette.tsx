"use client";

import {
  CANVAS_BG_OPTIONS,
  type CanvasBgValue,
} from "@/lib/wardrobeCanvasBackground";

interface CanvasBackgroundPaletteProps {
  value: CanvasBgValue;
  onChange: (value: CanvasBgValue) => void;
}

export function CanvasBackgroundPalette({
  value,
  onChange,
}: CanvasBackgroundPaletteProps) {
  return (
    <div className="min-w-0">
      <span className="text-meta mb-2 block font-mono text-[9px] tracking-[0.25em] uppercase sm:tracking-[0.35em]">
        Canvas Background
      </span>
      <div className="flex flex-wrap gap-2">
        {CANVAS_BG_OPTIONS.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 border px-2 py-1.5 transition-colors max-[360px]:w-full max-[360px]:justify-start ${
                isActive
                  ? "border-jet-black bg-canvas-paper"
                  : "border-blueprint-border bg-canvas-paper hover:border-neutral-400"
              }`}
            >
              <span
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 border border-neutral-300"
                style={{ backgroundColor: option.value }}
              />
              <span className="font-mono text-[8px] tracking-[0.14em] text-neutral-700 uppercase">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
