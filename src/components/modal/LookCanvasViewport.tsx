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
  return (
    <div
      className={`relative mx-auto aspect-[4/5] w-full max-w-full max-h-[62vh] overflow-hidden bg-white md:mx-0 md:aspect-[2/3] md:h-full md:max-h-none md:w-auto md:overflow-visible ${className}`.trim()}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white md:overflow-visible">
        <div
          className={`relative h-full w-full origin-center max-md:scale-[0.92] ${
            allowBleed
              ? "overflow-hidden md:overflow-visible"
              : "overflow-hidden"
          }`}
        >
          <div
            className={`relative h-full w-full ${
              allowBleed
                ? "overflow-hidden md:overflow-visible"
                : "overflow-hidden"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
