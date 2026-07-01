import { useWorkspaceStore } from '../../store/workspaceStore'
import { STUDIO_BTN_SECONDARY, STUDIO_CANVAS_BG, STUDIO_SURFACE } from '../../lib/studioUiTokens'

export function StageIngestionOverlay() {
  const status = useWorkspaceStore((s) => s.ingestionStatus)
  const error = useWorkspaceStore((s) => s.ingestionError)
  const label = useWorkspaceStore((s) => s.ingestionLabel)
  const setIngestionStatus = useWorkspaceStore((s) => s.setIngestionStatus)

  if (status === 'idle') return null

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[100] flex items-center justify-center ${STUDIO_CANVAS_BG}/80 backdrop-blur-sm`}
    >
      <div className="pointer-events-auto max-w-md px-8 text-center">
        {status === 'processing' && (
          <p className="animate-pulse font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-300">
            {label}
          </p>
        )}

        {status === 'error' && (
          <div className={`space-y-4 border border-white/[0.08] ${STUDIO_SURFACE} px-6 py-5`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400/90">
              Segmentation failed
            </p>
            <p className="font-sans text-[12px] leading-relaxed text-zinc-400">{error}</p>
            <button
              type="button"
              className={STUDIO_BTN_SECONDARY}
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
