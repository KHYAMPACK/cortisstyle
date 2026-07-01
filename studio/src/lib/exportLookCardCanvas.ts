import type { ArtboardItem } from '../types/item'
import type { LookParameters } from '../types/export'
import { displayHeight } from './canvasLayout'
import {
  LOOK_HERO_EXPORT_HEIGHT,
  LOOK_HERO_EXPORT_WIDTH,
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  MOODBOARD_FOOTER_HEIGHT_PX,
} from './lookCanvasReference'
import {
  MOOD_CREATOR_FONT_SIZE_PX,
  MOOD_CREATOR_TOP_PX,
  MOOD_FRAME_HEIGHT_PX,
  MOOD_FRAME_INSET_PX,
  MOOD_FRAME_WIDTH_PX,
} from './moodLayout'

const SCALE_X = LOOK_HERO_EXPORT_WIDTH / LOOK_CANVAS_REFERENCE_WIDTH
const SCALE_Y = LOOK_HERO_EXPORT_HEIGHT / LOOK_CANVAS_REFERENCE_HEIGHT
const FOOTER_EXPORT_HEIGHT = Math.round(MOODBOARD_FOOTER_HEIGHT_PX * SCALE_X)

export const LOOK_CARD_FULL_EXPORT_HEIGHT =
  LOOK_HERO_EXPORT_HEIGHT + FOOTER_EXPORT_HEIGHT

export interface RenderLookCardInput {
  artboardItems: ArtboardItem[]
  lookParams: Pick<LookParameters, 'lookTitle' | 'modelName' | 'moodImageUrl'>
  /** Include moodboard footer strip (look name + cortisstyle.com). */
  includeFooter?: boolean
}

interface MoodBlockLayout {
  frameX: number
  frameY: number
  frameW: number
  frameH: number
  creatorY: number
  creatorMaxWidth: number
}

function resolveMoodBlockLayout(sx: number, sy: number): MoodBlockLayout {
  const frameW = MOOD_FRAME_WIDTH_PX * sx
  const frameH = MOOD_FRAME_HEIGHT_PX * sy
  const frameX = LOOK_HERO_EXPORT_WIDTH - MOOD_FRAME_INSET_PX * sx - frameW
  const frameY = MOOD_FRAME_INSET_PX * sy
  const creatorY = MOOD_CREATOR_TOP_PX * sy

  return {
    frameX,
    frameY,
    frameW,
    frameH,
    creatorY,
    creatorMaxWidth: frameW,
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load image for look card export (${response.status}).`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to decode image for look card export.'))
      image.src = blobUrl
    })
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

async function ensureCreatorFont(scale: number): Promise<void> {
  const size = Math.round(MOOD_CREATOR_FONT_SIZE_PX * scale)
  try {
    await document.fonts.load(`600 ${size}px "Cormorant Garamond"`)
  } catch {
    // Fall back to system serif if Google Font is unavailable.
  }
}

function drawMoodFrame(
  ctx: CanvasRenderingContext2D,
  moodImage: HTMLImageElement | null,
  layout: MoodBlockLayout,
): void {
  const { frameX, frameY, frameW, frameH } = layout

  ctx.save()
  ctx.fillStyle = '#fafafa'
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = Math.max(1, SCALE_X * 0.5)
  ctx.fillRect(frameX, frameY, frameW, frameH)
  ctx.strokeRect(frameX, frameY, frameW, frameH)

  if (moodImage) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(frameX, frameY, frameW, frameH)
    ctx.clip()
    const scale = Math.max(frameW / moodImage.naturalWidth, frameH / moodImage.naturalHeight)
    const drawW = moodImage.naturalWidth * scale
    const drawH = moodImage.naturalHeight * scale
    ctx.drawImage(
      moodImage,
      frameX + (frameW - drawW) / 2,
      frameY + (frameH - drawH) / 2,
      drawW,
      drawH,
    )
    ctx.restore()
  }

  ctx.restore()
}

function drawCreatorName(
  ctx: CanvasRenderingContext2D,
  name: string,
  layout: MoodBlockLayout,
  sx: number,
): void {
  const trimmed = name.trim()
  if (!trimmed) return

  const fontSize = Math.round(MOOD_CREATOR_FONT_SIZE_PX * sx)
  const centerX = layout.frameX + layout.frameW / 2
  const { creatorY, creatorMaxWidth } = layout

  ctx.save()
  ctx.font = `600 ${fontSize}px "Cormorant Garamond", Georgia, serif`
  ctx.fillStyle = '#0a0a0a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const upper = trimmed.toUpperCase()
  const words = upper.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= creatorMaxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  const lineHeight = fontSize * 0.95
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i]!, centerX, creatorY + i * lineHeight, creatorMaxWidth)
  }

  ctx.restore()
}

function drawGarmentLayers(
  ctx: CanvasRenderingContext2D,
  items: ArtboardItem[],
  sx: number,
  sy: number,
  images: Map<string, HTMLImageElement>,
): void {
  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex)

  for (const item of sorted) {
    const image = images.get(item.id)
    if (!image) continue

    const x = item.x * sx
    const y = item.y * sy
    const width = item.widthPx * sx
    const height = displayHeight(item) * sy

    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(image, x, y, width, height)
    ctx.restore()
  }
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  lookTitle: string,
  heroHeight: number,
): void {
  const footerY = heroHeight
  const gradient = ctx.createLinearGradient(0, footerY, 0, footerY + FOOTER_EXPORT_HEIGHT)
  gradient.addColorStop(0, '#fafafa')
  gradient.addColorStop(1, '#f4f4f4')

  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(0, footerY, LOOK_HERO_EXPORT_WIDTH, FOOTER_EXPORT_HEIGHT)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, footerY)
  ctx.lineTo(LOOK_HERO_EXPORT_WIDTH, footerY)
  ctx.stroke()

  const padX = 12 * SCALE_X
  const title = (lookTitle ?? '').trim().toUpperCase() || 'LOOK NAME'
  const labelSize = Math.max(10, Math.round(9 * SCALE_X))

  ctx.font = `500 ${labelSize}px "IBM Plex Mono", ui-monospace, monospace`
  ctx.fillStyle = '#525252'
  ctx.textBaseline = 'middle'

  ctx.textAlign = 'left'
  const maxTitleWidth = LOOK_HERO_EXPORT_WIDTH * 0.55
  let displayTitle = title
  while (displayTitle.length > 3 && ctx.measureText(displayTitle).width > maxTitleWidth) {
    displayTitle = `${displayTitle.slice(0, -4)}…`
  }
  ctx.fillText(
    displayTitle,
    padX,
    footerY + FOOTER_EXPORT_HEIGHT / 2,
    maxTitleWidth,
  )

  ctx.textAlign = 'right'
  ctx.fillStyle = '#a3a3a3'
  const rightSize = Math.max(8, Math.round(7 * SCALE_X))
  ctx.font = `500 ${rightSize}px "IBM Plex Mono", ui-monospace, monospace`
  ctx.fillText(
    'BUILD YOUR OWN / CORTISSTYLE.COM',
    LOOK_HERO_EXPORT_WIDTH - padX,
    footerY + FOOTER_EXPORT_HEIGHT / 2,
  )

  ctx.restore()
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Look card PNG export failed — canvas was tainted or empty.'))
    }, 'image/png', 1)
  })

  return new Uint8Array(await blob.arrayBuffer())
}

/**
 * Renders the look card hero (1700×2500) or full card with moodboard footer.
 */
export async function renderLookCardPngBytes(input: RenderLookCardInput): Promise<Uint8Array> {
  const includeFooter = input.includeFooter ?? true
  const canvasHeight = includeFooter
    ? LOOK_CARD_FULL_EXPORT_HEIGHT
    : LOOK_HERO_EXPORT_HEIGHT

  await ensureCreatorFont(SCALE_X)

  const moodLayout = resolveMoodBlockLayout(SCALE_X, SCALE_Y)

  const garmentImages = new Map<string, HTMLImageElement>()
  await Promise.all(
    input.artboardItems.map(async (item) => {
      garmentImages.set(item.id, await loadImage(item.imageUrl))
    }),
  )

  let moodImage: HTMLImageElement | null = null
  if (input.lookParams.moodImageUrl) {
    moodImage = await loadImage(input.lookParams.moodImageUrl)
  }

  const canvas = document.createElement('canvas')
  canvas.width = LOOK_HERO_EXPORT_WIDTH
  canvas.height = canvasHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to create canvas for look card export.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawMoodFrame(ctx, moodImage, moodLayout)
  drawCreatorName(ctx, input.lookParams.modelName, moodLayout, SCALE_X)
  drawGarmentLayers(ctx, input.artboardItems, SCALE_X, SCALE_Y, garmentImages)

  if (includeFooter) {
    drawFooter(ctx, input.lookParams.lookTitle, LOOK_HERO_EXPORT_HEIGHT)
  }

  return canvasToPngBytes(canvas)
}

/** Hero-only PNG at production size (1700×2500) — matches `hero.WEBP` in look JSON. */
export async function renderLookHeroPngBytes(
  input: RenderLookCardInput,
): Promise<Uint8Array> {
  return renderLookCardPngBytes({ ...input, includeFooter: false })
}
