import {
  createBoutiqueAdmin,
  getBoutiqueBySlugAdmin,
  updateBoutiqueBrandAdmin,
  updateBoutiqueStatusAdmin,
} from "@/lib/tr/boutiques";
import { createDiscountCodeAdmin } from "@/lib/tr/discountCodes";
import {
  createOrderAdmin,
  updateOrderFulfillmentStatusAdmin,
} from "@/lib/tr/orders";
import { createProductAdmin } from "@/lib/tr/products";
import { isTrAdminAuthorized } from "@/lib/tr/adminAuth";
import { parseTryToKurus } from "@/types/tr-marketplace";
import type { TrFulfillmentStatus } from "@/types/tr-marketplace";

export const runtime = "nodejs";

interface SeedBoutiquePayload {
  slug: string;
  name: string;
  legalName?: string;
  vergiNo?: string;
  iban?: string;
  contactEmail?: string;
  description?: string;
  logoUrl?: string;
  whatsappPhone?: string;
  instagramHandle?: string;
  themeAccent?: string;
  shippingNote?: string;
  exchangePolicy?: string;
  physicalAddress?: string;
  homeLayout?: "default" | "editorial";
  customDomain?: string;
  editorialContent?: Record<string, unknown>;
  catalogProfile?: "fashion" | "custom_art";
  status?: "draft" | "pending" | "verified" | "suspended";
  products?: Array<{
    title: string;
    description?: string;
    priceTry: number;
    compareAtPriceTry?: number;
    size?: string;
    sizes?: string[];
    sizeStocks?: Record<string, number>;
    colors?: Array<{ name: string; hex: string }>;
    conditionLabel?: string;
    category?: string;
    images?: string[];
    stock?: number;
    features?: Record<string, unknown>;
  }>;
  sampleOrders?: Array<{
    daysAgo?: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    fulfillmentStatus?: TrFulfillmentStatus;
    productIndexes: number[];
  }>;
  discountCodes?: Array<{
    code: string;
    percentOff?: number;
    amountOffTry?: number;
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
    const createdProducts: Array<{
      id: string;
      title: string;
      boutiqueSlug: string;
    }> = [];
    const createdOrders: Array<{ id: string; boutiqueSlug: string }> = [];
    const createdCodes: Array<{ code: string; boutiqueSlug: string }> = [];

    for (const boutiqueInput of payload.boutiques ?? []) {
      const existing = await getBoutiqueBySlugAdmin(boutiqueInput.slug);
      const desiredStatus = boutiqueInput.status ?? "verified";
      let boutique = existing
        ? await updateBoutiqueBrandAdmin(existing.id, {
            description: boutiqueInput.description,
            logoUrl: boutiqueInput.logoUrl,
            whatsappPhone: boutiqueInput.whatsappPhone,
            instagramHandle: boutiqueInput.instagramHandle,
            themeAccent: boutiqueInput.themeAccent,
            shippingNote: boutiqueInput.shippingNote,
            exchangePolicy: boutiqueInput.exchangePolicy,
            physicalAddress: boutiqueInput.physicalAddress,
            homeLayout: boutiqueInput.homeLayout,
            customDomain: boutiqueInput.customDomain,
            editorialContent: boutiqueInput.editorialContent,
            catalogProfile: boutiqueInput.catalogProfile,
            legalName: boutiqueInput.legalName,
            vergiNo: boutiqueInput.vergiNo,
            iban: boutiqueInput.iban,
            contactEmail: boutiqueInput.contactEmail,
          })
        : await createBoutiqueAdmin({
            slug: boutiqueInput.slug,
            name: boutiqueInput.name,
            legalName: boutiqueInput.legalName,
            vergiNo: boutiqueInput.vergiNo,
            iban: boutiqueInput.iban,
            contactEmail: boutiqueInput.contactEmail,
            description: boutiqueInput.description,
            logoUrl: boutiqueInput.logoUrl,
            whatsappPhone: boutiqueInput.whatsappPhone,
            instagramHandle: boutiqueInput.instagramHandle,
            themeAccent: boutiqueInput.themeAccent,
            shippingNote: boutiqueInput.shippingNote,
            exchangePolicy: boutiqueInput.exchangePolicy,
            physicalAddress: boutiqueInput.physicalAddress,
            homeLayout: boutiqueInput.homeLayout,
            customDomain: boutiqueInput.customDomain,
            editorialContent: boutiqueInput.editorialContent,
            catalogProfile: boutiqueInput.catalogProfile,
            status: desiredStatus,
          });

      // Re-seed must flip draft/pending → verified (public view filters status).
      if (existing && boutique.status !== desiredStatus) {
        boutique = await updateBoutiqueStatusAdmin(existing.id, desiredStatus);
      }

      createdBoutiques.push({
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
        status: boutique.status,
        updated: Boolean(existing),
      });

      // On update-only passes, skip creating duplicate products/orders/codes.
      if (existing) {
        continue;
      }

      const productIds: string[] = [];
      const productSnapshots: Array<{
        id: string;
        title: string;
        priceKurus: number;
      }> = [];

      for (const productInput of boutiqueInput.products ?? []) {
        const product = await createProductAdmin({
          boutiqueId: boutique.id,
          title: productInput.title,
          description: productInput.description,
          priceKurus: parseTryToKurus(productInput.priceTry),
          compareAtPriceKurus:
            productInput.compareAtPriceTry != null
              ? parseTryToKurus(productInput.compareAtPriceTry)
              : null,
          size: productInput.size,
          sizes: productInput.sizes,
          colors: productInput.colors,
          conditionLabel: productInput.conditionLabel,
          category: productInput.category,
          images: productInput.images ?? [],
          features: productInput.features,
          status: "available",
          stock: productInput.stock ?? 1,
          sizeStocks: productInput.sizeStocks,
        });

        productIds.push(product.id);
        productSnapshots.push({
          id: product.id,
          title: product.title,
          priceKurus: product.priceKurus,
        });
        createdProducts.push({
          id: product.id,
          title: product.title,
          boutiqueSlug: boutique.slug,
        });
      }

      for (const orderInput of boutiqueInput.sampleOrders ?? []) {
        const items = (orderInput.productIndexes ?? [])
          .map((index) => productSnapshots[index])
          .filter(Boolean)
          .map((product) => ({
            productId: product!.id,
            boutiqueId: boutique.id,
            title: product!.title,
            priceKurus: product!.priceKurus,
            quantity: 1,
          }));

        if (items.length === 0) continue;

        const daysAgo = orderInput.daysAgo ?? 0;
        const createdAt = new Date(
          Date.now() - daysAgo * 24 * 60 * 60 * 1000,
        ).toISOString();

        const order = await createOrderAdmin({
          customerEmail: orderInput.customerEmail,
          customerName: orderInput.customerName,
          customerPhone: orderInput.customerPhone ?? null,
          shippingAddress: {
            line1: "Örnek Mah. Demo Cad. No:1",
            district: "Merkezefendi",
            city: "Denizli",
            postalCode: "20010",
            country: "TR",
          },
          isSandbox: true,
          createdAt,
          items,
          decrementInventory: false,
        });

        if (orderInput.fulfillmentStatus) {
          await updateOrderFulfillmentStatusAdmin(
            order.id,
            orderInput.fulfillmentStatus,
          );
        }

        createdOrders.push({ id: order.id, boutiqueSlug: boutique.slug });
      }

      for (const codeInput of boutiqueInput.discountCodes ?? []) {
        const code = await createDiscountCodeAdmin({
          boutiqueId: boutique.id,
          code: codeInput.code,
          percentOff: codeInput.percentOff ?? null,
          amountOffKurus:
            codeInput.amountOffTry != null
              ? parseTryToKurus(codeInput.amountOffTry)
              : null,
        });
        createdCodes.push({ code: code.code, boutiqueSlug: boutique.slug });
      }
    }

    return Response.json({
      ok: true,
      boutiques: createdBoutiques,
      products: createdProducts,
      orders: createdOrders,
      discountCodes: createdCodes,
    });
  } catch (error) {
    console.error("TR admin seed failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" &&
            error &&
            "message" in error &&
            typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : typeof error === "object" &&
              error &&
              "error" in error &&
              typeof (error as { error: unknown }).error === "string"
            ? (error as { error: string }).error
            : JSON.stringify(error);
    return Response.json(
      {
        error: message || "Unable to seed TR marketplace data.",
      },
      { status: 500 },
    );
  }
}
