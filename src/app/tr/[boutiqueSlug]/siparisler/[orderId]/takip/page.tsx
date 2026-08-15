import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueDemoOrderTracking } from "@/components/tr/boutique/orders/TrBoutiqueDemoOrderTracking";
import { getDemoShopperOrder } from "@/lib/tr/commerce/demoShopperOrders";
import { safeGetBoutiqueStorefront, safeGetPublicBoutique } from "@/lib/tr/publicData";

interface BoutiqueOrderTrackingPageProps {
  params: Promise<{ boutiqueSlug: string; orderId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Kargo takip",
    robots: { index: false, follow: false },
  };
}

export default async function BoutiqueOrderTrackingPage({
  params,
}: BoutiqueOrderTrackingPageProps) {
  const { boutiqueSlug, orderId } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
  const boutique = storefront ?? (await safeGetPublicBoutique(boutiqueSlug));
  if (!boutique) notFound();

  const order = getDemoShopperOrder(orderId, storefront?.products ?? []);
  if (!order) notFound();

  return <TrBoutiqueDemoOrderTracking boutique={boutique} order={order} />;
}
