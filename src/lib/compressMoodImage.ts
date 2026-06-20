/** Keep in sync with savedWardrobeOutfitDb sanitize limit. */
export const MAX_MOOD_IMAGE_URL_LENGTH = 400_000;

const MAX_DIMENSION_PX = 720;
const INITIAL_JPEG_QUALITY = 0.82;
const MIN_JPEG_QUALITY = 0.45;
const QUALITY_STEP = 0.08;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read mood image file."));
    };

    image.src = objectUrl;
  });
}

function drawScaledImage(
  image: HTMLImageElement,
  maxDimension: number,
): HTMLCanvasElement {
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight, 1),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

function encodeCanvasWithinLimit(canvas: HTMLCanvasElement): string {
  let quality = INITIAL_JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  while (
    dataUrl.length > MAX_MOOD_IMAGE_URL_LENGTH &&
    quality - QUALITY_STEP >= MIN_JPEG_QUALITY
  ) {
    quality -= QUALITY_STEP;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length <= MAX_MOOD_IMAGE_URL_LENGTH) {
    return dataUrl;
  }

  const reducedCanvas = document.createElement("canvas");
  reducedCanvas.width = Math.max(1, Math.round(canvas.width * 0.75));
  reducedCanvas.height = Math.max(1, Math.round(canvas.height * 0.75));

  const context = reducedCanvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  context.drawImage(canvas, 0, 0, reducedCanvas.width, reducedCanvas.height);
  return encodeCanvasWithinLimit(reducedCanvas);
}

export async function compressMoodImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Mood image must be an image file.");
  }

  const image = await loadImageFromFile(file);
  const canvas = drawScaledImage(image, MAX_DIMENSION_PX);
  return encodeCanvasWithinLimit(canvas);
}
