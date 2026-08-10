"use client";

import {
  listTrCategoriesGrouped,
  type TrCategoryDefinition,
} from "@/lib/tr/categories";

interface TrOwnerCategoryPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  /** Extra unknown categories (e.g. legacy product ids). */
  extras?: TrCategoryDefinition[];
  disabled?: boolean;
}

export function TrOwnerCategoryPicker({
  value,
  onChange,
  extras = [],
  disabled = false,
}: TrOwnerCategoryPickerProps) {
  const groups = listTrCategoriesGrouped();
  const knownIds = new Set(
    groups.flatMap((group) => group.items.map((item) => item.id)),
  );
  const extraItems = extras.filter((entry) => !knownIds.has(entry.id));

  const chipClass = (active: boolean) =>
    `rounded-full px-4 py-3 text-[16px] font-semibold disabled:opacity-50 ${
      active
        ? "text-white"
        : "bg-white text-neutral-800 ring-1 ring-[color:var(--panel-accent-border)]"
    }`;

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
                  style={
                    active
                      ? { backgroundColor: "var(--panel-accent)" }
                      : undefined
                  }
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
                  style={
                    active
                      ? { backgroundColor: "var(--panel-accent)" }
                      : undefined
                  }
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
