import type { ClothingItem } from "@/types/item";

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

export interface Look {
  id: string;
  title: string;
  image: string;
  modelName: string;
  shopierUrl: string;
  guidePrice: number;
  width: number;
  height: number;
  items: LookItemPlacement[];
}
