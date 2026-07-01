"use client";

import { useMemo, useState } from "react";
import type { ResolvedLookItem } from "@/types/look";
import {
  clearCanvasLayoutsFromStorage,
  formatHitboxHeight,
  formatHitboxWidth,
  resolveHitboxOffset,
  stripLegacyModelLayers,
  type CanvasItemLayout,
} from "@/lib/canvasLayout";
import { isLocalhostClient } from "@/lib/dev";

interface CoordinateEditorExportProps {
  lookId: string;
  items: ResolvedLookItem[];
  canvasLayouts?: Record<string, CanvasItemLayout>;
  isCollage?: boolean;
}

function layoutToExportEntry(
  itemId: string,
  layout: CanvasItemLayout,
  label?: string,
) {
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
  lookId,
  items,
  canvasLayouts = {},
  isCollage = false,
}: CoordinateEditorExportProps) {
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const canSaveToCodebase = isLocalhostClient();
  const clothingLayouts = useMemo(
    () => stripLegacyModelLayers(canvasLayouts),
    [canvasLayouts],
  );

  const canvasJson = useMemo(() => {
    const entries = items.map((item) => {
      const layout = clothingLayouts[item.id];
      if (!layout) {
        return { itemId: item.id };
      }
      return layoutToExportEntry(item.id, layout, item.name);
    });

    return JSON.stringify(entries, null, 2);
  }, [items, clothingLayouts]);

  const canvasSnippet = useMemo(() => {
    return items
      .map((item) => {
        const layout = clothingLayouts[item.id];
        if (!layout) {
          return `// missing layout for ${item.id}`;
        }

        const widthPercent = item.defaultCanvasPosition?.width ?? "20%";

        return `// ${item.id}
defaultCanvasPosition: {
  top: "${layout.top}",
  left: "${layout.left}",
  width: "${widthPercent}",
  zIndex: ${layout.zIndex},
},
// hitboxWidth: "${formatHitboxWidth(layout)}",
// hitboxHeight: "${formatHitboxHeight(layout)}",`;
      })
      .join("\n\n");
  }, [items, clothingLayouts]);

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

  const handleSaveToCodebase = async () => {
    setSaveState("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/save-canvas-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookId, layouts: clothingLayouts }),
      });

      const payload = (await response.json()) as {
        error?: string;
        file?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save canvas layout.");
      }

      clearCanvasLayoutsFromStorage(lookId);
      setSaveState("saved");
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setSaveState("error");
      setSaveError(
        error instanceof Error ? error.message : "Failed to save canvas layout.",
      );
    }
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
        {canSaveToCodebase && (
          <>
            <button
              type="button"
              onClick={handleSaveToCodebase}
              disabled={saveState === "saving" || saveState === "saved"}
              className="w-full border border-neutral-900 bg-neutral-900 px-4 py-3 text-[10px] tracking-[0.25em] text-white uppercase transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveState === "saving"
                ? "Saving to Codebase…"
                : saveState === "saved"
                  ? "Saved — Reloading…"
                  : "Save Layout to Codebase"}
            </button>
            <p className="text-[9px] leading-relaxed text-neutral-500">
              Writes canvas layouts into the matching{" "}
              <span className="font-mono">
                src/data/dynamic-looks/*.json
              </span>{" "}
              look file and reloads so committed layouts load for everyone on
              deploy.
            </p>
            {saveState === "error" && saveError && (
              <p className="text-[9px] leading-relaxed text-red-600">
                {saveError}
              </p>
            )}
          </>
        )}
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
