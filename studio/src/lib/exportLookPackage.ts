import type { StudioNode, ArtboardItem } from '../types/item'
import type {
  DynamicItemsJson,
  DynamicLookJson,
  ExportClothingItem,
  LookParameters,
} from '../types/export'
import {
  DEFAULT_BUDGET_ALTERNATIVE_URL,
  DEFAULT_EST_PRICE_RANGE,
} from '../types/export'
import {
  defaultCanvasImagePath,
  defaultShopUrl,
} from '../types/item'
import { compileLookLayoutMap, pixelToLayout } from './canvasLayout'
import {
  LOOK_HERO_EXPORT_HEIGHT,
  LOOK_HERO_EXPORT_WIDTH,
} from './lookCanvasReference'
import { zipSync, strToU8 } from 'fflate'

export function generateLookId(): string {
  const token = crypto.randomUUID().split('-')[0]
  return `look-${token}`
}

export function resolveOutfitId(lookId: string, outfitId?: string): string {
  return outfitId || lookId.replace('look-', 'outfit-')
}

function layoutToLegacyHotspot(layout: ReturnType<typeof pixelToLayout>) {
  const topPct = parseFloat(layout.top)
  const leftPct = parseFloat(layout.left)
  return {
    from: { top: `${(topPct + 8).toFixed(2)}%`, left: `${(leftPct + 8).toFixed(2)}%` },
    to: { top: `${(topPct + 12).toFixed(2)}%`, left: `${(leftPct - 6).toFixed(2)}%` },
  }
}

export function buildDynamicLookJson(
  lookId: string,
  params: LookParameters,
  linked: Array<{ metadata: StudioNode; layout: ArtboardItem }>,
): DynamicLookJson {
  const layouts = linked.map((entry) => entry.layout)
  const canvasLayouts = compileLookLayoutMap(layouts)
  const outfitId = resolveOutfitId(lookId, params.outfitId)

  return {
    id: lookId,
    title: params.lookTitle,
    image: `/images/clothes/${outfitId}/hero.WEBP`,
    modelName: params.modelName.toUpperCase(),
    layout: 'collage',
    outfitId,
    vibe: params.vibe,
    investmentRetail: params.investmentRetail,
    investmentWithGuide: params.investmentWithGuide,
    versatility: params.versatility,
    width: LOOK_HERO_EXPORT_WIDTH,
    height: LOOK_HERO_EXPORT_HEIGHT,
    homepageOrder: params.homepageOrder,
    items: layouts.map((item) => {
      const layout = pixelToLayout(item.x, item.y, item.widthPx, item.zIndex)
      return {
        itemId: item.id,
        coordinates: layoutToLegacyHotspot(layout),
      }
    }),
    canvasLayouts,
  }
}

export function buildDynamicItemsJson(
  linked: Array<{ metadata: StudioNode; layout: ArtboardItem }>,
  outfitId: string,
): DynamicItemsJson {
  const items: ExportClothingItem[] = linked.map(({ metadata, layout }) => {
    const coords = pixelToLayout(layout.x, layout.y, layout.widthPx, layout.zIndex)
    const displayModel = metadata.displayModel?.trim()
    return {
      id: metadata.id,
      name: metadata.name.toUpperCase(),
      category: metadata.category,
      brand: metadata.brand,
      shopUrl: metadata.shopUrl || defaultShopUrl(metadata.id),
      ...(displayModel ? { displayModel } : {}),
      estPriceRange: metadata.estPriceRange || DEFAULT_EST_PRICE_RANGE,
      budgetAlternativeUrl: metadata.budgetAlternativeUrl || DEFAULT_BUDGET_ALTERNATIVE_URL,
      rarityScore: metadata.rarityScore ?? 1,
      canvasImage: defaultCanvasImagePath(outfitId, metadata.id),
      defaultCanvasPosition: {
        top: coords.top,
        left: coords.left,
        width: `${((coords.widthPx ?? 120) / 420) * 100}%`,
        zIndex: coords.zIndex,
      },
    }
  })

  return { items }
}

async function blobUrlToUint8Array(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

export async function exportLookPackageZip(
  lookId: string,
  params: LookParameters,
  linked: Array<{ metadata: StudioNode; layout: ArtboardItem }>,
): Promise<void> {
  if (linked.length === 0) {
    throw new Error('Place at least one item on the artboard before exporting.')
  }

  const outfitId = resolveOutfitId(lookId, params.outfitId)
  const lookJson = buildDynamicLookJson(lookId, { ...params, outfitId }, linked)
  const itemsJson = buildDynamicItemsJson(linked, outfitId)

  const zipEntries: Record<string, Uint8Array> = {
    [`${outfitId}.json`]: strToU8(JSON.stringify(lookJson, null, 2)),
    [`${outfitId}-items.json`]: strToU8(JSON.stringify(itemsJson, null, 2)),
  }

  for (const { layout } of linked) {
    const bytes = await blobUrlToUint8Array(layout.imageUrl)
    zipEntries[`images/${layout.id}.png`] = bytes
  }

  const zipped = zipSync(zipEntries)
  const blob = new Blob([zipped], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${outfitId}-package.zip`
  anchor.click()

  URL.revokeObjectURL(url)
}
