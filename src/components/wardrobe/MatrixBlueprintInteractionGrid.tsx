"use client";

import type { ReactNode } from "react";
import { MATRIX_BLUEPRINT_COLUMNS } from "@/lib/matrixBlueprintLayout";

interface MatrixBlueprintInteractionGridProps {
  className?: string;
  renderCell: (config: {
    slotIndex: number;
    heightClass: string;
  }) => ReactNode;
}

/** Mirrors blueprint anatomical columns for aligned slot hit targets. */
export function MatrixBlueprintInteractionGrid({
  className = "",
  renderCell,
}: MatrixBlueprintInteractionGridProps) {
  return (
    <div
      className={`absolute inset-0 flex h-full w-full ${className}`.trim()}
    >
      {MATRIX_BLUEPRINT_COLUMNS.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex h-full min-h-0 flex-1 flex-col"
        >
          {column.map((cell) => (
            <div key={cell.slotIndex} className={`w-full ${cell.heightClass}`}>
              {renderCell({
                slotIndex: cell.slotIndex,
                heightClass: cell.heightClass,
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
