import { useWorkspaceStore } from '../../store/workspaceStore'

const DELETE_BTN_SIZE = 16

export function FabricArtboardControls() {
  const selectedGarmentId = useWorkspaceStore((s) => s.selectedGarmentId)
  const layout = useWorkspaceStore((s) =>
    s.artboardItems.find((item) => item.id === selectedGarmentId),
  )
  const removeLinkedGarment = useWorkspaceStore((s) => s.removeLinkedGarment)

  if (!selectedGarmentId || !layout) return null

  return (
    <button
      type="button"
      className="pointer-events-auto absolute z-30 flex items-center justify-center border border-black/15 bg-white/95 font-mono text-[11px] leading-none text-neutral-500 shadow-sm transition-all duration-300 hover:border-red-300/80 hover:bg-red-600 hover:text-white"
      style={{
        left: layout.x + layout.widthPx - DELETE_BTN_SIZE / 2,
        top: layout.y - DELETE_BTN_SIZE / 2,
        width: DELETE_BTN_SIZE,
        height: DELETE_BTN_SIZE,
      }}
      title="Delete garment"
      aria-label="Delete garment"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => removeLinkedGarment(selectedGarmentId)}
    >
      ×
    </button>
  )
}
