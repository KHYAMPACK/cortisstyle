import { useMemo } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { displayHeight } from '../../lib/canvasLayout'
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  MOODBOARD_FOOTER_HEIGHT_PX,
} from '../../lib/lookCanvasReference'
import { CreatorNameOverlay, MoodImageFrame } from '../workspace/MoodImageFrame'
import { STUDIO_LABEL, STUDIO_RULE, STUDIO_SECTION_TITLE_SM, STUDIO_SURFACE } from '../../lib/studioUiTokens'

/** Sidebar preview width — hero keeps 2:3 (420×630 ≡ 1700×2500) */
const PREVIEW_WIDTH = 248
const SCALE = PREVIEW_WIDTH / LOOK_CANVAS_REFERENCE_WIDTH
const PREVIEW_HERO_HEIGHT = PREVIEW_WIDTH * (LOOK_CANVAS_REFERENCE_HEIGHT / LOOK_CANVAS_REFERENCE_WIDTH)
const PREVIEW_FOOTER_HEIGHT = MOODBOARD_FOOTER_HEIGHT_PX * SCALE

interface LookCardPreviewProps {
  lookTitle: string
  vibe: string
  modelName: string
  moodImageUrl: string | null
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
 * Homepage look card preview — white 2:3 hero plus moodboard footer (preview-only).
 */
export function LookCardPreview({
  lookTitle,
  vibe,
  modelName,
  moodImageUrl,
}: LookCardPreviewProps) {
  const title = (lookTitle ?? '').trim() || 'Look name'
  const vibeText = (vibe ?? '').trim() || 'Look vibe'
  const creator = (modelName ?? '').trim() || 'Creator'

  return (
    <div className="space-y-3">
      <p className={STUDIO_LABEL}>Live Preview</p>

      <div
        className={`overflow-hidden border border-white/[0.08] ${STUDIO_SURFACE}`}
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

      <div className={`border ${STUDIO_RULE} ${STUDIO_SURFACE} px-3 py-3`}>
        <p className={STUDIO_SECTION_TITLE_SM}>{title}</p>
        <p className={`mt-1.5 ${STUDIO_LABEL}`}>{vibeText}</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
          By {creator}
        </p>
      </div>
    </div>
  )
}
