"use client";

import { useMemo } from "react";
import type { ResolvedLookItem } from "@/types/look";

interface CoordinateEditorExportProps {
  items: ResolvedLookItem[];
}

export function CoordinateEditorExport({ items }: CoordinateEditorExportProps) {
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
    const payload = `${placementsJson}\n\n// placement() helpers:\n${placementSnippet}`;
    await navigator.clipboard.writeText(payload);
  };

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
