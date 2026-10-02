"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { TrVariantPickerDrawer } from "@/components/tr/panel/TrVariantPickerDrawer";
import { TrVariantTypeDrawer } from "@/components/tr/panel/TrVariantTypeDrawer";
import { useOwnerVariantTypes } from "@/components/tr/panel/useOwnerVariantTypes";
import {
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  sanitizeStockInput,
  sanitizeTryPriceInput,
} from "@/lib/tr/ownerProductConstraints";
import { updateOwnerVariantType } from "@/lib/tr/ownerClient";
import { PRODUCT_VARIANT_LIMITS, variantLabel } from "@/lib/tr/variants/productVariantRules";
import {
  addValues,
  formFromVariantType,
  variantTypeBody,
} from "@/lib/tr/variants/typeForm";
import { labelKey } from "@/lib/tr/variants/typeRules";
import {
  applyBulk,
  applySelection,
  groupHasImage,
  groupVariantRows,
  toggleGroupImage,
  hasBulkChanges,
  selectionCombinations,
  selectionFromForm,
  selectionProblem,
  variantsTotalStock,
  type BulkChanges,
  type BulkTarget,
  type VariantRowDraft,
  type VariantSelection,
  type VariantsFormState,
} from "@/lib/tr/variants/variantForm";
import type {
  TrVariantType,
  TrVariantTypeListEntry,
} from "@/lib/tr/variants/types";

const CELL_INPUT =
  "w-full min-w-0 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[13px] text-neutral-900 outline-none transition-colors focus:border-[color:var(--panel-accent)] disabled:bg-neutral-50";

const EMPTY_SELECTION: VariantSelection = { typeIds: [], valueIdsByType: {} };

/** One of the product's photos, picked (ringed) or not, for a variant or a colour. */
function ImageToggle({
  url,
  index,
  selected,
  disabled,
  size,
  onToggle,
}: {
  url: string;
  index: number;
  selected: boolean;
  disabled: boolean;
  size: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${index + 1}. görsel`}
      disabled={disabled}
      onClick={onToggle}
      className={`${size} overflow-hidden rounded border transition-[box-shadow,opacity] ${
        selected
          ? "border-[color:var(--panel-accent)] ring-2 ring-[color:var(--panel-accent)]/40"
          : "border-neutral-200 opacity-55 hover:opacity-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full object-cover" />
    </button>
  );
}

/**
 * The Varyant card of a Gelişmiş product: choose option types and values in the drawer,
 * then edit the generated variants (SKU, barcode, price, stock, on/off). When one of the
 * product's option types has photos (`hasPhotos`, e.g. Renk), the variants are split into
 * a section per value of it, where that value's photos are uploaded and picked. It edits the form's variants only;
 * they are saved with the product's Kaydet.
 */
export function TrProductVariantsCard({
  boutiqueId,
  variants,
  onChange,
  productImages,
  productPrice,
  disabled = false,
  onUploadPhotos,
  uploadBlockedReason = null,
}: {
  boutiqueId: string;
  variants: VariantsFormState;
  onChange: (next: VariantsFormState) => void;
  /** The product's images, which a variant can pick from. */
  productImages: readonly string[];
  /** The product's price as typed, shown as the placeholder of an empty variant price. */
  productPrice: string;
  disabled?: boolean;
  /**
   * Uploads photos for one value of the photo option: the editor adds them to the
   * product's photos and to those variants (`rowKeys`).
   */
  onUploadPhotos?: (files: File[], rowKeys: string[]) => Promise<void>;
  /** Why photos can't be uploaded here right now, if they can't. */
  uploadBlockedReason?: string | null;
}) {
  const { types, loaded, reload } = useOwnerVariantTypes(boutiqueId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selection, setSelection] = useState<VariantSelection>(EMPTY_SELECTION);
  const [baseline, setBaseline] = useState("");
  const [confirming, setConfirming] = useState(false);
  // `null` = closed, `{ type: null }` = creating.
  const [typeDrawer, setTypeDrawer] = useState<{ type: TrVariantType | null } | null>(null);
  const [typeDrawerType, setTypeDrawerType] = useState<TrVariantType | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  // Which colour sections are open (unset = the default: open when there are at most two).
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [uploadingGroup, setUploadingGroup] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bulkTarget, setBulkTarget] = useState("all");
  const [bulk, setBulk] = useState<{ price: string; stock: string; active: "keep" | "on" | "off" }>(
    { price: "", stock: "", active: "keep" },
  );

  const valueLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of types) for (const value of type.values) map.set(value.id, value.label);
    return map;
  }, [types]);
  const labelOf = (valueId: string) => valueLabels.get(valueId) ?? "…";

  const hasRows = variants.rows.length > 0;
  const preview = applySelection(variants, selection, types);
  const problem = selectionProblem(selection, types);
  const variantCount = selectionCombinations(selection, types).length;

  const openPicker = () => {
    const initial = selectionFromForm(variants, types);
    setSelection(initial);
    setBaseline(JSON.stringify(initial));
    setConfirming(false);
    setPickerOpen(true);
  };

  const changeSelection = (
    update: (current: VariantSelection) => VariantSelection,
  ) => {
    setSelection(update);
    setConfirming(false);
  };

  const apply = () => {
    if (problem) return;
    if (preview.removed > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    onChange(preview.form);
    setPickerOpen(false);
    setConfirming(false);
  };

  // The type form opens on top of nothing: the picker steps aside, then comes back with
  // its selection intact.
  const openTypeDrawer = (type: TrVariantType | null) => {
    setTypeDrawerType(type);
    setTypeDrawer({ type });
    setPickerOpen(false);
  };
  const closeTypeDrawer = () => {
    setTypeDrawer(null);
    setPickerOpen(true);
  };

  const addTypeValue = async (
    type: TrVariantTypeListEntry,
    label: string,
  ): Promise<string | null> => {
    const { form, skipped } = addValues(formFromVariantType(type), [label]);
    if (skipped.length > 0) return "Bu değer zaten var.";
    try {
      const { type: saved } = await updateOwnerVariantType(type.id, variantTypeBody(form));
      await reload();
      const added = saved.values.find((value) => labelKey(value.label) === labelKey(label));
      if (added) {
        setSelection((current) => ({
          ...current,
          valueIdsByType: {
            ...current.valueIdsByType,
            [type.id]: [...(current.valueIdsByType[type.id] ?? []), added.id],
          },
        }));
      }
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Değer eklenemedi.";
    }
  };

  const updateRow = (key: string, patch: Partial<VariantRowDraft>) =>
    onChange({
      ...variants,
      rows: variants.rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    });

  // What the option summary and the bulk-edit target list show: the values in use.
  const optionSummary = variants.typeIds.map((typeId, index) => {
    const type = types.find((entry) => entry.id === typeId);
    const used = new Set(variants.rows.map((row) => row.optionValueIds[index]));
    const values = (type?.values ?? []).filter((value) => used.has(value.id));
    return { typeId, name: type?.name ?? "…", values };
  });

  // Sections: one per value of the product's photo option (Renk…), if it has one.
  const photoTypeId =
    variants.typeIds.find((typeId) => types.find((type) => type.id === typeId)?.hasPhotos) ?? null;
  const photoIndex = photoTypeId ? variants.typeIds.indexOf(photoTypeId) : -1;
  const grouped = photoIndex >= 0;
  const groups = groupVariantRows(
    variants,
    photoTypeId,
    optionSummary[photoIndex]?.values.map((value) => value.id),
  );
  const restHeader =
    optionSummary
      .filter((_, index) => index !== photoIndex)
      .map((option) => option.name)
      .join(" / ") || "Varyant";
  const otherValues = (ids: readonly string[]) => ids.filter((_, index) => index !== photoIndex);

  const uploadForGroup = async (groupId: string, rowKeys: string[], files: FileList | null) => {
    if (!onUploadPhotos || !files || files.length === 0) return;
    setUploadError(null);
    setUploadingGroup(groupId);
    try {
      await onUploadPhotos(Array.from(files), rowKeys);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Fotoğraf yüklenemedi.");
    } finally {
      setUploadingGroup(null);
    }
  };
  const isOpen = (id: string) => expanded[id] ?? groups.length <= 2;
  const allOpen = groups.every((group) => isOpen(group.valueId ?? ""));

  const bulkTargetValue = (): BulkTarget =>
    bulkTarget === "all" ? { kind: "all" } : { kind: "value", valueId: bulkTarget };
  const bulkChanges: BulkChanges = {
    price: bulk.price,
    stock: bulk.stock,
    active: bulk.active === "keep" ? undefined : bulk.active === "on",
  };

  return (
    <div className="space-y-5">
      {!hasRows ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-5">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-neutral-900">
              Henüz bir varyant eklemediniz.
            </p>
            <p className={`mt-0.5 ${panelHintClass}`}>
              Renk, beden gibi seçenekleri seçin; her kombinasyon ayrı fiyat ve stokla
              satılabilir. Eklemezseniz ürün tek fiyat ve tek stokla satılır.
            </p>
          </div>
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className={panelPrimaryBtnClass}
          >
            Varyant Ekle
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1 text-[13px] text-neutral-700">
              {optionSummary.map((option) => (
                <li key={option.typeId}>
                  <span className="font-semibold text-neutral-900">{option.name}:</span>{" "}
                  {option.values.map((value) => value.label).join(", ")}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkOpen((open) => !open)}
                aria-expanded={bulkOpen}
                disabled={disabled}
                className={panelSecondaryBtnClass}
              >
                Toplu düzenle
              </button>
              <button
                type="button"
                onClick={openPicker}
                disabled={disabled}
                className={panelSecondaryBtnClass}
              >
                Varyantları düzenle
              </button>
            </div>
          </div>

          {bulkOpen ? (
            <div className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-end">
              <label className="block space-y-1.5">
                <span className={panelLabelClass}>Uygulanacak varyantlar</span>
                <select
                  value={bulkTarget}
                  onChange={(event) => setBulkTarget(event.target.value)}
                  className={CELL_INPUT}
                >
                  <option value="all">Tüm varyantlar ({variants.rows.length})</option>
                  {optionSummary.flatMap((option) =>
                    option.values.map((value) => (
                      <option key={value.id} value={value.id}>
                        {option.name}: {value.label}
                      </option>
                    )),
                  )}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className={panelLabelClass}>Fiyat (₺)</span>
                <input
                  value={bulk.price}
                  onChange={(event) =>
                    setBulk({ ...bulk, price: sanitizeTryPriceInput(event.target.value) })
                  }
                  inputMode="decimal"
                  placeholder="Değiştirme"
                  className={CELL_INPUT}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={panelLabelClass}>Stok</span>
                <input
                  value={bulk.stock}
                  onChange={(event) =>
                    setBulk({ ...bulk, stock: sanitizeStockInput(event.target.value) })
                  }
                  inputMode="numeric"
                  placeholder="Değiştirme"
                  className={CELL_INPUT}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={panelLabelClass}>Durum</span>
                <select
                  value={bulk.active}
                  onChange={(event) =>
                    setBulk({ ...bulk, active: event.target.value as "keep" | "on" | "off" })
                  }
                  className={CELL_INPUT}
                >
                  <option value="keep">Değiştirme</option>
                  <option value="on">Aktif</option>
                  <option value="off">Pasif</option>
                </select>
              </label>
              <button
                type="button"
                disabled={!hasBulkChanges(bulkChanges)}
                onClick={() => {
                  onChange(applyBulk(variants, bulkTargetValue(), bulkChanges));
                  setBulk({ price: "", stock: "", active: "keep" });
                }}
                className={panelPrimaryBtnClass}
              >
                Uygula
              </button>
            </div>
          ) : null}

          {grouped && groups.length > 2 ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setExpanded(
                    Object.fromEntries(groups.map((group) => [group.valueId ?? "", !allOpen])),
                  )
                }
                className="text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
              >
                {allOpen ? "Tümünü kapat" : "Tümünü aç"}
              </button>
            </div>
          ) : null}

          <div className="space-y-3">
            {groups.map((group) => {
              const id = group.valueId ?? "";
              const open = !grouped || isOpen(id);
              const inactive = group.rows.length - group.activeCount;
              const rowKeys = group.rows.map((row) => row.key);
              return (
                <section key={id} className="overflow-hidden rounded-lg border border-neutral-200">
                  {grouped ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((current) => ({ ...current, [id]: !open }))}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 bg-neutral-50 px-3.5 py-2.5 text-left hover:bg-neutral-100"
                    >
                      {open ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.75} aria-hidden />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.75} aria-hidden />
                      )}
                      <span className="text-[14px] font-semibold text-neutral-900">
                        {labelOf(group.valueId!)}
                      </span>
                      <span className="text-[12px] text-neutral-500">
                        {[
                          `${group.rows.length} varyant`,
                          `${group.stock} adet`,
                          inactive > 0 ? `${inactive} pasif` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  ) : null}

                  {open ? (
                    <div className={grouped ? "space-y-3 border-t border-neutral-200 p-3" : ""}>
                      {grouped ? (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className={panelLabelClass}>{labelOf(group.valueId!)} fotoğrafları</p>
                            {onUploadPhotos ? (
                              <label
                                className={`${panelSecondaryBtnClass} cursor-pointer ${
                                  disabled || uploadBlockedReason || uploadingGroup
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }`}
                              >
                                {uploadingGroup === id ? "Yükleniyor…" : "Fotoğraf yükle"}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  multiple
                                  className="sr-only"
                                  disabled={disabled || Boolean(uploadBlockedReason) || uploadingGroup !== null}
                                  onChange={(event) => {
                                    void uploadForGroup(id, rowKeys, event.target.files);
                                    event.target.value = "";
                                  }}
                                />
                              </label>
                            ) : null}
                          </div>
                          {productImages.length > 0 ? (
                            <div
                              className="mt-1.5 flex flex-wrap gap-1.5"
                              role="group"
                              aria-label={`${labelOf(group.valueId!)} fotoğrafları`}
                            >
                              {productImages.map((url, index) => (
                                <ImageToggle
                                  key={`${url}-${index}`}
                                  url={url}
                                  index={index}
                                  selected={groupHasImage(group.rows, url)}
                                  disabled={disabled}
                                  size="size-12"
                                  onToggle={() => onChange(toggleGroupImage(variants, rowKeys, url))}
                                />
                              ))}
                            </div>
                          ) : null}
                          <p className={`mt-1.5 ${panelHintClass}`}>
                            {uploadBlockedReason ??
                              "Yüklediğiniz fotoğraflar ürünün fotoğraflarına da eklenir. Seçili (çerçeveli) olanlar bu değerde gösterilir; tıklayarak ekleyip çıkarın."}
                          </p>
                        </div>
                      ) : null}
                      <div className={grouped ? "overflow-x-auto rounded-md border border-neutral-100" : "overflow-x-auto"}>
                        <table className="w-full min-w-[34rem] border-collapse text-left">
                          <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50 text-[12px] font-semibold tracking-wide text-neutral-500">
                              <th className="px-3 py-2">{grouped ? restHeader : "Varyant"}</th>
                              <th className="px-2 py-2">SKU</th>
                              <th className="px-2 py-2">Barkod</th>
                              <th className="px-2 py-2">Fiyat (₺)</th>
                              <th className="px-2 py-2">Stok</th>
                              <th className="px-3 py-2 text-center">Aktif</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {group.rows.map((row) => {
                              const label = variantLabel(row.optionValueIds, labelOf);
                              const shortLabel = grouped
                                ? variantLabel(otherValues(row.optionValueIds), labelOf) || label
                                : label;
                              return (
                                <tr key={row.key} className={row.active ? "" : "bg-neutral-50/60"}>
                                  <td className="px-3 py-2 text-[13px] font-medium whitespace-nowrap text-neutral-900">
                                    {shortLabel}
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      value={row.sku}
                                      onChange={(event) => updateRow(row.key, { sku: event.target.value })}
                                      maxLength={64}
                                      aria-label={`${label} SKU`}
                                      disabled={disabled}
                                      className={CELL_INPUT}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      value={row.barcode}
                                      onChange={(event) => updateRow(row.key, { barcode: event.target.value })}
                                      maxLength={64}
                                      aria-label={`${label} barkod`}
                                      disabled={disabled}
                                      className={CELL_INPUT}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      value={row.price}
                                      onChange={(event) =>
                                        updateRow(row.key, { price: sanitizeTryPriceInput(event.target.value) })
                                      }
                                      inputMode="decimal"
                                      placeholder={productPrice || "Ürün fiyatı"}
                                      aria-label={`${label} fiyatı`}
                                      disabled={disabled}
                                      className={`${CELL_INPUT} w-24`}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      value={row.stock}
                                      onChange={(event) =>
                                        updateRow(row.key, { stock: sanitizeStockInput(event.target.value) })
                                      }
                                      inputMode="numeric"
                                      aria-label={`${label} stoğu`}
                                      disabled={disabled}
                                      className={`${CELL_INPUT} w-20`}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={row.active}
                                      onChange={(event) => updateRow(row.key, { active: event.target.checked })}
                                      aria-label={`${label} aktif`}
                                      disabled={disabled}
                                      className="h-4 w-4 accent-[color:var(--panel-accent)]"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          {uploadError ? <p className="text-[13px] text-red-700">{uploadError}</p> : null}

          <p className={panelHintClass}>
            Toplam stok: <span className="font-semibold text-neutral-800">{variantsTotalStock(variants)}</span>{" "}
            (aktif varyantların toplamı). Boş bıraktığınız fiyat ürün fiyatını kullanır.
          </p>
        </>
      )}

      <TrVariantPickerDrawer
        open={pickerOpen}
        types={types}
        loaded={loaded}
        selection={selection}
        onSelectionChange={changeSelection}
        dirty={pickerOpen && JSON.stringify(selection) !== baseline}
        problem={problem}
        variantCount={variantCount}
        removalCount={preview.removed}
        confirmingRemoval={confirming}
        onApply={apply}
        onCancelRemoval={() => setConfirming(false)}
        onClose={() => setPickerOpen(false)}
        onNewType={() => openTypeDrawer(null)}
        onEditType={(type) => openTypeDrawer(type)}
        onAddValue={addTypeValue}
      />

      <TrVariantTypeDrawer
        open={typeDrawer !== null}
        boutiqueId={boutiqueId}
        type={typeDrawerType}
        types={types}
        onClose={closeTypeDrawer}
        onSaved={(saved) => {
          const creating = typeDrawer?.type === null;
          void reload().then(() => {
            setSelection((current) => {
              const known = new Set(saved.values.map((value) => value.id));
              if (creating) {
                if (current.typeIds.length >= PRODUCT_VARIANT_LIMITS.typesMax) return current;
                return {
                  typeIds: [...current.typeIds, saved.id],
                  valueIdsByType: {
                    ...current.valueIdsByType,
                    [saved.id]: saved.values.map((value) => value.id),
                  },
                };
              }
              return {
                ...current,
                valueIdsByType: {
                  ...current.valueIdsByType,
                  ...(current.typeIds.includes(saved.id)
                    ? {
                        [saved.id]: (current.valueIdsByType[saved.id] ?? []).filter((id) =>
                          known.has(id),
                        ),
                      }
                    : {}),
                },
              };
            });
            setConfirming(false);
            closeTypeDrawer();
          });
        }}
        onDeleted={(typeId) => {
          void reload().then(() => {
            setSelection((current) => {
              const rest = { ...current.valueIdsByType };
              delete rest[typeId];
              return {
                typeIds: current.typeIds.filter((id) => id !== typeId),
                valueIdsByType: rest,
              };
            });
            setConfirming(false);
            closeTypeDrawer();
          });
        }}
      />
    </div>
  );
}
