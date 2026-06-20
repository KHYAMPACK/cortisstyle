"use client";

import { MatrixBlueprintGrid } from "@/components/modal/MatrixBlueprintGrid";
import { MATRIX_BLUEPRINT_EDITOR_LABELS } from "@/lib/matrixBlueprintLayout";

function MatrixBlueprintGuideCell({ label }: { label: string }) {
  return (
    <div className="relative h-full w-full border border-neutral-300/80">
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.12em] whitespace-nowrap text-neutral-500 uppercase">
        {label}
      </span>
    </div>
  );
}

export function MatrixBlueprintOverlay() {
  return (
    <MatrixBlueprintGrid
      className="z-30"
      renderCell={({ slotIndex }) => (
        <MatrixBlueprintGuideCell
          label={
            MATRIX_BLUEPRINT_EDITOR_LABELS[
              slotIndex as keyof typeof MATRIX_BLUEPRINT_EDITOR_LABELS
            ]
          }
        />
      )}
    />
  );
}
