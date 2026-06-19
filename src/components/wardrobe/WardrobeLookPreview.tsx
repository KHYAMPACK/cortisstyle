"use client";

import { useRef } from "react";
import type { WardrobeLook } from "@/types/user";
import { resolveEditableLookItems } from "@/lib/resolveLookItems";
import { LookCanvas } from "@/components/modal/LookCanvas";

interface WardrobeLookPreviewProps {
  look: WardrobeLook;
}

export function WardrobeLookPreview({ look }: WardrobeLookPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = resolveEditableLookItems(look);

  return (
    <article className="border border-neutral-200 bg-white">
      <div className="aspect-[2/3] w-full overflow-hidden bg-white">
        <LookCanvas
          look={look}
          lookImage={look.image}
          title={look.title}
          items={items}
          activeItemId={null}
          isEditMode={false}
          containerRef={containerRef}
          onSelectItem={() => {}}
        />
      </div>
      <div className="border-t border-neutral-200 px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {look.title}
        </h2>
        <p className="mt-1 text-[9px] tracking-[0.3em] text-neutral-400 uppercase">
          Unlocked
        </p>
      </div>
    </article>
  );
}
