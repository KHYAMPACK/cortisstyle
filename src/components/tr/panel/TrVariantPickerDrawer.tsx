"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import {
  panelChipClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { PRODUCT_VARIANT_LIMITS } from "@/lib/tr/variants/productVariantRules";
import type { VariantSelection } from "@/lib/tr/variants/variantForm";
import type { TrVariantTypeListEntry } from "@/lib/tr/variants/types";

const LINK_BUTTON =
  "inline-flex items-center gap-1 text-[12px] font-medium text-[color:var(--panel-accent-deep)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]";

/**
 * "Varyant Ekle" / "Varyantları düzenle": pick the variant types a Gelişmiş product uses
 * and which of their values, and see how many variants that makes. Presentational — the
 * Varyant card owns the selection and turns it into rows on Uygula.
 */
export function TrVariantPickerDrawer({
  open,
  types,
  loaded,
  selection,
  onSelectionChange,
  dirty,
  problem,
  variantCount,
  removalCount,
  confirmingRemoval,
  onApply,
  onCancelRemoval,
  onClose,
  onNewType,
  onEditType,
  onAddValue,
}: {
  open: boolean;
  types: readonly TrVariantTypeListEntry[];
  loaded: boolean;
  selection: VariantSelection;
  /** Takes an updater, so changes made before a re-render build on each other. */
  onSelectionChange: (update: (current: VariantSelection) => VariantSelection) => void;
  dirty: boolean;
  /** Why the selection can't be applied yet, or null. */
  problem: string | null;
  /** How many variants the selection makes. */
  variantCount: number;
  /** How many existing variants applying it drops (their data goes with them). */
  removalCount: number;
  /** Uygula was pressed while variants would be removed: ask first. */
  confirmingRemoval: boolean;
  onApply: () => void;
  onCancelRemoval: () => void;
  onClose: () => void;
  onNewType: () => void;
  onEditType: (type: TrVariantTypeListEntry) => void;
  /** Adds a value to a list-style type on the spot; resolves with an error sentence, or null. */
  onAddValue: (type: TrVariantTypeListEntry, label: string) => Promise<string | null>;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<string | null>(null);

  const atLimit = selection.typeIds.length >= PRODUCT_VARIANT_LIMITS.typesMax;

  const toggleType = (typeId: string) =>
    onSelectionChange((current) => {
      if (current.typeIds.includes(typeId)) {
        const rest = { ...current.valueIdsByType };
        delete rest[typeId];
        return {
          typeIds: current.typeIds.filter((id) => id !== typeId),
          valueIdsByType: rest,
        };
      }
      if (current.typeIds.length >= PRODUCT_VARIANT_LIMITS.typesMax) return current;
      return {
        typeIds: [...current.typeIds, typeId],
        valueIdsByType: { ...current.valueIdsByType, [typeId]: [] },
      };
    });

  const setValues = (typeId: string, valueIds: string[]) =>
    onSelectionChange((current) => ({
      ...current,
      valueIdsByType: { ...current.valueIdsByType, [typeId]: valueIds },
    }));

  const toggleValue = (typeId: string, valueId: string) =>
    onSelectionChange((current) => {
      const chosen = current.valueIdsByType[typeId] ?? [];
      return {
        ...current,
        valueIdsByType: {
          ...current.valueIdsByType,
          [typeId]: chosen.includes(valueId)
            ? chosen.filter((id) => id !== valueId)
            : [...chosen, valueId],
        },
      };
    });

  const addValue = async (type: TrVariantTypeListEntry) => {
    const label = (drafts[type.id] ?? "").trim();
    if (!label || adding) return;
    setAdding(type.id);
    const problemText = await onAddValue(type, label);
    setAdding(null);
    setNotes((current) => ({ ...current, [type.id]: problemText ?? "" }));
    if (!problemText) setDrafts((current) => ({ ...current, [type.id]: "" }));
  };

  const selectedTypes = selection.typeIds
    .map((id) => types.find((type) => type.id === id))
    .filter((type): type is TrVariantTypeListEntry => Boolean(type));

  return (
    <TrPanelDrawer
      open={open}
      onClose={onClose}
      title="Varyantlar"
      dirty={dirty}
      saveLabel="Uygula"
      saveDisabled={Boolean(problem) || confirmingRemoval}
      onSave={onApply}
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className={panelLabelClass}>Varyant türleri</p>
            <span className={panelHintClass}>
              {selection.typeIds.length}/{PRODUCT_VARIANT_LIMITS.typesMax}
            </span>
          </div>

          {!loaded ? (
            <p className={panelHintClass}>Varyant türleri yükleniyor…</p>
          ) : types.length === 0 ? (
            <p className={panelHintClass}>
              Henüz varyant türü tanımlamadınız. Renk veya beden gibi bir tür
              oluşturarak başlayın.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {types.map((type) => {
                const checked = selection.typeIds.includes(type.id);
                const blocked = !checked && atLimit;
                return (
                  <li key={type.id}>
                    <label
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[14px] ${
                        checked
                          ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-soft)]"
                          : "border-neutral-200 bg-white"
                      } ${blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={blocked}
                        onChange={() => toggleType(type.id)}
                        className="h-4 w-4 accent-[color:var(--panel-accent)]"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">
                        {type.name}
                      </span>
                      <span className={panelHintClass}>{type.values.length} değer</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <button type="button" onClick={onNewType} className={LINK_BUTTON}>
            + Yeni varyant türü
          </button>
        </section>

        {selectedTypes.map((type) => {
          const chosen = selection.valueIdsByType[type.id] ?? [];
          const allChosen = chosen.length === type.values.length;
          return (
            <section key={type.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className={panelLabelClass}>{type.name} değerleri</p>
                <span className="flex items-center gap-3">
                  <button
                    type="button"
                    className={LINK_BUTTON}
                    onClick={() =>
                      setValues(type.id, allChosen ? [] : type.values.map((v) => v.id))
                    }
                  >
                    {allChosen ? "Seçimi temizle" : "Tümünü seç"}
                  </button>
                  <button
                    type="button"
                    className={LINK_BUTTON}
                    onClick={() => onEditType(type)}
                  >
                    <Pencil className="size-3" aria-hidden />
                    Türü düzenle
                  </button>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {type.values.map((value) => {
                  const active = chosen.includes(value.id);
                  return (
                    <button
                      key={value.id}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      onClick={() => toggleValue(type.id, value.id)}
                      className={`${panelChipClass(active)} inline-flex items-center gap-2`}
                    >
                      {type.selectionStyle === "swatch" ? (
                        <span
                          aria-hidden
                          className="size-3.5 rounded-full border border-black/15 bg-neutral-200 bg-cover bg-center"
                          style={{
                            ...(value.hex ? { backgroundColor: value.hex } : {}),
                            ...(value.imageUrl
                              ? { backgroundImage: `url(${value.imageUrl})` }
                              : {}),
                          }}
                        />
                      ) : null}
                      {value.label}
                    </button>
                  );
                })}
              </div>

              {type.selectionStyle === "list" ? (
                <div className="flex gap-2 pt-1">
                  <input
                    value={drafts[type.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [type.id]: event.target.value }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addValue(type);
                      }
                    }}
                    placeholder="Yeni değer ekle"
                    maxLength={40}
                    aria-label={`${type.name} için yeni değer`}
                    className={`${panelFieldClass} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    disabled={!(drafts[type.id] ?? "").trim() || adding === type.id}
                    onClick={() => void addValue(type)}
                    className={panelSecondaryBtnClass}
                  >
                    Ekle
                  </button>
                </div>
              ) : (
                <p className={panelHintClass}>
                  Renk veya görsel değerleri eklemek için “Türü düzenle”yi kullanın.
                </p>
              )}
              {notes[type.id] ? <p className={panelHintClass}>{notes[type.id]}</p> : null}
            </section>
          );
        })}

        {selection.typeIds.length > 0 ? (
          problem ? (
            <p className={panelErrorClass}>{problem}</p>
          ) : (
            <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[14px] text-neutral-800">
              <span className="font-semibold">{variantCount}</span> varyant oluşturulacak.
            </p>
          )
        ) : (
          <p className={panelHintClass}>
            Hiçbir tür seçmezseniz ürün, Basit ürün gibi tek fiyat ve tek stokla satılır.
          </p>
        )}

        {confirmingRemoval ? (
          <div
            role="alertdialog"
            aria-label="Varyantlar kaldırılacak"
            className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5"
          >
            <p className="text-[14px] text-amber-950">
              Bu seçim <span className="font-semibold">{removalCount}</span> mevcut
              varyantı kaldırır; SKU, fiyat ve stok bilgileri de silinir. Devam
              edilsin mi?
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onApply} className={panelSecondaryBtnClass}>
                Evet, kaldır
              </button>
              <button
                type="button"
                onClick={onCancelRemoval}
                className={panelSecondaryBtnClass}
              >
                Vazgeç
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </TrPanelDrawer>
  );
}
