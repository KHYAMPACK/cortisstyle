/** Boutique panel accent helpers — soft/deep tints from primary hex. */

const DEFAULT_ACCENT = "#C2185B";

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(raw)) return null;
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => clamp(v).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mix(
  hex: string,
  toward: { r: number; g: number; b: number },
  amount: number,
): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return toHex(
    rgb.r + (toward.r - rgb.r) * amount,
    rgb.g + (toward.g - rgb.g) * amount,
    rgb.b + (toward.b - rgb.b) * amount,
  );
}

export function normalizePanelAccent(hex: string | null | undefined): string {
  const parsed = parseHex(hex ?? "");
  return parsed ? toHex(parsed.r, parsed.g, parsed.b) : DEFAULT_ACCENT;
}

export function panelAccentCssVars(hex: string | null | undefined): {
  "--panel-accent": string;
  "--panel-accent-soft": string;
  "--panel-accent-softer": string;
  "--panel-accent-deep": string;
  "--panel-accent-border": string;
} {
  const accent = normalizePanelAccent(hex);
  return {
    "--panel-accent": accent,
    "--panel-accent-soft": mix(accent, { r: 255, g: 255, b: 255 }, 0.82),
    "--panel-accent-softer": mix(accent, { r: 255, g: 255, b: 255 }, 0.92),
    "--panel-accent-deep": mix(accent, { r: 0, g: 0, b: 0 }, 0.28),
    "--panel-accent-border": mix(accent, { r: 255, g: 255, b: 255 }, 0.55),
  };
}

/** Demo storefront KPIs when the boutique has no live revenue yet. */
export const PANEL_DEMO_TODAY = {
  orderCount: 3,
  revenueKurus: 485_000,
  pendingFulfillment: 2,
} as const;
