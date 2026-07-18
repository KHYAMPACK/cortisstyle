import { create } from "zustand";

export interface TrAddedToCartPayload {
  productId: string;
  title: string;
  priceKurus: number;
  image: string | null;
  size: string | null;
  color: string | null;
  boutiqueName: string | null;
  /** When adding a full look, show how many pieces were added. */
  pieceCount?: number;
}

interface TrAddedToCartStore {
  payload: TrAddedToCartPayload | null;
  open: (payload: TrAddedToCartPayload) => void;
  close: () => void;
}

export const useTrAddedToCartStore = create<TrAddedToCartStore>((set) => ({
  payload: null,
  open: (payload) => set({ payload }),
  close: () => set({ payload: null }),
}));
