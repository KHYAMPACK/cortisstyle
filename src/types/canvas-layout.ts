export interface CanvasItemLayout {
  top: string;
  left: string;
  widthPx?: number;
  fontSizePx?: number;
  zIndex: number;
  hitboxWidthPx?: number;
  hitboxHeightPx?: number;
  hitboxOffsetTopPx?: number;
  hitboxOffsetLeftPx?: number;
}

export const MODEL_PORTRAIT_CANVAS_ID = "__model-portrait__";
export const MODEL_NAME_CANVAS_ID = "__model-name__";

export const DEFAULT_MODEL_PORTRAIT_POSITION = {
  top: "6%",
  left: "52%",
  width: "42%",
  zIndex: 0,
} as const;

export const DEFAULT_MODEL_NAME_POSITION = {
  top: "72%",
  left: "52%",
  fontSizePx: 11,
  zIndex: 1,
} as const;
