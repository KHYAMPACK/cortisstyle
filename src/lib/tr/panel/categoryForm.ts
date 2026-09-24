import type { TrOwnerCategoryInput } from "@/lib/tr/panel/ownerClient";
import {
  readCategorySortCriterion,
  type TrCategorySortCriterion,
} from "@/lib/tr/categories/sortCriteria";
import type { TrCategory } from "@/lib/tr/categories/types";
import {
  EMPTY_SEO_FORM,
  isValidCanonicalPath,
  seoFromForm,
  seoToForm,
  type TrSeoFormValue,
} from "@/lib/tr/seo/seoFields";
import { isValidSlug } from "@/lib/tr/seo/slug";

export const CATEGORY_NAME_MAX = 80;
export const CATEGORY_DESCRIPTION_MAX = 2000;

/** Form state of the category editor, as typed. */
export interface CategoryFormState {
  name: string;
  /** "" = a top-level category. */
  parentId: string;
  description: string;
  imageUrl: string | null;
  /** "" = the store's default order. */
  sortCriterion: TrCategorySortCriterion | "";
  /** Slug and the SEO card's fields. */
  seo: TrSeoFormValue;
}

export function emptyCategoryForm(): CategoryFormState {
  return {
    name: "",
    parentId: "",
    description: "",
    imageUrl: null,
    sortCriterion: "",
    seo: { ...EMPTY_SEO_FORM },
  };
}

export function categoryFormFromCategory(category: TrCategory): CategoryFormState {
  return {
    name: category.name,
    parentId: category.parentId ?? "",
    description: category.description ?? "",
    imageUrl: category.imageUrl,
    sortCriterion: category.sortCriterion ?? "",
    seo: seoToForm(category.slug, category.seo),
  };
}

/** First problem in the form as a sentence, or null when it can be saved. */
export function validateCategoryForm(
  form: CategoryFormState,
  options: { requireSlug?: boolean } = {},
): string | null {
  if (!form.name.trim()) return "Kategori adı zorunlu.";
  if (form.name.trim().length > CATEGORY_NAME_MAX) {
    return `Kategori adı en fazla ${CATEGORY_NAME_MAX} karakter olmalı.`;
  }
  if (form.description.length > CATEGORY_DESCRIPTION_MAX) {
    return `Açıklama en fazla ${CATEGORY_DESCRIPTION_MAX} karakter olmalı.`;
  }
  const slug = form.seo.slug.replace(/-+$/, "");
  if (slug ? !isValidSlug(slug) : options.requireSlug) {
    return slug
      ? "Slug yalnızca küçük harf, rakam ve tek tire içermeli."
      : "Slug boş olamaz.";
  }
  if (form.seo.canonical && !isValidCanonicalPath(`/${form.seo.canonical}`)) {
    return "Canonical URL geçersiz.";
  }
  return null;
}

/**
 * The API body. On create an empty slug is left out (the server derives it from the
 * name); on edit it is always sent, and `validateCategoryForm` has already required it.
 */
export function categoryInput(
  form: CategoryFormState,
  options: { isEdit: boolean },
): TrOwnerCategoryInput {
  const slug = form.seo.slug.replace(/-+$/, "");
  return {
    name: form.name.trim(),
    parentId: form.parentId || null,
    description: form.description.trim() || null,
    imageUrl: form.imageUrl,
    sortCriterion: readCategorySortCriterion(form.sortCriterion),
    seo: seoFromForm(form.seo),
    ...(options.isEdit ? { slug } : slug ? { slug } : {}),
  };
}
