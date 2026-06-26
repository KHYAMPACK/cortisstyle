"use client";

interface WardrobeMoodImageFrameProps {
  moodImageUrl: string | null;
  showPlaceholder?: boolean;
  imagePriority?: boolean;
}

export function WardrobeMoodImageFrame({
  moodImageUrl,
  showPlaceholder = false,
  imagePriority = false,
}: WardrobeMoodImageFrameProps) {
  if (!moodImageUrl && !showPlaceholder) {
    return null;
  }

  const isEmpty = moodImageUrl === null;

  return (
    <div
      data-mood-image-frame
      data-mood-image-src={moodImageUrl ?? undefined}
      aria-hidden={isEmpty}
      className={`absolute top-4 right-4 z-10 aspect-[3/4] w-[120px] overflow-hidden border border-neutral-100 bg-neutral-50 ${
        isEmpty ? "pointer-events-none" : "pointer-events-auto"
      }`}
    >
      {moodImageUrl ? (
        <img
          src={moodImageUrl}
          alt=""
          data-mood-image
          decoding="sync"
          loading={imagePriority ? "eager" : "lazy"}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center font-mono text-[8px] leading-relaxed tracking-[0.14em] text-neutral-300 uppercase">
          + ADD MOOD IMAGE
        </div>
      )}
    </div>
  );
}
