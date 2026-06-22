/** Canonical collage coordinate width — matches editor + committed JSON calibration. */
export const LOOK_CANVAS_REFERENCE_WIDTH = 420;

/** Look modal + wardrobe builder aspect ratio (width : height = 2 : 3). */
export const LOOK_CANVAS_REFERENCE_HEIGHT = Math.round(
  LOOK_CANVAS_REFERENCE_WIDTH * (3 / 2),
);

/** @deprecated Use LOOK_CANVAS_REFERENCE_HEIGHT — wardrobe now shares 2:3 with the editor. */
export const WARDROBE_CANVAS_REFERENCE_HEIGHT = LOOK_CANVAS_REFERENCE_HEIGHT;

/** Mobile display caps after CSS scale. */
export const LOOK_CANVAS_MOBILE_DISPLAY_MAX_WIDTH = 272;
export const WARDROBE_MOBILE_DISPLAY_MAX_WIDTH = 360;

export const LOOK_CANVAS_MOBILE_SCALE =
  LOOK_CANVAS_MOBILE_DISPLAY_MAX_WIDTH / LOOK_CANVAS_REFERENCE_WIDTH;

export const WARDROBE_MOBILE_SCALE =
  WARDROBE_MOBILE_DISPLAY_MAX_WIDTH / LOOK_CANVAS_REFERENCE_WIDTH;

export const LOOK_CANVAS_MOBILE_DISPLAY_HEIGHT = Math.round(
  LOOK_CANVAS_REFERENCE_HEIGHT * LOOK_CANVAS_MOBILE_SCALE,
);

export const WARDROBE_MOBILE_DISPLAY_HEIGHT = Math.round(
  LOOK_CANVAS_REFERENCE_HEIGHT * WARDROBE_MOBILE_SCALE,
);

export interface CanvasLayoutReference {
  width: number;
  height: number;
}

export function resolveLookCanvasLayoutContainer(
  reference: CanvasLayoutReference | null,
  rect: Pick<DOMRect, "width" | "height">,
): { width: number; height: number } {
  if (reference) {
    return { width: reference.width, height: reference.height };
  }

  return { width: rect.width, height: rect.height };
}

export function mapPointerToLayoutSpace(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  reference: CanvasLayoutReference | null,
): { x: number; y: number } {
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  if (!reference || rect.width <= 0 || rect.height <= 0) {
    return { x: localX, y: localY };
  }

  return {
    x: (localX / rect.width) * reference.width,
    y: (localY / rect.height) * reference.height,
  };
}
