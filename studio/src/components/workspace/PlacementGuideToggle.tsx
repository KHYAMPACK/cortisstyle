import { useWorkspaceStore } from '../../store/workspaceStore'

export function PlacementGuideToggle() {
  const showPlacementGuide = useWorkspaceStore((s) => s.showPlacementGuide)
  const setShowPlacementGuide = useWorkspaceStore((s) => s.setShowPlacementGuide)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={showPlacementGuide}
      className="group flex items-center gap-2.5 border border-white/[0.08] bg-[#141416]/80 px-3 py-2 backdrop-blur-md transition-all duration-300 hover:border-white/[0.14]"
      onClick={() => setShowPlacementGuide(!showPlacementGuide)}
    >
      <span className="font-sans text-[11px] tracking-[0.04em] text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
        Placement guide
      </span>
      <span
        className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-300 ${
          showPlacementGuide ? 'bg-white/90' : 'bg-zinc-700/80'
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full transition-all duration-300 ease-out ${
            showPlacementGuide
              ? 'translate-x-[14px] bg-neutral-800'
              : 'translate-x-0 bg-zinc-400'
          }`}
        />
      </span>
    </button>
  )
}
