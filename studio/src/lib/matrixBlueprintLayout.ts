/** Mirrors cortisstyle `matrixBlueprintLayout.ts` — anatomical slot guide grid */

export type MatrixSlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const MATRIX_BLUEPRINT_LABELS: Record<MatrixSlotIndex, string> = {
  0: '[ EYEWEAR ]',
  1: '[ HAT ]',
  2: '[ ACC_HEAD ]',
  3: '[ OUTER ]',
  4: '[ TOP ]',
  5: '[ BAG ]',
  6: '[ FOOTWEAR ]',
  7: '[ BOTTOM ]',
  8: '[ WAIST ]',
}

export interface MatrixBlueprintCellLayout {
  slotIndex: MatrixSlotIndex
  heightClass: string
}

/** Asymmetric anatomical row spans — equal column widths on 420×630 */
export const MATRIX_BLUEPRINT_COLUMNS: MatrixBlueprintCellLayout[][] = [
  [
    { slotIndex: 0, heightClass: 'h-[80px] shrink-0' },
    { slotIndex: 3, heightClass: 'min-h-[220px] flex-1' },
    { slotIndex: 6, heightClass: 'min-h-0 flex-1' },
  ],
  [
    { slotIndex: 1, heightClass: 'h-[80px] shrink-0' },
    { slotIndex: 4, heightClass: 'min-h-[140px] flex-[1] shrink-0' },
    { slotIndex: 7, heightClass: 'min-h-0 flex-[2]' },
  ],
  [
    { slotIndex: 2, heightClass: 'h-[80px] shrink-0' },
    { slotIndex: 5, heightClass: 'min-h-[140px] flex-[1] shrink-0' },
    { slotIndex: 8, heightClass: 'min-h-0 flex-1' },
  ],
]
