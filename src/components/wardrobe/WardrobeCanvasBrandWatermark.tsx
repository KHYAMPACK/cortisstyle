"use client";

import Image from "next/image";

const WATERMARK_SRC = "/brand/cortisstyle-logo-light.png";

export function WardrobeCanvasBrandWatermark({
  onDarkCanvas = false,
}: {
  onDarkCanvas?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden"
    >
      <Image
        src={WATERMARK_SRC}
        alt=""
        width={512}
        height={512}
        className={`h-[min(48%,18rem)] w-auto select-none ${
          onDarkCanvas ? "opacity-[0.1] invert" : "opacity-[0.07]"
        }`}
      />
    </div>
  );
}
