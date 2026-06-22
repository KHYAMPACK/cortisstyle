"use client";

import { useRef } from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { LookCanvasLayoutProvider } from "@/context/LookCanvasLayoutContext";
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
} from "@/lib/lookCanvasReference";
import { resolveEditableLookItems } from "@/lib/resolveLookItems";
import type { WardrobeLook } from "@/types/user";

/** Matches saved outfit preview card width — layout math stays at 420px reference. */
const PREVIEW_DISPLAY_WIDTH_PX = 320;
const PREVIEW_SCALE = PREVIEW_DISPLAY_WIDTH_PX / LOOK_CANVAS_REFERENCE_WIDTH;
const PREVIEW_MASK_HEIGHT_PX = Math.round(
  LOOK_CANVAS_REFERENCE_HEIGHT * PREVIEW_SCALE,
);

interface WardrobeLookPreviewProps {
  look: WardrobeLook;
}

export function WardrobeLookPreview({ look }: WardrobeLookPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = resolveEditableLookItems(look);

  return (
    <article className="surface-canvas-paper border border-blueprint-border">
      <div className="p-3 md:p-4">
        <div
          className="relative mx-auto flex w-full max-w-[320px] items-center justify-center overflow-hidden bg-white"
          style={{ height: PREVIEW_MASK_HEIGHT_PX }}
        >
          <LookCanvasLayoutProvider
            referenceWidth={LOOK_CANVAS_REFERENCE_WIDTH}
            referenceHeight={LOOK_CANVAS_REFERENCE_HEIGHT}
          >
            <div
              className="w-[420px] shrink-0 will-change-transform"
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "center",
              }}
            >
              <div
                className="relative box-content shrink-0 overflow-hidden border border-blueprint-border surface-canvas-paper"
                style={{
                  width: LOOK_CANVAS_REFERENCE_WIDTH,
                  height: LOOK_CANVAS_REFERENCE_HEIGHT,
                }}
              >
                <LookCanvas
                  look={look}
                  lookImage={look.image}
                  title={look.title}
                  items={items}
                  activeItemId={null}
                  isEditMode={false}
                  containerRef={containerRef}
                  onSelectItem={() => {}}
                  disableCanvasHitTesting
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          </LookCanvasLayoutProvider>
        </div>
      </div>
      <div className="border-t border-blueprint-border px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {look.title}
        </h2>
        <p className="text-meta mt-1 text-[9px] tracking-[0.3em] uppercase">
          Unlocked
        </p>
      </div>
    </article>
  );
}
