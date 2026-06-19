"use client";

import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import type { ResolvedLookItem } from "@/types/look";
import { GuidePreviewCanvas } from "@/components/modal/GuidePreviewCanvas";
import { LookHotspotLayer } from "@/components/modal/LookHotspotLayer";

interface LookImagePanelProps {
  image: string;
  title: string;
  modelName: string;
  items: ResolvedLookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  showPreview: boolean;
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
  modelName,
  items,
  activeItemId,
  isEditMode,
  showPreview,
  onSelectItem,
  onCoordinateChange,
}: LookImagePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-[42vh] min-h-0 shrink-0 items-center justify-center bg-white p-4 lg:h-full lg:w-[52%] lg:p-8">
      <div className="aspect-[2/3] h-full w-auto max-h-full max-w-full">
        <div className="relative h-full w-full overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            {showPreview ? (
              <GuidePreviewCanvas
                key="preview"
                lookTitle={title}
                modelName={modelName}
                items={items}
              />
            ) : (
              <div
                key="collage"
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
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
