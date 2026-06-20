"use client";

import { AnimatePresence } from "framer-motion";
import { useRef } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { GuidePreviewCanvas } from "@/components/modal/GuidePreviewCanvas";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { LookCanvasViewport } from "@/components/modal/LookCanvasViewport";

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
  const allowDesktopCanvasBleed =
    look.layout === "collage" && isEditMode && !showPreview;

  return (
    <div className="flex w-full shrink-0 flex-col items-center bg-white p-4 md:h-full md:w-[52%] md:p-8">
      <LookCanvasViewport allowBleed={allowDesktopCanvasBleed}>
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
      </LookCanvasViewport>

      <p className="mt-3 w-full text-center text-[9px] tracking-[0.38em] text-neutral-500 uppercase md:hidden">
        {look.title.toUpperCase()} // BY {look.modelName.toUpperCase()}
      </p>
    </div>
  );
}
