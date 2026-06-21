"use client";

import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, type RefObject } from "react";
import type { Look, ResolvedLookItem } from "@/types/look";
import type { CanvasItemLayout } from "@/lib/canvasLayout";
import { resolveEditorGuideImagePath } from "@/lib/canvasLayout";
import {
  canRenderCollageLayout,
  COLLAGE_BACKDROP,
} from "@/lib/collageLayout";
import { CollageStudioLayer } from "@/components/modal/CollageStudioLayer";
import { EditorGuideOverlay } from "@/components/modal/EditorGuideOverlay";
import { MatrixBlueprintOverlay } from "@/components/modal/MatrixBlueprintOverlay";

interface LookCanvasProps {
  look: Pick<
    Look,
    "id" | "outfitId" | "layout" | "editorGuideImage"
  >;
  lookImage: string;
  title: string;
  items: ResolvedLookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onSelectItem: (itemId: string) => void;
  onCanvasLayoutsChange?: (layouts: Record<string, CanvasItemLayout>) => void;
  resolveLayouts?: (
    items: ResolvedLookItem[],
    containerWidth: number,
  ) => Record<string, CanvasItemLayout>;
  className?: string;
  isFreeDragMode?: boolean;
  onFreeDragPositionCommit?: (
    itemId: string,
    position: { top: string; left: string },
  ) => void;
  /** When true, click hit-testing won't intercept outer UI overlays. */
  disableCanvasHitTesting?: boolean;
  /** Collage canvas fill — defaults to print paper white. */
  collageBackdrop?: string;
}

export function LookCanvas({
  look,
  lookImage,
  title,
  items,
  activeItemId,
  isEditMode,
  containerRef,
  onSelectItem,
  onCanvasLayoutsChange,
  resolveLayouts,
  className = "",
  isFreeDragMode = false,
  onFreeDragPositionCommit,
  disableCanvasHitTesting = false,
  collageBackdrop = COLLAGE_BACKDROP,
}: LookCanvasProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const useCollage = canRenderCollageLayout(look.layout, items);

  useEffect(() => {
    setSelectedItemId(null);
  }, [look.id]);

  useEffect(() => {
    if (!isEditMode) {
      setSelectedItemId(null);
    }
  }, [isEditMode]);

  const allowBleed = useCollage && isEditMode;

  const showEditorGuide = useCollage && isEditMode;
  const guideImagePath = resolveEditorGuideImagePath(look.id, {
    outfitId: look.outfitId,
    editorGuideImage: look.editorGuideImage,
  });

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full ${
        allowBleed ? "overflow-visible" : "overflow-hidden"
      } ${isEditMode ? "ring-2 ring-blue-400 ring-inset" : ""} ${className}`.trim()}
      style={useCollage ? { backgroundColor: collageBackdrop } : undefined}
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
          lookId={look.id}
          items={items}
          selectedItemId={selectedItemId}
          activeItemId={activeItemId}
          isEditMode={isEditMode}
          parentRef={containerRef}
          onSelectItem={onSelectItem}
          onSelectCanvasItem={setSelectedItemId}
          onLayoutsChange={onCanvasLayoutsChange}
          resolveLayouts={resolveLayouts}
          isFreeDragMode={isFreeDragMode}
          onFreeDragPositionCommit={onFreeDragPositionCommit}
          disableCanvasHitTesting={disableCanvasHitTesting}
        />
      ) : (
        <SingleLookImage image={lookImage} title={title} />
      )}

      {useCollage && isEditMode ? <MatrixBlueprintOverlay /> : null}
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
