"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TrCategoryDefinition } from "@/lib/tr/categories";

interface TrBoutiqueCatalogContextValue {
  categories: TrCategoryDefinition[];
  activeCategory: string | null;
  setActiveCategory: (categoryId: string | null) => void;
  selectCategory: (categoryId: string | null, options?: { scroll?: boolean }) => void;
  registerCatalogElement: (element: HTMLElement | null) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const TrBoutiqueCatalogContext = createContext<TrBoutiqueCatalogContextValue | null>(
  null,
);

interface TrBoutiqueCatalogProviderProps {
  categories: TrCategoryDefinition[];
  children: ReactNode;
}

export function TrBoutiqueCatalogProvider({
  categories,
  children,
}: TrBoutiqueCatalogProviderProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const catalogElementRef = useRef<HTMLElement | null>(null);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const registerCatalogElement = useCallback((element: HTMLElement | null) => {
    catalogElementRef.current = element;
  }, []);

  const scrollToCatalog = useCallback(() => {
    const element = catalogElementRef.current;
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const selectCategory = useCallback(
    (categoryId: string | null, options?: { scroll?: boolean }) => {
      setActiveCategory(categoryId);

      if (options?.scroll !== false) {
        requestAnimationFrame(() => {
          scrollToCatalog();
        });
      }
    },
    [scrollToCatalog],
  );

  const value = useMemo(
    () => ({
      categories,
      activeCategory,
      setActiveCategory,
      selectCategory,
      registerCatalogElement,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [
      activeCategory,
      categories,
      closeDrawer,
      isDrawerOpen,
      openDrawer,
      registerCatalogElement,
      selectCategory,
    ],
  );

  return (
    <TrBoutiqueCatalogContext.Provider value={value}>
      {children}
    </TrBoutiqueCatalogContext.Provider>
  );
}

export function useTrBoutiqueCatalog(): TrBoutiqueCatalogContextValue {
  const context = useContext(TrBoutiqueCatalogContext);
  if (!context) {
    throw new Error("useTrBoutiqueCatalog must be used within TrBoutiqueCatalogProvider");
  }
  return context;
}

export function useTrBoutiqueCatalogOptional(): TrBoutiqueCatalogContextValue | null {
  return useContext(TrBoutiqueCatalogContext);
}
