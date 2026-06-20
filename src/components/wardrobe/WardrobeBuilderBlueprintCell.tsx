"use client";

interface WardrobeBuilderBlueprintCellProps {
  label: string;
  isEmpty: boolean;
}

function TechnicalCrosshair() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="relative h-5 w-5 opacity-40">
        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-neutral-300" />
        <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-neutral-300" />
      </div>
    </div>
  );
}

export function WardrobeBuilderBlueprintCell({
  label,
  isEmpty,
}: WardrobeBuilderBlueprintCellProps) {
  return (
    <div className="relative border border-neutral-100/40">
      {isEmpty ? (
        <>
          <TechnicalCrosshair />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              aria-hidden
              className="font-mono text-lg leading-none font-light text-neutral-200"
            >
              +
            </span>
          </div>
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-tighter whitespace-nowrap text-neutral-300 uppercase">
            {label}
          </span>
        </>
      ) : null}
    </div>
  );
}
