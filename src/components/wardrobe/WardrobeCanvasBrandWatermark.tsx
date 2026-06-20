"use client";

export function WardrobeCanvasBrandWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden"
    >
      <p className="select-none font-mono text-[26px] tracking-[0.55em] text-neutral-900 opacity-[0.06] uppercase">
        C O R T I S S T Y L E
      </p>
    </div>
  );
}
