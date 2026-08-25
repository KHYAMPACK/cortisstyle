"use client";

import { panelChipClass } from "@/components/tr/panel/panelUi";
import {
  getTrCategoryNavChildren,
  listTrCategoriesGrouped,
  type TrCategoryDefinition,
} from "@/lib/tr/categories";

interface TrOwnerCategoryPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  /** Extra unknown categories (e.g. legacy product ids). */
  extras?: TrCategoryDefinition[];
  disabled?: boolean;
  /** When set, only that family's shop leaves (AI pick + owner correction). */
  parentId?: string | null;
  /** Hide leaves that belong to another pipeline (e.g. takım as a set item). */
  excludeIds?: string[];
}

export function TrOwnerCategoryPicker({
  value,
  onChange,
  extras = [],
  disabled = false,
  parentId = null,
  excludeIds = [],
}: TrOwnerCategoryPickerProps) {
  const hidden = new Set(excludeIds);
  if (parentId) {
    const items = getTrCategoryNavChildren(parentId).filter(
      (entry) => !hidden.has(entry.id),
    );
    if (items.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((entry) => {
          const active = value === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(entry.id)}
              className={panelChipClass(active)}
            >
              {entry.label}
            </button>
          );
        })}
      </div>
    );
  }

  const groups = listTrCategoriesGrouped();
  const knownIds = new Set(
    groups.flatMap((group) => group.items.map((item) => item.id)),
  );
  const extraItems = extras.filter((entry) => !knownIds.has(entry.id));

  const chipClass = (active: boolean) =>
    panelChipClass(active);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.items.map((entry) => {
              const active = value === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange(active ? null : entry.id)
                  }
                  className={chipClass(active)}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {extraItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
            Diğer
          </p>
          <div className="flex flex-wrap gap-2">
            {extraItems.map((entry) => {
              const active = value === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(active ? null : entry.id)}
                  className={chipClass(active)}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
