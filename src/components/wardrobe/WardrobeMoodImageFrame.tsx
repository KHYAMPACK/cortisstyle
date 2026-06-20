"use client";

import Image from "next/image";

interface WardrobeMoodImageFrameProps {
  moodImageUrl: string | null;
  showPlaceholder?: boolean;
}

export function WardrobeMoodImageFrame({
  moodImageUrl,
  showPlaceholder = false,
}: WardrobeMoodImageFrameProps) {
  if (!moodImageUrl && !showPlaceholder) {
    return null;
  }

  const isEmpty = moodImageUrl === null;

  return (
    <div
      aria-hidden={isEmpty}
      className={`absolute top-4 right-4 z-10 aspect-[3/4] w-[120px] overflow-hidden border border-neutral-100 bg-neutral-50 object-cover ${
        isEmpty ? "pointer-events-none" : "pointer-events-auto"
      }`}
    >
      {moodImageUrl ? (
        <Image
          src={moodImageUrl}
          alt=""
          fill
          unoptimized
          sizes="120px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center font-mono text-[8px] leading-relaxed tracking-[0.14em] text-neutral-300 uppercase">
          + ADD MOOD IMAGE
        </div>
      )}
    </div>
  );
}
