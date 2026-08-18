import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { encodeOpaqueWebp } from "@/lib/tr/assets/encodeOpaqueImage";
import { getCatalogBackground } from "@/lib/tr/catalogBackgrounds/registry";

const SOLID_RGB: Record<string, { r: number; g: number; b: number }> = {
  "studio-white": { r: 255, g: 255, b: 255 },
  "soft-ivory": { r: 247, g: 243, b: 235 },
  "cool-gray": { r: 232, g: 234, b: 237 },
  "warm-sand": { r: 232, g: 223, b: 208 },
  "soft-sage": { r: 228, g: 235, b: 228 },
  blush: { r: 246, g: 232, b: 236 },
  dawn: { r: 239, g: 228, b: 216 },
  linen: { r: 232, g: 220, b: 200 },
  slate: { r: 58, g: 64, b: 70 },
  cutout: { r: 255, g: 255, b: 255 },
};

async function rasterBackground(
  backgroundId: string,
  width: number,
  height: number,
): Promise<Buffer> {
  if (backgroundId === "concrete" || backgroundId === "wood") {
    const filePath = path.join(
      process.cwd(),
      "public",
      "tr",
      "catalog-bg",
      `${backgroundId}.webp`,
    );
    try {
      const file = await readFile(filePath);
      return sharp(file)
        .resize(width, height, { fit: "cover", position: "centre" })
        .toBuffer();
    } catch {
      // fall through to solid
    }
  }

  if (backgroundId === "dawn" || backgroundId === "slate" || backgroundId === "linen") {
    const svg =
      backgroundId === "dawn"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stop-color="#FBF6F0"/>
        <stop offset="55%" stop-color="#EFE4D8"/>
        <stop offset="100%" stop-color="#E8D5C8"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`
        : backgroundId === "slate"
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#4A4F55"/>
        <stop offset="45%" stop-color="#2F343A"/>
        <stop offset="100%" stop-color="#3A4046"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#F3EBDD"/>
        <stop offset="100%" stop-color="#E8DCC8"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  const rgb = SOLID_RGB[backgroundId] ?? SOLID_RGB["studio-white"]!;
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: rgb,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Composite a transparent (or opaque) packshot onto the product catalog
 * background and encode WebP for boutique storefront.
 */
export async function flattenCutoutToStorefrontWebp(params: {
  cutout: Buffer;
  backgroundId: string | null | undefined;
}): Promise<{ bytes: Buffer; contentType: "image/webp" | "image/jpeg" }> {
  const rotated = sharp(params.cutout).rotate();
  const meta = await rotated.metadata();
  const width = Math.max(1, meta.width ?? 1);
  const height = Math.max(1, meta.height ?? 1);
  const hasAlpha = meta.hasAlpha === true;
  const png = await rotated.ensureAlpha().png().toBuffer();
  const bgId = getCatalogBackground(params.backgroundId).id;

  if (!hasAlpha) {
    return encodeOpaqueWebp(png);
  }

  const background = await rasterBackground(bgId, width, height);
  const flattened = await sharp(background)
    .composite([{ input: png }])
    .png()
    .toBuffer();

  return encodeOpaqueWebp(flattened);
}
