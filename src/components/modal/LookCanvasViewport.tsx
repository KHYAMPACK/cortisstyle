import type { ReactNode } from "react";

interface LookCanvasViewportProps {
  children: ReactNode;
  allowBleed?: boolean;
  className?: string;
}

/**
 * Canonical LookCanvas parent chain — matches LookImagePanel view/edit framing
 * so resolveCanvasLayouts reads the same box model on homepage and wardrobe.
 *
 * Mobile uses the same 2:3 aspect as desktop so percentage coordinates resolve
 * identically. Desktop md:+ classes are unchanged.
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
      className={`relative isolate mx-auto aspect-[2/3] w-full min-w-0 max-w-full overflow-hidden bg-white md:mx-0 md:aspect-[2/3] md:h-full md:max-h-none md:w-auto md:overflow-visible ${className}`.trim()}
    >
      {/* Mobile: absolute inset-0 coordinate sandbox. Desktop: flex centering unchanged. */}
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-white md:relative md:flex md:h-full md:w-full md:items-center md:justify-center md:overflow-visible">
        <div
          className={`absolute inset-0 h-full w-full ${bleedClass} md:relative md:h-full md:w-full md:origin-center`}
        >
          <div className={`absolute inset-0 h-full w-full ${bleedClass} md:relative md:h-full md:w-full`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
