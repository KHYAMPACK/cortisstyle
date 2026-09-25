import {
  readCategorySortCriterion,
  type TrCategorySortCriterion,
} from "@/lib/tr/categories/sortCriteria";
import { sanitizeSeo, type TrSeo } from "@/lib/tr/seo/seoFields";

/**
 * Which category system a boutique uses: `legacy` = the built-in fashion tree in code
 * (what lilabutik runs on), `custom` = its own categories (`tr_categories`).
 */
export type TrCategoryMode = "legacy" | "custom";

/** One of a boutique's own categories. */
export interface TrCategory {
  id: string;
  boutiqueId: string;
  parentId: string | null;
  name: string;
  slug: string;
  /** Plain text for now (a rich-text description arrives with the rich-text field). */
  description: string | null;
  imageUrl: string | null;
  /** How its products are ordered on the storefront; null = the store's default. */
  sortCriterion: TrCategorySortCriterion | null;
  seo: TrSeo;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A category plus what the list page shows next to it. */
export interface TrCategoryListEntry extends TrCategory {
  /** Products assigned to this category directly (not counting its subcategories). */
  productCount: number;
}

/** A product's categories: every one it belongs to and which one is primary. */
export interface TrProductCategories {
  ids: string[];
  primaryId: string | null;
}

export function readCategoryMode(value: unknown): TrCategoryMode {
  return value === "custom" ? "custom" : "legacy";
}

export function mapCategoryRow(row: Record<string, unknown>): TrCategory {
  return {
    id: String(row.id),
    boutiqueId: String(row.boutique_id),
    parentId: typeof row.parent_id === "string" ? row.parent_id : null,
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    description: typeof row.description === "string" ? row.description : null,
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    sortCriterion: readCategorySortCriterion(row.sort_criterion),
    seo: sanitizeSeo(row.seo),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
