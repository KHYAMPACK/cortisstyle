/**
 * Cadde (`/tr`) intro — photo-stack mask. Boutique custom-domain intro is separate.
 * Dedicated JPEGs (regenerate with `node scripts/optimize-cadde-intro-images.mjs`).
 * Do not point the loader at lookbook PNGs — they stall reverse motion.
 */
export const CADDE_INTRO_FRAMES = [
  {
    src: "/images/tr/intro/stack-01.jpg",
    rotate: -14,
    x: -10,
    y: 8,
  },
  {
    src: "/images/tr/intro/stack-02.jpg",
    rotate: 10,
    x: 12,
    y: -6,
  },
  {
    src: "/images/tr/intro/stack-03.jpg",
    rotate: -7,
    x: -4,
    y: -12,
  },
  {
    src: "/images/tr/intro/stack-04.jpg",
    rotate: 13,
    x: 8,
    y: 10,
  },
  {
    src: "/images/tr/intro/stack-05.jpg",
    rotate: -11,
    x: 2,
    y: -2,
  },
  {
    src: "/images/tr/intro/stack-06.jpg",
    rotate: 6,
    x: -8,
    y: 4,
  },
] as const;

export const CADDE_INTRO_WORD = {
  top: "CORTIS",
  bottom: "STYLE",
} as const;

export const CADDE_INTRO_LETTER_START_S = 0.48;
export const CADDE_INTRO_LETTER_STAGGER_S = 0.08;

export const CADDE_INTRO_PHOTO_IN_DELAY_S = 0.18;
export const CADDE_INTRO_PHOTO_IN_STAGGER_S = 0.11;
export const CADDE_INTRO_PHOTO_IN_DURATION_S = 0.4;

export const CADDE_INTRO_LETTER_OUT_STAGGER_S = 0.045;
export const CADDE_INTRO_LETTER_OUT_DURATION_S = 0.22;
export const CADDE_INTRO_PHOTO_OUT_STAGGER_S = 0.055;
export const CADDE_INTRO_PHOTO_OUT_DURATION_S = 0.26;

/** Overlay hold before reverse — counter reaches 100 in this window. */
export const CADDE_INTRO_HOLD_MS = 2800;
export const CADDE_INTRO_REDUCED_MOTION_MS = 1000;
export const CADDE_INTRO_SLIDE_MS = 560;

const CADDE_INTRO_LETTER_COUNT =
  CADDE_INTRO_WORD.top.length + CADDE_INTRO_WORD.bottom.length;

/** Time for letters + photos to reverse before the overlay lifts. */
export function caddeIntroReverseMs(): number {
  const letters =
    (CADDE_INTRO_LETTER_COUNT - 1) * CADDE_INTRO_LETTER_OUT_STAGGER_S +
    CADDE_INTRO_LETTER_OUT_DURATION_S;
  const photos =
    (CADDE_INTRO_FRAMES.length - 1) * CADDE_INTRO_PHOTO_OUT_STAGGER_S +
    CADDE_INTRO_PHOTO_OUT_DURATION_S;
  return Math.ceil(Math.max(letters, photos) * 1000) + 80;
}
