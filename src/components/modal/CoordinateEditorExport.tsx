"use client";

import { useMemo } from "react";
import type { ResolvedLookItem } from "@/types/look";
import {
  formatHitboxHeight,
  formatHitboxWidth,
  resolveHitboxOffset,
  MODEL_NAME_CANVAS_ID,
  MODEL_PORTRAIT_CANVAS_ID,
  type CanvasItemLayout,
} from "@/lib/canvasLayout";

interface CoordinateEditorExportProps {
  items: ResolvedLookItem[];
  canvasLayouts?: Record<string, CanvasItemLayout>;
  isCollage?: boolean;
  modelName?: string;
}

function layoutToExportEntry(
  itemId: string,
  layout: CanvasItemLayout,
  label?: string,
) {
  if (layout.fontSizePx !== undefined && layout.widthPx === undefined) {
    return {
      itemId,
      label,
      top: layout.top,
      left: layout.left,
      fontSize: `${layout.fontSizePx}px`,
      zIndex: layout.zIndex,
    };
  }

  return {
    itemId,
    label,
    top: layout.top,
    left: layout.left,
    width: `${layout.widthPx}px`,
    hitboxWidth: formatHitboxWidth(layout),
    hitboxHeight: formatHitboxHeight(layout),
    hitboxOffsetTop: `${resolveHitboxOffset(layout).topPx}px`,
    hitboxOffsetLeft: `${resolveHitboxOffset(layout).leftPx}px`,
    zIndex: layout.zIndex,
  };
}

export function CoordinateEditorExport({
  items,
  canvasLayouts = {},
  isCollage = false,
  modelName,
}: CoordinateEditorExportProps) {
  const canvasJson = useMemo(() => {
    const entries = [];

    const modelLayout = canvasLayouts[MODEL_PORTRAIT_CANVAS_ID];
    if (modelLayout) {
      entries.push(
        layoutToExportEntry(
          MODEL_PORTRAIT_CANVAS_ID,
          modelLayout,
          "Model portrait",
        ),
      );
    }

    const nameLayout = canvasLayouts[MODEL_NAME_CANVAS_ID];
    if (nameLayout) {
      entries.push(
        layoutToExportEntry(
          MODEL_NAME_CANVAS_ID,
          nameLayout,
          modelName ?? "Model name",
        ),
      );
    }

    for (const item of items) {
      const layout = canvasLayouts[item.id];
      if (!layout) {
        entries.push({ itemId: item.id });
        continue;
      }
      entries.push(layoutToExportEntry(item.id, layout, item.name));
    }

    return JSON.stringify(entries, null, 2);
  }, [items, canvasLayouts, modelName]);

  const canvasSnippet = useMemo(() => {
    const snippets: string[] = [];
    const modelLayout = canvasLayouts[MODEL_PORTRAIT_CANVAS_ID];

    if (modelLayout) {
      snippets.push(`// Model portrait
modelPortraitPosition: {
  top: "${modelLayout.top}",
  left: "${modelLayout.left}",
  width: "42%",
  zIndex: ${modelLayout.zIndex},
},
// hitboxWidth: "${formatHitboxWidth(modelLayout)}",
// hitboxHeight: "${formatHitboxHeight(modelLayout)}",`);
    }

    const nameLayout = canvasLayouts[MODEL_NAME_CANVAS_ID];
    if (nameLayout) {
      snippets.push(`// Model name typography
modelNamePosition: {
  top: "${nameLayout.top}",
  left: "${nameLayout.left}",
  fontSizePx: ${nameLayout.fontSizePx ?? 11},
  zIndex: ${nameLayout.zIndex},
},`);
    }

    for (const item of items) {
      const layout = canvasLayouts[item.id];
      if (!layout) {
        snippets.push(`// missing layout for ${item.id}`);
        continue;
      }

      const widthPercent = item.defaultCanvasPosition?.width ?? "20%";

      snippets.push(`// ${item.id}
defaultCanvasPosition: {
  top: "${layout.top}",
  left: "${layout.left}",
  width: "${widthPercent}",
  zIndex: ${layout.zIndex},
},
// hitboxWidth: "${formatHitboxWidth(layout)}",
// hitboxHeight: "${formatHitboxHeight(layout)}",`);
    }

    return snippets.join("\n\n");
  }, [items, canvasLayouts]);

  const placementsJson = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({
          itemId: item.id,
          coordinates: item.coordinates,
        })),
        null,
        2,
      ),
    [items],
  );

  const placementSnippet = useMemo(
    () =>
      items
        .map(
          (item) =>
            `placement("${item.id}", "${item.coordinates.from.top}", "${item.coordinates.from.left}", "${item.coordinates.to.top}", "${item.coordinates.to.left}"),`,
        )
        .join("\n"),
    [items],
  );

  const handleCopy = async () => {
    const payload = isCollage
      ? `${canvasJson}\n\n// layout snippets:\n${canvasSnippet}`
      : `${placementsJson}\n\n// placement() helpers:\n${placementSnippet}`;

    await navigator.clipboard.writeText(payload);
  };

  if (isCollage) {
    return (
      <div className="mt-6 space-y-3 border-t border-blue-200 pt-6">
        <p className="text-[9px] tracking-[0.35em] text-blue-600 uppercase">
          Canvas Layout Export
        </p>
        <p className="text-[9px] leading-relaxed text-neutral-500">
          Press <span className="font-mono">H</span> to toggle hitbox mode.
          Arrows move the hitbox, Shift+Arrows resize it.
        </p>
        <textarea
          readOnly
          value={canvasJson}
          rows={8}
          className="w-full resize-none border border-blue-200 bg-blue-50/40 p-3 font-mono text-[10px] leading-relaxed text-neutral-800 outline-none"
        />
        <textarea
          readOnly
          value={canvasSnippet}
          rows={8}
          className="w-full resize-none border border-blue-200 bg-blue-50/40 p-3 font-mono text-[10px] leading-relaxed text-neutral-800 outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="w-full border border-blue-600 bg-blue-600 px-4 py-3 text-[10px] tracking-[0.25em] text-white uppercase transition-colors hover:bg-blue-700"
        >
          Copy Canvas Layout to Clipboard
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3 border-t border-blue-200 pt-6">
      <p className="text-[9px] tracking-[0.35em] text-blue-600 uppercase">
        Editor Export
      </p>
      <textarea
        readOnly
        value={placementsJson}
        rows={8}
        className="w-full resize-none border border-blue-200 bg-blue-50/40 p-3 font-mono text-[10px] leading-relaxed text-neutral-800 outline-none"
      />
      <textarea
        readOnly
        value={placementSnippet}
        rows={6}
        className="w-full resize-none border border-blue-200 bg-blue-50/40 p-3 font-mono text-[10px] leading-relaxed text-neutral-800 outline-none"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="w-full border border-blue-600 bg-blue-600 px-4 py-3 text-[10px] tracking-[0.25em] text-white uppercase transition-colors hover:bg-blue-700"
      >
        Copy Updated JSON to Clipboard
      </button>
    </div>
  );
}
