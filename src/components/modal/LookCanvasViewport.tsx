"use client";

import type { CSSProperties, ReactNode } from "react";
import { LookCanvasLayoutProvider } from "@/context/LookCanvasLayoutContext";
import {
  LOOK_CANVAS_MOBILE_DISPLAY_MAX_WIDTH,
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  WARDROBE_MOBILE_DISPLAY_MAX_WIDTH,
} from "@/lib/lookCanvasReference";

interface LookCanvasViewportProps {
  children: ReactNode;
  allowBleed?: boolean;
  className?: string;
  /** Look modal side panel vs wardrobe builder card. */
  layout?: "panel" | "standalone";
  /** Mobile width cap after CSS scale — 272 look modal, 360 wardrobe. */
  mobileDisplayMaxWidth?: number;
}

const COORDINATE_SIZE_STYLE: CSSProperties = {
  width: LOOK_CANVAS_REFERENCE_WIDTH,
  height: LOOK_CANVAS_REFERENCE_HEIGHT,
};

function resolveMobileShellClass(mobileDisplayMaxWidth: number): string {
  if (mobileDisplayMaxWidth === WARDROBE_MOBILE_DISPLAY_MAX_WIDTH) {
    return "max-md:max-w-[360px] max-md:h-[540px]";
  }

  return "max-md:max-w-[272px] max-md:h-[408px]";
}

function resolveMobileScaleClass(mobileDisplayMaxWidth: number): string {
  if (mobileDisplayMaxWidth === WARDROBE_MOBILE_DISPLAY_MAX_WIDTH) {
    return "max-md:scale-[calc(360/420)]";
  }

  return "max-md:scale-[calc(272/420)]";
}

/**
 * Canonical LookCanvas parent chain — matches LookImagePanel view/edit framing.
 *
 * Always renders collage coordinates at exactly 420×630, then CSS-scales on
 * mobile. Desktop panel mode centers the fixed box inside the modal column.
 */
export function LookCanvasViewport({
  children,
  allowBleed = false,
  className = "",
  layout = "panel",
  mobileDisplayMaxWidth = LOOK_CANVAS_MOBILE_DISPLAY_MAX_WIDTH,
}: LookCanvasViewportProps) {
  const bleedClass = allowBleed
    ? "overflow-hidden md:overflow-visible"
    : "overflow-hidden";

  const mobileShellClass = resolveMobileShellClass(mobileDisplayMaxWidth);
  const mobileScaleClass = resolveMobileScaleClass(mobileDisplayMaxWidth);

  const desktopShellClass =
    layout === "standalone"
      ? "md:mx-auto md:overflow-hidden"
      : "md:flex md:h-full md:w-full md:items-center md:justify-center md:overflow-hidden";

  return (
    <LookCanvasLayoutProvider
      referenceWidth={LOOK_CANVAS_REFERENCE_WIDTH}
      referenceHeight={LOOK_CANVAS_REFERENCE_HEIGHT}
    >
      <div
        className={`relative mx-auto w-full overflow-hidden bg-ice-floor max-md:w-full md:overflow-visible ${mobileShellClass} ${desktopShellClass} ${className}`.trim()}
      >
        <div
          className={`overflow-hidden bg-ice-floor max-md:absolute max-md:left-1/2 max-md:top-0 max-md:-translate-x-1/2 max-md:origin-top ${mobileScaleClass} md:relative md:translate-x-0 md:scale-100 md:overflow-visible`}
          style={COORDINATE_SIZE_STYLE}
        >
          <div
            className={`relative shrink-0 ${bleedClass} md:origin-center`}
            style={COORDINATE_SIZE_STYLE}
          >
            <div
              className={`relative shrink-0 ${bleedClass}`}
              style={COORDINATE_SIZE_STYLE}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </LookCanvasLayoutProvider>
  );
}
