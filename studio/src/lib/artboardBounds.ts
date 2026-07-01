import type { ArtboardItem } from '../types/item'
import { displayHeight } from './canvasLayout'
import { clampWidthPx } from './canvasLayout'
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  WIDTH_PX_MAX,
  WIDTH_PX_MIN,
} from './lookCanvasReference'

export interface ArtboardBounds {
  x: number
  y: number
  widthPx: number
}

/** Clamp width only — position may bleed off-canvas (negative % export values) */
export function sanitizeArtboardLayout(item: ArtboardItem): ArtboardItem {
  return {
    ...item,
    widthPx: clampWidthPx(item.widthPx),
  }
}

/** Place garment by center anchor; bounding box may extend outside 420×630 */
export function centerAnchorPlacement(
  naturalWidth: number,
  naturalHeight: number,
  centerX: number,
  centerY: number,
  widthPx: number,
): ArtboardBounds {
  const clampedWidth = Math.min(WIDTH_PX_MAX, Math.max(WIDTH_PX_MIN, Math.round(widthPx)))
  const height = clampedWidth * (naturalHeight / naturalWidth)
  return {
    widthPx: clampedWidth,
    x: centerX - clampedWidth / 2,
    y: centerY - height / 2,
  }
}

/** @deprecated Full perimeter clamp — use center-anchor + sanitize for editorial bleed */
export function clampArtboardBounds(
  item: Pick<ArtboardItem, 'naturalWidth' | 'naturalHeight'>,
  bounds: ArtboardBounds,
): ArtboardBounds {
  const height = displayHeight({
    widthPx: bounds.widthPx,
    naturalWidth: item.naturalWidth,
    naturalHeight: item.naturalHeight,
  })

  const widthPx = Math.min(
    WIDTH_PX_MAX,
    Math.max(WIDTH_PX_MIN, Math.round(bounds.widthPx)),
  )
  const maxX = Math.max(0, LOOK_CANVAS_REFERENCE_WIDTH - widthPx)
  const maxY = Math.max(0, LOOK_CANVAS_REFERENCE_HEIGHT - height)

  return {
    widthPx,
    x: Math.min(maxX, Math.max(0, bounds.x)),
    y: Math.min(maxY, Math.max(0, bounds.y)),
  }
}

export function clampArtboardItem(item: ArtboardItem): ArtboardItem {
  const clamped = clampArtboardBounds(item, {
    x: item.x,
    y: item.y,
    widthPx: item.widthPx,
  })
  return { ...item, ...clamped }
}

export function centerPlacement(
  naturalWidth: number,
  naturalHeight: number,
  dropX: number,
  dropY: number,
  widthPx: number,
): ArtboardBounds {
  return centerAnchorPlacement(naturalWidth, naturalHeight, dropX, dropY, widthPx)
}
