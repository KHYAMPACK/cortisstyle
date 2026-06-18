"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import type { LookItem } from "@/types/look";
import { LookHotspotLayer } from "@/components/modal/LookHotspotLayer";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookImagePanelProps {
  image: string;
  title: string;
  items: LookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  onSelectItem: (itemId: string) => void;
  onCoordinateChange: (
    itemId: string,
    point: "from" | "to",
    top: string,
    left: string,
  ) => void;
}

export function LookImagePanel({
  image,
  title,
  items,
  activeItemId,
  isEditMode,
  onSelectItem,
  onCoordinateChange,
}: LookImagePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: 32 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 16 }}
      transition={{ ...spring, delay: 0.05 }}
      className="flex h-[42vh] min-h-0 shrink-0 items-center justify-center bg-white p-4 lg:h-full lg:w-[52%] lg:p-8"
    >
      <div className="aspect-[2/3] h-full w-auto max-h-full max-w-full">
        <div
          ref={containerRef}
          className={`relative h-full w-full overflow-hidden bg-white ${
            isEditMode ? "ring-2 ring-blue-400 ring-inset" : ""
          }`}
        >
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 1024px) 45vw, 26vw"
            priority
            className="object-contain object-center mix-blend-multiply"
          />

          <LookHotspotLayer
            items={items}
            activeItemId={activeItemId}
            containerRef={containerRef}
            isEditMode={isEditMode}
            onSelectItem={onSelectItem}
            onCoordinateChange={onCoordinateChange}
          />
        </div>
      </div>
    </motion.div>
  );
}
