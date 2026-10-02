"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import {
  panelChipClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  createOwnerAttribute,
  deleteOwnerAttribute,
  updateOwnerAttribute,
} from "@/lib/tr/ownerClient";
import { toast } from "@/lib/tr/panel/toast";
import {
  addOptions,
  attributeBody,
  emptyAttributeForm,
  formFromAttribute,
  type AttributeFormState,
} from "@/lib/tr/productKinds/forms";
import { moveValue } from "@/lib/tr/variants/typeForm";
import { PRODUCT_KIND_LIMITS, readAttributeBody } from "@/lib/tr/productKinds/rules";
import type { TrAttributeDefinition, TrAttributeInput } from "@/lib/tr/productKinds/types";

export const ATTRIBUTE_INPUT_OPTIONS: Array<{ id: TrAttributeInput; label: string; hint: string }> = [
  { id: "choice", label: "Seçenekli", hint: "Listeden seçilir (Keten, Pamuk…)" },
  { id: "text", label: "Kısa metin", hint: "Tek satır yazılır" },
  { id: "textarea", label: "Uzun metin", hint: "Birkaç satır yazılır" },
];

const ICON_BUTTON =
  "grid size-8 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--panel-accent-deep)] disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none";

/**
 * Creates or edits a product field (Özellik) in the right-hand drawer: its name, how it
 * is filled in and, for a choice, its options. Same save model as the variant type
 * drawer (manual Kaydet, exit confirmation); the caller closes it from the callbacks.
 */
export function TrAttributeDrawer({
  open,
  boutiqueId,
  attribute,
  kindCount = 0,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  boutiqueId: string;
  /** The field being edited; `null` creates a new one. */
  attribute: TrAttributeDefinition | null;
  /** Kinds that have the field (shown before deleting). */
  kindCount?: number;
  onClose: () => void;
  onSaved: (attribute: TrAttributeDefinition) => void;
  onDeleted?: (attributeId: string) => void;
}) {
  const [form, setForm] = useState<AttributeFormState>(emptyAttributeForm);
  const [baseline, setBaseline] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const initial = attribute ? formFromAttribute(attribute) : emptyAttributeForm();
      setForm(initial);
      setBaseline(JSON.stringify(initial));
      setDraft("");
      setConfirmDelete(false);
    }
  }

  const dirty = open && (JSON.stringify(form) !== baseline || draft.trim() !== "");
  const busy = saving || deleting;
  const choice = form.input === "choice";
  const change = (patch: Partial<AttributeFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const commitDraft = (source: AttributeFormState): AttributeFormState => {
    if (!draft.trim()) return source;
    const { options, skipped } = addOptions(source.options, draft);
    if (skipped.length > 0) {
      toast.warning(`Eklenmedi (zaten var veya sınır aşıldı): ${skipped.join(", ")}`);
    }
    return { ...source, options };
  };

  const save = async () => {
    if (busy) return;
    const submitted = commitDraft(form);
    setForm(submitted);
    setDraft("");
    const body = attributeBody(submitted);
    try {
      readAttributeBody(body);
    } catch (problem) {
      toast.error(problem, "Özellik geçersiz.");
      return;
    }
    setSaving(true);
    try {
      const saved = attribute
        ? await updateOwnerAttribute(attribute.id, body)
        : await createOwnerAttribute(boutiqueId, body);
      toast.success(attribute ? "Özellik kaydedildi." : "Özellik eklendi.");
      onSaved(saved);
    } catch (saveError) {
      toast.error(saveError, "Özellik kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!attribute || busy) return;
    setDeleting(true);
    try {
      await deleteOwnerAttribute(attribute.id);
      toast.success("Özellik silindi.");
      onDeleted?.(attribute.id);
    } catch (deleteError) {
      toast.error(deleteError, "Özellik silinemedi.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TrPanelDrawer
      open={open}
      onClose={onClose}
      title={attribute ? "Özelliği düzenle" : "Özellik oluştur"}
      dirty={dirty}
      saving={saving}
      saveDisabled={deleting}
      onSave={() => void save()}
    >
      <div className="space-y-6">
        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Özellik adı
            <span className="text-[color:var(--panel-accent)]"> *</span>
          </span>
          <input
            value={form.label}
            onChange={(event) => change({ label: event.target.value })}
            maxLength={PRODUCT_KIND_LIMITS.labelMax}
            placeholder="Kumaş, Yaka, Malzeme…"
            className={panelFieldClass}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className={panelLabelClass}>Nasıl doldurulur</legend>
          <div className="grid grid-cols-3 gap-2">
            {ATTRIBUTE_INPUT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={form.input === option.id}
                onClick={() => change({ input: option.id })}
                className={`${panelChipClass(form.input === option.id)} h-auto flex-col items-start py-2 text-left`}
              >
                <span className="block">{option.label}</span>
                <span className="mt-0.5 block text-[12px] font-normal opacity-80">
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {choice ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={panelLabelClass}>
                Seçenekler
                <span className="text-[color:var(--panel-accent)]"> *</span>
              </span>
              <span className={panelHintClass}>
                {form.options.length}/{PRODUCT_KIND_LIMITS.optionsMax}
              </span>
            </div>
            {form.options.length > 0 ? (
              <ul className="space-y-2">
                {form.options.map((option, index) => (
                  <li key={`${index}-${option}`} className="flex items-center gap-1">
                    <input
                      value={option}
                      onChange={(event) =>
                        change({
                          options: form.options.map((entry, at) =>
                            at === index ? event.target.value : entry,
                          ),
                        })
                      }
                      maxLength={PRODUCT_KIND_LIMITS.optionMax}
                      aria-label={`${index + 1}. seçenek`}
                      className={`${panelFieldClass} min-w-0 flex-1`}
                    />
                    <button
                      type="button"
                      aria-label="Yukarı taşı"
                      disabled={index === 0}
                      onClick={() => change({ options: moveValue(form.options, index, -1) })}
                      className={ICON_BUTTON}
                    >
                      <ChevronUp className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Aşağı taşı"
                      disabled={index === form.options.length - 1}
                      onClick={() => change({ options: moveValue(form.options, index, 1) })}
                      className={ICON_BUTTON}
                    >
                      <ChevronDown className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`${option || "Seçenek"} seçeneğini kaldır`}
                      onClick={() =>
                        change({ options: form.options.filter((_, at) => at !== index) })
                      }
                      className={ICON_BUTTON}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={panelHintClass}>Henüz seçenek eklemediniz.</p>
            )}
            <div className="flex gap-2 pt-1">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setForm(commitDraft(form));
                    setDraft("");
                  }
                }}
                placeholder="Seçenek ekle (virgülle birden fazla)"
                maxLength={400}
                aria-label="Yeni seçenek"
                className={`${panelFieldClass} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => {
                  setForm(commitDraft(form));
                  setDraft("");
                }}
                disabled={draft.trim() === ""}
                className={panelSecondaryBtnClass}
              >
                Ekle
              </button>
            </div>
            <label className="flex items-start gap-2 pt-2 text-[14px] text-neutral-800">
              <input
                type="checkbox"
                checked={form.allowCustom}
                onChange={(event) => change({ allowCustom: event.target.checked })}
                className="mt-0.5 size-4 accent-[color:var(--panel-accent)]"
              />
              <span>
                Listede olmayan bir değer de yazılabilsin
                <span className={`block ${panelHintClass}`}>
                  Ürün düzenlerken seçeneklerin yanında serbest yazma kutusu çıkar.
                </span>
              </span>
            </label>
          </div>
        ) : null}

        {attribute ? (
          <p className={panelHintClass}>
            Değerler ürünlerde <span className="font-mono">{attribute.key}</span> adıyla
            saklanır; özelliğin adını değiştirmek kayıtlı değerleri etkilemez.
          </p>
        ) : null}

        {attribute ? (
          <div className="space-y-2 border-t border-neutral-200 pt-5">
            <p className={panelHintClass}>
              {kindCount > 0
                ? `Silerseniz ${kindCount} ürün türünden çıkar. `
                : ""}
              Ürünlerdeki kayıtlı değerler silinmez.
            </p>
            <TrPanelConfirmPopover
              open={confirmDelete}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void remove()}
              message="Bu özellik silinsin mi?"
              confirmLabel="Evet, sil"
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
                className={`${panelSecondaryBtnClass} border-red-300 text-red-800`}
              >
                {deleting ? "Siliniyor…" : "Özelliği sil"}
              </button>
            </TrPanelConfirmPopover>
          </div>
        ) : null}
      </div>
    </TrPanelDrawer>
  );
}
