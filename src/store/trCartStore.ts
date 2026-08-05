import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sameCartLine, type TrCartLineItem } from "@/types/tr-cart";

interface TrCartStore {
  items: TrCartLineItem[];
  addItem: (item: TrCartLineItem) => boolean;
  removeItem: (productId: string, size?: string | null) => void;
  clearCart: () => void;
  hasItem: (productId: string, size?: string | null) => boolean;
}

export const TR_CART_STORAGE_KEY = "cortis-tr-cart";

export const useTrCartStore = create<TrCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (get().items.some((entry) => sameCartLine(entry, item))) {
          return false;
        }

        set({ items: [...get().items, item] });
        return true;
      },

      removeItem: (productId, size) => {
        set({
          items: get().items.filter((entry) => {
            if (size === undefined) {
              return entry.productId !== productId;
            }
            return !sameCartLine(entry, { productId, size });
          }),
        });
      },

      clearCart: () => set({ items: [] }),

      hasItem: (productId, size) =>
        get().items.some((entry) => {
          if (size === undefined) {
            return entry.productId === productId;
          }
          return sameCartLine(entry, { productId, size });
        }),
    }),
    {
      name: TR_CART_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function selectCartItemCount(state: TrCartStore): number {
  return state.items.length;
}
