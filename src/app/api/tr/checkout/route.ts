import { createOrderAdmin } from "@/lib/tr/orders";
import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import type { CreateTrOrderInput } from "@/types/tr-marketplace";

export const runtime = "nodejs";

type CheckoutItem = {
  productId: string;
  boutiqueId: string;
  title: string;
  priceKurus: number;
  quantity?: number;
};

type CheckoutBody = {
  boutiqueSlug?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: CreateTrOrderInput["shippingAddress"];
  items: CheckoutItem[];
  /** Accept mesafeli satış + ön bilgilendirme */
  acceptedDistanceSales: boolean;
  acceptedKvkk: boolean;
};

/**
 * Single-boutique (or demo) checkout — creates a sandbox order until card payment is live.
 * POST /api/tr/checkout
 */
export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  if (!body.acceptedDistanceSales || !body.acceptedKvkk) {
    return Response.json(
      { error: "Sözleşmeleri onaylamanız gerekir." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Sepet boş." }, { status: 400 });
  }

  const boutiqueSlug = body.boutiqueSlug?.trim().toLowerCase() || null;

  if (boutiqueSlug) {
    const boutique = await getPublicBoutiqueBySlug(boutiqueSlug);
    if (!boutique) {
      return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
    }
    const foreign = body.items.find((item) => item.boutiqueId !== boutique.id);
    if (foreign) {
      return Response.json(
        { error: "Sepette başka satıcıya ait ürün var." },
        { status: 400 },
      );
    }
  } else {
    const boutiqueIds = new Set(body.items.map((item) => item.boutiqueId));
    if (boutiqueIds.size > 1) {
      return Response.json(
        {
          error:
            "Çoklu satıcı ödeme henüz bu uç noktada desteklenmiyor. Marketplace sepetini kullanın.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const order = await createOrderAdmin({
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      items: body.items.map((item) => ({
        productId: item.productId,
        boutiqueId: item.boutiqueId,
        title: item.title,
        priceKurus: item.priceKurus,
        quantity: item.quantity ?? 1,
      })),
      isSandbox: true,
    });

    return Response.json({
      ok: true,
      orderId: order.id,
      sandbox: true,
    });
  } catch (error) {
    console.error("TR checkout failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Sipariş oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
