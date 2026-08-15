import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueDemoOrderDetail } from "@/components/tr/boutique/orders/TrBoutiqueDemoOrderDetail";
import { getDemoShopperOrder } from "@/lib/tr/commerce/demoShopperOrders";
import { safeGetBoutiqueStorefront, safeGetPublicBoutique } from "@/lib/tr/publicData";

interface BoutiqueOrderDetailPageProps {
  params: Promise<{ boutiqueSlug: string; orderId: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueOrderDetailPageProps): Promise<Metadata> {
  const { boutiqueSlug, orderId } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
  const order = getDemoShopperOrder(orderId, storefront?.products ?? []);
  return {
    title: order
      ? `Sipariş ${order.displayNumber}`
      : boutique
        ? `Sipariş · ${boutique.name}`
        : "Sipariş",
    robots: { index: false, follow: false },
  };
}

export default async function BoutiqueOrderDetailPage({
  params,
}: BoutiqueOrderDetailPageProps) {
  const { boutiqueSlug, orderId } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
  const boutique = storefront ?? (await safeGetPublicBoutique(boutiqueSlug));
  if (!boutique) notFound();

  const order = getDemoShopperOrder(orderId, storefront?.products ?? []);
  if (!order) notFound();

  return <TrBoutiqueDemoOrderDetail boutique={boutique} order={order} />;
}
