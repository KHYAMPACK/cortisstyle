/** Home studio tease — plus aperture + torn lip into the footer. */

export const CADDE_PLUS_REVEAL_ID = "kendi-kombin";

/** Resting plus size in vmin — large enough to read as a mark, not a glyph. */
export const CADDE_PLUS_ARM_VMIN = 22;
export const CADDE_PLUS_BAR_VMIN = 3.1;
export const CADDE_PLUS_GROW_VMIN = 320;

/** Ice-floor fill for the paper sheet / torn lip — keep in sync with `--ice-floor`. */
export const CADDE_PLUS_SHEET = "#f4f6f8";

/**
 * Horizontal torn-paper path (viewBox 0 0 1000 48).
 * Integer noise only so SSR and the client match.
 */
export function caddePlusTearPath(): string {
  const steps = 52;
  let d = "M0 48";
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * 1000;
    const t = Math.imul(i * 17 + 91, 0x9e3779b9) >>> 0;
    const n = t / 4294967296;
    const y = 5 + n * 16 + (i % 5 === 0 ? 5 : 0);
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  d += " L1000 48 Z";
  return d;
}
