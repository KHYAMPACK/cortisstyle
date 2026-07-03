import type { ClothingCategory } from '../types/item'
import { getStudioApiOrigin } from './studioIntegration'
import { getAccessToken } from './supabaseClient'

export type StudioImportPipeline = 'segmented' | 'raw'

export interface StudioImportCacheRecord {
  id: string
  sourceHash: string
  pipeline: StudioImportPipeline
  assetUrl: string
  storagePath: string
  productName: string | null
  category: string | null
  brand: string | null
  itemIdSlug: string
  width: number
  height: number
  sourceUrl: string | null
  sourceFilename: string | null
  shopUrl: string | null
  displayModel: string | null
  estPriceRange: string | null
  budgetAlternativeUrl: string | null
  createdAt: string
  lastUsedAt: string
}

async function importCacheFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Not authenticated')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getStudioApiOrigin()}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function lookupImportCache(
  sourceHash: string,
  pipeline: StudioImportPipeline,
): Promise<StudioImportCacheRecord | null> {
  const data = await importCacheFetch<{ hit: boolean; record?: StudioImportCacheRecord }>(
    '/api/studio/imports/lookup',
    {
      method: 'POST',
      body: JSON.stringify({ sourceHash, pipeline }),
    },
  )

  return data.hit && data.record ? data.record : null
}

export async function registerImportCache(input: {
  sourceHash: string
  pipeline: StudioImportPipeline
  assetUrl: string
  storagePath: string
  productName?: string | null
  category?: ClothingCategory | null
  brand?: string | null
  itemIdSlug: string
  width: number
  height: number
  sourceUrl?: string | null
  sourceFilename?: string | null
  shopUrl?: string | null
  displayModel?: string | null
  estPriceRange?: string | null
  budgetAlternativeUrl?: string | null
}): Promise<StudioImportCacheRecord> {
  const data = await importCacheFetch<{ record: StudioImportCacheRecord }>(
    '/api/studio/imports/register',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )

  return data.record
}

export async function listImportCache(limit = 48): Promise<StudioImportCacheRecord[]> {
  const data = await importCacheFetch<{ records: StudioImportCacheRecord[] }>(
    `/api/studio/imports?limit=${limit}`,
  )

  return data.records
}

export async function touchImportCache(id: string): Promise<StudioImportCacheRecord> {
  const data = await importCacheFetch<{ record: StudioImportCacheRecord }>(
    '/api/studio/imports/use',
    {
      method: 'POST',
      body: JSON.stringify({ id }),
    },
  )

  return data.record
}

export async function updateImportCacheMetadata(
  id: string,
  patch: {
    productName?: string | null
    category?: string | null
    brand?: string | null
    shopUrl?: string | null
    displayModel?: string | null
    estPriceRange?: string | null
    budgetAlternativeUrl?: string | null
  },
): Promise<StudioImportCacheRecord> {
  const data = await importCacheFetch<{ record: StudioImportCacheRecord }>(
    '/api/studio/imports/update',
    {
      method: 'POST',
      body: JSON.stringify({ id, ...patch }),
    },
  )

  return data.record
}

function isClothingCategory(value: string | null): value is ClothingCategory {
  if (!value) return false
  return [
    'tops',
    'bottoms',
    'waist',
    'outerwear',
    'shoes',
    'bags',
    'eyewear',
    'headwear',
    'accessories',
  ].includes(value)
}

export function categoryFromCache(value: string | null): ClothingCategory | undefined {
  return isClothingCategory(value) ? value : undefined
}
