interface WardrobeBuilderSlotProps {
  label: string;
  item: null;
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

export function WardrobeBuilderSlot({ label, item }: WardrobeBuilderSlotProps) {
  const isEmpty = item === null;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden border border-neutral-100">
      {isEmpty ? (
        <>
          <TechnicalCrosshair />
          <span
            aria-hidden
            className="font-mono text-lg leading-none font-light text-neutral-200"
          >
            +
          </span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-tighter whitespace-nowrap text-neutral-300 uppercase">
            {label}
          </span>
        </>
      ) : null}
    </div>
  );
}
