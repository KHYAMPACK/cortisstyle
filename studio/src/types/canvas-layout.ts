/** Production layout shape — mirrors cortisstyle `src/types/canvas-layout.ts` */

export interface CanvasItemLayout {
  top: string
  left: string
  widthPx?: number
  zIndex: number
  hitboxWidthPx?: number
  hitboxHeightPx?: number
  hitboxOffsetTopPx?: number
  hitboxOffsetLeftPx?: number
}

/** Committed look JSON: item id → layout */
export type LookCanvasLayoutMap = Record<string, CanvasItemLayout>
