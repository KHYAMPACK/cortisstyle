const PHOTOROOM_SEGMENT_URL = "https://sdk.photoroom.com/v1/segment";

export function isPhotoroomConfigured(): boolean {
  const apiKey =
    process.env.PHOTOROOM_API_KEY?.trim() ||
    process.env.VITE_PHOTOROOM_API_KEY?.trim();
  return Boolean(apiKey);
}

function getPhotoroomApiKey(): string {
  const apiKey =
    process.env.PHOTOROOM_API_KEY?.trim() ||
    process.env.VITE_PHOTOROOM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PHOTOROOM_API_KEY is not configured on the server.");
  }
  return apiKey;
}

export async function removeGarmentBackground(params: {
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
