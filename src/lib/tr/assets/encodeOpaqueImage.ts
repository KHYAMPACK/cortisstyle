import sharp from "sharp";

export const OPAQUE_WEBP_QUALITY = 95;
/** Leftover alias — same as OPAQUE_WEBP_QUALITY. */
export const STOREFRONT_WEBP_QUALITY = OPAQUE_WEBP_QUALITY;
export const STOREFRONT_JPEG_QUALITY = 90;
export const STOREFRONT_MAX_EDGE_PX = 1600;
export const ORIGINAL_MAX_EDGE_PX = 2400;

/**
 * Opaque WebP for hanger originals and on-model shots.
 * Default max edge is ORIGINAL_MAX_EDGE_PX (2400) — do not use the old
 * 1600 storefront cap here. Marketplace cutouts stay PNG.
 */
export async function encodeOpaqueWebp(
  input: Buffer,
  maxEdgePx = ORIGINAL_MAX_EDGE_PX,
): Promise<{ bytes: Buffer; contentType: "image/webp" | "image/jpeg" }> {
  const pipeline = sharp(input)
    .rotate()
    .resize(maxEdgePx, maxEdgePx, {
      fit: "inside",
      withoutEnlargement: true,
    });

  const resized = await pipeline.toBuffer();

  try {
    const bytes = await sharp(resized)
      .webp({ quality: OPAQUE_WEBP_QUALITY })
      .toBuffer();
    return { bytes, contentType: "image/webp" };
  } catch {
    const bytes = await sharp(resized)
      .jpeg({ quality: STOREFRONT_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return { bytes, contentType: "image/jpeg" };
  }
}
