import type { CanvasItemLayout, LookCanvasLayoutMap } from '../types/canvas-layout'
import type { ArtboardItem } from '../types/item'
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  WIDTH_PX_MAX,
  WIDTH_PX_MIN,
} from './lookCanvasReference'

export function clampWidthPx(value: number): number {
  return Math.min(WIDTH_PX_MAX, Math.max(WIDTH_PX_MIN, Math.round(value)))
}

export function displayHeight(
  item: Pick<ArtboardItem, 'widthPx' | 'naturalWidth' | 'naturalHeight'>,
): number {
  if (item.naturalWidth <= 0) return item.widthPx
  return item.widthPx * (item.naturalHeight / item.naturalWidth)
}

/**
 * Top-left pixel anchor on 420×630 → production `CanvasItemLayout`.
 * Matches cortisstyle `CollageStudioLayer` (`top`/`left` %, `widthPx` on 420 baseline).
 */
export function pixelToLayout(
  x: number,
  y: number,
  widthPx: number,
  zIndex: number,
): CanvasItemLayout {
  return {
    top: `${((y / LOOK_CANVAS_REFERENCE_HEIGHT) * 100).toFixed(2)}%`,
    left: `${((x / LOOK_CANVAS_REFERENCE_WIDTH) * 100).toFixed(2)}%`,
    widthPx: clampWidthPx(widthPx),
    zIndex,
  }
}

/**
 * Full layout for cortis import — hitbox matches the visible PNG bounds (zero offset).
 * Our Fabric selection rect uses the same box; cortis defaults are wrong without these fields.
 */
export function artboardItemToCanvasLayout(item: ArtboardItem): CanvasItemLayout {
  const layout = pixelToLayout(item.x, item.y, item.widthPx, item.zIndex)
  const hitboxHeightPx = Math.round(displayHeight(item))
  return {
    ...layout,
    hitboxWidthPx: layout.widthPx,
    hitboxHeightPx,
    hitboxOffsetTopPx: 0,
    hitboxOffsetLeftPx: 0,
  }
}

export function layoutToPixel(layout: CanvasItemLayout): {
  x: number
  y: number
  widthPx: number
} {
  const leftPct = parseFloat(layout.left.replace('%', ''))
  const topPct = parseFloat(layout.top.replace('%', ''))
  return {
    x: (leftPct / 100) * LOOK_CANVAS_REFERENCE_WIDTH,
    y: (topPct / 100) * LOOK_CANVAS_REFERENCE_HEIGHT,
    widthPx: layout.widthPx ?? WIDTH_PX_MIN,
  }
}

/** Compile artboard state → look-XX.json map keyed by item id */
export function compileLookLayoutMap(items: ArtboardItem[]): LookCanvasLayoutMap {
  const map: LookCanvasLayoutMap = {}
  for (const item of items) {
    map[item.id] = artboardItemToCanvasLayout(item)
  }
  return map
}

export function formatLookLayoutJson(items: ArtboardItem[]): string {
  return JSON.stringify(compileLookLayoutMap(items), null, 2)
}

/** Default spawn width — ~76% of artboard; closer to Pinterest product hero scale */
const DEFAULT_SPAWN_WIDTH_PX = 320

export function initialPlacementWidth(naturalWidth: number): number {
  return clampWidthPx(Math.min(naturalWidth, DEFAULT_SPAWN_WIDTH_PX))
}
