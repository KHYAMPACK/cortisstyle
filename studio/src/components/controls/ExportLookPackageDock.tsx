import { useCallback, useState } from 'react'
import { useWorkspaceStore, resolveLinkedGarments } from '../../store/workspaceStore'
import { exportLookPackageZip, resolveOutfitId } from '../../lib/exportLookPackage'
import { LOOK_CARD_FULL_EXPORT_HEIGHT } from '../../lib/exportLookCardCanvas'
import {
  LOOK_HERO_EXPORT_HEIGHT,
  LOOK_HERO_EXPORT_WIDTH,
} from '../../lib/lookCanvasReference'
import { STUDIO_BTN_PRIMARY, STUDIO_LABEL } from '../../lib/studioUiTokens'

const PACKAGE_FILES = [
  '{outfitId}.json — look metadata + canvas layout',
  '{outfitId}-items.json — item definitions',
  'images/look-card.png — full look card with footer',
  `images/hero.png — ${LOOK_HERO_EXPORT_WIDTH}×${LOOK_HERO_EXPORT_HEIGHT} hero (2:3)`,
  'images/{itemId}.png — one cutout per garment',
] as const

export function ExportLookPackageDock() {
  const assignNewLookId = useWorkspaceStore((s) => s.assignNewLookId)
  const outfitId = useWorkspaceStore((s) => s.lookParams.outfitId)

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

  const previewOutfitId = outfitId || 'outfit-xx'

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

      <div className="space-y-2">
        <p className={STUDIO_LABEL}>Package includes</p>
        <ul className="space-y-1.5 font-sans text-[11px] leading-relaxed text-meta">
          {PACKAGE_FILES.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="text-blueprint-accent">
                ·
              </span>
              <span>{line.replace('{outfitId}', previewOutfitId)}</span>
            </li>
          ))}
        </ul>
        <p className="font-sans text-[11px] leading-relaxed text-meta">
          Look card is rendered at {LOOK_HERO_EXPORT_WIDTH}×{LOOK_HERO_EXPORT_HEIGHT} (2:3 hero)
          {` + ${LOOK_CARD_FULL_EXPORT_HEIGHT - LOOK_HERO_EXPORT_HEIGHT}px footer`} in
          look-card.png. Mood image and creator name appear when set in the preview panel.
        </p>
      </div>

      {status ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-meta">{status}</p>
      ) : null}
    </div>
  )
}
