import type { CanvasItemLayout } from "@/types/canvas-layout";
import type { ClothingItem } from "@/types/item";
import type { Look } from "@/types/look";

export type HomepageOrderPlacement = "prepend" | "append";

export interface DynamicLookJson {
  id: string;
  title: string;
  image: string;
  modelName: string;
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

export interface DynamicCatalogBundle {
  items: ClothingItem[];
  looks: Look[];
  lookOrderAdditions: Array<{ id: string; placement: HomepageOrderPlacement }>;
  canvasLayoutsByLookId: Record<string, Record<string, CanvasItemLayout>>;
}

export const EMPTY_DYNAMIC_CATALOG: DynamicCatalogBundle = {
  items: [],
  looks: [],
  lookOrderAdditions: [],
  canvasLayoutsByLookId: {},
};
