"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { isCustomArtCatalogProfile } from "@/lib/tr/catalogProfiles";
import { isPanelProductRoute } from "@/lib/tr/panel/panelNav";
import { trPanelOrdersPath } from "@/lib/tr/paths";
import type { TrOwnerBoutiqueSummary } from "@/lib/tr/ownerClient";

/** Redirect print-on-demand boutiques away from product/stock panel routes. */
export function TrOwnerProductRouteGate({
  activeBoutique,
  children,
}: {
  activeBoutique: TrOwnerBoutiqueSummary;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const blocked =
    isCustomArtCatalogProfile(activeBoutique) &&
    isPanelProductRoute(pathname ?? "");

  useEffect(() => {
    if (!isCustomArtCatalogProfile(activeBoutique)) return;
    if (isPanelProductRoute(pathname ?? "")) {
      router.replace(trPanelOrdersPath());
    }
  }, [activeBoutique, pathname, router]);

  if (blocked) {
    return (
      <p className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-[14px] text-neutral-600">
        Bu butik sipariş odaklıdır — ürün ve stok paneli kapalı.
      </p>
    );
  }

  return <>{children}</>;
}
