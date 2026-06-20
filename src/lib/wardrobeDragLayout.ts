import type { CanvasItemLayout } from "@/lib/canvasLayout";
import type { LayoutPositionOverride } from "@/types/wardrobe-builder";

export interface FreeDragPosition {
  top: string;
  left: string;
}

export function parseLayoutPercent(value: string): number {
  return Number.parseFloat(value.replace("%", "")) || 0;
}

export function formatLayoutPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value)).toFixed(2)}%`;
}

function clampOverridePercent(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

export function normalizeLayoutOverrides(
  raw: unknown,
): Record<string, LayoutPositionOverride> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const next: Record<string, LayoutPositionOverride> = {};

  for (const [itemId, value] of Object.entries(raw)) {
    if (!itemId || !value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const top = clampOverridePercent((value as LayoutPositionOverride).top);
    const left = clampOverridePercent((value as LayoutPositionOverride).left);

    if (top === null || left === null) continue;

    next[itemId] = { top, left };
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

export function dragPositionsToLayoutOverrides(
  positions: Record<string, FreeDragPosition>,
): Record<string, LayoutPositionOverride> {
  const next: Record<string, LayoutPositionOverride> = {};

  for (const [itemId, position] of Object.entries(positions)) {
    next[itemId] = {
      top: parseLayoutPercent(position.top),
      left: parseLayoutPercent(position.left),
    };
  }

  return next;
}

export function layoutOverridesToDragPositions(
  overrides: Record<string, LayoutPositionOverride>,
): Record<string, FreeDragPosition> {
  const next: Record<string, FreeDragPosition> = {};

  for (const [itemId, position] of Object.entries(overrides)) {
    next[itemId] = {
      top: formatLayoutPercent(position.top),
      left: formatLayoutPercent(position.left),
    };
  }

  return next;
}

export function mergeFreeDragPositions(
  layouts: Record<string, CanvasItemLayout>,
  overrides: Record<string, FreeDragPosition>,
): Record<string, CanvasItemLayout> {
  if (Object.keys(overrides).length === 0) return layouts;

  const next: Record<string, CanvasItemLayout> = { ...layouts };

  for (const [itemId, position] of Object.entries(overrides)) {
    const layout = next[itemId];
    if (!layout) continue;

    next[itemId] = {
      ...layout,
      top: position.top,
      left: position.left,
    };
  }

  return next;
}

export function mergeLayoutOverrides(
  layouts: Record<string, CanvasItemLayout>,
  overrides: Record<string, LayoutPositionOverride> | undefined,
  applyOverrides: boolean,
): Record<string, CanvasItemLayout> {
  if (!applyOverrides || !overrides || Object.keys(overrides).length === 0) {
    return layouts;
  }

  return mergeFreeDragPositions(
    layouts,
    layoutOverridesToDragPositions(overrides),
  );
}
