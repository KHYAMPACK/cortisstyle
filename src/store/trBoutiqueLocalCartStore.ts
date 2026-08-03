"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import type { TrCartLineItem } from "@/types/tr-cart";

interface TrBoutiqueLocalCartStore {
  items: TrCartLineItem[];
  addItem: (item: TrCartLineItem) => boolean;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  hasItem: (productId: string) => boolean;
}

type CartStore = UseBoundStore<StoreApi<TrBoutiqueLocalCartStore>> & {
  persist?: {
    hasHydrated: () => boolean;
    onFinishHydration: (callback: () => void) => () => void;
  };
};

const storeCache = new Map<string, CartStore>();

function createBoutiqueLocalCartStore(
  boutiqueSlug: string,
  persistEnabled: boolean,
): CartStore {
  if (!persistEnabled) {
    return create<TrBoutiqueLocalCartStore>()((set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().items.some((entry) => entry.productId === item.productId)) {
          return false;
        }
        set({ items: [...get().items, item] });
        return true;
      },
      removeItem: (productId) => {
        set({
          items: get().items.filter((entry) => entry.productId !== productId),
        });
      },
      clearCart: () => set({ items: [] }),
      hasItem: (productId) =>
        get().items.some((entry) => entry.productId === productId),
    })) as CartStore;
  }

  return create<TrBoutiqueLocalCartStore>()(
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
          set({
            items: get().items.filter((entry) => entry.productId !== productId),
          });
        },
        clearCart: () => set({ items: [] }),
        hasItem: (productId) =>
          get().items.some((entry) => entry.productId === productId),
      }),
      {
        name: `cortis-tr-cart:boutique:${boutiqueSlug}`,
        partialize: (state) => ({ items: state.items }),
      },
    ),
  ) as CartStore;
}

/** Per-boutique cart — separate from marketplace multi-tenant cart. */
export function getTrBoutiqueLocalCartStore(boutiqueSlug: string): CartStore {
  const slug = boutiqueSlug.trim();
  const persistEnabled = !slug.startsWith("__");
  const cacheKey = `${slug}:${persistEnabled ? "p" : "m"}`;
  let store = storeCache.get(cacheKey);
  if (!store) {
    store = createBoutiqueLocalCartStore(slug, persistEnabled);
    storeCache.set(cacheKey, store);
  }
  return store;
}

export function selectBoutiqueCartItemCount(
  state: TrBoutiqueLocalCartStore,
): number {
  return state.items.length;
}
