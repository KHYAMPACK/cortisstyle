/**
 * Seed minimora boutique (custom art) via service role.
 * Usage: npx tsx scripts/seed-minimora.mts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createBoutiqueAdmin,
  getBoutiqueBySlugAdmin,
  updateBoutiqueBrandAdmin,
  updateBoutiqueStatusAdmin,
} from "../src/lib/tr/catalog/boutiques";
import { createProductAdmin, listProductsByBoutiqueIdAdmin, updateProductAdmin } from "../src/lib/tr/catalog/products";
import { parseTryToKurus } from "../src/types/tr-marketplace";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional
  }
}

interface SeedPayload {
  boutiques?: Array<{
    slug: string;
    name: string;
    legalName?: string;
    description?: string;
    logoUrl?: string;
    whatsappPhone?: string;
    instagramHandle?: string;
    themeAccent?: string;
    catalogProfile?: "fashion" | "custom_art";
    shippingNote?: string;
    exchangePolicy?: string;
    physicalAddress?: string;
    homeLayout?: "default" | "editorial";
    customDomain?: string;
    editorialContent?: Record<string, unknown>;
    status?: "draft" | "pending" | "verified" | "suspended";
    products?: Array<{
      title: string;
      description?: string;
      priceTry: number;
      sizes?: string[];
      sizeStocks?: Record<string, number>;
      colors?: Array<{ name: string; hex: string }>;
      category?: string;
      images?: string[];
      stock?: number;
      features?: Record<string, unknown>;
    }>;
  }>;
}

async function main() {
  loadEnvLocal();

  const payload = JSON.parse(
    readFileSync(resolve(process.cwd(), "src/data/tr/minimora-seed.json"), "utf8"),
  ) as SeedPayload;

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
        })
      : await createBoutiqueAdmin({
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
          homeLayout: boutiqueInput.homeLayout,
          customDomain: boutiqueInput.customDomain,
          editorialContent: boutiqueInput.editorialContent,
          catalogProfile: boutiqueInput.catalogProfile,
          status: desiredStatus,
        });

    if (existing && boutique.status !== desiredStatus) {
      boutique = await updateBoutiqueStatusAdmin(existing.id, desiredStatus);
    }

    console.log(
      `${existing ? "Updated" : "Created"} boutique: ${boutique.slug} (${boutique.id})`,
    );

    if (!existing) {
      for (const productInput of boutiqueInput.products ?? []) {
        const product = await createProductAdmin({
          boutiqueId: boutique.id,
          title: productInput.title,
          description: productInput.description,
          priceKurus: parseTryToKurus(productInput.priceTry),
          sizes: productInput.sizes,
          sizeStocks: productInput.sizeStocks,
          colors: productInput.colors,
          category: productInput.category,
          images: productInput.images ?? [],
          stock: productInput.stock,
          features: productInput.features,
          status: "available",
        });
        console.log(`  + ${product.title} (${product.id})`);
      }
    } else {
      const products = await listProductsByBoutiqueIdAdmin(boutique.id);
      const nextDescription = boutiqueInput.products?.[0]?.description;
      if (nextDescription && products[0]) {
        await updateProductAdmin(products[0].id, {
          description: nextDescription,
        });
        console.log(`  ~ ${products[0].title} description`);
      }
    }
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
