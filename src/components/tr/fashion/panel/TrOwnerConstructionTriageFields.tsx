"use client";

import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import {
  emptyElbiseGateChips,
  elbiseGateReady,
  TrOwnerElbiseConstructionGateFields,
  type ElbiseGateChipState,
} from "@/components/tr/fashion/panel/TrOwnerElbiseConstructionGate";
import { panelHintClass } from "@/components/tr/panel/panelUi";
import {
  constructionFamilyLeafReady,
  familyStillMatchesCategory,
  GARMENT_UPLOAD_TYPES,
  type ConstructionCatalogFamily,
} from "@/lib/tr/fashion/garmentUploadTypes";

const FAMILIES = GARMENT_UPLOAD_TYPES.filter(
  (entry) =>
    entry.live &&
    (entry.id === "elbise" ||
      entry.id === "ust-giyim" ||
      entry.id === "alt-giyim"),
);

export interface ConstructionTriageValue {
  family: ConstructionCatalogFamily;
  category: string | null;
  chips: ElbiseGateChipState;
}

export function constructionTriageReady(
  family: ConstructionCatalogFamily | null,
  shopCategory: string | null,
  chips: ElbiseGateChipState,
): boolean {
  if (!constructionFamilyLeafReady(family, shopCategory) || !family) {
    return false;
  }
  return elbiseGateReady(chips, family, shopCategory);
}

export function nextConstructionTriage(
  current: {
    family: ConstructionCatalogFamily | null;
    category: string | null;
    chips: ElbiseGateChipState;
  },
  nextFamily: ConstructionCatalogFamily,
  hasDetailPhoto: boolean,
): ConstructionTriageValue {
  const keepCategory = familyStillMatchesCategory(
    nextFamily,
    current.category,
  );
  return {
    family: nextFamily,
    category:
      nextFamily === "elbise"
        ? "elbise"
        : keepCategory
          ? current.category
          : null,
    chips:
      nextFamily === current.family
        ? current.chips
        : emptyElbiseGateChips(undefined, { hasDetailPhoto }),
  };
}

export function TrOwnerConstructionTriageFields({
  family,
  shopCategory,
  chips,
  onChange,
  disabled = false,
  hasDetailPhoto = true,
}: {
  family: ConstructionCatalogFamily | null;
  shopCategory: string | null;
  chips: ElbiseGateChipState;
  onChange: (next: ConstructionTriageValue) => void;
  disabled?: boolean;
  hasDetailPhoto?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[14px] font-semibold text-neutral-800">Tür</p>
        <div className="flex flex-wrap gap-2">
          {FAMILIES.map((entry) => {
            const active = family === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange(
                    nextConstructionTriage(
                      { family, category: shopCategory, chips },
                      entry.id as ConstructionCatalogFamily,
                      hasDetailPhoto,
                    ),
                  )
                }
                className={`min-h-10 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
                  active
                    ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent)] text-white"
                    : "border-neutral-200 bg-white text-neutral-800"
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      {family === "ust-giyim" || family === "alt-giyim" ? (
        <div className="space-y-2">
          <p className="text-[14px] font-semibold text-neutral-800">
            Alt kategori
          </p>
          <TrOwnerCategoryPicker
            value={shopCategory}
            onChange={(category) =>
              onChange({
                family,
                category,
                chips,
              })
            }
            parentId={family}
            disabled={disabled}
          />
        </div>
      ) : null}

      {family ? (
        <TrOwnerElbiseConstructionGateFields
          chips={chips}
          onChange={(next) =>
            onChange({
              family,
              category: shopCategory,
              chips: next,
            })
          }
          disabled={disabled}
          family={family}
          shopCategory={shopCategory}
          hasDetailPhoto={hasDetailPhoto}
        />
      ) : (
        <p className={panelHintClass}>Önce tür seçin.</p>
      )}
    </div>
  );
}
