"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ResolvedLookItem } from "@/types/look";
import {
  buildCanvasHitTestEntries,
  findTopmostAssetAtPoint,
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
import { isLocalhostClient } from "@/lib/dev";

interface CollageStudioLayerProps {
  lookId: string;
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

export function CollageStudioLayer({
  lookId,
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

  const syncLayoutsFromContainer = useCallback(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const containerWidth = parent.getBoundingClientRect().width;
    if (containerWidth <= 0) return;

    const nextLayouts = resolveCanvasLayouts(lookId, items, containerWidth);
    layoutsReadyRef.current = true;
    setLayouts(nextLayouts);
  }, [lookId, items, parentRef]);

  useLayoutEffect(() => {
    syncLayoutsFromContainer();
  }, [syncLayoutsFromContainer]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent || typeof ResizeObserver === "undefined" || isEditMode) return;

    const observer = new ResizeObserver(() => {
      syncLayoutsFromContainer();
    });
    observer.observe(parent);

    return () => observer.disconnect();
  }, [syncLayoutsFromContainer, parentRef, isEditMode]);

  useEffect(() => {
    if (!layoutsReadyRef.current || Object.keys(layouts).length === 0) return;

    onLayoutsChange?.(layouts);

    if (isLocalhostClient()) {
      saveCanvasLayoutsToStorage(lookId, layouts);
    }
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
        { isEditMode, selectedItemId },
        container,
      );

      const hitId = findTopmostAssetAtPoint(x, y, entries, {
        allowVisualFallback: !isHitboxMode,
      });

      if (hitId) {
        event.preventDefault();
        event.stopPropagation();

        if (isEditMode) {
          onSelectCanvasItem(hitId);
        } else {
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
    isEditMode,
    isHitboxMode,
    selectedItemId,
    parentRef,
    onSelectCanvasItem,
    onSelectItem,
  ]);

  useEffect(() => {
    if (!isEditMode || !selectedItemId || isHitboxMode) return;

    const handleWheel = (event: WheelEvent) => {
      const layout = layouts[selectedItemId];
      if (!layout || layout.widthPx === undefined) return;

      event.preventDefault();

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
        if (!layout || layout.widthPx === undefined) return current;

        if (isHitboxMode) {
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

  return (
    <>
      {isEditMode && isHitboxMode && (
        <div className="pointer-events-none absolute top-2 left-2 z-[100] bg-red-600/90 px-2 py-1 text-[8px] tracking-[0.25em] text-white uppercase">
          Hitbox · Arrows move · Shift+Arrows resize
        </div>
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
            imageSrc={item.canvasImage}
            imageAlt={item.name}
            isSelected={isSelected}
            isDimmed={isDimmed}
            isEditMode={isEditMode}
            isHitboxMode={isHitboxMode}
            onScale={(widthPx) => updateLayout(item.id, { widthPx })}
          />
        );
      })}
    </>
  );
}

interface CanvasAssetProps {
  layout: CanvasItemLayout;
  imageSrc: string;
  imageAlt: string;
  isSelected: boolean;
  isDimmed: boolean;
  isEditMode: boolean;
  isHitboxMode: boolean;
  onScale: (widthPx: number) => void;
}

function CanvasAsset({
  layout,
  imageSrc,
  imageAlt,
  isSelected,
  isDimmed,
  isEditMode,
  isHitboxMode,
  onScale,
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
      <div className="relative leading-[0]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1200}
          height={1200}
          unoptimized
          draggable={false}
          sizes={`${Math.ceil(visualWidth)}px`}
          className="pointer-events-none block h-auto w-full max-w-none select-none object-contain object-left-top"
        />
      </div>

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
