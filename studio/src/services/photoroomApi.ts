import { upgradeImageUrl } from '../lib/imageIngestion'
import { postStudioIngestion } from '../lib/studioIngestionApi'

export interface SegmentPayload {
  file?: File | Blob
  imageUrl?: string
  filename?: string
}

export interface SegmentResult {
  blob: Blob
  objectUrl: string
}

/** Segment garment via cortisstyle Photoroom proxy (prod) or Vite dev proxy (local). */
export async function segmentGarment(
  payload: SegmentPayload,
  signal?: AbortSignal,
): Promise<SegmentResult> {
  const formData = new FormData()
  if (payload.file) {
    formData.append('image', payload.file, payload.filename ?? 'clipboard-asset.png')
  }
  if (payload.imageUrl) {
    formData.append('imageUrl', upgradeImageUrl(payload.imageUrl))
  }

  if (!payload.file && !payload.imageUrl) {
    throw new Error('No image file or URL provided')
  }

  const response = await postStudioIngestion('remove-bg', formData, signal)

  if (!response.ok) {
    const raw = await response.text().catch(() => response.statusText)
    const message =
      raw.includes('__next_error__') || raw.trimStart().startsWith('<!')
        ? `Segmentation server error (${response.status}). Check cortisstyle /api/studio/remove-bg logs.`
        : raw || `Segmentation failed (${response.status})`
    throw new Error(message)
  }

  const blob = await response.blob()
  return { blob, objectUrl: URL.createObjectURL(blob) }
}

export function loadImageDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Failed to load processed image'))
    img.src = url
  })
}

export function slugifyItemId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `item-${Date.now()}`
}
