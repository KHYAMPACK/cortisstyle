import type { ClothingCategory } from '../types/item'

/** Layer constants — mirrors cortisstyle `canvasLayerStack.ts` */
export const CANVAS_LAYER_MOOD = 10
export const CANVAS_LAYER_BOTTOMS = 20
export const CANVAS_LAYER_WAIST = 21
export const CANVAS_LAYER_TOPS = 22
export const CANVAS_LAYER_OUTER = 25
export const CANVAS_LAYER_TOP = 30
export const CANVAS_LAYER_ACTIVE = 50

/** Bottom → top stacking for overlapping editorial collages */
const CATEGORY_Z_INDEX: Record<ClothingCategory, number> = {
  bottoms: CANVAS_LAYER_BOTTOMS,
  waist: CANVAS_LAYER_WAIST,
  tops: CANVAS_LAYER_TOPS,
  outerwear: CANVAS_LAYER_OUTER,
  shoes: CANVAS_LAYER_TOP,
  bags: CANVAS_LAYER_TOP,
  eyewear: CANVAS_LAYER_TOP,
  headwear: CANVAS_LAYER_TOP,
  accessories: CANVAS_LAYER_TOP,
}

export function zIndexForCategory(category: ClothingCategory): number {
  return CATEGORY_Z_INDEX[category]
}

export function bringToFrontZIndex(): number {
  return CANVAS_LAYER_ACTIVE
}

export function sendToBackZIndex(existing: number[]): number {
  if (existing.length === 0) return CANVAS_LAYER_MOOD - 1
  return Math.min(...existing) - 1
}
