import sharp from "sharp";

/** Marketplace catalog canvas — matches product card 2:3. */
export const TR_MARKETPLACE_CANVAS_WIDTH = 1200;
export const TR_MARKETPLACE_CANVAS_HEIGHT = 1800;
/** Longest side of the cutout as a fraction of the canvas. */
export const TR_MARKETPLACE_SUBJECT_SCALE = 0.78;
/** Warm ground aligned with lookbook / marketplace cards. */
export const TR_MARKETPLACE_CANVAS_BG = { r: 243, g: 241, b: 236, alpha: 1 };

/**
 * Place a Photoroom (or other) cutout onto a fixed 2:3 canvas with consistent padding.
 */
export async function normalizeProductCutoutToCanvas(
  cutoutPng: Buffer,
): Promise<Buffer> {
  const subject = sharp(cutoutPng).rotate().ensureAlpha();
  const meta = await subject.metadata();
  const srcW = meta.width ?? 1;
  const srcH = meta.height ?? 1;

  const maxW = Math.round(TR_MARKETPLACE_CANVAS_WIDTH * TR_MARKETPLACE_SUBJECT_SCALE);
  const maxH = Math.round(TR_MARKETPLACE_CANVAS_HEIGHT * TR_MARKETPLACE_SUBJECT_SCALE);
  const scale = Math.min(maxW / srcW, maxH / srcH);
  const destW = Math.max(1, Math.round(srcW * scale));
  const destH = Math.max(1, Math.round(srcH * scale));
  const left = Math.round((TR_MARKETPLACE_CANVAS_WIDTH - destW) / 2);
  const top = Math.round((TR_MARKETPLACE_CANVAS_HEIGHT - destH) / 2);

  const resized = await subject
    .resize(destW, destH, { fit: "fill" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: TR_MARKETPLACE_CANVAS_WIDTH,
      height: TR_MARKETPLACE_CANVAS_HEIGHT,
      channels: 4,
      background: TR_MARKETPLACE_CANVAS_BG,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

export function isTrProductImageNormalizeEnabled(): boolean {
  const raw = process.env.TR_PRODUCT_IMAGE_NORMALIZE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}
