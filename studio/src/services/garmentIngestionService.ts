import { uploadBlobAsset } from '../lib/studioApi'
import { useWorkspaceStore } from '../store/workspaceStore'
import { uniqueItemId } from '../lib/uniqueItemId'
import { nextNodeWorldPosition } from '../lib/linkedGarment'
import {
  ingestPayloadLabel,
  resolveIngestImageBlob,
  type IngestImagePayload,
} from '../lib/imageIngestion'
import type { ClothingCategory } from '../types/item'
import { hashSourceBytes } from '../lib/sourceImageHash'
import {
  lookupImportCache,
  registerImportCache,
  type StudioImportPipeline,
} from '../lib/studioImportCacheApi'
import { notifyImportCacheUpdated, placeGarmentFromCacheRecord } from '../lib/placeGarmentFromCache'
import { loadImageDimensions, segmentGarment, slugifyItemId } from './photoroomApi'
import { analyzeGarmentImage } from './garmentVisionApi'

function toSegmentPayload(payload: IngestImagePayload) {
  if (payload.kind === 'file') {
    return {
      file: payload.file,
      filename: payload.file.name,
    }
  }
  return { imageUrl: payload.imageUrl }
}

function sourceMetadata(payload: IngestImagePayload): {
  sourceUrl: string | null
  sourceFilename: string | null
} {
  if (payload.kind === 'file') {
    return {
      sourceUrl: null,
      sourceFilename: payload.file.name || null,
    }
  }

  return {
    sourceUrl: payload.imageUrl,
    sourceFilename: null,
  }
}

function spawnFromIngestion(params: {
  id: string
  imageUrl: string
  width: number
  height: number
  name?: string
  category?: ClothingCategory
  brand?: string
}): void {
  const nodes = useWorkspaceStore.getState().studioNodes
  const { worldX, worldY } = nextNodeWorldPosition(nodes)

  useWorkspaceStore.getState().spawnLinkedTwin({
    id: params.id,
    imageUrl: params.imageUrl,
    naturalWidth: params.width,
    naturalHeight: params.height,
    worldX,
    worldY,
    name: params.name,
    category: params.category,
    brand: params.brand,
  })
}

export async function runGarmentIngestion(
  payload: IngestImagePayload,
  signal?: AbortSignal,
): Promise<void> {
  const { setIngestionStatus, removeBackgroundOnImport } = useWorkspaceStore.getState()
  const pipeline: StudioImportPipeline = removeBackgroundOnImport ? 'segmented' : 'raw'

  setIngestionStatus('processing', null, 'Checking import archive…')

  const source = await resolveIngestImageBlob(payload, signal)
  const sourceHash = await hashSourceBytes(source.blob)

  let cached: StudioImportCacheRecord | null = null

  try {
    cached = await lookupImportCache(sourceHash, pipeline)
  } catch (error) {
    console.warn('[garment-ingestion] import cache lookup skipped:', error)
  }

  if (cached) {
    setIngestionStatus('processing', null, 'Reused archived cutout')
    placeGarmentFromCacheRecord(cached)
    notifyImportCacheUpdated()
    setIngestionStatus('idle', null, `Reused ${ingestPayloadLabel(payload)}`)
    return
  }

  const existingIds = new Set(useWorkspaceStore.getState().studioNodes.map((node) => node.id))

  let objectUrl = source.objectUrl
  let blob = source.blob

  if (removeBackgroundOnImport) {
    setIngestionStatus('processing', null, 'Removing background…')
    const segmented = await segmentGarment(toSegmentPayload(payload), signal)
    objectUrl = segmented.objectUrl
    blob = segmented.blob
  }

  const { width, height } = await loadImageDimensions(objectUrl)

  let id = uniqueItemId(`draft-${Date.now()}`, existingIds)
  let name: string | undefined
  let category: ClothingCategory | undefined
  let brand: string | undefined

  try {
    setIngestionStatus('processing', null, 'Gemini — identifying garment…')
    const analysis = await analyzeGarmentImage(blob, signal)
    id = uniqueItemId(analysis.itemId || analysis.productName, existingIds)
    name = analysis.productName
    category = analysis.category
    brand = analysis.brand || undefined
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Garment analysis failed'
    console.warn('[garment-ingestion] Gemini labeling skipped:', message)
    id = uniqueItemId(slugifyItemId(`draft-${Date.now()}`), existingIds)
  }

  let imageUrl = objectUrl
  let storagePath: string | null = null

  try {
    setIngestionStatus('processing', null, 'Uploading garment to archive…')
    const uploaded = await uploadBlobAsset({
      blob,
      itemId: id,
      fileName: `${id}.png`,
      library: { sourceHash, pipeline },
    })
    imageUrl = uploaded.url
    storagePath = uploaded.path
  } catch (error) {
    console.warn('[garment-ingestion] CDN upload skipped:', error)
  }

  if (storagePath) {
    const meta = sourceMetadata(payload)

    try {
      await registerImportCache({
        sourceHash,
        pipeline,
        assetUrl: imageUrl,
        storagePath,
        productName: name ?? null,
        category: category ?? null,
        brand: brand ?? null,
        itemIdSlug: id,
        width,
        height,
        sourceUrl: meta.sourceUrl,
        sourceFilename: meta.sourceFilename,
      })
      notifyImportCacheUpdated()
    } catch (error) {
      console.warn('[garment-ingestion] import cache register skipped:', error)
    }
  }

  spawnFromIngestion({
    id,
    imageUrl,
    width,
    height,
    name,
    category,
    brand,
  })

  setIngestionStatus('idle')
}
