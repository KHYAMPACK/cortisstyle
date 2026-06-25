export const CANVAS_BG_DEFAULT = "#FFFFFF";

export const CANVAS_BG_OPTIONS = [
  { value: "#FFFFFF", label: "Crisp White" },
  { value: "#0D0D0D", label: "Jet Black" },
  { value: "#E3EDF7", label: "Blueprint Ice" },
  { value: "#F4F6F8", label: "Editorial Gray" },
] as const;

export type CanvasBgValue = (typeof CANVAS_BG_OPTIONS)[number]["value"];

const DARK_CANVAS_VALUES = new Set<string>(["#0D0D0D", "#0d0d0d"]);

const CANVAS_BG_VALUES = new Set<string>(
  CANVAS_BG_OPTIONS.map((option) => option.value),
);

export function normalizeCanvasBg(value: unknown): CanvasBgValue {
  if (typeof value === "string" && CANVAS_BG_VALUES.has(value)) {
    return value as CanvasBgValue;
  }

  return CANVAS_BG_DEFAULT;
}

export function isDarkCanvasBackground(bg: string): boolean {
  const normalized = bg.trim();
  if (DARK_CANVAS_VALUES.has(normalized)) return true;

  const hex = normalized.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;

  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.2;
}
