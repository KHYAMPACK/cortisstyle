import { useWorkspaceStore } from '../store/workspaceStore'
import { uniqueItemId } from '../lib/uniqueItemId'
import { nextNodeWorldPosition } from '../lib/linkedGarment'
import { categoryFromCache, type StudioImportCacheRecord } from './studioImportCacheApi'

export function placeGarmentFromCacheRecord(record: StudioImportCacheRecord): string {
  const existingIds = new Set(useWorkspaceStore.getState().studioNodes.map((node) => node.id))
  const id = uniqueItemId(record.itemIdSlug || record.productName || 'item', existingIds)
  const nodes = useWorkspaceStore.getState().studioNodes
  const { worldX, worldY } = nextNodeWorldPosition(nodes)

  useWorkspaceStore.getState().spawnLinkedTwin({
    id,
    imageUrl: record.assetUrl,
    naturalWidth: record.width,
    naturalHeight: record.height,
    worldX,
    worldY,
    name: record.productName ?? undefined,
    category: categoryFromCache(record.category),
    brand: record.brand || undefined,
    shopUrl: record.shopUrl || undefined,
    displayModel: record.displayModel || undefined,
    estPriceRange: record.estPriceRange || undefined,
    budgetAlternativeUrl: record.budgetAlternativeUrl || undefined,
    rarityScore: record.rarityScore ?? undefined,
    importCacheId: record.id,
  })

  return id
}

export const IMPORT_CACHE_UPDATED_EVENT = 'studio-import-cache-updated'

export function notifyImportCacheUpdated(): void {
  window.dispatchEvent(new CustomEvent(IMPORT_CACHE_UPDATED_EVENT))
}
