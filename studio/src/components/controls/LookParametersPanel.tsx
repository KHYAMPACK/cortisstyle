import { useWorkspaceStore } from '../../store/workspaceStore'
import { LookCardPreview } from './LookCardPreview'
import {
  STUDIO_INPUT,
  STUDIO_KICKER,
  STUDIO_LABEL,
  STUDIO_RULE,
  STUDIO_SECTION_TITLE_SM,
} from '../../lib/studioUiTokens'

export function LookParametersPanel() {
  const lookParams = useWorkspaceStore((s) => s.lookParams)
  const setLookParams = useWorkspaceStore((s) => s.setLookParams)

  return (
    <div className="space-y-6">
      <div>
        <p className={STUDIO_KICKER}>Export Metadata</p>
        <p className={`mt-1 ${STUDIO_SECTION_TITLE_SM}`}>About This Look</p>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-meta">
          These fields are written into your JSON files and appear on the exported look card.
        </p>
      </div>

      <div className="space-y-0">
        <label className={`block border-b ${STUDIO_RULE} py-2.5`}>
          <span className={STUDIO_LABEL}>Look Name</span>
          <input
            className={STUDIO_INPUT}
            value={lookParams.lookTitle}
            onChange={(e) => setLookParams({ lookTitle: e.target.value })}
            placeholder="Look 01 — Monochrome Silence"
          />
        </label>

        <label className={`block border-b ${STUDIO_RULE} py-2.5`}>
          <span className={STUDIO_LABEL}>Look Vibe</span>
          <input
            className={STUDIO_INPUT}
            value={lookParams.vibe}
            onChange={(e) => setLookParams({ vibe: e.target.value })}
            placeholder="Quiet Luxury / Monochrome"
          />
        </label>

        <label className={`block border-b ${STUDIO_RULE} py-2.5`}>
          <span className={STUDIO_LABEL}>By Who</span>
          <input
            className={STUDIO_INPUT}
            value={lookParams.modelName}
            onChange={(e) => setLookParams({ modelName: e.target.value })}
            placeholder="Juhoon"
          />
        </label>
      </div>

      <LookCardPreview
        lookTitle={lookParams.lookTitle}
        vibe={lookParams.vibe}
        modelName={lookParams.modelName}
      />
    </div>
  )
}
