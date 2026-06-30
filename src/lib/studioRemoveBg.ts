import { getBgRemovalProvider } from "@/lib/bgRemovalConfig";
import { removeGarmentBackgroundLocal } from "@/lib/localBgRemoval";

const PHOTOROOM_SEGMENT_URL = "https://sdk.photoroom.com/v1/segment";

function getPhotoroomApiKey(): string {
  const apiKey = process.env.PHOTOROOM_API_KEY ?? process.env.VITE_PHOTOROOM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "PHOTOROOM_API_KEY is not configured. Set BG_REMOVAL_PROVIDER=local or add PHOTOROOM_API_KEY.",
    );
  }
  return apiKey;
}

async function removeGarmentBackgroundPhotoroom(params: {
  bytes: Buffer;
  filename: string;
  mimeType: string;
}): Promise<Buffer> {
  const formData = new FormData();
  formData.append(
    "image_file",
    new Blob([new Uint8Array(params.bytes)], { type: params.mimeType }),
    params.filename,
  );
  formData.append("crop", "true");
  formData.append("format", "png");

  const response = await fetch(PHOTOROOM_SEGMENT_URL, {
    method: "POST",
    headers: { "x-api-key": getPhotoroomApiKey() },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(detail || `Photoroom API error (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function removeGarmentBackground(params: {
  bytes: Buffer;
  filename: string;
  mimeType: string;
  signal?: AbortSignal;
}): Promise<Buffer> {
  if (getBgRemovalProvider() === "photoroom") {
    return removeGarmentBackgroundPhotoroom(params);
  }

  return removeGarmentBackgroundLocal(params.bytes, params.signal);
}

export async function fetchRemoteImageBuffer(
  imageUrl: string,
): Promise<{ bytes: Buffer; filename: string; mimeType: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image URL (${response.status})`);
  }

  const mimeType = response.headers.get("content-type") ?? "image/jpeg";
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    filename: "remote-asset.jpg",
    mimeType,
  };
}
