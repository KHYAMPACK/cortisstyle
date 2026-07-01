import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../lib/linkedGarment'
import { CanvasGrid } from './CanvasGrid'
import { EditorialArtboard } from './EditorialArtboard'
import { GarmentStudioNode } from './GarmentStudioNode'
import { PlacementGuideToggle } from './PlacementGuideToggle'
import { StageIngestionOverlay } from './StageIngestionOverlay'

interface InfiniteCanvasProps {
  onImportFile: (file: File) => void
}

export function InfiniteCanvas({ onImportFile }: InfiniteCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const worldLayerRef = useRef<HTMLDivElement>(null)

  const studioNodes = useWorkspaceStore((s) => s.studioNodes)
  const selectedGarmentId = useWorkspaceStore((s) => s.selectedGarmentId)
  const artboardItems = useWorkspaceStore((s) => s.artboardItems)
  const viewport = useWorkspaceStore((s) => s.viewport)
  const setViewport = useWorkspaceStore((s) => s.setViewport)
  const moveStudioNode = useWorkspaceStore((s) => s.moveStudioNode)
  const selectLinkedGarment = useWorkspaceStore((s) => s.selectLinkedGarment)

  const [isDragOver, setIsDragOver] = useState(false)

  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const nodeElById = useRef<Map<string, HTMLDivElement>>(new Map())
  const nodeDrag = useRef<{
    nodeId: string
    startClientX: number
    startClientY: number
    startWorldX: number
    startWorldY: number
    worldX: number
    worldY: number
  } | null>(null)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)

  const registerNodeEl = useCallback((nodeId: string, el: HTMLDivElement | null) => {
    if (el) nodeElById.current.set(nodeId, el)
    else nodeElById.current.delete(nodeId)
  }, [])

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (isPanning.current) {
        const dx = event.clientX - panStart.current.x
        const dy = event.clientY - panStart.current.y
        setViewport({
          panX: panStart.current.panX + dx,
          panY: panStart.current.panY + dy,
        })
        return
      }

      if (nodeDrag.current) {
        const dx = (event.clientX - nodeDrag.current.startClientX) / viewport.zoom
        const dy = (event.clientY - nodeDrag.current.startClientY) / viewport.zoom
        const worldX = nodeDrag.current.startWorldX + dx
        const worldY = nodeDrag.current.startWorldY + dy
        nodeDrag.current.worldX = worldX
        nodeDrag.current.worldY = worldY

        const el = nodeElById.current.get(nodeDrag.current.nodeId)
        if (el) {
          el.style.left = `${worldX}px`
          el.style.top = `${worldY}px`
        }
      }
    },
    [setViewport, viewport.zoom],
  )

  const onPointerUp = useCallback(() => {
    if (nodeDrag.current) {
      moveStudioNode(nodeDrag.current.nodeId, nodeDrag.current.worldX, nodeDrag.current.worldY)
    }
    isPanning.current = false
    nodeDrag.current = null
    setDraggingNodeId(null)
  }, [moveStudioNode])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  const handleNodeDragStart = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const node = studioNodes.find((n) => n.id === nodeId)
      if (!node) return
      selectLinkedGarment(nodeId)
      setDraggingNodeId(nodeId)
      nodeDrag.current = {
        nodeId,
        startClientX: clientX,
        startClientY: clientY,
        startWorldX: node.worldX,
        startWorldY: node.worldY,
        worldX: node.worldX,
        worldY: node.worldY,
      }
    },
    [selectLinkedGarment, studioNodes],
  )

  const previewById = new Map(artboardItems.map((item) => [item.id, item.imageUrl]))

  return (
    <div
      ref={stageRef}
      className={`relative h-full w-full overflow-hidden bg-[#0D0D0D] outline-none ${
        isDragOver ? 'ring-1 ring-inset ring-white/20' : ''
      }`}
      tabIndex={0}
      onDragOver={(event) => {
        if (!Array.from(event.dataTransfer.types).includes('Files')) return
        event.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return
        setIsDragOver(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragOver(false)
        const file = Array.from(event.dataTransfer.files).find((f) =>
          f.type.startsWith('image/'),
        )
        if (file) onImportFile(file)
      }}
      onPointerDown={(event) => {
        if (event.button === 1 || (event.button === 0 && event.altKey)) {
          isPanning.current = true
          panStart.current = {
            x: event.clientX,
            y: event.clientY,
            panX: viewport.panX,
            panY: viewport.panY,
          }
          return
        }

        if (event.target === event.currentTarget) {
          selectLinkedGarment(null)
        }
      }}
      onWheel={(event) => {
        if (!event.ctrlKey && !event.metaKey) return
        event.preventDefault()
        const delta = event.deltaY > 0 ? 0.9 : 1.1
        setViewport({ zoom: Math.min(3, Math.max(0.5, viewport.zoom * delta)) })
      }}
    >
      <CanvasGrid panX={viewport.panX} panY={viewport.panY} zoom={viewport.zoom} />

      <div className="pointer-events-none absolute left-5 top-5 z-30">
        <div className="pointer-events-auto">
          <PlacementGuideToggle />
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(calc(-50% + ${viewport.panX}px), calc(-50% + ${viewport.panY}px)) scale(${viewport.zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            ref={worldLayerRef}
            className="relative"
            style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT }}
          >
            {studioNodes.map((node) => (
              <GarmentStudioNode
                key={node.id}
                node={node}
                previewImageUrl={previewById.get(node.id)}
                isSelected={node.id === selectedGarmentId}
                isDragging={node.id === draggingNodeId}
                nodeRef={(el) => registerNodeEl(node.id, el)}
                onDragHandlePointerDown={handleNodeDragStart}
              />
            ))}

            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: 420 }}
            >
              <EditorialArtboard onSelectClear={() => selectLinkedGarment(null)} />
            </div>
          </div>
        </div>
      </div>

      <StageIngestionOverlay />
    </div>
  )
}
