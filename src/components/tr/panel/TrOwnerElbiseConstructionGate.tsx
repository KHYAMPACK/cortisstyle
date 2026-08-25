"use client";

import { panelChipClass } from "@/components/tr/panel/panelUi";
import {
  constructionGateRequiredCopy,
  decolleteNoneLabel,
  getConstructionGateGroup,
  getConstructionPackshotGateGroups,
  withDefaultSleeves,
} from "@/lib/tr/catalog/dressFeatures";
import {
  altGiyimUsesPaca,
  type ConstructionCatalogFamily,
} from "@/lib/tr/catalog/garmentUploadTypes";

export { constructionGateRequiredCopy } from "@/lib/tr/catalog/dressFeatures";

export interface ElbiseGateChipState {
  neckline: string;
  sleeves: string;
  fit: string;
  length: string;
  decollete: string;
  rise: string;
  hem: string;
}

interface TrOwnerElbiseConstructionGateFieldsProps {
  chips: ElbiseGateChipState;
  onChange: (chips: ElbiseGateChipState) => void;
  disabled?: boolean;
  family?: ConstructionCatalogFamily;
  shopCategory?: string | null;
  hasDetailPhoto?: boolean;
}

export function emptyElbiseGateChips(
  proposed?: {
    neckline?: string | null;
    sleeves?: string | null;
    fit?: string | null;
    length?: string | null;
    decollete?: string | null;
    rise?: string | null;
    hem?: string | null;
  } | null,
  options?: { hasDetailPhoto?: boolean },
): ElbiseGateChipState {
  const hasDetailPhoto = options?.hasDetailPhoto !== false;
  return withDefaultSleeves({
    neckline: proposed?.neckline?.trim() || "",
    sleeves: proposed?.sleeves?.trim() || "",
    fit: proposed?.fit?.trim() || "",
    length: proposed?.length?.trim() || "",
    decollete: hasDetailPhoto
      ? proposed?.decollete?.trim() || ""
      : decolleteNoneLabel(),
    rise: proposed?.rise?.trim() || "",
    hem: proposed?.hem?.trim() || "",
  });
}

export function elbiseGateReady(
  chips: ElbiseGateChipState,
  family: ConstructionCatalogFamily = "elbise",
  shopCategory?: string | null,
): boolean {
  if (family === "alt-giyim") {
    const base = Boolean(
      chips.length.trim() && chips.rise.trim() && chips.fit.trim(),
    );
    if (!base) return false;
    if (!altGiyimUsesPaca(shopCategory)) return true;
    return Boolean(chips.hem.trim());
  }
  const base = Boolean(
    chips.neckline.trim() && chips.sleeves.trim() && chips.length.trim(),
  );
  if (!base) return false;
  if (family === "ust-giyim") return Boolean(chips.fit.trim());
  return true;
}

export function constructionGateErrorCopy(
  family: ConstructionCatalogFamily,
  shopCategory?: string | null,
): string {
  return `${constructionGateRequiredCopy(family, shopCategory)} seçin.`;
}

export function TrOwnerElbiseConstructionGateFields({
  chips,
  onChange,
  disabled = false,
  family = "elbise",
  shopCategory = null,
  hasDetailPhoto = true,
}: TrOwnerElbiseConstructionGateFieldsProps) {
  return (
    <div className="space-y-4">
      {getConstructionPackshotGateGroups(
        family,
        shopCategory,
        hasDetailPhoto,
      ).map((gate) => {
        const group = getConstructionGateGroup(gate.key, family, shopCategory);
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
