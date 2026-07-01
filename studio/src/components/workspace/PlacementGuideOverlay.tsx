import { MatrixBlueprintGrid } from './MatrixBlueprintGrid'
import {
  MATRIX_BLUEPRINT_LABELS,
  type MatrixSlotIndex,
} from '../../lib/matrixBlueprintLayout'

function GuideCrosshair() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="relative h-5 w-5 opacity-40">
        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-neutral-300" />
        <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-neutral-300" />
      </div>
    </div>
  )
}

function PlacementGuideCell({ label }: { label: string }) {
  return (
    <div className="pointer-events-none relative h-full w-full border border-neutral-200/60">
      <GuideCrosshair />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          aria-hidden
          className="font-mono text-lg leading-none font-light text-neutral-200"
        >
          +
        </span>
      </div>
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-400">
        {label}
      </span>
    </div>
  )
}

export function PlacementGuideOverlay() {
  return (
    <MatrixBlueprintGrid
      className="z-[5]"
      renderCell={({ slotIndex }) => (
        <PlacementGuideCell
          label={MATRIX_BLUEPRINT_LABELS[slotIndex as MatrixSlotIndex]}
        />
      )}
    />
  )
}
