"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { refreshTrMarketplaceCatalog } from "@/lib/tr/marketplaceCatalogAction";
import type {
  TrBoutiquePublic,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

type CacheStatus = "idle" | "refreshing" | "error";

interface TrMarketplaceCacheValue {
  products: TrProductWithBoutique[];
  boutiques: TrBoutiquePublic[];
  status: CacheStatus;
  error: string | null;
  refresh: () => void;
}

const TrMarketplaceCacheContext =
  createContext<TrMarketplaceCacheValue | null>(null);

interface TrMarketplaceCacheProviderProps {
  children: ReactNode;
  initialProducts: TrProductWithBoutique[];
  initialBoutiques: TrBoutiquePublic[];
}

export function TrMarketplaceCacheProvider({
  children,
  initialProducts,
  initialBoutiques,
}: TrMarketplaceCacheProviderProps) {
  const [products, setProducts] =
    useState<TrProductWithBoutique[]>(initialProducts);
  const [boutiques, setBoutiques] =
    useState<TrBoutiquePublic[]>(initialBoutiques);
  const [status, setStatus] = useState<CacheStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("refreshing");
    setError(null);

    startTransition(() => {
      void refreshTrMarketplaceCatalog()
        .then((payload) => {
          setProducts(payload.products);
          setBoutiques(payload.boutiques);
          setStatus("idle");
          setError(null);
        })
        .catch(() => {
          setStatus("error");
          setError("Güncelleme başarısız — mevcut liste gösteriliyor.");
        })
        .finally(() => {
          inFlight.current = false;
        });
    });
  }, []);

  const value = useMemo(
    () => ({
      products,
      boutiques,
      status,
      error,
      refresh,
    }),
    [products, boutiques, status, error, refresh],
  );

  return (
    <TrMarketplaceCacheContext.Provider value={value}>
      {children}
    </TrMarketplaceCacheContext.Provider>
  );
}

export function useTrMarketplaceCache(): TrMarketplaceCacheValue {
  const value = useContext(TrMarketplaceCacheContext);
  if (!value) {
    throw new Error(
      "useTrMarketplaceCache must be used within TrMarketplaceCacheProvider",
    );
  }
  return value;
}

export function useTrMarketplaceCacheOptional(): TrMarketplaceCacheValue | null {
  return useContext(TrMarketplaceCacheContext);
}
