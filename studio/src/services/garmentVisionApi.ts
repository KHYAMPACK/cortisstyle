import { postStudioIngestion } from '../lib/studioIngestionApi'
import type { ClothingCategory } from '../types/item'

export interface GarmentVisionResult {
  productName: string
  category: ClothingCategory
  brand: string
  itemId: string
}

export async function analyzeGarmentImage(
  imageBlob: Blob,
  signal?: AbortSignal,
): Promise<GarmentVisionResult> {
  const formData = new FormData()
  formData.append('image', imageBlob, 'garment.png')

  const response = await postStudioIngestion('analyze-garment', formData, signal)

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `Garment analysis failed (${response.status})`)
  }

  return (await response.json()) as GarmentVisionResult
}
