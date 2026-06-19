import type { ClothingItem } from "@/types/item";
import type { StyleMetrics } from "@/types/style-metrics";

export interface CoordinatePoint {
  top: string;
  left: string;
}

export interface ItemCoordinates {
  from: CoordinatePoint;
  to: CoordinatePoint;
}

export interface LookItemPlacement {
  itemId: string;
  coordinates: ItemCoordinates;
}

export interface ResolvedLookItem extends ClothingItem {
  coordinates: ItemCoordinates;
}

export interface Look extends StyleMetrics {
  id: string;
  title: string;
  image: string;
  modelName: string;
  shopierUrl: string;
  guidePrice: number;
  width: number;
  height: number;
  layout?: "collage" | "single-image";
  /** Folder slug for editor guide assets, e.g. "outfit-01". Defaults from look id. */
  outfitId?: string;
  /** Edit-only guide override. Defaults to /images/clothes/{outfitId}/combined.png */
  editorGuideImage?: string;
  items: LookItemPlacement[];
}
