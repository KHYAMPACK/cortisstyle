import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ClothingItem } from "@/types/item";
import type { Look } from "@/types/look";

export type HomepageOrderPlacement = "prepend" | "append";

export interface DynamicLookJson {
  id: string;
  title: string;
  image: string;
  modelName: string;
  /** TikTok @handle for credit link — defaults to cortisstyl. */
  tiktokHandle?: string;
  /** Primary category id for homepage sectioning. */
  category?: string;
  layout?: "collage" | "single-image";
  outfitId?: string;
  editorGuideImage?: string;
  vibe: string;
  investmentRetail: number;
  investmentWithGuide: number;
  versatility: number;
  width?: number;
  height?: number;
  homepageOrder?: HomepageOrderPlacement;
  items: Array<{
    itemId: string;
    coordinates: {
      from: { top: string; left: string };
      to: { top: string; left: string };
    };
  }>;
  /** Collage positions calibrated to 420×630 reference space. */
  canvasLayouts?: Record<string, CanvasItemLayout>;
}

export interface DynamicItemsJson {
  items: ClothingItem[];
}

export interface LookCategoryDefinition {
  id: string;
  label: string;
  type: "aesthetic" | "color" | "creator";
  /** TikTok @handle — used for creator-type section headers. */
  tiktokHandle?: string;
}

export interface DynamicCatalogBundle {
  items: ClothingItem[];
  looks: Look[];
  lookOrderAdditions: Array<{ id: string; placement: HomepageOrderPlacement }>;
  canvasLayoutsByLookId: Record<string, Record<string, CanvasItemLayout>>;
  /** Explicit homepage stream when homepage-order.json is present. */
  homepageOrder?: string[];
  /** Category definitions from categories.json. */
  categories?: LookCategoryDefinition[];
}

export const EMPTY_DYNAMIC_CATALOG: DynamicCatalogBundle = {
  items: [],
  looks: [],
  lookOrderAdditions: [],
  canvasLayoutsByLookId: {},
};
