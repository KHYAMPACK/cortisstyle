export interface CoordinatePoint {
  top: string;
  left: string;
}

export interface ItemCoordinates {
  from: CoordinatePoint;
  to: CoordinatePoint;
}

export interface LookItem {
  id: string;
  name: string;
  blurredDescription: string;
  coordinates: ItemCoordinates;
}

export interface Look {
  id: string;
  title: string;
  image: string;
  modelName: string;
  shopierUrl: string;
  width: number;
  height: number;
  items: LookItem[];
}
