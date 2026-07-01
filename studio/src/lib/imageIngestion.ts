/**
 * Quality-first image ingestion helpers.
 *
 * Best → worst source quality:
 * 1. Local file (picker / drag-drop / clipboard image/* item) — original bytes
 * 2. Upgraded remote URL (originals, largest srcset, stripped CDN resize params)
 * 3. Raw clipboard HTML <img src> or plain URL
 */

export type IngestImagePayload =
  | { kind: 'file'; file: File }
  | { kind: 'url'; imageUrl: string }

const PINIMG_SIZE_SEGMENT = /\/\d+x\//

/** Upgrade common CDN thumbnail URLs to their highest practical resolution */
export function upgradeImageUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  try {
    const parsed = new URL(trimmed, window.location.origin)

    if (parsed.hostname.includes('pinimg.com')) {
      if (PINIMG_SIZE_SEGMENT.test(parsed.pathname)) {
        parsed.pathname = parsed.pathname.replace(PINIMG_SIZE_SEGMENT, '/originals/')
      }
      return parsed.toString()
    }

    if (parsed.searchParams.has('width')) {
      parsed.searchParams.set('width', '4096')
    }
    if (parsed.searchParams.has('w')) {
      parsed.searchParams.set('w', '4096')
    }
    if (parsed.searchParams.has('height') && parsed.searchParams.has('width')) {
      parsed.searchParams.delete('height')
    }

    let path = parsed.pathname
    path = path.replace(/_\d+x\d*\./g, '.')
    path = path.replace(/_\d+x\./g, '.')
    parsed.pathname = path

    return parsed.toString()
  } catch {
    return trimmed
      .replace(PINIMG_SIZE_SEGMENT, '/originals/')
      .replace(/_\d+x\d*\./g, '.')
      .replace(/[?&]width=\d+/gi, '?width=4096')
  }
}

function parseLargestSrcset(srcset: string): string | null {
  let bestUrl = ''
  let bestWidth = 0

  for (const entry of srcset.split(',')) {
    const parts = entry.trim().split(/\s+/)
    const url = parts[0]
    if (!url) continue

    const descriptor = parts[1] ?? ''
    const width = descriptor.endsWith('w') ? Number.parseInt(descriptor, 10) : 0
    if (!bestUrl || width > bestWidth) {
      bestUrl = url
      bestWidth = width
    }
  }

  return bestUrl || null
}

function extractBestUrlFromHtml(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
  if (ogImage) return upgradeImageUrl(ogImage)

  const img = doc.querySelector('img')
  if (!img) return null

  const pinMedia = img.getAttribute('data-pin-media')
  if (pinMedia) return upgradeImageUrl(pinMedia)

  const srcset = img.getAttribute('srcset')
  if (srcset) {
    const largest = parseLargestSrcset(srcset)
    if (largest) return upgradeImageUrl(largest)
  }

  const src = img.getAttribute('src')
  if (src) return upgradeImageUrl(src)

  return null
}

/** Prefer largest image/* clipboard file — original bytes, no CDN thumbnail */
function extractLargestClipboardFile(clipboardData: DataTransfer): File | null {
  const files: File[] = []

  for (const item of Array.from(clipboardData.items)) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (file) files.push(file)
  }

  if (files.length === 0) return null
  files.sort((a, b) => b.size - a.size)
  return files[0] ?? null
}

export function extractClipboardImage(clipboardData: DataTransfer): IngestImagePayload | null {
  const file = extractLargestClipboardFile(clipboardData)
  if (file) return { kind: 'file', file }

  const html = clipboardData.getData('text/html')
  if (html) {
    const imageUrl = extractBestUrlFromHtml(html)
    if (imageUrl) return { kind: 'url', imageUrl }
  }

  const text = clipboardData.getData('text/plain')?.trim()
  if (text && /^https?:\/\/.+/i.test(text)) {
    return { kind: 'url', imageUrl: upgradeImageUrl(text) }
  }

  return null
}

export function ingestPayloadFromFile(file: File): IngestImagePayload {
  return { kind: 'file', file }
}

export function ingestPayloadLabel(payload: IngestImagePayload): string {
  if (payload.kind === 'file') {
    return payload.file.name || 'local image'
  }
  try {
    return new URL(payload.imageUrl).hostname
  } catch {
    return 'remote image'
  }
}

export interface ResolvedIngestImage {
  blob: Blob
  objectUrl: string
}

/** Use original pixels — skip background removal when the asset already has transparency */
export async function resolveIngestImageBlob(
  payload: IngestImagePayload,
  signal?: AbortSignal,
): Promise<ResolvedIngestImage> {
  if (payload.kind === 'file') {
    return {
      blob: payload.file,
      objectUrl: URL.createObjectURL(payload.file),
    }
  }

  const imageUrl = upgradeImageUrl(payload.imageUrl)
  const response = await fetch(imageUrl, { signal })
  if (!response.ok) {
    throw new Error(`Failed to fetch image URL (${response.status})`)
  }

  const blob = await response.blob()
  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
  }
}
