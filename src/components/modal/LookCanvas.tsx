"use client";

import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, type RefObject } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import {
  resolveEditorGuideImagePath,
  resolveModelPortraitPath,
} from "@/lib/canvasLayout";
import {
  canRenderCollageLayout,
  COLLAGE_BACKDROP,
  COLLAGE_BACKDROP_GRADIENT,
} from "@/lib/collageLayout";
import { CollageStudioLayer } from "@/components/modal/CollageStudioLayer";
import { EditorGuideOverlay } from "@/components/modal/EditorGuideOverlay";

interface LookCanvasProps {
  lookId: string;
  lookImage: string;
  title: string;
  modelName: string;
  layout?: Look["layout"];
  outfitId?: string;
  editorGuideImage?: string;
  modelPortraitImage?: string;
  modelPortraitPosition?: Look["modelPortraitPosition"];
  modelNamePosition?: Look["modelNamePosition"];
  items: ResolvedLookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onSelectItem: (itemId: string) => void;
  onCanvasLayoutsChange?: (layouts: Record<string, CanvasItemLayout>) => void;
}

export function LookCanvas({
  lookId,
  lookImage,
  title,
  modelName,
  layout,
  outfitId,
  editorGuideImage,
  modelPortraitImage,
  modelPortraitPosition,
  modelNamePosition,
  items,
  activeItemId,
  isEditMode,
  containerRef,
  onSelectItem,
  onCanvasLayoutsChange,
}: LookCanvasProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const useCollage = canRenderCollageLayout(layout, items);

  useEffect(() => {
    setSelectedItemId(null);
  }, [lookId]);

  useEffect(() => {
    if (!isEditMode) {
      setSelectedItemId(null);
    }
  }, [isEditMode]);

  const allowBleed = useCollage && isEditMode;

  const showEditorGuide = useCollage && isEditMode;
  const guideImagePath = resolveEditorGuideImagePath(lookId, {
    outfitId,
    editorGuideImage,
  });
  const modelPortraitSrc = resolveModelPortraitPath(lookId, {
    outfitId,
    modelPortraitImage,
  });

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full ${
        allowBleed ? "overflow-visible" : "overflow-hidden"
      } ${isEditMode ? "ring-2 ring-blue-400 ring-inset" : ""}`}
      style={
        useCollage
          ? {
              backgroundColor: COLLAGE_BACKDROP,
              backgroundImage: COLLAGE_BACKDROP_GRADIENT,
            }
          : undefined
      }
    >
      <AnimatePresence>
        {showEditorGuide && (
          <EditorGuideOverlay
            key="editor-guide"
            src={guideImagePath}
            alt={`${title} placement guide`}
          />
        )}
      </AnimatePresence>

      {useCollage ? (
        <CollageStudioLayer
          lookId={lookId}
          modelName={modelName}
          modelPortraitSrc={modelPortraitSrc}
          modelPortraitPosition={modelPortraitPosition}
          modelNamePosition={modelNamePosition}
          items={items}
          selectedItemId={selectedItemId}
          activeItemId={activeItemId}
          isEditMode={isEditMode}
          parentRef={containerRef}
          onSelectItem={onSelectItem}
          onSelectCanvasItem={setSelectedItemId}
          onLayoutsChange={onCanvasLayoutsChange}
        />
      ) : (
        <SingleLookImage image={lookImage} title={title} />
      )}
    </div>
  );
}

function SingleLookImage({ image, title }: { image: string; title: string }) {
  return (
    <Image
      src={image}
      alt={title}
      fill
      sizes="(max-width: 1024px) 45vw, 26vw"
      priority
      className="object-contain object-center mix-blend-multiply"
    />
  );
}
