"use client";

import type { ReactNode } from "react";
import { LookCanvasLayoutProvider } from "@/context/LookCanvasLayoutContext";
import { useIsMobileMd } from "@/hooks/useIsMobileMd";
import { LOOK_CANVAS_REFERENCE_HEIGHT, LOOK_CANVAS_REFERENCE_WIDTH } from "@/lib/lookCanvasReference";

interface LookCanvasViewportProps {
  children: ReactNode;
  allowBleed?: boolean;
  className?: string;
}

/**
 * Canonical LookCanvas parent chain — matches LookImagePanel view/edit framing.
 *
 * Mobile: renders at 420×630 then CSS-scales to ~272×408 so committed widthPx
 * layouts match desktop. Desktop chain is unchanged.
 */
export function LookCanvasViewport({
  children,
  allowBleed = false,
  className = "",
}: LookCanvasViewportProps) {
  const isMobile = useIsMobileMd();
  const bleedClass = allowBleed
    ? "overflow-hidden md:overflow-visible"
    : "overflow-hidden";

  return (
    <LookCanvasLayoutProvider
      referenceWidth={isMobile ? LOOK_CANVAS_REFERENCE_WIDTH : null}
      referenceHeight={isMobile ? LOOK_CANVAS_REFERENCE_HEIGHT : null}
    >
      <div
        className={`relative mx-auto overflow-hidden bg-ice-floor max-md:h-[408px] max-md:w-full max-md:max-w-[272px] md:aspect-[2/3] md:mx-0 md:h-full md:max-h-none md:w-auto md:overflow-visible ${className}`.trim()}
      >
        <div className="overflow-hidden bg-ice-floor max-md:absolute max-md:left-1/2 max-md:top-0 max-md:h-[630px] max-md:w-[420px] max-md:-translate-x-1/2 max-md:origin-top max-md:scale-[calc(272/420)] md:relative md:flex md:h-full md:w-full md:translate-x-0 md:scale-100 md:items-center md:justify-center md:overflow-visible">
          <div
            className={`relative h-full w-full max-md:h-[630px] max-md:w-[420px] ${bleedClass} md:origin-center`}
          >
            <div className={`relative h-full w-full ${bleedClass}`}>{children}</div>
          </div>
        </div>
      </div>
    </LookCanvasLayoutProvider>
  );
}
