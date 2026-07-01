import type { FabricImage } from 'fabric'
import { Point, type Canvas } from 'fabric'
import type { ArtboardItem } from '../types/item'
import type { CanvasItemLayout } from '../types/canvas-layout'
import { clampWidthPx } from './canvasLayout'
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  WIDTH_PX_MAX,
  WIDTH_PX_MIN,
} from './lookCanvasReference'

export type GarmentFabricImage = FabricImage & { garmentId: string }

export const GARMENT_MIN_SCALE_LIMIT = 0.05

/** Matches cortisstyle `CollageStudioLayer` — top-left box anchor on 420×630 */
export const GARMENT_FABRIC_ORIGIN = { originX: 'left' as const, originY: 'top' as const }

/** Read top-left anchor in canvas pixels (not Fabric center default). */
export function fabricTopLeftPoint(obj: FabricImage): Point {
  return obj.getPositionByOrigin('left', 'top')
}

export function layoutFromFabricObject(obj: FabricImage): Pick<ArtboardItem, 'x' | 'y' | 'widthPx'> {
  const pt = fabricTopLeftPoint(obj)
  return {
    x: Math.round(pt.x),
    y: Math.round(pt.y),
    widthPx: clampWidthPx(Math.round(obj.getScaledWidth())),
  }
}

/** Production percentage layout — mirrors cortisstyle coordinate injection */
export function fabricObjectToCanvasItemLayout(
  obj: FabricImage,
  zIndex: number,
): CanvasItemLayout {
  const pt = fabricTopLeftPoint(obj)
  return {
    left: `${((pt.x / LOOK_CANVAS_REFERENCE_WIDTH) * 100).toFixed(2)}%`,
    top: `${((pt.y / LOOK_CANVAS_REFERENCE_HEIGHT) * 100).toFixed(2)}%`,
    widthPx: Math.round(obj.getScaledWidth()),
    zIndex,
  }
}

/** Preserve visual position when migrating from Fabric v6 center default. */
export function ensureGarmentFabricOrigin(obj: FabricImage) {
  if (obj.originX === 'left' && obj.originY === 'top') return
  const pt = fabricTopLeftPoint(obj)
  obj.set({ ...GARMENT_FABRIC_ORIGIN, left: pt.x, top: pt.y })
  obj.setCoords()
}

export function artboardItemToFabricScale(item: Pick<ArtboardItem, 'widthPx' | 'naturalWidth'>) {
  if (item.naturalWidth <= 0) return 1
  return item.widthPx / item.naturalWidth
}

export function applyArtboardItemToFabricObject(
  obj: FabricImage,
  item: Pick<ArtboardItem, 'x' | 'y' | 'widthPx' | 'naturalWidth'>,
) {
  const scale = artboardItemToFabricScale(item)
  obj.set({
    ...GARMENT_FABRIC_ORIGIN,
    left: item.x,
    top: item.y,
    scaleX: scale,
    scaleY: scale,
    angle: 0,
  })
  obj.setCoords()
}

/** Movement: keep geometric center inside 420×630; allow bounding box bleed */
export function constrainFabricGarmentMove(obj: FabricImage) {
  const center = obj.getCenterPoint()
  const cx = Math.min(LOOK_CANVAS_REFERENCE_WIDTH, Math.max(0, center.x))
  const cy = Math.min(LOOK_CANVAS_REFERENCE_HEIGHT, Math.max(0, center.y))

  if (cx !== center.x || cy !== center.y) {
    obj.setPositionByOrigin(new Point(cx, cy), 'center', 'center')
    obj.setCoords()
  }
}

/** Live scale — clamp width without integer rounding (smoother drag) */
export function constrainFabricGarmentScaleLive(obj: FabricImage, naturalWidth: number) {
  const scaledWidth = obj.getScaledWidth()
  const widthPx = Math.min(WIDTH_PX_MAX, Math.max(WIDTH_PX_MIN, scaledWidth))
  const scale = artboardItemToFabricScale({ widthPx, naturalWidth })
  obj.set({ scaleX: scale, scaleY: scale })
  obj.setCoords()
}

/** Final scale — snap width to integer px for export state */
export function constrainFabricGarmentScaleFinal(obj: FabricImage, naturalWidth: number) {
  const widthPx = clampWidthPx(Math.round(obj.getScaledWidth()))
  const scale = artboardItemToFabricScale({ widthPx, naturalWidth })
  obj.set({ scaleX: scale, scaleY: scale })
  obj.setCoords()
}

export function applyHighQualityCanvasContext(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
}

let viewportZoomMultiplier = 1

export function setArtboardViewportZoom(zoom: number) {
  viewportZoomMultiplier = Math.max(1, zoom)
}

/** Retina × workspace zoom — capped to keep drag smooth on zoomed infinite canvas */
export function artboardRetinaScaling(canvas: Canvas): number {
  if (!canvas.enableRetinaScaling) return 1
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.min(dpr * viewportZoomMultiplier, 2.5)
}

export function installZoomAwareRetina(canvas: Canvas) {
  canvas.getRetinaScaling = () => artboardRetinaScaling(canvas)
}

export function applyViewportZoomToCanvas(canvas: Canvas, viewportZoom: number) {
  setArtboardViewportZoom(viewportZoom)
  canvas.setDimensions({
    width: LOOK_CANVAS_REFERENCE_WIDTH,
    height: LOOK_CANVAS_REFERENCE_HEIGHT,
  })
  const ctx = canvas.getContext()
  if (ctx) applyHighQualityCanvasContext(ctx)
  canvas.calcOffset()
  canvas.requestRenderAll()
}

/**
 * Single-pass display from full-res Photoroom PNG — mirrors cortisstyle object-contain.
 * Avoids Lanczos pre-bake + transform scale (double resampling that softens detail).
 */
export function configureGarmentFabricImage(
  img: GarmentFabricImage,
  item: ArtboardItem,
): GarmentFabricImage {
  img.garmentId = item.id
  img.set({
    ...GARMENT_FABRIC_ORIGIN,
    resizeFilter: undefined,
    minimumScaleTrigger: 0,
    imageSmoothing: true,
    objectCaching: true,
    noScaleCache: false,
    minScaleLimit: GARMENT_MIN_SCALE_LIMIT,
    lockRotation: true,
    lockSkewingX: true,
    lockSkewingY: true,
    // Opaque stack — multiply bleeds lower layers through overlaps in the editor
    globalCompositeOperation: 'source-over',
    cornerStyle: 'rect',
    transparentCorners: false,
    borderColor: 'rgba(0,0,0,0.45)',
    cornerColor: '#ffffff',
    cornerStrokeColor: '#000000',
  })
  img.applyResizeFilters()
  img.setControlsVisibility({
    mtr: false,
    mt: false,
    mb: false,
    ml: false,
    mr: false,
  })
  applyArtboardItemToFabricObject(img, item)
  img.dirty = true
  return img
}

export function refreshGarmentDisplayQuality(
  img: GarmentFabricImage,
  naturalWidth: number,
  finalize = false,
) {
  if (finalize) {
    constrainFabricGarmentScaleFinal(img, naturalWidth)
  }
  img.set({ imageSmoothing: true, objectCaching: true })
  img.dirty = true
}
