import type { ReactNode } from "react";

interface LookCanvasViewportProps {
  children: ReactNode;
  allowBleed?: boolean;
  className?: string;
}

/**
 * Canonical LookCanvas parent chain — matches LookImagePanel view/edit framing
 * so resolveCanvasLayouts reads the same box model on homepage and wardrobe.
 */
export function LookCanvasViewport({
  children,
  allowBleed = false,
  className = "",
}: LookCanvasViewportProps) {
  const bleedClass = allowBleed
    ? "overflow-hidden md:overflow-visible"
    : "overflow-hidden";

  return (
    <div
      className={`relative mx-auto aspect-[2/3] w-full min-w-0 max-w-full max-md:max-w-[min(100%,272px)] overflow-hidden bg-white md:mx-0 md:aspect-[2/3] md:h-full md:max-h-none md:max-w-full md:w-auto md:overflow-visible ${className}`.trim()}
    >
      {/*
        Mobile: absolute inset-0 sandbox pinned to the aspect-ratio box so % coords
        resolve against the full frame (flex children must not collapse height).
        Desktop: original verified flex centering chain.
      */}
      <div className="max-md:absolute max-md:inset-0 max-md:h-full max-md:w-full overflow-hidden bg-white md:relative md:flex md:h-full md:w-full md:items-center md:justify-center md:overflow-visible">
        <div
          className={`relative h-full w-full ${bleedClass} md:origin-center`}
        >
          <div className={`relative h-full w-full ${bleedClass}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
