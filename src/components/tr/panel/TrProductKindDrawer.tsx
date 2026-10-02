"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  panelChipClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { parentOptions } from "@/lib/tr/categories/tree";
import type { TrCategory } from "@/lib/tr/categories/types";
import {
  createOwnerProductKind,
  deleteOwnerProductKind,
  updateOwnerProductKind,
} from "@/lib/tr/ownerClient";
import { trPanelAttributesPath, trPanelVariantTypesPath } from "@/lib/tr/paths";
import { toast } from "@/lib/tr/panel/toast";
import {
  attributesToAdd,
  emptyKindForm,
  formFromKind,
  kindBody,
  toggleKindOption,
  toggleOptionType,
  type KindFormState,
} from "@/lib/tr/productKinds/forms";
import { kindOptionsFor, PRODUCT_KIND_LIMITS, readKindBody } from "@/lib/tr/productKinds/rules";
import type { TrAttributeDefinition, TrProductKind } from "@/lib/tr/productKinds/types";
import { moveValue } from "@/lib/tr/variants/typeForm";
import type { TrVariantType } from "@/lib/tr/variants/types";

const ICON_BUTTON =
  "grid size-8 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--panel-accent-deep)] disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none";

/**
 * Creates or edits a product kind (Ürün türü): its name, the variant types a new product
 * starts with, the category pre-selected for it, and its fields with, for a choice
 * field, the options this kind offers.
 */
export function TrProductKindDrawer({
  open,
  boutiqueId,
  kind,
  productCount = 0,
  attributes,
  variantTypes,
  categories,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  boutiqueId: string;
  /** The kind being edited; `null` creates a new one. */
  kind: TrProductKind | null;
  productCount?: number;
  attributes: readonly TrAttributeDefinition[];
  variantTypes: readonly Pick<TrVariantType, "id" | "name">[];
  categories: readonly TrCategory[];
  onClose: () => void;
  onSaved: (kind: TrProductKind) => void;
  onDeleted?: (kindId: string) => void;
}) {
  const [form, setForm] = useState<KindFormState>(emptyKindForm);
  const [baseline, setBaseline] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const initial = kind ? formFromKind(kind) : emptyKindForm();
      setForm(initial);
      setBaseline(JSON.stringify(initial));
      setConfirmDelete(false);
      setExpanded(null);
    }
  }

  const dirty = open && JSON.stringify(form) !== baseline;
  const busy = saving || deleting;
  const byId = new Map(attributes.map((attribute) => [attribute.id, attribute]));
  const addable = attributesToAdd(attributes, form);
  const change = (patch: Partial<KindFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    if (busy) return;
    const body = kindBody(form);
    try {
      readKindBody(body);
    } catch (problem) {
      toast.error(problem, "Ürün türü geçersiz.");
      return;
    }
    setSaving(true);
    try {
      const saved = kind
        ? await updateOwnerProductKind(kind.id, body)
        : await createOwnerProductKind(boutiqueId, body);
      toast.success(kind ? "Ürün türü kaydedildi." : "Ürün türü eklendi.");
      onSaved(saved);
    } catch (saveError) {
      toast.error(saveError, "Ürün türü kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!kind || busy) return;
    setDeleting(true);
    try {
      await deleteOwnerProductKind(kind.id);
      toast.success("Ürün türü silindi.");
      onDeleted?.(kind.id);
    } catch (deleteError) {
      toast.error(deleteError, "Ürün türü silinemedi.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TrPanelDrawer
      open={open}
      onClose={onClose}
      title={kind ? "Ürün türünü düzenle" : "Ürün türü oluştur"}
      dirty={dirty}
      saving={saving}
      saveDisabled={deleting}
      onSave={() => void save()}
    >
      <div className="space-y-6">
        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Ürün türü adı
            <span className="text-[color:var(--panel-accent)]"> *</span>
          </span>
          <input
            value={form.name}
            onChange={(event) => change({ name: event.target.value })}
            maxLength={PRODUCT_KIND_LIMITS.nameMax}
            placeholder="Elbise, Pantolon, Çanta…"
            className={panelFieldClass}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className={panelLabelClass}>Başlangıç varyantları</legend>
          <p className={panelHintClass}>
            Bu türde yeni ürün eklerken varyant tablosu bu türlerle başlar (en fazla{" "}
            {PRODUCT_KIND_LIMITS.optionTypesMax}).
          </p>
          {variantTypes.length === 0 ? (
            <p className={panelHintClass}>
              Henüz varyant türünüz yok.{" "}
              <Link href={trPanelVariantTypesPath()} className="font-medium underline">
                Varyant Türleri
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variantTypes.map((type) => {
                const index = form.defaultOptionTypeIds.indexOf(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    aria-pressed={index >= 0}
                    onClick={() =>
                      change({
                        defaultOptionTypeIds: toggleOptionType(form.defaultOptionTypeIds, type.id),
                      })
                    }
                    className={panelChipClass(index >= 0)}
                  >
                    {index >= 0 ? `${index + 1}. ` : ""}
                    {type.name}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        <label className="block space-y-2">
          <span className={panelLabelClass}>Önerilen kategori</span>
          <select
            value={form.suggestedCategoryId ?? ""}
            onChange={(event) => change({ suggestedCategoryId: event.target.value || null })}
            className={panelFieldClass}
          >
            <option value="">Yok</option>
            {parentOptions(categories).map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={`block ${panelHintClass}`}>
            Yeni üründe kategori seçicide hazır işaretli gelir.
          </span>
        </label>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={panelLabelClass}>Özellikler</span>
            <span className={panelHintClass}>
              {form.attributes.length}/{PRODUCT_KIND_LIMITS.kindAttributesMax}
            </span>
          </div>
          <p className={panelHintClass}>
            Bu türdeki ürünlerde doldurulan alanlar, bu sırayla.
          </p>
          {form.attributes.length > 0 ? (
            <ul className="space-y-2">
              {form.attributes.map((link, index) => {
                const attribute = byId.get(link.attributeId);
                if (!attribute) return null;
                const offered = kindOptionsFor(attribute, link);
                const isOpen = expanded === link.attributeId;
                return (
                  <li
                    key={link.attributeId}
                    className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5"
                  >
                    <div className="flex items-center gap-1">
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-neutral-900">
                        {attribute.label}
                        {attribute.input === "choice" ? (
                          <span className="ml-2 text-[12px] font-normal text-neutral-500">
                            {link.options === null
                              ? "tüm seçenekler"
                              : `${offered.length}/${attribute.options.length} seçenek`}
                          </span>
                        ) : null}
                      </span>
                      <label className="mr-1 flex items-center gap-1.5 text-[12.5px] text-neutral-600">
                        <input
                          type="checkbox"
                          checked={link.required}
                          onChange={(event) =>
                            change({
                              attributes: form.attributes.map((entry) =>
                                entry.attributeId === link.attributeId
                                  ? { ...entry, required: event.target.checked }
                                  : entry,
                              ),
                            })
                          }
                          className="size-3.5 accent-[color:var(--panel-accent)]"
                        />
                        Zorunlu
                      </label>
                      <button
                        type="button"
                        aria-label="Yukarı taşı"
                        disabled={index === 0}
                        onClick={() => change({ attributes: moveValue(form.attributes, index, -1) })}
                        className={ICON_BUTTON}
                      >
                        <ChevronUp className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Aşağı taşı"
                        disabled={index === form.attributes.length - 1}
                        onClick={() => change({ attributes: moveValue(form.attributes, index, 1) })}
                        className={ICON_BUTTON}
                      >
                        <ChevronDown className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`${attribute.label} özelliğini çıkar`}
                        onClick={() =>
                          change({
                            attributes: form.attributes.filter(
                              (entry) => entry.attributeId !== link.attributeId,
                            ),
                          })
                        }
                        className={ICON_BUTTON}
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                    {attribute.input === "choice" ? (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : link.attributeId)}
                          className="text-[12.5px] font-medium text-[color:var(--panel-accent-deep)] hover:underline"
                        >
                          {isOpen ? "Seçenekleri gizle" : "Bu türde gösterilen seçenekler"}
                        </button>
                        {isOpen ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {attribute.options.map((option) => {
                              const on = offered.includes(option);
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() =>
                                    change({
                                      attributes: form.attributes.map((entry) =>
                                        entry.attributeId === link.attributeId
                                          ? toggleKindOption(attribute, entry, option)
                                          : entry,
                                      ),
                                    })
                                  }
                                  className={`${panelChipClass(on)} min-h-8 px-2.5 text-[12.5px]`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={panelHintClass}>Henüz özellik eklemediniz.</p>
          )}
          {addable.length > 0 ? (
            <select
              value=""
              onChange={(event) => {
                const attributeId = event.target.value;
                if (!attributeId) return;
                change({
                  attributes: [
                    ...form.attributes,
                    { attributeId, required: false, options: null },
                  ],
                });
              }}
              aria-label="Özellik ekle"
              className={panelFieldClass}
            >
              <option value="">+ Özellik ekle…</option>
              {addable.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.label}
                </option>
              ))}
            </select>
          ) : null}
          <p className={panelHintClass}>
            Yeni bir alan için{" "}
            <Link href={trPanelAttributesPath()} className="font-medium underline">
              Özellikler
            </Link>{" "}
            sayfasını kullanın.
          </p>
        </div>

        {kind ? (
          <div className="space-y-2 border-t border-neutral-200 pt-5">
            <p className={panelHintClass}>
              {productCount > 0
                ? `Bu türde ${productCount} ürün var; silerseniz türsüz kalırlar. `
                : ""}
              Ürünlerin bilgileri silinmez.
            </p>
            <TrPanelConfirmPopover
              open={confirmDelete}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void remove()}
              message="Bu ürün türü silinsin mi?"
              confirmLabel="Evet, sil"
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
                className={`${panelSecondaryBtnClass} border-red-300 text-red-800`}
              >
                {deleting ? "Siliniyor…" : "Ürün türünü sil"}
              </button>
            </TrPanelConfirmPopover>
          </div>
        ) : null}
      </div>
    </TrPanelDrawer>
  );
}
