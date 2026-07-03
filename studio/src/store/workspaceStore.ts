import { create } from 'zustand'
import type {
  ArtboardItem,
  CatalogItemMetadata,
  ClothingCategory,
  StudioNode,
} from '../types/item'
import { defaultShopUrl } from '../types/item'
import type { IngestionStatus, ViewportState } from '../types/workspace'
import { DEFAULT_SHOW_PLACEMENT_GUIDE, DEFAULT_VIEWPORT } from '../types/workspace'
import type { LookParameters } from '../types/export'
import type { StudioDraftPayload } from '../lib/draftPayload'
import {
  DEFAULT_BUDGET_ALTERNATIVE_URL,
  DEFAULT_EST_PRICE_RANGE,
  DEFAULT_LOOK_PARAMETERS,
} from '../types/export'
import {
  zIndexForCategory,
} from '../lib/canvasLayerStack'
import { clampWidthPx } from '../lib/canvasLayout'
import { sanitizeArtboardLayout } from '../lib/artboardBounds'
import { artboardCenterPlacement } from '../lib/linkedGarment'
import { generateLookId } from '../lib/exportLookPackage'

export interface TwinIngestPayload {
  id: string
  imageUrl: string
  naturalWidth: number
  naturalHeight: number
  worldX: number
  worldY: number
  name?: string
  category?: ClothingCategory
  brand?: string
  shopUrl?: string
  displayModel?: string
  estPriceRange?: string
  budgetAlternativeUrl?: string
  rarityScore?: number
  importCacheId?: string
}

interface WorkspaceStore {
  studioNodes: StudioNode[]
  artboardItems: ArtboardItem[]
  selectedGarmentId: string | null
  cursorWorld: { x: number; y: number }
  viewport: ViewportState
  ingestionStatus: IngestionStatus
  ingestionError: string | null
  ingestionLabel: string
  lookParams: LookParameters
  lookId: string
  draftId: string | null
  showPlacementGuide: boolean

  spawnLinkedTwin: (payload: TwinIngestPayload) => void
  updateStudioNode: (id: string, patch: Partial<CatalogItemMetadata>) => void
  moveStudioNode: (id: string, worldX: number, worldY: number) => void
  renameLinkedGarmentId: (oldId: string, newId: string) => void
  removeLinkedGarment: (id: string) => void
  selectLinkedGarment: (id: string | null) => void

  updateArtboardLayout: (
    id: string,
    patch: Partial<Pick<ArtboardItem, 'x' | 'y' | 'widthPx' | 'zIndex'>>,
  ) => void

  setLookParams: (patch: Partial<LookParameters>) => void
  setLookId: (lookId: string) => void
  setDraftId: (draftId: string | null) => void
  assignNewLookId: () => string
  hydrateFromDraft: (payload: StudioDraftPayload, draftId: string) => void

  setCursorWorld: (coords: { x: number; y: number }) => void
  setViewport: (patch: Partial<ViewportState>) => void
  setIngestionStatus: (status: IngestionStatus, error?: string | null, label?: string) => void
  setShowPlacementGuide: (show: boolean) => void
}

function catalogDefaults(id: string): CatalogItemMetadata {
  return {
    name: '',
    category: 'tops',
    brand: '',
    shopUrl: defaultShopUrl(id),
    estPriceRange: DEFAULT_EST_PRICE_RANGE,
    budgetAlternativeUrl: DEFAULT_BUDGET_ALTERNATIVE_URL,
    rarityScore: 1,
  }
}

function cascadeMetadataToArtboard(
  items: ArtboardItem[],
  id: string,
  patch: Partial<CatalogItemMetadata>,
): ArtboardItem[] {
  return items.map((item) => {
    if (item.id !== id) return item
    const next = { ...item }
    if (patch.category !== undefined) {
      next.zIndex = zIndexForCategory(patch.category)
    }
    return sanitizeArtboardLayout(next)
  })
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  studioNodes: [],
  artboardItems: [],
  selectedGarmentId: null,
  cursorWorld: { x: 0, y: 0 },
  viewport: { ...DEFAULT_VIEWPORT },
  ingestionStatus: 'idle',
  ingestionError: null,
  ingestionLabel: 'Processing image…',
  lookParams: { ...DEFAULT_LOOK_PARAMETERS },
  lookId: 'look-01',
  draftId: null,
  showPlacementGuide: DEFAULT_SHOW_PLACEMENT_GUIDE,

  spawnLinkedTwin: (payload) => {
    const stackIndex = get().studioNodes.length
    const defaults = catalogDefaults(payload.id)
    const metadata: CatalogItemMetadata = {
      ...defaults,
      name: (payload.name ?? payload.id.replace(/-/g, ' ')).toUpperCase(),
      category: payload.category ?? 'tops',
      brand: payload.brand ?? '',
      shopUrl: payload.shopUrl ?? defaults.shopUrl,
      displayModel: payload.displayModel,
      estPriceRange: payload.estPriceRange ?? defaults.estPriceRange,
      budgetAlternativeUrl: payload.budgetAlternativeUrl ?? defaults.budgetAlternativeUrl,
      rarityScore: payload.rarityScore ?? defaults.rarityScore,
    }

    const node: StudioNode = {
      id: payload.id,
      ...metadata,
      worldX: payload.worldX,
      worldY: payload.worldY,
      importCacheId: payload.importCacheId,
    }

    const placement = artboardCenterPlacement(
      payload.naturalWidth,
      payload.naturalHeight,
      stackIndex,
    )

    const layout: ArtboardItem = sanitizeArtboardLayout({
      id: payload.id,
      imageUrl: payload.imageUrl,
      naturalWidth: payload.naturalWidth,
      naturalHeight: payload.naturalHeight,
      x: placement.x,
      y: placement.y,
      widthPx: placement.widthPx,
      zIndex: zIndexForCategory(metadata.category),
    })

    set((state) => ({
      studioNodes: [...state.studioNodes, node],
      artboardItems: [...state.artboardItems, layout],
      selectedGarmentId: payload.id,
    }))
  },

  updateStudioNode: (id, patch) => {
    const normalized = { ...patch }
    if (normalized.name !== undefined) {
      normalized.name = normalized.name.toUpperCase()
    }

    set((state) => ({
      studioNodes: state.studioNodes.map((node) =>
        node.id === id ? { ...node, ...normalized } : node,
      ),
      artboardItems: cascadeMetadataToArtboard(state.artboardItems, id, normalized),
    }))
  },

  moveStudioNode: (id, worldX, worldY) => {
    set((state) => ({
      studioNodes: state.studioNodes.map((node) =>
        node.id === id ? { ...node, worldX, worldY } : node,
      ),
    }))
  },

  renameLinkedGarmentId: (oldId, newId) => {
    const trimmed = newId.trim()
    if (!trimmed || trimmed === oldId) return

    set((state) => {
      if (state.studioNodes.some((n) => n.id === trimmed)) return state
      if (state.artboardItems.some((n) => n.id === trimmed && n.id !== oldId)) return state

      return {
        studioNodes: state.studioNodes.map((node) =>
          node.id === oldId
            ? {
                ...node,
                id: trimmed,
                shopUrl: node.shopUrl.includes(oldId) ? defaultShopUrl(trimmed) : node.shopUrl,
              }
            : node,
        ),
        artboardItems: state.artboardItems.map((item) =>
          item.id === oldId ? { ...item, id: trimmed } : item,
        ),
        selectedGarmentId: state.selectedGarmentId === oldId ? trimmed : state.selectedGarmentId,
      }
    })
  },

  removeLinkedGarment: (id) => {
    set((state) => ({
      studioNodes: state.studioNodes.filter((node) => node.id !== id),
      artboardItems: state.artboardItems.filter((item) => item.id !== id),
      selectedGarmentId: state.selectedGarmentId === id ? null : state.selectedGarmentId,
    }))
  },

  selectLinkedGarment: (id) => set({ selectedGarmentId: id }),

  updateArtboardLayout: (id, patch) => {
    set((state) => ({
      artboardItems: state.artboardItems.map((item) => {
        if (item.id !== id) return item
        let next = { ...item, ...patch }
        if (patch.widthPx !== undefined) {
          next.widthPx = clampWidthPx(patch.widthPx)
        }
        return sanitizeArtboardLayout(next)
      }),
    }))
  },

  setLookParams: (patch) => {
    set((state) => ({ lookParams: { ...state.lookParams, ...patch } }))
  },

  setLookId: (lookId) => set({ lookId }),

  setDraftId: (draftId) => set({ draftId }),

  hydrateFromDraft: (payload, draftId) => {
    set({
      lookId: payload.lookId,
      lookParams: { ...payload.lookParams },
      studioNodes: [...payload.studioNodes],
      artboardItems: [...payload.artboardItems],
      selectedGarmentId: null,
      draftId,
    })
  },

  assignNewLookId: () => {
    const id = generateLookId()
    const outfitId = id.replace('look-', 'outfit-')
    set((state) => ({
      lookId: id,
      lookParams: { ...state.lookParams, outfitId },
    }))
    return id
  },

  setCursorWorld: (coords) => set({ cursorWorld: coords }),

  setViewport: (patch) => {
    set((state) => ({ viewport: { ...state.viewport, ...patch } }))
  },

  setIngestionStatus: (status, error = null, label) =>
    set((state) => ({
      ingestionStatus: status,
      ingestionError: error,
      ingestionLabel: label ?? state.ingestionLabel,
    })),

  setShowPlacementGuide: (show) => set({ showPlacementGuide: show }),
}))

/** Merge linked node metadata with artboard layout for export */
export function resolveLinkedGarments(
  nodes: StudioNode[],
  layouts: ArtboardItem[],
): Array<{ metadata: StudioNode; layout: ArtboardItem }> {
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  return layouts
    .map((layout) => {
      const metadata = nodeById.get(layout.id)
      if (!metadata) return null
      return { metadata, layout }
    })
    .filter((entry): entry is { metadata: StudioNode; layout: ArtboardItem } => entry !== null)
}
