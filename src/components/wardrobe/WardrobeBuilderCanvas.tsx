"use client";

import { useState } from "react";
import { WardrobeBuilderSlot } from "@/components/wardrobe/WardrobeBuilderSlot";
import {
  WARDROBE_MATRIX_SLOTS,
  type WardrobeOutfitMatrix,
} from "@/types/wardrobe-builder";

export function WardrobeBuilderCanvas() {
  const [currentOutfit, setCurrentOutfit] = useState<WardrobeOutfitMatrix>(() =>
    Array(9).fill(null),
  );

  return (
    <section aria-label="Wardrobe builder matrix" className="w-full">
      <div className="mb-6 text-center">
        <p className="text-[9px] tracking-[0.42em] text-neutral-400 uppercase">
          Core Matrix // 3×3
        </p>
        <h2 className="mt-2 font-serif text-xl tracking-[-0.01em] text-neutral-950 md:text-2xl">
          Outfit Builder
        </h2>
      </div>

      <div className="grid aspect-square w-full max-w-[500px] grid-cols-3 grid-rows-3 border border-neutral-200 bg-white mx-auto">
        {WARDROBE_MATRIX_SLOTS.map((slot) => (
          <WardrobeBuilderSlot
            key={slot.index}
            label={slot.label}
            item={currentOutfit[slot.index]}
          />
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-[500px] text-center font-mono text-[9px] tracking-[0.18em] text-neutral-400 uppercase">
        Matrix state locked // awaiting asset assignment
      </p>

      {/* Reserved for upcoming drag-and-drop and slot assignment handlers. */}
      <span className="sr-only" aria-live="polite">
        {currentOutfit.filter((slot) => slot === null).length} empty slots
      </span>
    </section>
  );
}
