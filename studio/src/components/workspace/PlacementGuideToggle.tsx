import { useWorkspaceStore } from '../../store/workspaceStore'
import { STUDIO_CANVAS_CONTROL, STUDIO_CANVAS_CONTROL_LABEL } from '../../lib/studioUiTokens'

export function PlacementGuideToggle() {
  const showPlacementGuide = useWorkspaceStore((s) => s.showPlacementGuide)
  const setShowPlacementGuide = useWorkspaceStore((s) => s.setShowPlacementGuide)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={showPlacementGuide}
      className={`group flex items-center gap-3 ${STUDIO_CANVAS_CONTROL}`}
      onClick={() => setShowPlacementGuide(!showPlacementGuide)}
    >
      <span
        className={`${STUDIO_CANVAS_CONTROL_LABEL} ${
          showPlacementGuide
            ? 'text-jet-black'
            : 'text-neutral-400 group-hover:text-neutral-600'
        }`}
      >
        Placement guide
      </span>
      <span
        aria-hidden
        className={`relative inline-flex h-5 w-9 shrink-0 border border-jet-black transition-colors ${
          showPlacementGuide ? 'bg-jet-black' : 'bg-white'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 transition-transform duration-200 ${
            showPlacementGuide
              ? 'translate-x-[18px] bg-white'
              : 'translate-x-0.5 bg-jet-black'
          }`}
        />
      </span>
    </button>
  )
}
