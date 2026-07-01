import { useEffect, useRef } from 'react'
import { Canvas, FabricImage, type FabricObject } from 'fabric'
import type { ArtboardItem } from '../types/item'
import { useWorkspaceStore } from '../store/workspaceStore'
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
} from '../lib/lookCanvasReference'
import { DEFAULT_CANVAS_BG } from '../types/workspace'
import {
  applyArtboardItemToFabricObject,
  applyHighQualityCanvasContext,
  applyViewportZoomToCanvas,
  configureGarmentFabricImage,
  constrainFabricGarmentMove,
  constrainFabricGarmentScaleLive,
  ensureGarmentFabricOrigin,
  installZoomAwareRetina,
  layoutFromFabricObject,
  refreshGarmentDisplayQuality,
  type GarmentFabricImage,
} from '../lib/fabricArtboardBridge'

function syncZOrder(
  canvas: Canvas,
  items: ArtboardItem[],
  objectById: Map<string, GarmentFabricImage>,
) {
  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach((item, index) => {
    const obj = objectById.get(item.id)
    if (obj) canvas.moveObjectTo(obj, index)
  })
}

function layoutMatches(
  obj: FabricImage,
  item: Pick<ArtboardItem, 'x' | 'y' | 'widthPx'>,
) {
  const layout = layoutFromFabricObject(obj)
  return layout.x === item.x && layout.y === item.y && layout.widthPx === item.widthPx
}

export function useFabricArtboard(canvasElRef: React.RefObject<HTMLCanvasElement | null>) {
  const canvasRef = useRef<Canvas | null>(null)
  const objectByIdRef = useRef<Map<string, GarmentFabricImage>>(new Map())
  const syncingFromStoreRef = useRef(false)
  const syncingFromFabricRef = useRef(false)
  const isDraggingRef = useRef(false)

  const artboardItems = useWorkspaceStore((s) => s.artboardItems)
  const selectedGarmentId = useWorkspaceStore((s) => s.selectedGarmentId)
  const viewportZoom = useWorkspaceStore((s) => s.viewport.zoom)
  const updateArtboardLayout = useWorkspaceStore((s) => s.updateArtboardLayout)
  const selectLinkedGarment = useWorkspaceStore((s) => s.selectLinkedGarment)
  const removeLinkedGarment = useWorkspaceStore((s) => s.removeLinkedGarment)

  useEffect(() => {
    const el = canvasElRef.current
    if (!el || canvasRef.current) return

    const canvas = new Canvas(el, {
      width: LOOK_CANVAS_REFERENCE_WIDTH,
      height: LOOK_CANVAS_REFERENCE_HEIGHT,
      backgroundColor: DEFAULT_CANVAS_BG,
      selection: true,
      preserveObjectStacking: true,
      uniformScaling: true,
      stopContextMenu: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
    })

    canvas.setDimensions({
      width: LOOK_CANVAS_REFERENCE_WIDTH,
      height: LOOK_CANVAS_REFERENCE_HEIGHT,
    })
    installZoomAwareRetina(canvas)
    applyViewportZoomToCanvas(canvas, useWorkspaceStore.getState().viewport.zoom)

    const ctx = canvas.getContext()
    if (ctx) applyHighQualityCanvasContext(ctx)

    canvasRef.current = canvas

    const commitLayoutToStore = (obj: GarmentFabricImage) => {
      if (syncingFromStoreRef.current) return
      const item = useWorkspaceStore.getState().artboardItems.find((i) => i.id === obj.garmentId)
      if (!item) return

      syncingFromFabricRef.current = true
      updateArtboardLayout(obj.garmentId, layoutFromFabricObject(obj))
      syncingFromFabricRef.current = false
    }

    const onMoving = (event: { target?: FabricObject }) => {
      const obj = event.target as GarmentFabricImage | undefined
      if (!obj?.garmentId) return
      isDraggingRef.current = true
      if (obj.objectCaching) {
        obj.set({ objectCaching: false })
      }
      constrainFabricGarmentMove(obj)
    }

    const onScaling = (event: { target?: FabricObject }) => {
      const obj = event.target as GarmentFabricImage | undefined
      if (!obj?.garmentId) return
      isDraggingRef.current = true
      obj.set({ objectCaching: false })
      const item = useWorkspaceStore.getState().artboardItems.find((i) => i.id === obj.garmentId)
      if (!item) return
      constrainFabricGarmentScaleLive(obj, item.naturalWidth)
    }

    const onModified = (event: { target?: FabricObject }) => {
      const obj = event.target as GarmentFabricImage | undefined
      if (!obj?.garmentId) return
      isDraggingRef.current = false
      const item = useWorkspaceStore.getState().artboardItems.find((i) => i.id === obj.garmentId)
      if (!item) return

      constrainFabricGarmentMove(obj)
      refreshGarmentDisplayQuality(obj, item.naturalWidth, true)
      obj.set({ objectCaching: true })
      commitLayoutToStore(obj)
    }

    const onSelection = (event: { selected?: FabricObject[] }) => {
      if (syncingFromStoreRef.current) return
      const obj = event.selected?.[0] as GarmentFabricImage | undefined
      selectLinkedGarment(obj?.garmentId ?? null)
    }

    const onSelectionCleared = () => {
      if (syncingFromStoreRef.current) return
      selectLinkedGarment(null)
    }

    canvas.on('object:moving', onMoving)
    canvas.on('object:scaling', onScaling)
    canvas.on('object:modified', onModified)
    canvas.on('selection:created', onSelection)
    canvas.on('selection:updated', onSelection)
    canvas.on('selection:cleared', onSelectionCleared)

    return () => {
      canvas.off('object:moving', onMoving)
      canvas.off('object:scaling', onScaling)
      canvas.off('object:modified', onModified)
      canvas.off('selection:created', onSelection)
      canvas.off('selection:updated', onSelection)
      canvas.off('selection:cleared', onSelectionCleared)
      objectByIdRef.current.clear()
      canvas.dispose()
      canvasRef.current = null
    }
  }, [canvasElRef, selectLinkedGarment, updateArtboardLayout])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    applyViewportZoomToCanvas(canvas, viewportZoom)
  }, [viewportZoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || syncingFromFabricRef.current) return

    const objectById = objectByIdRef.current
    const storeIds = new Set(artboardItems.map((item) => item.id))

    syncingFromStoreRef.current = true

    for (const [id, obj] of objectById) {
      if (!storeIds.has(id)) {
        canvas.remove(obj)
        objectById.delete(id)
      }
    }

    const pendingLoads: Promise<void>[] = []

    for (const item of artboardItems) {
      const existing = objectById.get(item.id)
      if (existing) {
        ensureGarmentFabricOrigin(existing)
        existing.set({ globalCompositeOperation: 'source-over' })
        if (isDraggingRef.current && canvas.getActiveObject() === existing) {
          continue
        }
        if (!layoutMatches(existing, item)) {
          applyArtboardItemToFabricObject(existing, item)
          existing.dirty = true
        }
        continue
      }

      pendingLoads.push(
        FabricImage.fromURL(item.imageUrl, { crossOrigin: 'anonymous' })
          .then((img) => {
            if (!canvasRef.current) return
            if (objectById.has(item.id)) return
            const stillExists = useWorkspaceStore
              .getState()
              .artboardItems.some((entry) => entry.id === item.id)
            if (!stillExists) return

            const garmentImg = configureGarmentFabricImage(img as GarmentFabricImage, item)
            objectById.set(item.id, garmentImg)
            canvasRef.current.add(garmentImg)

            const ctx = canvasRef.current.getContext()
            if (ctx) applyHighQualityCanvasContext(ctx)
          })
          .catch(() => undefined),
      )
    }

    void Promise.all(pendingLoads).then(() => {
      if (!canvasRef.current) return
      syncZOrder(canvasRef.current, artboardItems, objectById)
      canvasRef.current.requestRenderAll()
      syncingFromStoreRef.current = false
    })

    if (pendingLoads.length === 0) {
      syncZOrder(canvas, artboardItems, objectById)
      canvas.requestRenderAll()
      syncingFromStoreRef.current = false
    }
  }, [artboardItems])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || syncingFromFabricRef.current) return

    syncingFromStoreRef.current = true
    if (selectedGarmentId) {
      const obj = objectByIdRef.current.get(selectedGarmentId)
      if (obj && canvas.getActiveObject() !== obj) {
        canvas.setActiveObject(obj)
      }
    } else if (canvas.getActiveObject()) {
      canvas.discardActiveObject()
    }
    canvas.requestRenderAll()
    syncingFromStoreRef.current = false
  }, [selectedGarmentId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }

      const id = useWorkspaceStore.getState().selectedGarmentId
      if (!id) return
      event.preventDefault()
      removeLinkedGarment(id)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [removeLinkedGarment])

  return canvasRef
}
