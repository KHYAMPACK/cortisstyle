import { committedCanvasLayouts } from "@/data/canvas-layouts";
import { isLocalhostClient } from "@/lib/dev";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import { MODEL_NAME_CANVAS_ID, MODEL_PORTRAIT_CANVAS_ID } from "@/types/canvas-layout";

export type { CanvasItemLayout } from "@/types/canvas-layout";
export {
  DEFAULT_MODEL_NAME_POSITION,
  DEFAULT_MODEL_PORTRAIT_POSITION,
  MODEL_NAME_CANVAS_ID,
  MODEL_PORTRAIT_CANVAS_ID,
} from "@/types/canvas-layout";

export function isTextLayerLayout(layout: CanvasItemLayout): boolean {
  return layout.fontSizePx !== undefined && layout.widthPx === undefined;
}

export function resolveHitboxDimensions(layout: CanvasItemLayout): {
  widthPx: number;
  heightPx: number;
} {
  const visualWidth = layout.widthPx ?? layout.hitboxWidthPx ?? 48;
  const widthPx = layout.hitboxWidthPx ?? visualWidth;
  const heightPx = layout.hitboxHeightPx ?? widthPx;

  return { widthPx, heightPx };
}

export function resolveHitboxOffset(layout: CanvasItemLayout): {
  topPx: number;
  leftPx: number;
} {
  return {
    topPx: layout.hitboxOffsetTopPx ?? 0,
    leftPx: layout.hitboxOffsetLeftPx ?? 0,
  };
}

export function getLayoutStorageKey(lookId: string): string {
  return `cortis-layout-${lookId}`;
}

export function loadCanvasLayoutsFromStorage(
  lookId: string,
): Record<string, CanvasItemLayout> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getLayoutStorageKey(lookId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, CanvasItemLayout>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCanvasLayoutsToStorage(
  lookId: string,
  layouts: Record<string, CanvasItemLayout>,
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(getLayoutStorageKey(lookId), JSON.stringify(layouts));
}

export function clearCanvasLayoutsFromStorage(lookId: string): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(getLayoutStorageKey(lookId));
}

export function resolveOutfitId(lookId: string, outfitId?: string): string {
  return outfitId ?? lookId.replace(/^look-/, "outfit-");
}

export function resolveModelPortraitPath(
  lookId: string,
  options?: { outfitId?: string; modelPortraitImage?: string },
): string {
  if (options?.modelPortraitImage) {
    return options.modelPortraitImage;
  }

  const folder = resolveOutfitId(lookId, options?.outfitId);
  return `/images/clothes/${folder}/model.png`;
}

export function resolveEditorGuideImagePath(
  lookId: string,
  options?: { outfitId?: string; editorGuideImage?: string },
): string {
  if (options?.editorGuideImage) {
    return options.editorGuideImage;
  }

  const folder = resolveOutfitId(lookId, options?.outfitId);
  return `/images/clothes/${folder}/combined.png`;
}

export function layoutFromDefaultPosition(
  position: {
    top: string;
    left: string;
    width: string;
    zIndex: number;
  },
  containerWidth: number,
): CanvasItemLayout {
  const widthPercent = Number.parseFloat(position.width.replace("%", ""));
  const widthPx = (widthPercent / 100) * containerWidth;

  return {
    top: position.top,
    left: position.left,
    widthPx: Math.round(widthPx),
    zIndex: position.zIndex,
  };
}

export function layoutFromTextPosition(position: {
  top: string;
  left: string;
  fontSizePx: number;
  zIndex: number;
}): CanvasItemLayout {
  return {
    top: position.top,
    left: position.left,
    fontSizePx: position.fontSizePx,
    zIndex: position.zIndex,
  };
}

export function buildInitialCanvasLayouts(
  items: Array<{
    id: string;
    defaultCanvasPosition?: {
      top: string;
      left: string;
      width: string;
      zIndex: number;
    };
  }>,
  containerWidth: number,
): Record<string, CanvasItemLayout> {
  return Object.fromEntries(
    items
      .filter((item) => item.defaultCanvasPosition)
      .map((item) => [
        item.id,
        layoutFromDefaultPosition(item.defaultCanvasPosition!, containerWidth),
      ]),
  );
}

function mergeStoredLayout(
  defaults: CanvasItemLayout,
  stored: CanvasItemLayout,
): CanvasItemLayout {
  return {
    ...defaults,
    top: stored.top ?? defaults.top,
    left: stored.left ?? defaults.left,
    widthPx: stored.widthPx ?? defaults.widthPx,
    fontSizePx: stored.fontSizePx ?? defaults.fontSizePx,
    hitboxWidthPx: stored.hitboxWidthPx ?? defaults.hitboxWidthPx,
    hitboxHeightPx: stored.hitboxHeightPx ?? defaults.hitboxHeightPx,
    hitboxOffsetTopPx: stored.hitboxOffsetTopPx ?? defaults.hitboxOffsetTopPx,
    hitboxOffsetLeftPx:
      stored.hitboxOffsetLeftPx ?? defaults.hitboxOffsetLeftPx,
    zIndex: stored.zIndex ?? defaults.zIndex,
  };
}

function mergeLayoutRecords(
  base: Record<string, CanvasItemLayout>,
  overlay: Record<string, CanvasItemLayout> | null | undefined,
): Record<string, CanvasItemLayout> {
  if (!overlay) return base;

  const merged: Record<string, CanvasItemLayout> = { ...base };

  for (const itemId of Object.keys(base)) {
    const stored = overlay[itemId];
    if (!stored) continue;
    merged[itemId] = mergeStoredLayout(base[itemId], stored);
  }

  for (const itemId of Object.keys(overlay)) {
    if (merged[itemId]) continue;
    merged[itemId] = overlay[itemId];
  }

  return merged;
}

export function resolveCanvasLayouts(
  lookId: string,
  items: Array<{
    id: string;
    defaultCanvasPosition?: {
      top: string;
      left: string;
      width: string;
      zIndex: number;
    };
  }>,
  containerWidth: number,
  options?: {
    modelPortrait?: {
      top: string;
      left: string;
      width: string;
      zIndex: number;
    };
    modelName?: {
      top: string;
      left: string;
      fontSizePx: number;
      zIndex: number;
    };
  },
): Record<string, CanvasItemLayout> {
  const defaults = buildInitialCanvasLayouts(items, containerWidth);

  if (options?.modelPortrait) {
    defaults[MODEL_PORTRAIT_CANVAS_ID] = layoutFromDefaultPosition(
      options.modelPortrait,
      containerWidth,
    );
  }

  if (options?.modelName) {
    defaults[MODEL_NAME_CANVAS_ID] = layoutFromTextPosition(options.modelName);
  }

  const committed = committedCanvasLayouts[lookId];
  let merged = mergeLayoutRecords(defaults, committed);

  // looks.ts controls model name unless Save to Codebase wrote __model-name__.
  if (options?.modelName && !committed?.[MODEL_NAME_CANVAS_ID]) {
    merged[MODEL_NAME_CANVAS_ID] = layoutFromTextPosition(options.modelName);
  }

  if (isLocalhostClient()) {
    merged = mergeLayoutRecords(merged, loadCanvasLayoutsFromStorage(lookId));
  }

  return merged;
}

export type CanvasMoveDirection = "up" | "down" | "left" | "right";

export function nudgeCanvasLayout(
  layout: CanvasItemLayout,
  direction: CanvasMoveDirection,
  stepPx: number,
  containerRect: DOMRect,
): Pick<CanvasItemLayout, "top" | "left"> {
  const topPct = Number.parseFloat(layout.top.replace("%", ""));
  const leftPct = Number.parseFloat(layout.left.replace("%", ""));

  const deltaTop = (stepPx / containerRect.height) * 100;
  const deltaLeft = (stepPx / containerRect.width) * 100;

  switch (direction) {
    case "up":
      return {
        top: `${(topPct - deltaTop).toFixed(2)}%`,
        left: layout.left,
      };
    case "down":
      return {
        top: `${(topPct + deltaTop).toFixed(2)}%`,
        left: layout.left,
      };
    case "left":
      return {
        top: layout.top,
        left: `${(leftPct - deltaLeft).toFixed(2)}%`,
      };
    case "right":
      return {
        top: layout.top,
        left: `${(leftPct + deltaLeft).toFixed(2)}%`,
      };
  }
}

export function nudgeHitboxLayout(
  layout: CanvasItemLayout,
  direction: CanvasMoveDirection,
  stepPx: number,
): Pick<CanvasItemLayout, "hitboxWidthPx" | "hitboxHeightPx"> {
  const { widthPx, heightPx } = resolveHitboxDimensions(layout);
  const minSize = 16;
  const maxSize = 800;

  switch (direction) {
    case "up":
      return {
        hitboxHeightPx: Math.max(minSize, Math.min(maxSize, heightPx - stepPx)),
      };
    case "down":
      return {
        hitboxHeightPx: Math.max(minSize, Math.min(maxSize, heightPx + stepPx)),
      };
    case "left":
      return {
        hitboxWidthPx: Math.max(minSize, Math.min(maxSize, widthPx - stepPx)),
      };
    case "right":
      return {
        hitboxWidthPx: Math.max(minSize, Math.min(maxSize, widthPx + stepPx)),
      };
  }
}

export function nudgeHitboxOffset(
  layout: CanvasItemLayout,
  direction: CanvasMoveDirection,
  stepPx: number,
): Pick<CanvasItemLayout, "hitboxOffsetTopPx" | "hitboxOffsetLeftPx"> {
  const { topPx, leftPx } = resolveHitboxOffset(layout);

  switch (direction) {
    case "up":
      return { hitboxOffsetTopPx: topPx - stepPx };
    case "down":
      return { hitboxOffsetTopPx: topPx + stepPx };
    case "left":
      return { hitboxOffsetLeftPx: leftPx - stepPx };
    case "right":
      return { hitboxOffsetLeftPx: leftPx + stepPx };
  }
}

export function formatHitboxWidth(layout: CanvasItemLayout): string {
  return `${resolveHitboxDimensions(layout).widthPx}px`;
}

export function formatHitboxHeight(layout: CanvasItemLayout): string {
  return `${resolveHitboxDimensions(layout).heightPx}px`;
}

export interface CanvasRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function parsePercentValue(value: string): number {
  return Number.parseFloat(value.replace("%", ""));
}

function pointInRect(x: number, y: number, rect: CanvasRect): boolean {
  return (
    x >= rect.left &&
    x <= rect.left + rect.width &&
    y >= rect.top &&
    y <= rect.top + rect.height
  );
}

export function getAssetAnchorPx(
  layout: CanvasItemLayout,
  container: { width: number; height: number },
): { top: number; left: number } {
  return {
    top: (parsePercentValue(layout.top) / 100) * container.height,
    left: (parsePercentValue(layout.left) / 100) * container.width,
  };
}

export function getHitboxRect(
  layout: CanvasItemLayout,
  container: { width: number; height: number },
): CanvasRect {
  const anchor = getAssetAnchorPx(layout, container);
  const offset = resolveHitboxOffset(layout);
  const hitbox = resolveHitboxDimensions(layout);

  return {
    top: anchor.top + offset.topPx,
    left: anchor.left + offset.leftPx,
    width: hitbox.widthPx,
    height: hitbox.heightPx,
  };
}

export function getVisualRect(
  layout: CanvasItemLayout,
  container: { width: number; height: number },
): CanvasRect | null {
  if (!layout.widthPx) return null;

  const anchor = getAssetAnchorPx(layout, container);

  return {
    top: anchor.top,
    left: anchor.left,
    width: layout.widthPx,
    height: layout.widthPx * 1.15,
  };
}

export function getTextRect(
  layout: CanvasItemLayout,
  label: string,
  container: { width: number; height: number },
): CanvasRect {
  const anchor = getAssetAnchorPx(layout, container);
  const fontSizePx = layout.fontSizePx ?? 11;

  return {
    top: anchor.top,
    left: anchor.left,
    width: Math.max(fontSizePx * 2, label.length * fontSizePx * 0.58),
    height: fontSizePx * 1.6,
  };
}

export interface CanvasHitTestEntry {
  id: string;
  zIndex: number;
  hitRect: CanvasRect;
  fallbackRect?: CanvasRect | null;
}

export function buildCanvasHitTestEntries(
  layouts: Record<string, CanvasItemLayout>,
  items: Array<{ id: string }>,
  modelName: string,
  options: {
    isEditMode: boolean;
    selectedItemId: string | null;
  },
  container: { width: number; height: number },
): CanvasHitTestEntry[] {
  const clothingIds = new Set(items.map((item) => item.id));
  const entries: CanvasHitTestEntry[] = [];

  for (const [id, layout] of Object.entries(layouts)) {
    const isClothing = clothingIds.has(id);
    const isModelPortrait = id === MODEL_PORTRAIT_CANVAS_ID;
    const isModelName = id === MODEL_NAME_CANVAS_ID;

    if (!options.isEditMode && !isClothing) {
      continue;
    }

    const zIndex =
      options.isEditMode && options.selectedItemId === id
        ? layout.zIndex + 1000
        : layout.zIndex;

    if (isModelName) {
      entries.push({
        id,
        zIndex,
        hitRect: getTextRect(layout, modelName, container),
      });
      continue;
    }

    if (layout.widthPx !== undefined) {
      entries.push({
        id,
        zIndex,
        hitRect: getHitboxRect(layout, container),
        fallbackRect: isClothing ? getVisualRect(layout, container) : null,
      });
      continue;
    }

    if (isModelPortrait) {
      entries.push({
        id,
        zIndex,
        hitRect: getHitboxRect(layout, container),
        fallbackRect: getVisualRect(layout, container),
      });
    }
  }

  return entries.sort((a, b) => b.zIndex - a.zIndex);
}

export function findTopmostAssetAtPoint(
  x: number,
  y: number,
  entries: CanvasHitTestEntry[],
): string | null {
  for (const entry of entries) {
    if (pointInRect(x, y, entry.hitRect)) {
      return entry.id;
    }

    if (entry.fallbackRect && pointInRect(x, y, entry.fallbackRect)) {
      return entry.id;
    }
  }

  return null;
}
