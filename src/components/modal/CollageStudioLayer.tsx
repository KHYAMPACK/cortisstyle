"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { ResolvedLookItem } from "@/types/look";
import {
  buildCanvasHitTestEntries,
  DEFAULT_MODEL_NAME_POSITION,
  DEFAULT_MODEL_PORTRAIT_POSITION,
  findTopmostAssetAtPoint,
  MODEL_NAME_CANVAS_ID,
  MODEL_PORTRAIT_CANVAS_ID,
  nudgeCanvasLayout,
  nudgeHitboxLayout,
  nudgeHitboxOffset,
  resolveCanvasLayouts,
  resolveHitboxDimensions,
  resolveHitboxOffset,
  saveCanvasLayoutsToStorage,
  type CanvasItemLayout,
  type CanvasMoveDirection,
} from "@/lib/canvasLayout";

interface CollageStudioLayerProps {
  lookId: string;
  modelName: string;
  modelPortraitSrc: string;
  modelPortraitPosition?: {
    top: string;
    left: string;
    width: string;
    zIndex: number;
  };
  modelNamePosition?: {
    top: string;
    left: string;
    fontSizePx: number;
    zIndex: number;
  };
  items: ResolvedLookItem[];
  selectedItemId: string | null;
  activeItemId: string | null;
  isEditMode: boolean;
  parentRef: RefObject<HTMLDivElement | null>;
  onSelectItem: (itemId: string) => void;
  onSelectCanvasItem: (itemId: string | null) => void;
  onLayoutsChange?: (layouts: Record<string, CanvasItemLayout>) => void;
}

const ARROW_KEY_DIRECTION: Record<string, CanvasMoveDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const MIN_WIDTH_PX = 48;
const MAX_WIDTH_PX = 720;
const MIN_FONT_PX = 8;
const MAX_FONT_PX = 28;

export function CollageStudioLayer({
  lookId,
  modelName,
  modelPortraitSrc,
  modelPortraitPosition = DEFAULT_MODEL_PORTRAIT_POSITION,
  modelNamePosition = DEFAULT_MODEL_NAME_POSITION,
  items,
  selectedItemId,
  activeItemId,
  isEditMode,
  parentRef,
  onSelectItem,
  onSelectCanvasItem,
  onLayoutsChange,
}: CollageStudioLayerProps) {
  const [layouts, setLayouts] = useState<Record<string, CanvasItemLayout>>({});
  const [isHitboxMode, setIsHitboxMode] = useState(false);
  const layoutsReadyRef = useRef(false);
  const clothingIds = useRef(new Set<string>());

  useLayoutEffect(() => {
    clothingIds.current = new Set(items.map((item) => item.id));
  }, [items]);

  useLayoutEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const containerWidth = parent.getBoundingClientRect().width;
    const nextLayouts = resolveCanvasLayouts(lookId, items, containerWidth, {
      modelPortrait: modelPortraitPosition,
      modelName: modelNamePosition,
    });
    layoutsReadyRef.current = true;
    setLayouts(nextLayouts);
  }, [lookId, items, modelPortraitPosition, modelNamePosition, parentRef]);

  useEffect(() => {
    if (!layoutsReadyRef.current || Object.keys(layouts).length === 0) return;

    onLayoutsChange?.(layouts);
    saveCanvasLayoutsToStorage(lookId, layouts);
  }, [lookId, layouts, onLayoutsChange]);

  useEffect(() => {
    if (!isEditMode) {
      setIsHitboxMode(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleCanvasClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("[data-canvas-resize]")) {
        return;
      }

      const rect = parent.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const container = { width: rect.width, height: rect.height };

      const entries = buildCanvasHitTestEntries(
        layouts,
        items,
        modelName,
        { isEditMode, selectedItemId },
        container,
      );

      const hitId = findTopmostAssetAtPoint(x, y, entries);

      if (hitId) {
        event.preventDefault();
        event.stopPropagation();

        if (isEditMode) {
          onSelectCanvasItem(hitId);
        } else if (clothingIds.current.has(hitId)) {
          onSelectItem(hitId);
        }
        return;
      }

      if (isEditMode) {
        event.stopPropagation();
        onSelectCanvasItem(null);
      }
    };

    parent.addEventListener("click", handleCanvasClick, true);
    return () => parent.removeEventListener("click", handleCanvasClick, true);
  }, [
    layouts,
    items,
    modelName,
    isEditMode,
    selectedItemId,
    parentRef,
    onSelectCanvasItem,
    onSelectItem,
  ]);

  useEffect(() => {
    if (!isEditMode || !selectedItemId || isHitboxMode) return;

    const handleWheel = (event: WheelEvent) => {
      const layout = layouts[selectedItemId];
      if (!layout) return;

      event.preventDefault();

      if (selectedItemId === MODEL_NAME_CANVAS_ID) {
        const fontSizePx = layout.fontSizePx ?? 11;
        const delta = event.deltaY > 0 ? -1 : 1;
        const nextSize = Math.max(
          MIN_FONT_PX,
          Math.min(MAX_FONT_PX, fontSizePx + delta),
        );
        setLayouts((current) => ({
          ...current,
          [selectedItemId]: { ...layout, fontSizePx: nextSize },
        }));
        return;
      }

      if (layout.widthPx === undefined) return;

      const delta = event.deltaY > 0 ? -8 : 8;
      const nextWidth = Math.round(
        Math.max(
          MIN_WIDTH_PX,
          Math.min(MAX_WIDTH_PX, layout.widthPx + delta),
        ),
      );

      setLayouts((current) => ({
        ...current,
        [selectedItemId]: { ...layout, widthPx: nextWidth },
      }));
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isEditMode, isHitboxMode, selectedItemId, layouts]);

  const updateLayout = useCallback(
    (itemId: string, patch: Partial<CanvasItemLayout>) => {
      setLayouts((current) => {
        const existing = current[itemId];
        if (!existing) return current;

        return {
          ...current,
          [itemId]: { ...existing, ...patch },
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!isEditMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        setIsHitboxMode((current) => !current);
        return;
      }

      const direction = ARROW_KEY_DIRECTION[event.key];
      if (!direction || !selectedItemId) return;

      const parent = parentRef.current;
      if (!parent) return;

      event.preventDefault();
      const stepPx = event.shiftKey ? 10 : 1;

      setLayouts((current) => {
        const layout = current[selectedItemId];
        if (!layout) return current;

        const isTextLayer = selectedItemId === MODEL_NAME_CANVAS_ID;
        if (isHitboxMode && !isTextLayer && layout.widthPx !== undefined) {
          const patch = event.shiftKey
            ? nudgeHitboxLayout(layout, direction, stepPx)
            : nudgeHitboxOffset(layout, direction, stepPx);

          return {
            ...current,
            [selectedItemId]: { ...layout, ...patch },
          };
        }

        const patch = nudgeCanvasLayout(
          layout,
          direction,
          stepPx,
          parent.getBoundingClientRect(),
        );

        return {
          ...current,
          [selectedItemId]: { ...layout, ...patch },
        };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, isHitboxMode, selectedItemId, parentRef]);

  const modelLayout = layouts[MODEL_PORTRAIT_CANVAS_ID];
  const modelNameLayout = layouts[MODEL_NAME_CANVAS_ID];

  return (
    <>
      {isEditMode && isHitboxMode && (
        <div className="pointer-events-none absolute top-2 right-2 z-[100] bg-red-600/90 px-2 py-1 text-[8px] tracking-[0.25em] text-white uppercase">
          Hitbox · Arrows move · Shift+Arrows resize
        </div>
      )}

      {modelLayout && (
        <CanvasAsset
          layout={modelLayout}
          isSelected={isEditMode && selectedItemId === MODEL_PORTRAIT_CANVAS_ID}
          isDimmed={false}
          isEditMode={isEditMode}
          isHitboxMode={isHitboxMode}
          onScale={(widthPx) =>
            updateLayout(MODEL_PORTRAIT_CANVAS_ID, { widthPx })
          }
        >
          <Image
            src={modelPortraitSrc}
            alt={`${modelName} portrait`}
            width={1200}
            height={1200}
            draggable={false}
            className="pointer-events-none h-auto w-full select-none object-contain"
            sizes="(max-width: 1024px) 30vw, 18vw"
          />
        </CanvasAsset>
      )}

      {modelNameLayout && (
        <CanvasTextLayer
          label={modelName}
          layout={modelNameLayout}
          isSelected={isEditMode && selectedItemId === MODEL_NAME_CANVAS_ID}
          isEditMode={isEditMode}
        />
      )}

      {items.map((item) => {
        if (!item.canvasImage) return null;

        const layout = layouts[item.id];
        if (!layout) return null;

        const isSelected = isEditMode
          ? selectedItemId === item.id
          : activeItemId === item.id;
        const isDimmed =
          !isEditMode && activeItemId !== null && activeItemId !== item.id;

        return (
          <CanvasAsset
            key={item.id}
            layout={layout}
            isSelected={isSelected}
            isDimmed={isDimmed}
            isEditMode={isEditMode}
            isHitboxMode={isHitboxMode}
            onScale={(widthPx) => updateLayout(item.id, { widthPx })}
          >
            <Image
              src={item.canvasImage}
              alt={item.name}
              width={1200}
              height={1200}
              draggable={false}
              className="pointer-events-none h-auto w-full select-none object-contain"
              sizes="(max-width: 1024px) 30vw, 18vw"
            />
          </CanvasAsset>
        );
      })}
    </>
  );
}

interface CanvasAssetProps {
  layout: CanvasItemLayout;
  isSelected: boolean;
  isDimmed: boolean;
  isEditMode: boolean;
  isHitboxMode: boolean;
  onScale: (widthPx: number) => void;
  children: ReactNode;
}

function CanvasAsset({
  layout,
  isSelected,
  isDimmed,
  isEditMode,
  isHitboxMode,
  onScale,
  children,
}: CanvasAssetProps) {
  const hitbox = resolveHitboxDimensions(layout);
  const hitboxOffset = resolveHitboxOffset(layout);
  const visualWidth = layout.widthPx ?? hitbox.widthPx;

  return (
    <motion.div
      className="pointer-events-none absolute select-none"
      style={{
        top: layout.top,
        left: layout.left,
        width: visualWidth,
        zIndex: isSelected ? layout.zIndex + 10 : layout.zIndex,
      }}
      animate={{ opacity: isDimmed ? 0.55 : 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="relative">{children}</div>

      {isEditMode && isSelected && !isHitboxMode && (
        <div
          aria-hidden
          className="pointer-events-none absolute ring-1 ring-blue-500/90"
          style={{
            top: hitboxOffset.topPx,
            left: hitboxOffset.leftPx,
            width: hitbox.widthPx,
            height: hitbox.heightPx,
          }}
        />
      )}

      {isEditMode && isSelected && isHitboxMode && (
        <div
          aria-hidden
          className="pointer-events-none absolute border-2 border-red-500/70 bg-red-500/15"
          style={{
            top: hitboxOffset.topPx,
            left: hitboxOffset.leftPx,
            width: hitbox.widthPx,
            height: hitbox.heightPx,
          }}
        />
      )}

      {isEditMode && isSelected && !isHitboxMode && (
        <ResizeHandle visualWidth={visualWidth} onScale={onScale} />
      )}
    </motion.div>
  );
}

interface CanvasTextLayerProps {
  label: string;
  layout: CanvasItemLayout;
  isSelected: boolean;
  isEditMode: boolean;
}

function CanvasTextLayer({
  label,
  layout,
  isSelected,
  isEditMode,
}: CanvasTextLayerProps) {
  const fontSizePx = layout.fontSizePx ?? 11;

  return (
    <motion.div
      className="pointer-events-none absolute select-none"
      style={{
        top: layout.top,
        left: layout.left,
        zIndex: isSelected ? layout.zIndex + 10 : layout.zIndex,
      }}
      animate={{ opacity: 1 }}
    >
      <span
        className={`block font-serif leading-none tracking-[0.35em] text-neutral-950 uppercase ${
          isEditMode && isSelected ? "ring-1 ring-blue-500/90" : ""
        }`}
        style={{ fontSize: fontSizePx }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function ResizeHandle({
  visualWidth,
  onScale,
}: {
  visualWidth: number;
  onScale: (widthPx: number) => void;
}) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handlePointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    startXRef.current = event.clientX;
    startWidthRef.current = visualWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const nextWidth = Math.round(
        Math.max(
          MIN_WIDTH_PX,
          Math.min(MAX_WIDTH_PX, startWidthRef.current + deltaX),
        ),
      );
      onScale(nextWidth);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      role="presentation"
      data-canvas-resize
      onPointerDown={handlePointerDown}
      className="pointer-events-auto absolute right-0 bottom-0 z-20 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize border border-blue-500 bg-white shadow-sm"
    />
  );
}
