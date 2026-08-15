"use client";

import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

const ZOOM_SCALE = 2.4;

export function useFinePointerHover() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return enabled;
}

interface TrProductHoverZoomProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Desktop (fine pointer): the photo magnifies under the cursor.
 * Touch: no hover zoom — expand/lightbox is the mobile path.
 */
export function TrProductHoverZoom({
  children,
  className = "",
  disabled = false,
}: TrProductHoverZoomProps) {
  const fineHover = useFinePointerHover();
  const active = fineHover && !disabled;
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const onMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!active) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setOrigin({
        x: Math.min(
          100,
          Math.max(0, ((event.clientX - rect.left) / rect.width) * 100),
        ),
        y: Math.min(
          100,
          Math.max(0, ((event.clientY - rect.top) / rect.height) * 100),
        ),
      });
      setZoomed(true);
    },
    [active],
  );

  const onLeave = useCallback(() => setZoomed(false), []);

  return (
    <div
      className={`h-full w-full overflow-hidden ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="relative h-full w-full"
        style={
          active
            ? {
                transform: zoomed ? `scale(${ZOOM_SCALE})` : "scale(1)",
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transition: zoomed
                  ? "none"
                  : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: zoomed ? "transform" : undefined,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
