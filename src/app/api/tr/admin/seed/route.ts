import { createBoutiqueAdmin } from "@/lib/tr/boutiques";
import { createProductAdmin } from "@/lib/tr/products";
import { isTrAdminAuthorized } from "@/lib/tr/adminAuth";
import { parseTryToKurus } from "@/types/tr-marketplace";

export const runtime = "nodejs";

interface SeedBoutiquePayload {
  slug: string;
  name: string;
  legalName?: string;
  description?: string;
  logoUrl?: string;
  whatsappPhone?: string;
  instagramHandle?: string;
  themeAccent?: string;
  shippingNote?: string;
  exchangePolicy?: string;
  physicalAddress?: string;
  status?: "draft" | "pending" | "verified" | "suspended";
  products?: Array<{
    title: string;
    description?: string;
    priceTry: number;
    size?: string;
    conditionLabel?: string;
    category?: string;
    images?: string[];
  }>;
}

interface SeedPayload {
  boutiques?: SeedBoutiquePayload[];
}

/**
 * Protected bootstrap endpoint for Phase 1 sandbox data.
 * Seeds product-based boutique storefronts only — no outfit/look bundles.
 *
 * POST /api/tr/admin/seed
 * Authorization: Bearer {TR_ADMIN_SECRET}
 */
export async function POST(request: Request) {
  if (!isTrAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: SeedPayload;
  try {
    payload = (await request.json()) as SeedPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const createdBoutiques = [];
    const createdProducts: Array<{ id: string; title: string; boutiqueSlug: string }> =
      [];

    for (const boutiqueInput of payload.boutiques ?? []) {
      const boutique = await createBoutiqueAdmin({
        slug: boutiqueInput.slug,
        name: boutiqueInput.name,
        legalName: boutiqueInput.legalName,
        description: boutiqueInput.description,
        logoUrl: boutiqueInput.logoUrl,
        whatsappPhone: boutiqueInput.whatsappPhone,
        instagramHandle: boutiqueInput.instagramHandle,
        themeAccent: boutiqueInput.themeAccent,
        shippingNote: boutiqueInput.shippingNote,
        exchangePolicy: boutiqueInput.exchangePolicy,
        physicalAddress: boutiqueInput.physicalAddress,
        status: boutiqueInput.status ?? "verified",
      });

      createdBoutiques.push({
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
        status: boutique.status,
      });

      for (const productInput of boutiqueInput.products ?? []) {
        const product = await createProductAdmin({
          boutiqueId: boutique.id,
          title: productInput.title,
          description: productInput.description,
          priceKurus: parseTryToKurus(productInput.priceTry),
          size: productInput.size,
          conditionLabel: productInput.conditionLabel,
          category: productInput.category,
          images: productInput.images ?? [],
          status: "available",
        });

        createdProducts.push({
          id: product.id,
          title: product.title,
          boutiqueSlug: boutique.slug,
        });
      }
    }

    return Response.json({
      ok: true,
      boutiques: createdBoutiques,
      products: createdProducts,
    });
  } catch (error) {
    console.error("TR admin seed failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to seed TR marketplace data.",
      },
      { status: 500 },
    );
  }
}
