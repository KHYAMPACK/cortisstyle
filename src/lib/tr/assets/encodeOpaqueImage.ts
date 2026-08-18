import sharp from "sharp";

export const STOREFRONT_WEBP_QUALITY = 80;
export const STOREFRONT_JPEG_QUALITY = 85;
export const STOREFRONT_MAX_EDGE_PX = 1600;
export const ORIGINAL_MAX_EDGE_PX = 2400;

/**
 * Opaque WebP for boutique/panel display. JPEG fallback if WebP encode fails.
 * Does not preserve alpha — use PNG for marketplace cutouts.
 */
export async function encodeOpaqueWebp(
  input: Buffer,
  maxEdgePx = STOREFRONT_MAX_EDGE_PX,
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
      .webp({ quality: STOREFRONT_WEBP_QUALITY })
      .toBuffer();
    return { bytes, contentType: "image/webp" };
  } catch {
    const bytes = await sharp(resized)
      .jpeg({ quality: STOREFRONT_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return { bytes, contentType: "image/jpeg" };
  }
}
