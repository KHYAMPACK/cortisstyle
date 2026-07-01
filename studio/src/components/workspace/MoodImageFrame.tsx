import {
  MOOD_CREATOR_TOP_PX,
  MOOD_FRAME_HEIGHT_PX,
  MOOD_FRAME_WIDTH_PX,
} from '../../lib/moodLayout'

interface MoodImageFrameProps {
  moodImageUrl: string | null
  showPlaceholder?: boolean
  className?: string
}

/** Mood frame — 3:4 portrait inset top-right on the artboard */
export function MoodImageFrame({
  moodImageUrl,
  showPlaceholder = false,
  className = 'absolute top-4 right-4 z-10',
}: MoodImageFrameProps) {
  if (!moodImageUrl && !showPlaceholder) return null

  return (
    <div
      aria-hidden={!moodImageUrl}
      className={`overflow-hidden border border-neutral-200/80 bg-neutral-50 ${className}`}
      style={{
        width: MOOD_FRAME_WIDTH_PX,
        height: MOOD_FRAME_HEIGHT_PX,
      }}
    >
      {moodImageUrl ? (
        <img
          src={moodImageUrl}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center font-mono text-[7px] leading-relaxed tracking-[0.12em] text-neutral-300 uppercase">
          Mood
        </div>
      )}
    </div>
  )
}

/** Creator credit centered below mood frame */
export function CreatorNameOverlay({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const trimmed = name.trim()
  if (!trimmed) return null

  return (
    <p
      aria-hidden
      className={`pointer-events-none absolute right-4 z-10 text-center font-serif text-[22px] font-semibold leading-none tracking-[-0.02em] text-neutral-950 uppercase ${className ?? ''}`}
      style={{
        top: MOOD_CREATOR_TOP_PX,
        width: MOOD_FRAME_WIDTH_PX,
      }}
    >
      {trimmed}
    </p>
  )
}
