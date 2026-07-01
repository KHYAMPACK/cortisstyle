export type ClothingCategory =
  | 'tops'
  | 'bottoms'
  | 'waist'
  | 'outerwear'
  | 'shoes'
  | 'bags'
  | 'eyewear'
  | 'headwear'
  | 'accessories'

export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  'tops',
  'bottoms',
  'waist',
  'outerwear',
  'shoes',
  'bags',
  'eyewear',
  'headwear',
  'accessories',
]

export interface CatalogItemMetadata {
  name: string
  category: ClothingCategory
  brand: string
  shopUrl: string
  estPriceRange: string
  budgetAlternativeUrl: string
  rarityScore: number
  displayModel?: string
}

/** Metadata-only data node on the infinite canvas */
export interface StudioNode extends CatalogItemMetadata {
  id: string
  worldX: number
  worldY: number
}

/** Spatial visual instance on the 420×630 artboard */
export interface ArtboardItem {
  id: string
  imageUrl: string
  naturalWidth: number
  naturalHeight: number
  x: number
  y: number
  widthPx: number
  zIndex: number
}

export function defaultShopUrl(id: string): string {
  return `https://cortisstyle.com/shop/${id}`
}

export function defaultCanvasImagePath(outfitId: string, itemId: string): string {
  return `/images/clothes/${outfitId}/${itemId}.png`
}
