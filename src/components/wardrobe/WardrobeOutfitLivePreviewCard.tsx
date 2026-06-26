"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { LookCanvas } from "@/components/modal/LookCanvas";
import { LookCanvasLayoutProvider } from "@/context/LookCanvasLayoutContext";
import { WardrobeCanvasBrandWatermark } from "@/components/wardrobe/WardrobeCanvasBrandWatermark";
import { WardrobeMoodImageFrame } from "@/components/wardrobe/WardrobeMoodImageFrame";
import { WardrobeMoodword } from "@/components/wardrobe/WardrobeMoodword";
import { WardrobeOutfitMoodboardCard } from "@/components/wardrobe/WardrobeOutfitMoodboardCard";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ResolvedLookItem } from "@/types/look";
import { WARDROBE_BUILDER_LOOK } from "@/types/wardrobe-builder";
import { COLLAGE_BACKDROP } from "@/lib/collageLayout";
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  MOODBOARD_FOOTER_HEIGHT_PX,
} from "@/lib/lookCanvasReference";
import { isDarkCanvasBackground } from "@/lib/wardrobeCanvasBackground";

const PREVIEW_MAX_SCALE = 0.76;

const PREVIEW_TOTAL_HEIGHT_PX =
  LOOK_CANVAS_REFERENCE_HEIGHT + MOODBOARD_FOOTER_HEIGHT_PX;

function resolvePreviewScale(containerWidth: number): number {
  if (containerWidth <= 0) return PREVIEW_MAX_SCALE;

  const fitScale = containerWidth / LOOK_CANVAS_REFERENCE_WIDTH;
  return Math.min(PREVIEW_MAX_SCALE, fitScale);
}

interface OutfitMoodboardRenderProps {
  outfitName: string;
  moodword: string;
  moodImageUrl: string | null;
  lookItems: ResolvedLookItem[];
  resolveLayouts: (
    items: ResolvedLookItem[],
    containerWidth: number,
  ) => Record<string, CanvasItemLayout>;
  canvasKey: string;
  canvasBg: string;
  showMoodPlaceholders: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  eagerImageLoading?: boolean;
}

function OutfitMoodboardRender({
  outfitName,
  moodword,
  moodImageUrl,
  lookItems,
  resolveLayouts,
  canvasKey,
  canvasBg,
  showMoodPlaceholders,
  containerRef,
  eagerImageLoading = false,
}: OutfitMoodboardRenderProps) {
  const isDarkCanvas = isDarkCanvasBackground(canvasBg);
  const moodwordFallback = showMoodPlaceholders ? "EDITORIAL" : undefined;

  const resolvePreviewLayouts = useCallback(
    (items: ResolvedLookItem[], width: number) => resolveLayouts(items, width),
    [resolveLayouts],
  );

  return (
    <WardrobeOutfitMoodboardCard
      name={outfitName}
      containerClassName="w-[420px] max-w-none shrink-0 bg-white"
    >
      <div
        className={`relative box-content w-[420px] shrink-0 overflow-hidden border ${
          isDarkCanvas
            ? "border-neutral-700"
            : "border-blueprint-border surface-canvas-paper"
        }`}
        style={{
          height: LOOK_CANVAS_REFERENCE_HEIGHT,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{ backgroundColor: canvasBg }}
        />

        {isDarkCanvas ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_42%,rgba(255,255,255,0.06)_100%)]"
          />
        ) : null}

        <WardrobeCanvasBrandWatermark
          onDarkCanvas={isDarkCanvas}
          imagePriority={eagerImageLoading}
        />

        <WardrobeMoodImageFrame
          moodImageUrl={moodImageUrl}
          showPlaceholder={showMoodPlaceholders}
          imagePriority={eagerImageLoading}
        />

        <WardrobeMoodword
          moodword={moodword}
          emptyFallback={moodwordFallback}
          onDarkCanvas={isDarkCanvas}
        />

        <LookCanvasLayoutProvider
          referenceWidth={LOOK_CANVAS_REFERENCE_WIDTH}
          referenceHeight={LOOK_CANVAS_REFERENCE_HEIGHT}
        >
          <div
            className={`pointer-events-none absolute inset-0 z-20 ${
              isDarkCanvas
                ? "[&_img]:drop-shadow-[0_0_1px_rgba(255,255,255,0.95)] [&_img]:drop-shadow-[0_0_5px_rgba(255,255,255,0.28)]"
                : "mix-blend-multiply"
            }`}
            data-export-blend-layer
          >
            <LookCanvas
              key={canvasKey}
              className="absolute inset-0 h-full w-full"
              look={WARDROBE_BUILDER_LOOK}
              lookImage=""
              title="Outfit Preview"
              items={lookItems}
              activeItemId={null}
              isEditMode={false}
              containerRef={containerRef}
              onSelectItem={() => {}}
              resolveLayouts={resolvePreviewLayouts}
              disableCanvasHitTesting
              collageBackdrop={isDarkCanvas ? "transparent" : COLLAGE_BACKDROP}
              eagerImageLoading={eagerImageLoading}
            />
          </div>
        </LookCanvasLayoutProvider>
      </div>
    </WardrobeOutfitMoodboardCard>
  );
}

interface WardrobeOutfitLivePreviewCardProps {
  outfitName: string;
  moodword: string;
  moodImageUrl: string | null;
  lookItems: ResolvedLookItem[];
  resolveLayouts: (
    items: ResolvedLookItem[],
    containerWidth: number,
  ) => Record<string, CanvasItemLayout>;
  canvasKey: string;
  canvasBg?: string;
  /** When false, mood image placeholder and empty moodword are hidden. */
  showMoodPlaceholders?: boolean;
  className?: string;
  /** @deprecated Ignored — preview always renders at the main canvas width. */
  canvasWidthClassName?: string;
}

export const WardrobeOutfitLivePreviewCard = forwardRef<
  HTMLDivElement,
  WardrobeOutfitLivePreviewCardProps
>(function WardrobeOutfitLivePreviewCard(
  {
    outfitName,
    moodword,
    moodImageUrl,
    lookItems,
    resolveLayouts,
    canvasKey,
    canvasBg = "#FFFFFF",
    showMoodPlaceholders = false,
    className = "",
  },
  ref,
) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const exportRootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(PREVIEW_MAX_SCALE);

  useImperativeHandle(ref, () => exportRootRef.current as HTMLDivElement);

  useEffect(() => {
    const measureTarget = measureRef.current;
    if (!measureTarget) return;

    const updateScale = () => {
      setPreviewScale(resolvePreviewScale(measureTarget.clientWidth));
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(measureTarget);

    return () => observer.disconnect();
  }, []);

  const renderProps = {
    outfitName,
    moodword,
    moodImageUrl,
    lookItems,
    resolveLayouts,
    canvasKey,
    canvasBg,
    showMoodPlaceholders,
  };

  const scaledWidth = Math.round(LOOK_CANVAS_REFERENCE_WIDTH * previewScale);
  const previewMaskHeight = Math.round(PREVIEW_TOTAL_HEIGHT_PX * previewScale);

  return (
    <div className={`mx-auto w-full min-w-0 max-w-full ${className}`.trim()}>
      <div
        ref={exportRootRef}
        data-look-card-export
        aria-hidden
        className="pointer-events-none fixed top-0 -left-[10000px] w-[420px] overflow-hidden bg-white"
        style={{ height: PREVIEW_TOTAL_HEIGHT_PX }}
      >
        <OutfitMoodboardRender
          {...renderProps}
          containerRef={exportContainerRef}
          eagerImageLoading
        />
      </div>

      <div ref={measureRef} className="w-full min-w-0">
        <div
          className="mx-auto overflow-hidden"
          style={{
            width: scaledWidth,
            height: previewMaskHeight,
          }}
        >
          <div
            className="origin-top-left"
            style={{
              width: LOOK_CANVAS_REFERENCE_WIDTH,
              transform: `scale(${previewScale})`,
            }}
          >
            <div className="w-[420px]">
              <OutfitMoodboardRender
                {...renderProps}
                containerRef={previewContainerRef}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
