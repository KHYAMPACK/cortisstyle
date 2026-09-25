"use client";

import { useMemo, useState } from "react";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import {
  TrPanelEditorCard,
  TrPanelEditorSave,
  TrPanelEditorTabs,
} from "@/components/tr/panel/TrPanelEditor";
import { TrPanelImageField } from "@/components/tr/panel/TrPanelImageField";
import { TrPanelSeoCard } from "@/components/tr/panel/TrPanelSeoCard";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { useOwnerCategories } from "@/components/tr/panel/useOwnerCategories";
import { CATEGORY_SORT_OPTIONS } from "@/lib/tr/categories/sortCriteria";
import { parentOptions } from "@/lib/tr/categories/tree";
import type { TrCategory } from "@/lib/tr/categories/types";
import {
  createOwnerCategory,
  deleteOwnerCategory,
  updateOwnerCategory,
} from "@/lib/tr/ownerClient";
import {
  categoryFormFromCategory,
  categoryInput,
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_NAME_MAX,
  emptyCategoryForm,
  validateCategoryForm,
  type CategoryFormState,
} from "@/lib/tr/panel/categoryForm";
import { toast } from "@/lib/tr/panel/toast";
import type { TrSeoFormValue } from "@/lib/tr/seo/seoFields";
import { slugify } from "@/lib/tr/seo/slug";
import { storeCategoryUrlPrefix } from "@/lib/tr/seo/storeAddress";

const TABS = [
  { id: "editor-temel", label: "Temel bilgi" },
  { id: "editor-urunler", label: "Ürünler" },
  { id: "editor-seo", label: "SEO" },
] as const;

/**
 * The category editor (create and edit): Temel bilgi, the products' default order,
 * and the shared SEO card. Manual save with an exit guard, like every form.
 */
export function TrCategoryEditor({
  boutiqueId,
  boutiqueSlug,
  customDomain = null,
  category,
  onCreated,
  onSaved,
  onDeleted,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  customDomain?: string | null;
  /** Absent = creating a new category. */
  category?: TrCategory;
  onCreated?: (category: TrCategory) => void;
  onSaved?: (category: TrCategory) => void;
  onDeleted?: () => void;
}) {
  const { categories, loaded: categoriesLoaded } = useOwnerCategories(boutiqueId, true);
  const [form, setForm] = useState<CategoryFormState>(() =>
    category ? categoryFormFromCategory(category) : emptyCategoryForm(),
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  const dirty = JSON.stringify(form) !== baseline;
  useUnsavedChangesGuard(
    "category-editor",
    dirty || saving || uploading || deleting,
  );

  const parents = useMemo(
    () => parentOptions(categories, category?.id),
    [categories, category?.id],
  );

  const change = (patch: Partial<CategoryFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };
  const changeSeo = (patch: Partial<TrSeoFormValue>) =>
    change({ seo: { ...form.seo, ...patch } });

  const save = async () => {
    if (saving || uploading) return;
    const problem = validateCategoryForm(form, { requireSlug: Boolean(category) });
    if (problem) {
      toast.error(problem);
      return;
    }
    const submitted = JSON.stringify(form);
    setSaving(true);
    try {
      const input = categoryInput(form, { isEdit: Boolean(category) });
      if (!category) {
        const created = await createOwnerCategory(boutiqueId, input);
        setBaseline(submitted);
        toast.success("Kategori eklendi.");
        onCreated?.(created);
      } else {
        const saved = await updateOwnerCategory(category.id, input);
        setBaseline(submitted);
        setSavedOnce(true);
        toast.success("Kategori kaydedildi.");
        onSaved?.(saved);
      }
    } catch (saveError) {
      toast.error(saveError, "Kategori kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!category) return;
    setDeleting(true);
    try {
      await deleteOwnerCategory(category.id);
      toast.success("Kategori silindi.");
      setBaseline(JSON.stringify(form)); // nothing left to lose: release the exit guard
      onDeleted?.();
    } catch (deleteError) {
      toast.error(deleteError, "Kategori silinemedi.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-5"
    >
      <TrPanelEditorSave
        dirty={dirty}
        saving={saving}
        saved={savedOnce}
        requireDirty={Boolean(category)}
        disabled={uploading || deleting}
        onSave={() => void save()}
      />

      <TrPanelEditorTabs tabs={TABS} />

      <div className="space-y-5">
        <TrPanelEditorCard
          id="editor-temel"
          title="Temel bilgi"
          hint="Kategorinin adı, yeri ve tanıtımı."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={panelLabelClass}>
                Kategori adı
                <span className="text-[color:var(--panel-accent)]"> *</span>
              </span>
              <input
                value={form.name}
                onChange={(event) =>
                  change({ name: event.target.value.slice(0, CATEGORY_NAME_MAX) })
                }
                placeholder="Örn. Aksesuar, Giyim …"
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Ebeveyn kategori</span>
              <select
                value={form.parentId}
                onChange={(event) => change({ parentId: event.target.value })}
                disabled={!categoriesLoaded}
                className={panelFieldClass}
              >
                <option value="">Yok (üst seviye)</option>
                {parents.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className={panelLabelClass}>Açıklama</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                change({
                  description: event.target.value.slice(0, CATEGORY_DESCRIPTION_MAX),
                })
              }
              rows={5}
              className={panelFieldClass}
            />
            <span className={`block text-right ${panelHintClass}`}>
              {form.description.length}/{CATEGORY_DESCRIPTION_MAX}
            </span>
          </label>

          <TrPanelImageField
            boutiqueId={boutiqueId}
            value={form.imageUrl}
            onChange={(imageUrl) => change({ imageUrl })}
            onError={(message) => {
              if (message) toast.error(message);
            }}
            onUploadingChange={setUploading}
            disabled={saving}
          />
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-urunler"
          title="Ürünler"
          hint="Bu kategorideki ürünlerin sitenizde hangi sırayla gösterileceği."
        >
          <label className="block max-w-md space-y-2">
            <span className={panelLabelClass}>Sıralama Ölçütü</span>
            <select
              value={form.sortCriterion}
              onChange={(event) =>
                change({
                  sortCriterion: event.target.value as CategoryFormState["sortCriterion"],
                })
              }
              className={panelFieldClass}
            >
              <option value="">Varsayılan sıra</option>
              {CATEGORY_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className={panelHintClass}>
            Belirlediğiniz sıralama ölçütüne göre bu kategorideki ürünleriniz
            sitenizde bu şekilde sıralanacaktır. Alt kategorilerin ürünleri de bu
            kategoride görünür.
          </p>
        </TrPanelEditorCard>

        <TrPanelSeoCard
          id="editor-seo"
          value={form.seo}
          onChange={changeSeo}
          entityName={form.name}
          fallbackDescription={form.description}
          urlPrefix={storeCategoryUrlPrefix({ boutiqueSlug, customDomain })}
          suggestedSlug={category ? "" : slugify(form.name)}
        />

        {category ? (
          <TrPanelEditorCard id="editor-sil" title="Kategoriyi sil" tone="danger">
            <p className={panelHintClass}>
              Alt kategoriler bir üst seviyeye taşınır. Ürünler bu kategoriden
              çıkarılır; ürünlerin kendisi silinmez.
            </p>
            <TrPanelConfirmPopover
              open={confirmDelete}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void remove()}
              message="Bu kategori silinsin mi?"
              confirmLabel="Evet, sil"
            >
              <button
                type="button"
                disabled={saving || uploading || deleting}
                onClick={() => setConfirmDelete(true)}
                className={`${panelSecondaryBtnClass} border-red-300 text-red-800`}
              >
                Kategoriyi sil
              </button>
            </TrPanelConfirmPopover>
            {deleting ? (
              <p className="flex items-center gap-2 text-[13px] text-neutral-600">
                <TrPanelBusySpinner />
                Siliniyor…
              </p>
            ) : null}
          </TrPanelEditorCard>
        ) : null}
      </div>
    </form>
  );
}

