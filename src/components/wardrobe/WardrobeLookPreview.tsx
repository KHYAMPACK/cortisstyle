"use client";

import { Copy } from "lucide-react";
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

const actionButtonClass =
  "flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/90 px-2.5 py-1 font-mono text-[8px] tracking-[0.16em] text-neutral-950 uppercase shadow-sm transition-all duration-200 hover:border-neutral-400 hover:bg-white hover:shadow-md";

interface WardrobeLookPreviewProps {
  look: WardrobeLook;
  onCopyToEditor?: (look: WardrobeLook) => void;
}

export function WardrobeLookPreview({
  look,
  onCopyToEditor,
}: WardrobeLookPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = resolveEditableLookItems(look);

  return (
    <article className="relative overflow-hidden border border-blueprint-border bg-transparent">
      <div className="relative">
        {onCopyToEditor ? (
          <div className="absolute top-3 right-3 z-[60]">
            <button
              type="button"
              aria-label={`Copy ${look.title} to editor`}
              onClick={() => onCopyToEditor(look)}
              className={actionButtonClass}
            >
              <Copy className="h-3 w-3 stroke-current" strokeWidth={1.75} />
              Copy to Editor
            </button>
          </div>
        ) : null}

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
      </div>
    </article>
  );
}
