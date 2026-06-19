export interface CanvasItemLayout {
  top: string;
  left: string;
  widthPx?: number;
  zIndex: number;
  hitboxWidthPx?: number;
  hitboxHeightPx?: number;
  hitboxOffsetTopPx?: number;
  hitboxOffsetLeftPx?: number;
}

/** Legacy editor ids — stripped from layout storage and hit testing. */
export const LEGACY_MODEL_LAYER_IDS = [
  "__model-portrait__",
  "__model-name__",
] as const;
