"use client";

import { motion, type PanInfo } from "framer-motion";
import type { RefObject } from "react";
import type { LookItem } from "@/types/look";
import { pointFromClient } from "@/lib/coordinates";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookHotspotProps {
  item: LookItem;
  isActive: boolean;
  isEditMode: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onSelect: (itemId: string) => void;
  onCoordinateChange: (
    itemId: string,
    point: "from" | "to",
    top: string,
    left: string,
  ) => void;
  animationDelay?: number;
}

export function LookHotspot({
  item,
  isActive,
  isEditMode,
  containerRef,
  onSelect,
  onCoordinateChange,
  animationDelay = 0.2,
}: LookHotspotProps) {
  const { to } = item.coordinates;

  const handleDrag = (_: unknown, info: PanInfo) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const { top, left } = pointFromClient(rect, info.point.x, info.point.y);
    onCoordinateChange(item.id, "to", top, left);
  };

  return (
    <motion.button
      type="button"
      aria-label={
        isEditMode ? `Drag indicator for ${item.name}` : `Highlight ${item.name}`
      }
      drag={isEditMode}
      dragMomentum={false}
      dragElastic={0}
      dragSnapToOrigin
      dragConstraints={containerRef}
      onDrag={handleDrag}
      onDragEnd={handleDrag}
      onClick={() => {
        if (!isEditMode) onSelect(item.id);
      }}
      initial={isEditMode ? false : { opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        isEditMode ? { duration: 0 } : { ...spring, delay: animationDelay }
      }
      style={{
        top: to.top,
        left: to.left,
      }}
      className={`group/hotspot absolute z-20 -translate-x-1/2 -translate-y-1/2 ${
        isEditMode ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {!isEditMode && (
        <motion.span
          aria-hidden
          animate={
            isActive
              ? { scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }
              : { scale: [1, 1.45, 1], opacity: [0.35, 0, 0.35] }
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-full border ${
            isActive ? "border-neutral-900" : "border-black/40"
          }`}
        />
      )}

      <motion.span
        animate={{ scale: isActive && !isEditMode ? 1.15 : 1 }}
        transition={spring}
        className={`relative flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
          isEditMode
            ? "h-8 w-8 border-2 border-white bg-red-500 text-white shadow-lg"
            : isActive
              ? "h-7 w-7 bg-neutral-900 text-white shadow-lg"
              : "h-7 w-7 bg-white/90 text-neutral-900 shadow-md group-hover/hotspot:bg-neutral-900 group-hover/hotspot:text-white"
        }`}
      >
        <span className="text-sm leading-none font-light">+</span>
      </motion.span>

      {!isEditMode && (
        <span
          className={`pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap px-2 py-1 font-serif text-[9px] tracking-[0.25em] uppercase opacity-0 transition-opacity duration-300 group-hover/hotspot:opacity-100 ${
            isActive ? "opacity-100" : ""
          } ${isActive ? "bg-neutral-900 text-white" : "bg-white/95 text-neutral-900 shadow-sm"}`}
        >
          {item.name}
        </span>
      )}

      {isEditMode && (
        <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap bg-red-500 px-2 py-1 font-mono text-[8px] tracking-wider text-white uppercase">
          {item.name}
        </span>
      )}
    </motion.button>
  );
}
