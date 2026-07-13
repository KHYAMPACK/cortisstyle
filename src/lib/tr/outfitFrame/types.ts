/**
 * Shared figure frame for stacking outfit cutouts (hero today; boutique scoop later).
 * Placement is by seam anchors — not garment length.
 */

export const OUTFIT_FRAME_WIDTH = 1200;
export const OUTFIT_FRAME_HEIGHT = 1800;

/** Roles the frame understands. Hero uses top + bottom; others are reserved. */
export type OutfitFrameRole =
  | "top"
  | "bottom"
  | "footwear"
  | "bag"
  | "accessory";

/**
 * Which edge of the trimmed garment bbox registers to a landmark.
 * - top: hem → waistY
 * - bottom: waistband → waistY
 * - footwear: sole → feetY (future)
 */
export type OutfitAnchorEdge = "bboxTop" | "bboxBottom";

export type OutfitRolePlacement = {
  role: OutfitFrameRole;
  /** Landmark Y as fraction of frame height (0–1). */
  landmarkY: number;
  anchorEdge: OutfitAnchorEdge;
  /** Max garment width as fraction of frame width. */
  maxWidthFraction: number;
  /** Max fraction of the vertical span available on the role's side of the landmark. */
  maxSpanFraction: number;
  zIndex: number;
  /** Whether this role is rendered in the hero slot mixer today. */
  heroEnabled: boolean;
};

/** Landmarks as fractions of frame height / width. */
export const OUTFIT_LANDMARKS = {
  /** Tee hem / waistband join. */
  waistY: 0.42,
  /**
   * Tiny visual gap each side of waistY (top pulls up, bottom pulls down).
   * ~1.2% total separation — seam stays readable without a big break.
   */
  seamGapY: 0.006,
  /** Future footwear sole line. */
  feetY: 0.92,
  centerX: 0.5,
  /** Future bag hang point (fraction of width from center). */
  hipOffsetX: 0.28,
} as const;

export const OUTFIT_ROLE_PLACEMENTS: Record<
  OutfitFrameRole,
  OutfitRolePlacement
> = {
  top: {
    role: "top",
    landmarkY: OUTFIT_LANDMARKS.waistY,
    anchorEdge: "bboxBottom",
    maxWidthFraction: 0.46,
    maxSpanFraction: 0.92,
    zIndex: 20,
    heroEnabled: true,
  },
  bottom: {
    role: "bottom",
    landmarkY: OUTFIT_LANDMARKS.waistY,
    anchorEdge: "bboxTop",
    maxWidthFraction: 0.44,
    maxSpanFraction: 0.94,
    zIndex: 10,
    heroEnabled: true,
  },
  footwear: {
    role: "footwear",
    landmarkY: OUTFIT_LANDMARKS.feetY,
    anchorEdge: "bboxBottom",
    maxWidthFraction: 0.36,
    maxSpanFraction: 0.85,
    zIndex: 15,
    heroEnabled: false,
  },
  bag: {
    role: "bag",
    landmarkY: OUTFIT_LANDMARKS.waistY,
    anchorEdge: "bboxTop",
    maxWidthFraction: 0.28,
    maxSpanFraction: 0.55,
    zIndex: 30,
    heroEnabled: false,
  },
  accessory: {
    role: "accessory",
    landmarkY: 0.28,
    anchorEdge: "bboxBottom",
    maxWidthFraction: 0.22,
    maxSpanFraction: 0.4,
    zIndex: 40,
    heroEnabled: false,
  },
};

/** Public URL prefix for locally imported (or later synced) hero cutouts. */
export const HERO_OUTFIT_PUBLIC_BASE = "/images/tr/hero";

export function heroOutfitPublicPath(
  role: OutfitFrameRole,
  filename: string,
): string {
  return `${HERO_OUTFIT_PUBLIC_BASE}/${role}/${filename}`;
}
