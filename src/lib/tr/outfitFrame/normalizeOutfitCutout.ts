import sharp from "sharp";
import {
  OUTFIT_FRAME_HEIGHT,
  OUTFIT_FRAME_WIDTH,
  OUTFIT_ROLE_PLACEMENTS,
  type OutfitFrameRole,
} from "@/lib/tr/outfitFrame/types";

const ALPHA_TRIM_THRESHOLD = 12;

/**
 * Place a transparent cutout onto the shared outfit frame by role anchor.
 *
 * Shorts and pants both register waistband to waistY — length falls below the seam.
 * Same entry point can later accept boutique upload buffers (not only local files).
 */
export async function normalizeOutfitCutout(
  cutoutPng: Buffer,
  role: OutfitFrameRole,
): Promise<Buffer> {
  const placement = OUTFIT_ROLE_PLACEMENTS[role];
  const landmarkPx = Math.round(OUTFIT_FRAME_HEIGHT * placement.landmarkY);
  const maxW = Math.round(OUTFIT_FRAME_WIDTH * placement.maxWidthFraction);

  const trimmed = sharp(cutoutPng).rotate().ensureAlpha().trim({
    threshold: ALPHA_TRIM_THRESHOLD,
  });
  const { data: trimmedBuf, info } = await trimmed
    .png()
    .toBuffer({ resolveWithObject: true });

  const srcW = Math.max(1, info.width);
  const srcH = Math.max(1, info.height);

  const availableSpan =
    placement.anchorEdge === "bboxBottom"
      ? landmarkPx
      : OUTFIT_FRAME_HEIGHT - landmarkPx;
  const maxH = Math.max(
    1,
    Math.round(availableSpan * placement.maxSpanFraction),
  );

  const scale = Math.min(maxW / srcW, maxH / srcH);
  const destW = Math.max(1, Math.round(srcW * scale));
  const destH = Math.max(1, Math.round(srcH * scale));
  const left = Math.round((OUTFIT_FRAME_WIDTH - destW) / 2);
  const top =
    placement.anchorEdge === "bboxBottom"
      ? landmarkPx - destH
      : landmarkPx;

  const resized = await sharp(trimmedBuf)
    .resize(destW, destH, { fit: "fill" })
    .png()
    .toBuffer();

  // Clamp if floating-point rounding pushed past canvas
  const safeTop = Math.max(0, Math.min(top, OUTFIT_FRAME_HEIGHT - destH));
  const safeLeft = Math.max(0, Math.min(left, OUTFIT_FRAME_WIDTH - destW));

  return sharp({
    create: {
      width: OUTFIT_FRAME_WIDTH,
      height: OUTFIT_FRAME_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left: safeLeft, top: safeTop }])
    .png()
    .toBuffer();
}
