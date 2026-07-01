import { useCallback, useState } from 'react'
import { useWorkspaceStore, resolveLinkedGarments } from '../../store/workspaceStore'
import { exportLookPackageZip, resolveOutfitId } from '../../lib/exportLookPackage'
import { STUDIO_BTN_PRIMARY } from '../../lib/studioUiTokens'

export function ExportLookPackageDock() {
  const assignNewLookId = useWorkspaceStore((s) => s.assignNewLookId)

  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleExportAll = useCallback(async () => {
    setBusy(true)
    setStatus(null)
    try {
      const exportId = assignNewLookId()
      const state = useWorkspaceStore.getState()
      const linked = resolveLinkedGarments(state.studioNodes, state.artboardItems)
      await exportLookPackageZip(exportId, state.lookParams, linked)
      const exportedOutfitId = resolveOutfitId(exportId, state.lookParams.outfitId)
      setStatus(`Ready — send ${exportedOutfitId}-package.zip`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }, [assignNewLookId])

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        className={STUDIO_BTN_PRIMARY}
        onClick={() => void handleExportAll()}
      >
        {busy ? 'Packaging…' : 'Download Outfit Package'}
      </button>

      <p className="font-sans text-[11px] normal-case leading-relaxed tracking-normal text-zinc-600">
        Downloads a zip with your layout, item details, and garment cutouts. Send the file to
        Cortisstyle when you are done.
      </p>

      {status && (
        <p className="font-sans text-[11px] normal-case tracking-normal text-zinc-500">
          {status}
        </p>
      )}
    </div>
  )
}
