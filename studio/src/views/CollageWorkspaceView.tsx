import { InfiniteCanvas } from '../components/workspace/InfiniteCanvas'
import { PropertiesPanel } from '../components/controls/PropertiesPanel'
import { GarmentLibraryPanel } from '../components/library/GarmentLibraryPanel'
import { useGarmentIngestion } from '../hooks/useGarmentIngestion'
import type { DraftSaveState } from '../hooks/useDraftAutosave'
import {
  STUDIO_CHROME_BG,
  STUDIO_BTN_GHOST,
  STUDIO_KICKER,
  STUDIO_LABEL,
  STUDIO_RULE,
  STUDIO_SECTION_TITLE,
} from '../lib/studioUiTokens'

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
    <div className={`flex h-screen w-screen flex-col overflow-hidden ${STUDIO_CHROME_BG} text-zinc-200`}>
      <header
        className={`flex h-14 shrink-0 items-center justify-between border-b ${STUDIO_RULE} ${STUDIO_CHROME_BG} px-5 md:px-6`}
      >
        <div className="flex min-w-0 items-center gap-5">
          <div>
            <p className={STUDIO_KICKER}>Lookbook Studio // Collage</p>
            <h1 className={`mt-1 ${STUDIO_SECTION_TITLE}`}>Outfit Builder</h1>
          </div>
          {statusLabel ? (
            <span className={`hidden truncate sm:inline ${STUDIO_LABEL}`}>
              {statusLabel}
              {draftId ? ` · ${draftId.slice(0, 8)}` : ''}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <span className={`hidden lg:inline ${STUDIO_LABEL}`}>
            Drag-drop · paste on canvas
          </span>
          {userEmail ? (
            <span className="hidden max-w-[180px] truncate font-sans text-[11px] text-zinc-500 md:inline">
              {userEmail}
            </span>
          ) : null}
          <button type="button" onClick={onSignOut} className={STUDIO_BTN_GHOST}>
            Sign out
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <GarmentLibraryPanel onImportFile={ingestFile} />

        <main className="relative min-w-0 flex-1">
          <InfiniteCanvas onImportFile={ingestFile} />
        </main>

        <PropertiesPanel />
      </div>
    </div>
  )
}
