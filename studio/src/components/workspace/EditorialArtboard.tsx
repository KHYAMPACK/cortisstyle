import { useWorkspaceStore } from '../../store/workspaceStore'
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
} from '../../lib/lookCanvasReference'
import { FabricArtboardCanvas } from './FabricArtboardCanvas'
import { FabricArtboardControls } from './FabricArtboardControls'
import { PlacementGuideOverlay } from './PlacementGuideOverlay'

interface EditorialArtboardProps {
  onSelectClear: () => void
}

export function EditorialArtboard({ onSelectClear }: EditorialArtboardProps) {
  const showPlacementGuide = useWorkspaceStore((s) => s.showPlacementGuide)

  return (
    <div
      className="relative shrink-0 shadow-[0_32px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04]"
      style={{
        width: LOOK_CANVAS_REFERENCE_WIDTH,
        height: LOOK_CANVAS_REFERENCE_HEIGHT,
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden bg-white"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onSelectClear()
        }}
      >
        <FabricArtboardCanvas />
        <div
          className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-300 ease-out ${
            showPlacementGuide ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!showPlacementGuide}
        >
          <PlacementGuideOverlay />
        </div>
        <div className="pointer-events-none absolute inset-0 border border-black/[0.04]" />
        <FabricArtboardControls />
      </div>
    </div>
  )
}
