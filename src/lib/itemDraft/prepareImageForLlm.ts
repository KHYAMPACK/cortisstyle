import sharp from "sharp";

const MAX_DIMENSION_PX = 1024;
const JPEG_QUALITY = 85;
const COMPRESS_IF_LARGER_THAN_BYTES = 280_000;

export interface PreparedLlmImage {
  base64: string;
  mimeType: string;
  compressed: boolean;
  originalBytes: number;
  preparedBytes: number;
}

/** Resize/compress large garment PNGs so Gemini uploads are reliable on slow networks. */
export async function prepareImageForLlm(
  buffer: Buffer,
  mimeType: string,
): Promise<PreparedLlmImage> {
  const originalBytes = buffer.length;
  const shouldCompress =
    originalBytes > COMPRESS_IF_LARGER_THAN_BYTES || mimeType !== "image/jpeg";

  if (!shouldCompress) {
    return {
      base64: buffer.toString("base64"),
      mimeType,
      compressed: false,
      originalBytes,
      preparedBytes: originalBytes,
    };
  }

  const prepared = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_DIMENSION_PX,
      height: MAX_DIMENSION_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return {
    base64: prepared.toString("base64"),
    mimeType: "image/jpeg",
    compressed: true,
    originalBytes,
    preparedBytes: prepared.length,
  };
}
