import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TrCartLineItem } from "@/types/tr-cart";

interface TrCartStore {
  items: TrCartLineItem[];
  addItem: (item: TrCartLineItem) => boolean;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  hasItem: (productId: string) => boolean;
}

export const TR_CART_STORAGE_KEY = "cortis-tr-cart";

export const useTrCartStore = create<TrCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (get().items.some((entry) => entry.productId === item.productId)) {
          return false;
        }

        set({ items: [...get().items, item] });
        return true;
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((entry) => entry.productId !== productId) });
      },

      clearCart: () => set({ items: [] }),

      hasItem: (productId) => get().items.some((entry) => entry.productId === productId),
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
