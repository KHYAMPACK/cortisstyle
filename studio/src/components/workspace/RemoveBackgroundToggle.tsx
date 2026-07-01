import { useWorkspaceStore } from '../../store/workspaceStore'

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
      className="group flex items-center gap-2.5 border border-white/[0.08] bg-[#141416]/80 px-3 py-2 backdrop-blur-md transition-all duration-300 hover:border-white/[0.14]"
      onClick={() => setRemoveBackgroundOnImport(!removeBackgroundOnImport)}
    >
      <span className="font-sans text-[11px] tracking-[0.04em] text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
        Remove background
      </span>
      <span
        className={`relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-300 ${
          removeBackgroundOnImport ? 'bg-white/90' : 'bg-zinc-700/80'
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full transition-all duration-300 ease-out ${
            removeBackgroundOnImport
              ? 'translate-x-[14px] bg-neutral-800'
              : 'translate-x-0 bg-zinc-400'
          }`}
        />
      </span>
    </button>
  )
}
