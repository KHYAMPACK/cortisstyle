"use client";

import { motion, type PanInfo } from "framer-motion";
import type { RefObject } from "react";
import type { LookItem } from "@/types/look";
import { parsePercent, pointFromClient } from "@/lib/coordinates";
import { LookHotspot } from "@/components/modal/LookHotspot";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookHotspotLayerProps {
  items: LookItem[];
  activeItemId: string | null;
  containerRef: RefObject<HTMLDivElement | null>;
  isEditMode: boolean;
  onSelectItem: (itemId: string) => void;
  onCoordinateChange: (
    itemId: string,
    point: "from" | "to",
    top: string,
    left: string,
  ) => void;
}

function handleDragUpdate(
  container: HTMLDivElement | null,
  info: PanInfo,
  itemId: string,
  point: "from" | "to",
  onCoordinateChange: LookHotspotLayerProps["onCoordinateChange"],
) {
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const { top, left } = pointFromClient(rect, info.point.x, info.point.y);
  onCoordinateChange(itemId, point, top, left);
}

export function LookHotspotLayer({
  items,
  activeItemId,
  containerRef,
  isEditMode,
  onSelectItem,
  onCoordinateChange,
}: LookHotspotLayerProps) {
  return (
    <>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {items.map((item, index) => {
          const isActive = activeItemId === item.id;
          const { from, to } = item.coordinates;

          return (
            <motion.line
              key={`line-${item.id}`}
              x1={parsePercent(from.left)}
              y1={parsePercent(from.top)}
              x2={parsePercent(to.left)}
              y2={parsePercent(to.top)}
              stroke="currentColor"
              strokeWidth={isEditMode ? 0.35 : 0.2}
              vectorEffect="non-scaling-stroke"
              className={
                isEditMode
                  ? "text-blue-500/70"
                  : isActive
                    ? "text-black/60"
                    : "text-black/30"
              }
              initial={isEditMode ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={
                isEditMode
                  ? { duration: 0 }
                  : {
                      pathLength: {
                        duration: 0.7,
                        delay: 0.15 + index * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: { duration: 0.3, delay: 0.15 + index * 0.08 },
                    }
              }
            />
          );
        })}
      </svg>

      {items.map((item, index) => (
        <motion.div
          key={`origin-${item.id}`}
          drag={isEditMode}
          dragMomentum={false}
          dragElastic={0}
          dragSnapToOrigin
          dragConstraints={containerRef}
          onDrag={(_, info) =>
            handleDragUpdate(
              containerRef.current,
              info,
              item.id,
              "from",
              onCoordinateChange,
            )
          }
          onDragEnd={(_, info) =>
            handleDragUpdate(
              containerRef.current,
              info,
              item.id,
              "from",
              onCoordinateChange,
            )
          }
          initial={isEditMode ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            isEditMode ? { duration: 0 } : { ...spring, delay: 0.2 + index * 0.08 }
          }
          style={{
            top: item.coordinates.from.top,
            left: item.coordinates.from.left,
          }}
          className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            isEditMode
              ? "h-4 w-4 cursor-grab border-2 border-white bg-blue-500 shadow-md active:cursor-grabbing"
              : `h-1 w-1 ${
                  activeItemId === item.id ? "bg-neutral-900" : "bg-black/70"
                }`
          }`}
          aria-label={isEditMode ? `Drag origin for ${item.name}` : undefined}
        />
      ))}

      {items.map((item, index) => (
        <LookHotspot
          key={item.id}
          item={item}
          isActive={activeItemId === item.id}
          isEditMode={isEditMode}
          containerRef={containerRef}
          onSelect={onSelectItem}
          onCoordinateChange={onCoordinateChange}
          animationDelay={isEditMode ? 0 : 0.25 + index * 0.08}
        />
      ))}
    </>
  );
}
