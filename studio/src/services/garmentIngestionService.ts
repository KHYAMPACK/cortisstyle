import { uploadBlobAsset } from '../lib/studioApi'
import { useWorkspaceStore } from '../store/workspaceStore'
import { uniqueItemId } from '../lib/uniqueItemId'
import { nextNodeWorldPosition } from '../lib/linkedGarment'
import { resolveIngestImageBlob, type IngestImagePayload } from '../lib/imageIngestion'
import type { ClothingCategory } from '../types/item'
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

export async function runGarmentIngestion(
  payload: IngestImagePayload,
  signal?: AbortSignal,
): Promise<void> {
  const { setIngestionStatus, removeBackgroundOnImport } = useWorkspaceStore.getState()

  let objectUrl: string
  let blob: Blob

  if (removeBackgroundOnImport) {
    setIngestionStatus('processing', null, 'Removing background…')
    const segmented = await segmentGarment(toSegmentPayload(payload), signal)
    objectUrl = segmented.objectUrl
    blob = segmented.blob
  } else {
    setIngestionStatus('processing', null, 'Preparing image…')
    const resolved = await resolveIngestImageBlob(payload, signal)
    objectUrl = resolved.objectUrl
    blob = resolved.blob
  }

  const { width, height } = await loadImageDimensions(objectUrl)

  const existingIds = new Set(useWorkspaceStore.getState().studioNodes.map((node) => node.id))
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

  const nodes = useWorkspaceStore.getState().studioNodes
  const { worldX, worldY } = nextNodeWorldPosition(nodes)

  let imageUrl = objectUrl

  try {
    setIngestionStatus('processing', null, 'Uploading garment to archive…')
    const draftId = useWorkspaceStore.getState().draftId
    imageUrl = await uploadBlobAsset({
      blob,
      itemId: id,
      draftId,
      fileName: `${id}.png`,
    })
  } catch (error) {
    console.warn('[garment-ingestion] CDN upload skipped:', error)
  }

  useWorkspaceStore.getState().spawnLinkedTwin({
    id,
    imageUrl,
    naturalWidth: width,
    naturalHeight: height,
    worldX,
    worldY,
    name,
    category,
    brand,
  })
}
