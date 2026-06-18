"use client";

import { useMemo } from "react";
import type { LookItem } from "@/types/look";

interface CoordinateEditorExportProps {
  items: LookItem[];
}

export function CoordinateEditorExport({ items }: CoordinateEditorExportProps) {
  const coordinatesJson = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({
          id: item.id,
          name: item.name,
          coordinates: item.coordinates,
        })),
        null,
        2,
      ),
    [items],
  );

  const leaderSnippet = useMemo(
    () =>
      items
        .map(
          (item) =>
            `leader("${item.coordinates.from.top}", "${item.coordinates.from.left}", "${item.coordinates.to.top}", "${item.coordinates.to.left}"),`,
        )
        .join("\n"),
    [items],
  );

  const handleCopy = async () => {
    const payload = `${coordinatesJson}\n\n// leader() helpers:\n${leaderSnippet}`;
    await navigator.clipboard.writeText(payload);
  };

  return (
    <div className="mt-6 space-y-3 border-t border-blue-200 pt-6">
      <p className="text-[9px] tracking-[0.35em] text-blue-600 uppercase">
        Editor Export
      </p>
      <textarea
        readOnly
        value={coordinatesJson}
        rows={8}
        className="w-full resize-none border border-blue-200 bg-blue-50/40 p-3 font-mono text-[10px] leading-relaxed text-neutral-800 outline-none"
      />
      <textarea
        readOnly
        value={leaderSnippet}
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
