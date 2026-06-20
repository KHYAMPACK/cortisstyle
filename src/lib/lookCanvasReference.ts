/** Canonical look collage coordinate space — matches editor + committed JSON calibration. */
export const LOOK_CANVAS_REFERENCE_WIDTH = 420;

/** Look modal aspect ratio (width : height = 2 : 3). */
export const LOOK_CANVAS_REFERENCE_HEIGHT = Math.round(
  LOOK_CANVAS_REFERENCE_WIDTH * (3 / 2),
);

/** Mobile display cap — visual size after CSS scale (room for item list below). */
export const LOOK_CANVAS_MOBILE_DISPLAY_MAX_WIDTH = 272;

export const LOOK_CANVAS_MOBILE_SCALE =
  LOOK_CANVAS_MOBILE_DISPLAY_MAX_WIDTH / LOOK_CANVAS_REFERENCE_WIDTH;

export const LOOK_CANVAS_MOBILE_DISPLAY_HEIGHT = Math.round(
  LOOK_CANVAS_REFERENCE_HEIGHT * LOOK_CANVAS_MOBILE_SCALE,
);

export function resolveLookCanvasLayoutContainer(
  referenceWidth: number | null,
  rect: Pick<DOMRect, "width" | "height">,
): { width: number; height: number } {
  if (referenceWidth) {
    return {
      width: referenceWidth,
      height: Math.round(referenceWidth * (3 / 2)),
    };
  }

  return { width: rect.width, height: rect.height };
}

export function mapPointerToLayoutSpace(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  referenceWidth: number | null,
): { x: number; y: number } {
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  if (!referenceWidth || rect.width <= 0 || rect.height <= 0) {
    return { x: localX, y: localY };
  }

  const layoutHeight = referenceWidth * (3 / 2);

  return {
    x: (localX / rect.width) * referenceWidth,
    y: (localY / rect.height) * layoutHeight,
  };
}
