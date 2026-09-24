"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { useTrPersistedHydration } from "@/lib/tr/useTrPersistedHydration";
import { getTrBoutiqueLocalCartStore } from "@/store/trBoutiqueLocalCartStore";
import { getTrBoutiqueLocalFavoritesStore } from "@/store/trBoutiqueLocalFavoritesStore";
import type { TrFavoriteItem } from "@/store/trBoutiqueLocalFavoritesStore";
import { sameCartLine, type TrCartLineItem } from "@/types/tr-cart";

export type TrBoutiqueCommercePanel =
  | "cart"
  | "favorites"
  | "tracking"
  | "report"
  | "help"
  | null;

interface TrBoutiqueCommerceScopeValue {
  boutiqueSlug: string;
  boutiqueName: string;
  localCommerce: true;
  activePanel: TrBoutiqueCommercePanel;
  openPanel: (panel: Exclude<TrBoutiqueCommercePanel, null>) => void;
  closePanel: () => void;
}

const TrBoutiqueCommerceScopeContext =
  createContext<TrBoutiqueCommerceScopeValue | null>(null);

interface TrBoutiqueCommerceScopeProviderProps {
  boutiqueSlug: string;
  boutiqueName: string;
  children: ReactNode;
}

export function TrBoutiqueCommerceScopeProvider({
  boutiqueSlug,
  boutiqueName,
  children,
}: TrBoutiqueCommerceScopeProviderProps) {
  const [activePanel, setActivePanel] =
    useState<TrBoutiqueCommercePanel>(null);

  const openPanel = useCallback(
    (panel: Exclude<TrBoutiqueCommercePanel, null>) => {
      setActivePanel(panel);
    },
    [],
  );

  const closePanel = useCallback(() => setActivePanel(null), []);

  const value = useMemo(
    () => ({
      boutiqueSlug,
      boutiqueName,
      localCommerce: true as const,
      activePanel,
      openPanel,
      closePanel,
    }),
    [activePanel, boutiqueName, boutiqueSlug, closePanel, openPanel],
  );

  return (
    <TrBoutiqueCommerceScopeContext.Provider value={value}>
      {children}
    </TrBoutiqueCommerceScopeContext.Provider>
  );
}

/** Every boutique route renders inside TrBoutiqueCommerceScopeProvider (see TrBoutiqueEditorialShell). */
export function useTrBoutiqueCommerceScope(): TrBoutiqueCommerceScopeValue {
  const context = useContext(TrBoutiqueCommerceScopeContext);
  if (!context) {
    throw new Error(
      "useTrBoutiqueCommerceScope must be used within TrBoutiqueCommerceScopeProvider",
    );
  }
  return context;
}

/** Boutique-local cart, scoped to the current storefront. */
export function useTrScopedCart() {
  const scope = useTrBoutiqueCommerceScope();
  const localStore = useMemo(
    () => getTrBoutiqueLocalCartStore(scope.boutiqueSlug),
    [scope.boutiqueSlug],
  );

  const items = useStore(localStore, (state) => state.items);
  const addItem = useStore(localStore, (state) => state.addItem);
  const removeItem = useStore(localStore, (state) => state.removeItem);
  const clearCart = useStore(localStore, (state) => state.clearCart);
  const itemCount = useStore(localStore, (state) => state.items.length);
  const hydrated = useTrPersistedHydration(localStore.persist);

  return {
    scoped: true as const,
    boutiqueSlug: scope.boutiqueSlug,
    items,
    addItem: addItem as (item: TrCartLineItem) => boolean,
    removeItem,
    clearCart,
    itemCount,
    hydrated,
    hasItem: (productId: string, size?: string | null) =>
      items.some((entry) => {
        if (size === undefined) return entry.productId === productId;
        return sameCartLine(entry, { productId, size });
      }),
  };
}

/** Boutique-local favorites, scoped to the current storefront. */
export function useTrScopedFavorites() {
  const scope = useTrBoutiqueCommerceScope();
  const localStore = useMemo(
    () => getTrBoutiqueLocalFavoritesStore(scope.boutiqueSlug),
    [scope.boutiqueSlug],
  );

  const items = useStore(localStore, (state) => state.items);
  const toggleItem = useStore(localStore, (state) => state.toggleItem);
  const removeItem = useStore(localStore, (state) => state.removeItem);
  const itemCount = useStore(localStore, (state) => state.items.length);
  const hydrated = useTrPersistedHydration(localStore.persist);

  return {
    scoped: true as const,
    boutiqueSlug: scope.boutiqueSlug,
    items,
    toggleItem: toggleItem as (item: TrFavoriteItem) => void,
    removeItem,
    itemCount,
    hydrated,
    hasItem: (productId: string) =>
      items.some((entry) => entry.productId === productId),
  };
}
