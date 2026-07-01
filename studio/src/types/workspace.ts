export interface ViewportState {
  panX: number
  panY: number
  zoom: number
}

export type IngestionStatus = 'idle' | 'processing' | 'error'

export const DEFAULT_VIEWPORT: ViewportState = {
  panX: 0,
  panY: 0,
  zoom: 1,
}

export const DEFAULT_SHOW_PLACEMENT_GUIDE = true

/** Photoroom segmentation on import — off for PNGs that already have transparency */
export const DEFAULT_REMOVE_BACKGROUND_ON_IMPORT = true

/** Default crisp white artboard — production site applies mix-blend-multiply per layer in CSS */
export const DEFAULT_CANVAS_BG = '#FFFFFF'
