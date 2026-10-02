import { deliverPublicAssetUrls } from "@/lib/tr/assets/deliverPublicAssetUrl";
import { getPublicProductById } from "@/lib/tr/catalog/products";
import { loadPublicProductVariants } from "@/lib/tr/catalog/publicVariants";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tr/products/[id]/variants — a shop product's variants as a shopper sees them
 * (the quick-add sheet on product lists). Only for products the shop shows; `null`
 * when the product sells without variants.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const product = await getPublicProductById(id);
    if (!product) {
      return Response.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }
    const variants = await loadPublicProductVariants(product);
    return Response.json(
      {
        variants: variants
          ? {
              ...variants,
              variants: variants.variants.map((variant) => ({
                ...variant,
                images: deliverPublicAssetUrls(variant.images, "full"),
              })),
            }
          : null,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[tr/products/variants]", error);
    return Response.json({ error: "Seçenekler yüklenemedi." }, { status: 500 });
  }
}
