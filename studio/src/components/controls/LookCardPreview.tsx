import { useCallback, useMemo, useRef } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { displayHeight } from '../../lib/canvasLayout'
import {
  LOOK_HERO_EXPORT_HEIGHT,
  LOOK_HERO_EXPORT_WIDTH,
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  MOODBOARD_FOOTER_HEIGHT_PX,
} from '../../lib/lookCanvasReference'
import { CreatorNameOverlay, MoodImageFrame } from '../workspace/MoodImageFrame'
import {
  STUDIO_KICKER,
  STUDIO_LABEL,
  STUDIO_RULE,
  STUDIO_SURFACE,
  STUDIO_SURFACE_BLUEPRINT,
} from '../../lib/studioUiTokens'

/** Sidebar preview width — hero keeps 2:3 (420×630 ≡ 1700×2500) */
const PREVIEW_WIDTH = 248
const SCALE = PREVIEW_WIDTH / LOOK_CANVAS_REFERENCE_WIDTH
const PREVIEW_HERO_HEIGHT = PREVIEW_WIDTH * (LOOK_CANVAS_REFERENCE_HEIGHT / LOOK_CANVAS_REFERENCE_WIDTH)
const PREVIEW_FOOTER_HEIGHT = MOODBOARD_FOOTER_HEIGHT_PX * SCALE

interface LookCardPreviewProps {
  lookTitle: string
  vibe: string
  modelName: string
}

async function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read mood image'))
    reader.readAsDataURL(file)
  })
}

function PreviewGarmentLayers() {
  const artboardItems = useWorkspaceStore((s) => s.artboardItems)

  const sorted = useMemo(
    () => [...artboardItems].sort((a, b) => a.zIndex - b.zIndex),
    [artboardItems],
  )

  if (sorted.length === 0) return null

  return (
    <>
      {sorted.map((item) => {
        const height = displayHeight(item)
        return (
          <img
            key={item.id}
            src={item.imageUrl}
            alt=""
            draggable={false}
            className="pointer-events-none absolute object-contain object-left-top"
            style={{
              left: item.x,
              top: item.y,
              width: item.widthPx,
              height,
              zIndex: item.zIndex,
            }}
          />
        )
      })}
    </>
  )
}

/**
 * Homepage look card reference — visual only. Export package is JSON + garment PNGs.
 */
export function LookCardPreview({ lookTitle, vibe, modelName }: LookCardPreviewProps) {
  const moodImageUrl = useWorkspaceStore((s) => s.lookParams.moodImageUrl)
  const setLookParams = useWorkspaceStore((s) => s.setLookParams)
  const fileRef = useRef<HTMLInputElement>(null)

  const onMoodFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      const dataUrl = await readImageFile(file)
      setLookParams({ moodImageUrl: dataUrl })
    },
    [setLookParams],
  )

  const title = (lookTitle ?? '').trim() || 'Look name'
  const creator = (modelName ?? '').trim() || 'Creator'

  return (
    <div className="space-y-3 border-t border-blueprint-border pt-5">
      <div>
        <p className={STUDIO_KICKER}>Look Card Export</p>
        <p className={`mt-1 ${STUDIO_LABEL}`}>Included in look-card.png export</p>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-meta">
          Renders at {LOOK_HERO_EXPORT_WIDTH}×{LOOK_HERO_EXPORT_HEIGHT} (2:3) plus moodboard
          footer. Matches the homepage look card layout.
        </p>
      </div>

      <div className="space-y-2">
        <span className={STUDIO_LABEL}>Mood image (optional)</span>
        <div
          className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center border border-dashed border-blueprint-border ${STUDIO_SURFACE_BLUEPRINT} p-3 text-center transition-colors hover:border-blueprint-accent`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void onMoodFile(e.dataTransfer.files[0] ?? null)
          }}
          onClick={() => fileRef.current?.click()}
        >
          {moodImageUrl ? (
            <img
              src={moodImageUrl}
              alt="Mood preview"
              className="max-h-20 max-w-full object-contain"
            />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-meta">
              Drop mood image for preview
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
        {moodImageUrl ? (
          <button
            type="button"
            className="font-mono text-[9px] uppercase tracking-[0.2em] text-meta transition-colors hover:text-jet-black"
            onClick={() => setLookParams({ moodImageUrl: null })}
          >
            Clear mood preview
          </button>
        ) : null}
      </div>

      <div
        className={`overflow-hidden border border-blueprint-border ${STUDIO_SURFACE}`}
        style={{ width: PREVIEW_WIDTH }}
      >
        <div
          className="relative overflow-hidden bg-white"
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_HERO_HEIGHT }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left bg-white"
            style={{
              width: LOOK_CANVAS_REFERENCE_WIDTH,
              height: LOOK_CANVAS_REFERENCE_HEIGHT,
              transform: `scale(${SCALE})`,
            }}
          >
            <div className="absolute inset-0 z-0" aria-hidden>
              <MoodImageFrame
                moodImageUrl={moodImageUrl}
                showPlaceholder={!moodImageUrl}
                className="absolute top-4 right-4"
              />
              <CreatorNameOverlay
                name={creator}
                className="absolute top-[184px] right-4 w-[120px]"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 z-10">
              <PreviewGarmentLayers />
            </div>
          </div>
        </div>

        <footer
          className="flex items-center justify-between border-t border-blueprint-border bg-gradient-to-b from-[#FAFAFA] to-[#F4F4F4] px-3 font-sans uppercase text-neutral-600"
          style={{ height: PREVIEW_FOOTER_HEIGHT }}
        >
          <span className="max-w-[55%] truncate text-[7px] tracking-[0.14em] text-neutral-700">
            {title}
          </span>
          <span className="shrink-0 text-[6px] tracking-[0.24em] text-neutral-400">
            BUILD YOUR OWN / CORTISSTYLE.COM
          </span>
        </footer>
      </div>

      {(vibe ?? '').trim() ? (
        <p className={`border ${STUDIO_RULE} ${STUDIO_SURFACE} px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-meta`}>
          {(vibe ?? '').trim()}
        </p>
      ) : null}
    </div>
  )
}
