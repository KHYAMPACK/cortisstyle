"use client";

import Image from "next/image";

const LOGO_SRC = "/brand/cortisstyle-logo-light.png";

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
        src={LOGO_SRC}
        alt=""
        width={1024}
        height={1024}
        unoptimized
        className={`h-[min(56%,22rem)] w-auto select-none ${
          onDarkCanvas ? "opacity-[0.1]" : "opacity-[0.07] invert"
        }`}
      />
    </div>
  );
}
