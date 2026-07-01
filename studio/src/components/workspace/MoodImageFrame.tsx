interface MoodImageFrameProps {
  moodImageUrl: string | null
  showPlaceholder?: boolean
  className?: string
}

/** 120×160 mood frame — mirrors cortisstyle `WardrobeMoodImageFrame` */
export function MoodImageFrame({
  moodImageUrl,
  showPlaceholder = false,
  className = 'absolute top-4 right-4 z-10',
}: MoodImageFrameProps) {
  if (!moodImageUrl && !showPlaceholder) return null

  return (
    <div
      aria-hidden={!moodImageUrl}
      className={`aspect-[3/4] w-[120px] overflow-hidden border border-neutral-200/80 bg-neutral-50 ${className}`}
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

/** Creator credit below mood frame — mirrors cortis homepage look card */
export function CreatorNameOverlay({
  name,
  className = 'absolute top-[184px] right-4 z-10 w-[120px]',
}: {
  name: string
  className?: string
}) {
  const trimmed = name.trim()
  if (!trimmed) return null

  return (
    <p
      aria-hidden
      className={`pointer-events-none text-right font-serif text-[22px] font-semibold leading-none tracking-[-0.02em] text-neutral-950 uppercase ${className}`}
    >
      {trimmed}
    </p>
  )
}
