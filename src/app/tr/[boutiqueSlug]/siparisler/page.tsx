import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueDemoOrderList } from "@/components/tr/boutique/orders/TrBoutiqueDemoOrderList";
import { listDemoShopperOrders } from "@/lib/tr/commerce/demoShopperOrders";
import { safeGetBoutiqueStorefront, safeGetPublicBoutique } from "@/lib/tr/publicData";

interface BoutiqueOrdersPageProps {
  params: Promise<{ boutiqueSlug: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueOrdersPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  return {
    title: boutique ? `Siparişler · ${boutique.name}` : "Siparişler",
    robots: { index: false, follow: false },
  };
}

export default async function BoutiqueOrdersPage({
  params,
}: BoutiqueOrdersPageProps) {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
  const boutique = storefront ?? (await safeGetPublicBoutique(boutiqueSlug));
  if (!boutique) notFound();

  const orders = listDemoShopperOrders(storefront?.products ?? []);

  return <TrBoutiqueDemoOrderList boutique={boutique} orders={orders} />;
}
