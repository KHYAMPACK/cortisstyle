"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
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
import { resolveRenderedCanvasZIndex } from "@/lib/canvasLayerStack";
import { isLocalhostClient } from "@/lib/dev";
import {
  formatLayoutPercent,
  parseLayoutPercent,
  type FreeDragPosition,
} from "@/lib/wardrobeDragLayout";

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
  resolveLayouts?: (
    items: ResolvedLookItem[],
    containerWidth: number,
  ) => Record<string, CanvasItemLayout>;
  isFreeDragMode?: boolean;
  onFreeDragPositionCommit?: (
    itemId: string,
    position: FreeDragPosition,
  ) => void;
  disableCanvasHitTesting?: boolean;
}

const ARROW_KEY_DIRECTION: Record<string, CanvasMoveDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const MIN_WIDTH_PX = 48;
const MAX_WIDTH_PX = 720;

function canvasLayoutsEqual(
  current: Record<string, CanvasItemLayout>,
  next: Record<string, CanvasItemLayout>,
): boolean {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);

  if (currentKeys.length !== nextKeys.length) return false;

  return currentKeys.every(
    (key) => JSON.stringify(current[key]) === JSON.stringify(next[key]),
  );
}

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
  resolveLayouts,
  isFreeDragMode = false,
  onFreeDragPositionCommit,
  disableCanvasHitTesting = false,
}: CollageStudioLayerProps) {
  const [layouts, setLayouts] = useState<Record<string, CanvasItemLayout>>({});
  const [isHitboxMode, setIsHitboxMode] = useState(false);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
  const [activeDrag, setActiveDrag] = useState<{
    itemId: string;
    top: string;
    left: string;
  } | null>(null);
  const loadedImageIdsRef = useRef(new Set<string>());
  const clothingIds = useRef(new Set<string>());
  const dragSessionRef = useRef<{
    itemId: string;
    startClientX: number;
    startClientY: number;
    startTopPct: number;
    startLeftPct: number;
  } | null>(null);

  const layoutsReady = Object.keys(layouts).length > 0;
  const renderableItems = items.filter(
    (item) => item.canvasImage && layouts[item.id],
  );
  const totalImagesToLoad = renderableItems.length;
  const isFullyLoaded =
    isEditMode ||
    (layoutsReady &&
      (totalImagesToLoad === 0 || loadedImagesCount >= totalImagesToLoad));

  const activeItemSignature = useMemo(
    () => items.map((item) => item.id).join("|"),
    [items],
  );

  useLayoutEffect(() => {
    clothingIds.current = new Set(items.map((item) => item.id));
  }, [items]);

  useEffect(() => {
    loadedImageIdsRef.current.clear();
    setLoadedImagesCount(0);
  }, [lookId, activeItemSignature]);

  const handleImageLoad = useCallback((itemId: string) => {
    if (loadedImageIdsRef.current.has(itemId)) return;

    loadedImageIdsRef.current.add(itemId);
    setLoadedImagesCount((current) => current + 1);
  }, []);

  const syncLayoutsFromContainer = useCallback(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const containerWidth = parent.getBoundingClientRect().width;
    if (containerWidth <= 0) return;

    const nextLayouts = resolveLayouts
      ? resolveLayouts(items, containerWidth)
      : resolveCanvasLayouts(lookId, items, containerWidth);

    setLayouts((current) => {
      if (canvasLayoutsEqual(current, nextLayouts)) {
        return current;
      }

      return nextLayouts;
    });
  }, [lookId, items, parentRef, resolveLayouts]);

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
    if (!layoutsReady) return;

    onLayoutsChange?.(layouts);

    if (isEditMode && isLocalhostClient()) {
      saveCanvasLayoutsToStorage(lookId, layouts);
    }
  }, [lookId, layouts, onLayoutsChange, isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setIsHitboxMode(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleCanvasClick = (event: MouseEvent) => {
      if (disableCanvasHitTesting || isFreeDragMode) return;

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
        { isEditMode, selectedItemId, activeItemId },
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
    activeItemId,
    parentRef,
    onSelectCanvasItem,
    onSelectItem,
    isFreeDragMode,
  ]);

  useEffect(() => {
    if (!isFreeDragMode) {
      dragSessionRef.current = null;
      setActiveDrag(null);
    }
  }, [isFreeDragMode]);

  const computeDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      const session = dragSessionRef.current;
      const parent = parentRef.current;
      if (!session || !parent) return null;

      const rect = parent.getBoundingClientRect();
      const dx = clientX - session.startClientX;
      const dy = clientY - session.startClientY;

      return {
        itemId: session.itemId,
        top: formatLayoutPercent(
          session.startTopPct + (dy / rect.height) * 100,
        ),
        left: formatLayoutPercent(
          session.startLeftPct + (dx / rect.width) * 100,
        ),
      };
    },
    [parentRef],
  );

  const handleAssetPointerDown = useCallback(
    (itemId: string, layout: CanvasItemLayout) =>
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isFreeDragMode) return;

        event.preventDefault();
        event.stopPropagation();

        event.currentTarget.setPointerCapture(event.pointerId);

        dragSessionRef.current = {
          itemId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startTopPct: parseLayoutPercent(layout.top),
          startLeftPct: parseLayoutPercent(layout.left),
        };

        setActiveDrag({
          itemId,
          top: layout.top,
          left: layout.left,
        });
      },
    [isFreeDragMode],
  );

  const handleAssetPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isFreeDragMode || !dragSessionRef.current) return;

      const nextPosition = computeDragPosition(event.clientX, event.clientY);
      if (nextPosition) {
        setActiveDrag(nextPosition);
      }
    },
    [computeDragPosition, isFreeDragMode],
  );

  const handleAssetPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragSessionRef.current) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const nextPosition = computeDragPosition(event.clientX, event.clientY);
      if (nextPosition) {
        onFreeDragPositionCommit?.(nextPosition.itemId, {
          top: nextPosition.top,
          left: nextPosition.left,
        });
      }

      dragSessionRef.current = null;
      setActiveDrag(null);
    },
    [computeDragPosition, onFreeDragPositionCommit],
  );

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
    <div className="relative h-full w-full">
      <AnimatePresence>
        {!isFullyLoaded && (
          <motion.div
            key="canvas-loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white"
            aria-live="polite"
            aria-busy="true"
          >
            <motion.div
              aria-hidden
              className="h-6 w-6 border border-neutral-300 border-t-neutral-900"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
              Loading Archive...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditMode && isHitboxMode && (
        <div className="pointer-events-none absolute top-2 left-2 z-[100] bg-red-600/90 px-2 py-1 text-[8px] tracking-[0.25em] text-white uppercase">
          Hitbox · Arrows move · Shift+Arrows resize
        </div>
      )}

      <motion.div
        className="absolute inset-0 h-full w-full overflow-hidden"
        initial={false}
        animate={{ opacity: isFullyLoaded ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {renderableItems.map((item) => {
          const baseLayout = layouts[item.id];
          if (!baseLayout) return null;

          const layout =
            activeDrag?.itemId === item.id
              ? {
                  ...baseLayout,
                  top: activeDrag.top,
                  left: activeDrag.left,
                }
              : baseLayout;

          const isSelected = isEditMode
            ? selectedItemId === item.id
            : activeItemId === item.id;
          const isDimmed =
            !isEditMode && activeItemId !== null && activeItemId !== item.id;
          const isDragging = activeDrag?.itemId === item.id;

          return (
            <CanvasAsset
              key={item.id}
              itemId={item.id}
              layout={layout}
              imageSrc={item.canvasImage!}
              imageAlt={item.name}
              isSelected={isSelected}
              isDimmed={isDimmed}
              isDragging={isDragging}
              isEditMode={isEditMode}
              isHitboxMode={isHitboxMode}
              isFreeDragMode={isFreeDragMode}
              onPointerDown={handleAssetPointerDown(item.id, layout)}
              onPointerMove={handleAssetPointerMove}
              onPointerUp={handleAssetPointerUp}
              onPointerCancel={handleAssetPointerUp}
              onScale={(widthPx) => updateLayout(item.id, { widthPx })}
              onImageLoad={() => handleImageLoad(item.id)}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

interface CanvasAssetProps {
  itemId: string;
  layout: CanvasItemLayout;
  imageSrc: string;
  imageAlt: string;
  isSelected: boolean;
  isDimmed: boolean;
  isDragging: boolean;
  isEditMode: boolean;
  isHitboxMode: boolean;
  isFreeDragMode: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  onScale: (widthPx: number) => void;
  onImageLoad: () => void;
}

function CanvasAsset({
  itemId,
  layout,
  imageSrc,
  imageAlt,
  isSelected,
  isDimmed,
  isDragging,
  isEditMode,
  isHitboxMode,
  isFreeDragMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onScale,
  onImageLoad,
}: CanvasAssetProps) {
  const hitbox = resolveHitboxDimensions(layout);
  const hitboxOffset = resolveHitboxOffset(layout);
  const visualWidth = layout.widthPx ?? hitbox.widthPx;
  const hasReportedLoadRef = useRef(false);

  useEffect(() => {
    hasReportedLoadRef.current = false;
  }, [imageSrc, itemId]);

  const reportImageLoad = () => {
    if (hasReportedLoadRef.current) return;
    hasReportedLoadRef.current = true;
    onImageLoad();
  };

  return (
    <motion.div
      className={`absolute select-none touch-none ${
        isFreeDragMode
          ? isDragging
            ? "pointer-events-auto cursor-grabbing"
            : "pointer-events-auto cursor-grab active:cursor-grabbing"
          : "pointer-events-auto cursor-not-allowed"
      }`}
      style={{
        top: layout.top,
        left: layout.left,
        width: visualWidth,
        zIndex: resolveRenderedCanvasZIndex(
          layout.zIndex,
          isSelected || isDragging,
        ),
      }}
      animate={{ opacity: isDimmed ? 0.55 : 1 }}
      transition={{ duration: 0.25 }}
      onPointerDown={isFreeDragMode ? onPointerDown : undefined}
      onPointerMove={isFreeDragMode ? onPointerMove : undefined}
      onPointerUp={isFreeDragMode ? onPointerUp : undefined}
      onPointerCancel={isFreeDragMode ? onPointerCancel : undefined}
    >
      <div className="relative shrink-0 leading-[0]">
        <Image
          key={itemId}
          src={imageSrc}
          alt={imageAlt}
          width={1200}
          height={1200}
          unoptimized
          draggable={false}
          sizes={`${Math.ceil(visualWidth)}px`}
          onLoad={reportImageLoad}
          onLoadingComplete={reportImageLoad}
          className="pointer-events-none block h-auto w-full max-w-none shrink-0 select-none object-contain object-left-top max-md:max-h-none max-md:min-h-0"
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
