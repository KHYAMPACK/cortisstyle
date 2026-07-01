import { useWorkspaceStore } from '../../store/workspaceStore'
import { STUDIO_CANVAS_CONTROL, STUDIO_CANVAS_CONTROL_LABEL } from '../../lib/studioUiTokens'

export function RemoveBackgroundToggle() {
  const removeBackgroundOnImport = useWorkspaceStore((s) => s.removeBackgroundOnImport)
  const setRemoveBackgroundOnImport = useWorkspaceStore((s) => s.setRemoveBackgroundOnImport)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={removeBackgroundOnImport}
      title={
        removeBackgroundOnImport
          ? 'Photoroom will cut out the background on import'
          : 'Import image as-is — for PNGs that already have no background'
      }
      className={`group flex items-center gap-3 ${STUDIO_CANVAS_CONTROL}`}
      onClick={() => setRemoveBackgroundOnImport(!removeBackgroundOnImport)}
    >
      <span
        className={`${STUDIO_CANVAS_CONTROL_LABEL} ${
          removeBackgroundOnImport
            ? 'text-jet-black'
            : 'text-neutral-400 group-hover:text-neutral-600'
        }`}
      >
        Remove background
      </span>
      <span
        aria-hidden
        className={`relative inline-flex h-5 w-9 shrink-0 border border-jet-black transition-colors ${
          removeBackgroundOnImport ? 'bg-jet-black' : 'bg-white'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 transition-transform duration-200 ${
            removeBackgroundOnImport
              ? 'translate-x-[18px] bg-white'
              : 'translate-x-0.5 bg-jet-black'
          }`}
        />
      </span>
    </button>
  )
}
