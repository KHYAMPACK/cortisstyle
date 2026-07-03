import type { StudioNode } from '../types/item'
import { updateImportCacheMetadata } from './studioImportCacheApi'

export async function syncImportCacheMetadata(nodes: StudioNode[]): Promise<void> {
  const linked = nodes.filter((n) => n.importCacheId)
  if (linked.length === 0) return

  await Promise.allSettled(
    linked.map((node) =>
      updateImportCacheMetadata(node.importCacheId!, {
        productName: node.name || null,
        category: node.category || null,
        brand: node.brand || null,
        shopUrl: node.shopUrl || null,
        displayModel: node.displayModel || null,
        estPriceRange: node.estPriceRange || null,
        budgetAlternativeUrl: node.budgetAlternativeUrl || null,
        rarityScore: node.rarityScore,
      }),
    ),
  )
}
