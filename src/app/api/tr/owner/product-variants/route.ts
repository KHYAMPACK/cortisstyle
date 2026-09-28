import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";
import { listVariantTypes } from "@/lib/tr/catalog/variantTypes";
import { listVariantsByBoutique } from "@/lib/tr/catalog/productVariants";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/product-variants?boutiqueId=
 * The variants of every Gelişmiş ürün of the boutique, by product id, with the label of
 * each variant value — what the order editor's product picker needs next to the product list.
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId = new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }

  try {
    const [byProduct, types] = await Promise.all([
      listVariantsByBoutique(boutique.id),
      listVariantTypes(boutique.id),
    ]);
    const labels: Record<string, string> = {};
    for (const type of types) {
      for (const value of type.values) labels[value.id] = value.label;
    }
    return Response.json({ variants: Object.fromEntries(byProduct), labels });
  } catch (error) {
    console.error("[tr/owner/product-variants]", error);
    return Response.json({ error: "Varyantlar yüklenemedi." }, { status: 500 });
  }
}
