import type { CanvasItemLayout } from './canvas-layout'
import type { ClothingCategory } from './item'

export type HomepageOrderPlacement = 'prepend' | 'append'

/** Mirrors cortisstyle `DynamicLookJson` */
export interface DynamicLookJson {
  id: string
  title: string
  image: string
  modelName: string
  layout?: 'collage' | 'single-image'
  outfitId?: string
  editorGuideImage?: string
  vibe: string
  investmentRetail: number
  investmentWithGuide: number
  versatility: number
  width?: number
  height?: number
  homepageOrder?: HomepageOrderPlacement
  items: Array<{
    itemId: string
    coordinates: {
      from: { top: string; left: string }
      to: { top: string; left: string }
    }
  }>
  canvasLayouts?: Record<string, CanvasItemLayout>
}

/** Mirrors cortisstyle `DynamicItemsJson` */
export interface DynamicItemsJson {
  items: ExportClothingItem[]
}

export interface ExportClothingItem {
  id: string
  name: string
  category: ClothingCategory
  brand: string
  shopUrl: string
  displayModel?: string
  estPriceRange: string
  budgetAlternativeUrl: string
  canvasImage?: string
  defaultCanvasPosition?: {
    top: string
    left: string
    width: string
    zIndex: number
  }
}

export interface LookParameters {
  lookTitle: string
  modelName: string
  moodImageUrl: string | null
  homepageOrder: HomepageOrderPlacement
  vibe: string
  investmentRetail: number
  investmentWithGuide: number
  versatility: number
  outfitId: string
}

export const DEFAULT_LOOK_PARAMETERS: LookParameters = {
  lookTitle: '',
  modelName: '',
  moodImageUrl: null,
  homepageOrder: 'append',
  vibe: '',
  investmentRetail: 3,
  investmentWithGuide: 2,
  versatility: 3,
  outfitId: 'outfit-01',
}

export const DEFAULT_EST_PRICE_RANGE = 'Contact archive for pricing'
export const DEFAULT_BUDGET_ALTERNATIVE_URL = 'https://www.forever21.com/'
