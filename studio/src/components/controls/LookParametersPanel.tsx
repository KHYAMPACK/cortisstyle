import { useCallback, useRef } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { LookCardPreview } from './LookCardPreview'
import {
  STUDIO_INPUT,
  STUDIO_KICKER,
  STUDIO_LABEL,
  STUDIO_RULE,
  STUDIO_SECTION_TITLE_SM,
  STUDIO_SURFACE_BLUEPRINT,
} from '../../lib/studioUiTokens'
import { uploadDataUrlAsset } from '../../lib/studioApi'

async function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read mood image'))
    reader.readAsDataURL(file)
  })
}

export function LookParametersPanel() {
  const lookParams = useWorkspaceStore((s) => s.lookParams)
  const draftId = useWorkspaceStore((s) => s.draftId)
  const setLookParams = useWorkspaceStore((s) => s.setLookParams)
  const fileRef = useRef<HTMLInputElement>(null)

  const onMoodFile = useCallback(
    async (file: File | null) => {
      if (!file) return

      const dataUrl = await readImageFile(file)
      setLookParams({ moodImageUrl: dataUrl })

      try {
        const url = await uploadDataUrlAsset({
          dataUrl,
          itemId: 'mood-image',
          draftId,
        })
        setLookParams({ moodImageUrl: url })
      } catch (error) {
        console.warn('[mood-image] CDN upload skipped:', error)
      }
    },
    [draftId, setLookParams],
  )

  return (
    <div className="space-y-6">
      <div>
        <p className={STUDIO_KICKER}>Look Metadata</p>
        <p className={`mt-1 ${STUDIO_SECTION_TITLE_SM}`}>About This Look</p>
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

      <div className="space-y-2">
        <span className={STUDIO_LABEL}>Mood Image</span>
        <div
          className={`flex min-h-[80px] cursor-pointer flex-col items-center justify-center border border-dashed border-blueprint-border ${STUDIO_SURFACE_BLUEPRINT} p-3 text-center transition-colors hover:border-blueprint-accent`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void onMoodFile(e.dataTransfer.files[0] ?? null)
          }}
          onClick={() => fileRef.current?.click()}
        >
          {lookParams.moodImageUrl ? (
            <img
              src={lookParams.moodImageUrl}
              alt="Mood preview"
              className="max-h-24 max-w-full object-contain"
            />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-meta">
              Drop mood image or click to upload
            </span>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            void onMoodFile(e.target.files?.[0] ?? null)
          }}
        />
      </div>

      <LookCardPreview
        lookTitle={lookParams.lookTitle}
        vibe={lookParams.vibe}
        modelName={lookParams.modelName}
        moodImageUrl={lookParams.moodImageUrl}
      />
    </div>
  )
}
