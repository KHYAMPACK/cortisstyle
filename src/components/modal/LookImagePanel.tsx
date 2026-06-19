"use client";

import { AnimatePresence } from "framer-motion";
import { useRef } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { GuidePreviewCanvas } from "@/components/modal/GuidePreviewCanvas";
import { LookCanvas } from "@/components/modal/LookCanvas";

interface LookImagePanelProps {
  look: Look;
  items: ResolvedLookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  showPreview: boolean;
  onSelectItem: (itemId: string) => void;
  onCanvasLayoutsChange?: (layouts: Record<string, CanvasItemLayout>) => void;
}

export function LookImagePanel({
  look,
  items,
  activeItemId,
  isEditMode,
  showPreview,
  onSelectItem,
  onCanvasLayoutsChange,
}: LookImagePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const allowCanvasBleed = look.layout === "collage" && isEditMode && !showPreview;

  return (
    <div className="flex h-[42vh] min-h-0 shrink-0 items-center justify-center bg-white p-4 lg:h-full lg:w-[52%] lg:p-8">
      <div
        className={`aspect-[2/3] h-full w-auto max-h-full max-w-full ${
          allowCanvasBleed ? "overflow-visible" : ""
        }`}
      >
        <div
          className={`relative h-full w-full bg-white ${
            allowCanvasBleed ? "overflow-visible" : "overflow-hidden"
          }`}
        >
          <AnimatePresence mode="wait">
            {showPreview ? (
              <GuidePreviewCanvas
                key="preview"
                look={look}
                isUnlockedViewState={showPreview}
              />
            ) : (
              <LookCanvas
                key="canvas"
                look={look}
                lookImage={look.image}
                title={look.title}
                items={items}
                activeItemId={activeItemId}
                isEditMode={isEditMode}
                containerRef={containerRef}
                onSelectItem={onSelectItem}
                onCanvasLayoutsChange={onCanvasLayoutsChange}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
