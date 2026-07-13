import type { TrProductWithBoutique } from "@/types/tr-marketplace";

export type TrLookStatus = "published" | "draft";

/** Curated look definition — product IDs optional; hydrator can auto-pick. */
export interface TrLookDefinition {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  /** Explicit cover; otherwise first hydrated product image. */
  coverImage?: string | null;
  productIds: string[];
  /**
   * When set, fill remaining slots from available catalog after resolving
   * `productIds` (prefers multi-boutique when possible).
   */
  autoPickCount?: number;
  sortOrder: number;
  status: TrLookStatus;
}

export interface TrLookWithProducts {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverImage: string | null;
  sortOrder: number;
  products: TrProductWithBoutique[];
  boutiqueCount: number;
}
