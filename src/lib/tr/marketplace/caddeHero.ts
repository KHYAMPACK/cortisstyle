/**
 * Cadde campaign hero poses — two waist-up PhotoRoom cutouts (Ayla + Lila).
 * Try-on: `npm run tr:generate-cadde-hero`
 * Cutouts: `npm run tr:prepare-cadde-hero`
 */

import type { CaddeHeroTearId } from "@/lib/tr/marketplace/caddeHeroTear";

export const CADDE_HERO_POSE_LIMIT = 2;

/** Intact model hold after the intro lifts, before the paper rips. */
export const CADDE_HERO_RIP_HOLD_MS = 200;
/** Top-to-bottom page fold duration. */
export const CADDE_HERO_RIP_MS = 880;

export type CaddeHeroPose = {
  src: string;
  alt: string;
  href?: string;
  /** Extra shift right of center, e.g. "5vw". */
  shiftX?: string;
  /** Uniform scale from the bottom center. */
  scale?: number;
  /** Phone-only shift; falls back to a reduced `shiftX`. */
  mobileShiftX?: string;
  /** Phone-only scale from the bottom center. */
  mobileScale?: number;
  /** Phone-only figure box width (e.g. "132vw"); Ayla’s cutout is wider. */
  mobileWidth?: string;
  /** Cap paired with `mobileWidth`, e.g. "560px". */
  mobileWidthCap?: string;
  /** Two-line mobile slogan, split by the tear (red / white). */
  mobileHeadline?: readonly [string, string];
  /** Which torn-paper path to use. */
  tear?: CaddeHeroTearId;
};

/** Intact (left) side of the mobile slogan. Torn side is white. */
export const CADDE_HERO_SLOGAN_RED = "#E10600";

export const CADDE_HERO_CAMPAIGN_POSES: readonly CaddeHeroPose[] = [
  {
    src: "/images/tr/hero/campaign/pose-01-ayla.png",
    alt: "Ayla",
    shiftX: "5.5vw",
    scale: 1.14,
    mobileShiftX: "22vw",
    mobileScale: 1.26,
    mobileWidth: "132vw",
    mobileWidthCap: "560px",
    mobileHeadline: ["KENDI", "KOMBININ"],
    tear: "ayla",
  },
  {
    src: "/images/tr/hero/campaign/pose-02-lila.png",
    alt: "Lila",
    mobileHeadline: ["KENDI", "TARZIN"],
    tear: "lila",
  },
];

export function loadCaddeHeroPoses(): CaddeHeroPose[] {
  return CADDE_HERO_CAMPAIGN_POSES.slice(0, CADDE_HERO_POSE_LIMIT).map(
    (pose) => ({ ...pose }),
  );
}
