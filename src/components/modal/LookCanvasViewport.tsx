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
      {/* Desktop chain matches original verified layout exactly. */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white max-md:items-stretch max-md:justify-stretch md:overflow-visible">
        <div
          className={`relative h-full w-full max-md:absolute max-md:inset-0 md:origin-center ${bleedClass}`}
        >
          <div
            className={`relative h-full w-full max-md:absolute max-md:inset-0 ${bleedClass}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
