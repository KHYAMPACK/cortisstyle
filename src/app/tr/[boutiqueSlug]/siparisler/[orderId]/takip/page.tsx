import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueDemoOrderTracking } from "@/components/tr/boutique/orders/TrBoutiqueDemoOrderTracking";
import {
  TrBoutiqueLiveOrderTracking,
  TrBoutiqueTrackingGate,
} from "@/components/tr/boutique/orders/TrBoutiqueLiveOrderTracking";
import { getDemoShopperOrder } from "@/lib/tr/commerce/demoShopperOrders";
import { verifyOrderConfirmToken } from "@/lib/tr/orderConfirmToken";
import { getOrderByIdAdmin } from "@/lib/tr/orders";
import { trackingStepFromProviderStatus } from "@/lib/tr/shipping/mapFulfillment";
import { refreshBasitKargoOrder } from "@/lib/tr/shipping/ownerShipment";
import { getShippingProviderId } from "@/lib/tr/shipping/registry";
import { safeGetBoutiqueStorefront, safeGetPublicBoutique } from "@/lib/tr/publicData";

interface BoutiqueOrderTrackingPageProps {
  params: Promise<{ boutiqueSlug: string; orderId: string }>;
  searchParams: Promise<{ token?: string; posta?: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Kargo takip",
    robots: { index: false, follow: false },
  };
}

function postalMatches(orderPostal: string, input: string | undefined): boolean {
  const expected = orderPostal.replace(/\D/g, "");
  const got = (input ?? "").replace(/\D/g, "");
  return expected.length >= 4 && got === expected;
}

export default async function BoutiqueOrderTrackingPage({
  params,
  searchParams,
}: BoutiqueOrderTrackingPageProps) {
  const { boutiqueSlug, orderId } = await params;
  const query = await searchParams;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
  const boutique = storefront ?? (await safeGetPublicBoutique(boutiqueSlug));
  if (!boutique) notFound();

  const demo = getDemoShopperOrder(orderId, storefront?.products ?? []);
  if (demo) {
    return <TrBoutiqueDemoOrderTracking boutique={boutique} order={demo} />;
  }

  if (!UUID_RE.test(orderId)) notFound();

  let order = await getOrderByIdAdmin(orderId).catch(() => null);
  if (!order || !order.items.some((item) => item.boutiqueId === boutique.id)) {
    notFound();
  }

  const token = query.token?.trim() || null;
  const allowed =
    verifyOrderConfirmToken(order.id, token) ||
    postalMatches(order.shippingAddress.postalCode, query.posta);
  if (!allowed) {
    return (
      <TrBoutiqueTrackingGate
        boutique={boutique}
        orderId={order.id}
        token={token}
      />
    );
  }

  const provider = getShippingProviderId(boutique.slug);
  if (provider !== "basitkargo" || !order.shipment.externalId) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950">
          Kargo takip
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600">
          {order.shipment.barcode
            ? "Kargo bilgisi kargo firmanızın sitesinden takip edilir."
            : "Bu sipariş henüz kargoya verilmedi."}
        </p>
      </div>
    );
  }

  order = await refreshBasitKargoOrder(boutique.slug, order);
  const step = trackingStepFromProviderStatus(order.shipment.status);
  const trackingNumber =
    order.shipment.trackingCode || order.shipment.barcode || "—";

  if (step < 0 && !order.shipment.barcode) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950">
          Kargo takip
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600">
          Sipariş hazırlanıyor. Kargo kodu üretilince takip burada görünür.
        </p>
      </div>
    );
  }

  return (
    <TrBoutiqueLiveOrderTracking
      boutique={boutique}
      tracking={{
        orderId: order.id,
        carrierName: order.shipment.carrierName || "Kargo",
        trackingNumber,
        statusLabel: order.shipment.status || "Hazırlanıyor",
        currentStep: Math.max(0, step),
        traces: order.shipment.traces,
      }}
    />
  );
}
