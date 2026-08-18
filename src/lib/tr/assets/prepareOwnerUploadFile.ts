/** Soft cap before hitting Next/Vercel request body limits (~4.5–10MB). */
const COMPRESS_IF_LARGER_THAN_BYTES = 1 * 1024 * 1024;
const MAX_EDGE_PX = 2400;
const JPEG_QUALITY = 0.85;

/**
 * Downscale large phone photos in the browser so `/api/tr/owner/upload`
 * does not hit HTTP 413 before the route runs.
 */
export async function prepareOwnerUploadFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= COMPRESS_IF_LARGER_THAN_BYTES) return file;

  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "product";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
