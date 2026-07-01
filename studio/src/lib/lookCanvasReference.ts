/** Canonical look card coordinate space — mirrors cortisstyle `lookCanvasReference.ts` */

export const LOOK_CANVAS_REFERENCE_WIDTH = 420
/** 2:3 garment area; % top/left are relative to this height (footer excluded). */
export const LOOK_CANVAS_REFERENCE_HEIGHT = Math.round(LOOK_CANVAS_REFERENCE_WIDTH * (3 / 2))
export const MOODBOARD_FOOTER_HEIGHT_PX = 56

/** Production hero export — 2:3, footer excluded */
export const LOOK_HERO_EXPORT_WIDTH = 1700
export const LOOK_HERO_EXPORT_HEIGHT = 2500

export const LOOK_CARD_EXPORT_WIDTH = LOOK_CANVAS_REFERENCE_WIDTH
/** Builder + coordinate space only — no moodboard footer */
export const LOOK_CARD_EXPORT_HEIGHT = LOOK_CANVAS_REFERENCE_HEIGHT

export const WIDTH_PX_MIN = 48
export const WIDTH_PX_MAX = 720
