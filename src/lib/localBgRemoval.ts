import { rmbg, createBriaaiModel, type RMBGModel } from "rmbg";
import sharp from "sharp";

let briaaiModel: RMBGModel | null = null;

function getBriaaiModel(): RMBGModel {
  if (!briaaiModel) {
    briaaiModel = createBriaaiModel();
  }
  return briaaiModel;
}

async function trimTransparentPng(png: Buffer): Promise<Buffer> {
  return sharp(png).trim().png().toBuffer();
}

/** Bria RMBG @ 1024px — highest quality model in the `rmbg` SDK */
export async function removeGarmentBackgroundLocal(
  buffer: Buffer,
  signal?: AbortSignal,
): Promise<Buffer> {
  const abortController = new AbortController();

  if (signal?.aborted) {
    throw new Error("Background removal aborted");
  }

  const onAbort = () => abortController.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const matted = await rmbg(buffer, {
      model: getBriaaiModel(),
      maxResolution: 2048,
      abortController,
    });

    return trimTransparentPng(matted);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
