/**
 * One-off seed runner — uses service role directly (no HTTP).
 * Usage: npx tsx scripts/seed-pervinsoysalbutik.mts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createBoutiqueAdmin } from "../src/lib/tr/boutiques";
import { createProductAdmin } from "../src/lib/tr/products";
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
    // .env.local optional when vars are already exported
  }
}

loadEnvLocal();

interface SeedPayload {
  boutiques?: Array<{
    slug: string;
    name: string;
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
  }>;
}

async function main() {
  const payload = JSON.parse(
    readFileSync(resolve(process.cwd(), "src/data/tr/pervinsoysalbutik-seed.json"), "utf8"),
  ) as SeedPayload;

  for (const boutiqueInput of payload.boutiques ?? []) {
    const boutique = await createBoutiqueAdmin({
      slug: boutiqueInput.slug,
      name: boutiqueInput.name,
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

    console.log(`Boutique: ${boutique.slug} (${boutique.id})`);

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

      console.log(`  + ${product.title}`);
    }
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
