/**
 * Cadde (`/tr`) intro — photo-stack mask. Boutique custom-domain intro is separate.
 * Editorial OOTD frames already in /public; swap this list when we have a dedicated set.
 */
export const CADDE_INTRO_FRAMES = [
  {
    src: "/images/clothes/outfit-07/ootd281.png",
    rotate: -14,
    x: -10,
    y: 8,
  },
  {
    src: "/images/clothes/outfit-05/ootd279.png",
    rotate: 10,
    x: 12,
    y: -6,
  },
  {
    src: "/images/clothes/outfit-03/ootd237.png",
    rotate: -7,
    x: -4,
    y: -12,
  },
  {
    src: "/images/clothes/outfit-06/ootd266.png",
    rotate: 13,
    x: 8,
    y: 10,
  },
  {
    src: "/images/clothes/outfit-02/ootd236.png",
    rotate: -11,
    x: 2,
    y: -2,
  },
  {
    src: "/images/clothes/outfit-04/ootd278.png",
    rotate: 6,
    x: -8,
    y: 4,
  },
] as const;

export const CADDE_INTRO_WORD = {
  top: "CORTIS",
  bottom: "STYLE",
} as const;

export const CADDE_INTRO_LETTER_START_S = 0.72;
export const CADDE_INTRO_LETTER_STAGGER_S = 0.11;

export const CADDE_INTRO_PHOTO_IN_DELAY_S = 0.28;
export const CADDE_INTRO_PHOTO_IN_STAGGER_S = 0.16;
export const CADDE_INTRO_PHOTO_IN_DURATION_S = 0.55;

export const CADDE_INTRO_LETTER_OUT_STAGGER_S = 0.1;
export const CADDE_INTRO_LETTER_OUT_DURATION_S = 0.42;
export const CADDE_INTRO_PHOTO_OUT_STAGGER_S = 0.14;
export const CADDE_INTRO_PHOTO_OUT_DURATION_S = 0.5;

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
