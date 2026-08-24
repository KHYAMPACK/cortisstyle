"use client";

import { panelChipClass } from "@/components/tr/panel/panelUi";
import {
  DRESS_PACKSHOT_GATE_GROUPS,
  getDressFeatureGroup,
  withDefaultSleeves,
} from "@/lib/tr/catalog/dressFeatures";

export interface ElbiseGateChipState {
  neckline: string;
  sleeves: string;
  length: string;
  decollete: string;
}

interface TrOwnerElbiseConstructionGateFieldsProps {
  chips: ElbiseGateChipState;
  onChange: (chips: ElbiseGateChipState) => void;
  disabled?: boolean;
}

export function emptyElbiseGateChips(
  proposed?: {
    neckline?: string | null;
    sleeves?: string | null;
    length?: string | null;
    decollete?: string | null;
  } | null,
): ElbiseGateChipState {
  return withDefaultSleeves({
    neckline: proposed?.neckline?.trim() || "",
    sleeves: proposed?.sleeves?.trim() || "",
    length: proposed?.length?.trim() || "",
    decollete: proposed?.decollete?.trim() || "",
  });
}

export function elbiseGateReady(chips: ElbiseGateChipState): boolean {
  return Boolean(
    chips.neckline.trim() && chips.sleeves.trim() && chips.length.trim(),
  );
}

export function TrOwnerElbiseConstructionGateFields({
  chips,
  onChange,
  disabled = false,
}: TrOwnerElbiseConstructionGateFieldsProps) {
  return (
    <div className="space-y-4">
      {DRESS_PACKSHOT_GATE_GROUPS.map((gate) => {
        const group = getDressFeatureGroup(gate.key);
        if (!group) return null;
        const current = chips[gate.key];
        return (
          <div key={gate.key} className="space-y-2">
            <p className="text-[14px] font-medium text-neutral-700">
              {gate.label}
              {gate.required ? (
                <span className="text-red-600"> *</span>
              ) : (
                <span className="ml-1 font-normal text-neutral-400">
                  (isteğe bağlı)
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const nextValue =
                      current === option.label
                        ? gate.required
                          ? current
                          : ""
                        : option.label;
                    onChange(
                      withDefaultSleeves({
                        ...chips,
                        [gate.key]: nextValue,
                      }),
                    );
                  }}
                  className={panelChipClass(current === option.label)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
