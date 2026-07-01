import { InfiniteCanvas } from '../components/workspace/InfiniteCanvas'
import { PropertiesPanel } from '../components/controls/PropertiesPanel'
import { GarmentLibraryPanel } from '../components/library/GarmentLibraryPanel'
import { ImportImageControl } from '../components/workspace/ImportImageControl'
import { RemoveBackgroundToggle } from '../components/workspace/RemoveBackgroundToggle'
import { useGarmentIngestion } from '../hooks/useGarmentIngestion'
import type { DraftSaveState } from '../hooks/useDraftAutosave'

interface CollageWorkspaceViewProps {
  userEmail: string | null
  onSignOut: () => void
  draftId: string | null
  saveState: DraftSaveState
  saveError: string | null
}

function saveStateLabel(state: DraftSaveState, error: string | null): string {
  switch (state) {
    case 'saving':
      return 'Saving…'
    case 'saved':
      return 'Saved'
    case 'dirty':
      return 'Unsaved changes'
    case 'error':
      return error ?? 'Save failed'
    default:
      return ''
  }
}

export function CollageWorkspaceView({
  userEmail,
  onSignOut,
  draftId,
  saveState,
  saveError,
}: CollageWorkspaceViewProps) {
  const { ingestFile } = useGarmentIngestion()
  const statusLabel = saveStateLabel(saveState, saveError)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0D0D0D] text-zinc-200">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0D0D0D]/90 px-6 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-4">
          <span className="font-sans text-[12px] font-medium tracking-[0.06em] text-zinc-400">
            Cortis Collage Builder
          </span>
          {statusLabel ? (
            <span className="hidden truncate font-sans text-[10px] tracking-[0.08em] text-zinc-600 sm:inline">
              {statusLabel}
              {draftId ? ` · ${draftId.slice(0, 8)}` : ''}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden font-sans text-[11px] normal-case tracking-normal text-zinc-600 sm:inline">
            Import file · drag-drop · paste image
          </span>
          {userEmail ? (
            <span className="hidden max-w-[180px] truncate font-sans text-[10px] text-zinc-500 md:inline">
              {userEmail}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onSignOut}
            className="font-sans text-[10px] uppercase tracking-[0.12em] text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Sign out
          </button>
          <RemoveBackgroundToggle />
          <ImportImageControl onImportFile={ingestFile} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <GarmentLibraryPanel />

        <main className="relative min-w-0 flex-1">
          <InfiniteCanvas onImportFile={ingestFile} />
        </main>

        <PropertiesPanel />
      </div>
    </div>
  )
}
