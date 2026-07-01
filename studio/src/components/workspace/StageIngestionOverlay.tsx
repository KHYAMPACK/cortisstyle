import { useWorkspaceStore } from '../../store/workspaceStore'

export function StageIngestionOverlay() {
  const status = useWorkspaceStore((s) => s.ingestionStatus)
  const error = useWorkspaceStore((s) => s.ingestionError)
  const label = useWorkspaceStore((s) => s.ingestionLabel)
  const setIngestionStatus = useWorkspaceStore((s) => s.setIngestionStatus)

  if (status === 'idle') return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[100] flex items-center justify-center bg-[#0D0D0D]/80 backdrop-blur-sm">
      <div className="pointer-events-auto max-w-md px-8 text-center">
        {status === 'processing' && (
          <p className="animate-pulse font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            {label}
          </p>
        )}

        {status === 'error' && (
          <div className="space-y-4 border border-white/[0.06] bg-[#141416]/90 px-6 py-5 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-400/90">
              Segmentation failed
            </p>
            <p className="font-mono text-[11px] normal-case leading-relaxed tracking-normal text-zinc-500">
              {error}
            </p>
            <button
              type="button"
              className="border border-white/[0.1] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400 transition-all duration-300 hover:border-white/25 hover:bg-white hover:text-black"
              onClick={() => setIngestionStatus('idle')}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
