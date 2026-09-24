"use client";

import { ChevronDown, ChevronUp, ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import {
  panelChipClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  createOwnerVariantType,
  deleteOwnerVariantType,
  updateOwnerVariantType,
  uploadOwnerProductImage,
} from "@/lib/tr/ownerClient";
import {
  addValues,
  emptyVariantTypeForm,
  formFromVariantType,
  moveValue,
  splitValueInput,
  validateVariantTypeForm,
  variantTypeBody,
  type VariantTypeFormState,
  type VariantValueDraft,
} from "@/lib/tr/variants/typeForm";
import { normalizeHex, VARIANT_TYPE_LIMITS } from "@/lib/tr/variants/typeRules";
import type {
  TrVariantSelectionStyle,
  TrVariantType,
} from "@/lib/tr/variants/types";

const STYLE_OPTIONS: Array<{
  id: TrVariantSelectionStyle;
  label: string;
  hint: string;
}> = [
  { id: "list", label: "Liste", hint: "Metin seçenekleri (S, M, L…)" },
  { id: "swatch", label: "Renk / Görsel", hint: "Her değer için bir renk veya görsel" },
];

const ICON_BUTTON =
  "grid size-8 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--panel-accent-deep)] disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none";

/**
 * Creates or edits a variant type (Renk, Beden…) in the right-hand drawer. Shared: the
 * Varyant Türleri page uses it, and so will the Gelişmiş product's "Yeni varyant
 * türü". It follows the panel save model — manual Kaydet, exit confirmation — and the
 * caller closes it from `onSaved` / `onDeleted`.
 */
export function TrVariantTypeDrawer({
  open,
  boutiqueId,
  type,
  types,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  boutiqueId: string;
  /** The type being edited; `null` creates a new one. */
  type: TrVariantType | null;
  /** The boutique's types, for the "name already used" check. */
  types: ReadonlyArray<Pick<TrVariantType, "id" | "name">>;
  onClose: () => void;
  onSaved: (type: TrVariantType) => void;
  onDeleted?: (typeId: string) => void;
}) {
  const [form, setForm] = useState<VariantTypeFormState>(emptyVariantTypeForm);
  const [baseline, setBaseline] = useState("");
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pickingFor = useRef<string | null>(null);

  // Every open starts from the saved type (or an empty form).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const initial = type ? formFromVariantType(type) : emptyVariantTypeForm();
      setForm(initial);
      setBaseline(JSON.stringify(initial));
      setDraft("");
      setNote(null);
      setError(null);
      setConfirmDelete(false);
    }
  }

  const dirty = open && (JSON.stringify(form) !== baseline || draft.trim() !== "");
  const swatch = form.selectionStyle === "swatch";
  const busy = saving || deleting || uploadingKey !== null;

  const change = (patch: Partial<VariantTypeFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const updateValue = (key: string, patch: Partial<VariantValueDraft>) => {
    setForm((current) => ({
      ...current,
      values: current.values.map((value) =>
        value.key === key ? { ...value, ...patch } : value,
      ),
    }));
    setError(null);
  };

  const commitDraft = (source: VariantTypeFormState): VariantTypeFormState => {
    const labels = splitValueInput(draft);
    if (labels.length === 0) return source;
    const { form: next, skipped } = addValues(source, labels);
    setNote(
      skipped.length > 0
        ? `Zaten var veya sınır aşıldı: ${skipped.join(", ")}`
        : null,
    );
    return next;
  };

  const addFromDraft = () => {
    setForm(commitDraft(form));
    setDraft("");
    setError(null);
  };

  const save = async () => {
    if (busy) return;
    const submitted = commitDraft(form);
    const problem = validateVariantTypeForm(submitted, types, type?.id);
    if (problem) {
      setForm(submitted);
      setDraft("");
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = variantTypeBody(submitted);
      const saved = type
        ? await updateOwnerVariantType(type.id, body)
        : await createOwnerVariantType(boutiqueId, body);
      onSaved(saved);
    } catch (saveError) {
      setForm(submitted);
      setDraft("");
      setError(saveError instanceof Error ? saveError.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!type || busy) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteOwnerVariantType(type.id);
      onDeleted?.(type.id);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Silinemedi.",
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const uploadImage = async (file: File) => {
    const key = pickingFor.current;
    if (!key) return;
    setUploadingKey(key);
    setError(null);
    try {
      const uploaded = await uploadOwnerProductImage(boutiqueId, file, {
        removeBackground: false,
      });
      updateValue(key, { imageUrl: uploaded.url });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Görsel yüklenemedi.",
      );
    } finally {
      setUploadingKey(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <TrPanelDrawer
      open={open}
      onClose={onClose}
      title={type ? "Varyant türünü düzenle" : "Varyant türü oluştur"}
      dirty={dirty}
      saving={saving}
      saveDisabled={busy && !saving}
      onSave={() => void save()}
    >
      <div className="space-y-6">
        {error ? <p className={panelErrorClass}>{error}</p> : null}

        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Varyant türü adı
            <span className="text-[color:var(--panel-accent)]"> *</span>
          </span>
          <input
            value={form.name}
            onChange={(event) => change({ name: event.target.value })}
            maxLength={VARIANT_TYPE_LIMITS.nameMax}
            placeholder="Renk, Beden, Boyut…"
            className={panelFieldClass}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className={panelLabelClass}>Seçim stili</legend>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={form.selectionStyle === option.id}
                onClick={() => change({ selectionStyle: option.id })}
                className={`${panelChipClass(form.selectionStyle === option.id)} h-auto flex-col items-start py-2 text-left`}
              >
                <span className="block">{option.label}</span>
                <span className="mt-0.5 block text-[12px] font-normal opacity-80">
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={panelLabelClass}>
              Değerler
              <span className="text-[color:var(--panel-accent)]"> *</span>
            </span>
            <span className={panelHintClass}>
              {form.values.length}/{VARIANT_TYPE_LIMITS.valuesMax}
            </span>
          </div>

          {form.values.length > 0 ? (
            <ul className="space-y-2">
              {form.values.map((value, index) => (
                <li
                  key={value.key}
                  className={
                    swatch
                      ? "space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5"
                      : ""
                  }
                >
                  <div className="flex items-center gap-1">
                    <input
                      value={value.label}
                      onChange={(event) =>
                        updateValue(value.key, { label: event.target.value })
                      }
                      maxLength={VARIANT_TYPE_LIMITS.labelMax}
                      aria-label={`${index + 1}. değer`}
                      className={`${panelFieldClass} min-w-0 flex-1`}
                    />
                    <button
                      type="button"
                      aria-label="Yukarı taşı"
                      disabled={index === 0}
                      onClick={() =>
                        change({ values: moveValue(form.values, index, -1) })
                      }
                      className={ICON_BUTTON}
                    >
                      <ChevronUp className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Aşağı taşı"
                      disabled={index === form.values.length - 1}
                      onClick={() =>
                        change({ values: moveValue(form.values, index, 1) })
                      }
                      className={ICON_BUTTON}
                    >
                      <ChevronDown className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`${value.label || "Değer"} değerini kaldır`}
                      onClick={() =>
                        change({
                          values: form.values.filter((entry) => entry.key !== value.key),
                        })
                      }
                      className={ICON_BUTTON}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>

                  {swatch ? (
                    <div className="flex items-center gap-2">
                      <label
                        className="relative block size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-neutral-300 bg-[repeating-linear-gradient(45deg,#e5e5e5_0_4px,#fff_4px_8px)]"
                        title="Renk seç"
                      >
                        <span
                          className="absolute inset-0"
                          style={
                            normalizeHex(value.hex)
                              ? { backgroundColor: normalizeHex(value.hex)! }
                              : undefined
                          }
                        />
                        <input
                          type="color"
                          value={normalizeHex(value.hex) ?? "#000000"}
                          onChange={(event) =>
                            updateValue(value.key, { hex: event.target.value })
                          }
                          aria-label={`${value.label || "Değer"} rengi`}
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                        />
                      </label>
                      <input
                        value={value.hex}
                        onChange={(event) => {
                          // A keystroke that would make an invalid code is ignored, so
                          // a typo never wipes what was already typed.
                          const typed = event.target.value.trim();
                          const code = typed.startsWith("#") ? typed : `#${typed}`;
                          if (/^#[0-9a-f]{0,6}$/i.test(code)) {
                            updateValue(value.key, { hex: code === "#" ? "" : code });
                          }
                        }}
                        placeholder="#rrggbb"
                        spellCheck={false}
                        aria-label={`${value.label || "Değer"} renk kodu`}
                        className={`${panelFieldClass} w-28 font-mono`}
                      />
                      <button
                        type="button"
                        title={value.imageUrl ? "Görseli değiştir" : "Görsel ekle"}
                        aria-label={value.imageUrl ? "Görseli değiştir" : "Görsel ekle"}
                        disabled={busy}
                        onClick={() => {
                          pickingFor.current = value.key;
                          fileInput.current?.click();
                        }}
                        className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600 disabled:opacity-50"
                      >
                        {uploadingKey === value.key ? (
                          <TrPanelBusySpinner />
                        ) : value.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={value.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageIcon className="size-4" aria-hidden />
                        )}
                      </button>
                      {value.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => updateValue(value.key, { imageUrl: null })}
                          className="text-[12px] font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                        >
                          Görseli kaldır
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={panelHintClass}>Henüz değer eklemediniz.</p>
          )}

          <div className="flex gap-2 pt-1">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  // Adds the value; never submits or closes anything.
                  event.preventDefault();
                  addFromDraft();
                }
              }}
              placeholder="Değer ekle (virgülle birden fazla)"
              maxLength={200}
              aria-label="Yeni değer"
              className={`${panelFieldClass} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={addFromDraft}
              disabled={draft.trim() === ""}
              className={panelSecondaryBtnClass}
            >
              Ekle
            </button>
          </div>
          {note ? <p className={panelHintClass}>{note}</p> : null}
          {swatch ? (
            <p className={panelHintClass}>
              Her değer için bir renk veya görsel seçin; ikisi de olabilir.
            </p>
          ) : null}
        </div>

        {type ? (
          <div className="space-y-2 border-t border-neutral-200 pt-5">
            <p className={panelHintClass}>Türü silmek değerlerini de siler.</p>
            <TrPanelConfirmPopover
              open={confirmDelete}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void remove()}
              message="Bu varyant türü silinsin mi?"
              confirmLabel="Evet, sil"
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
                className={`${panelSecondaryBtnClass} border-red-300 text-red-800`}
              >
                {deleting ? "Siliniyor…" : "Varyant türünü sil"}
              </button>
            </TrPanelConfirmPopover>
          </div>
        ) : null}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadImage(file);
        }}
      />
    </TrPanelDrawer>
  );
}
