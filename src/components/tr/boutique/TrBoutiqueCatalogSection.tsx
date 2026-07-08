"use client";

import { useEffect, useRef } from "react";
import { useTrBoutiqueCatalog } from "@/components/tr/boutique/TrBoutiqueCatalogContext";

interface TrBoutiqueCatalogSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function TrBoutiqueCatalogSection({
  children,
  className = "",
}: TrBoutiqueCatalogSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerCatalogElement } = useTrBoutiqueCatalog();

  useEffect(() => {
    registerCatalogElement(sectionRef.current);
    return () => registerCatalogElement(null);
  }, [registerCatalogElement]);

  return (
    <section
      ref={sectionRef}
      id="boutique-katalog"
      aria-label="Ürün kataloğu"
      className={`scroll-mt-28 ${className}`.trim()}
    >
      {children}
    </section>
  );
}
