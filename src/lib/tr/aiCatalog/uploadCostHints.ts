/**
 * Owner-facing Cortisstyle credit pricing.
 *
 * - Ürün (ön + arka packshot): 1 kredi
 * - Model (tek ön model shot, isteğe bağlı): 1 kredi
 * - 1 kredi = $0.25 → TRY via tryPerUsd
 */

export const TR_AI_CATALOG_CREDITS = {
  /** Front + back packshot together */
  productPackage: 1,
  /** Single front model try-on package */
  modelPackage: 1,
  /** How many lifestyle shots the model package produces */
  modelPackageShots: 1,
  /** List price per credit in USD */
  priceUsdPerCredit: 0.25,
  /** Approx TRY per USD for display */
  tryPerUsd: 47.5,
} as const;

/** Boutique-facing credits per logged usage kind (not raw FASHN units). */
export function boutiqueCreditsForUsageKind(
  kind: "packshot" | "tryon" | "bg_removal",
): number {
  if (kind === "packshot") {
    // Ön + arka together = 1 product package → 0.5 each event
    return TR_AI_CATALOG_CREDITS.productPackage / 2;
  }
  if (kind === "tryon") {
    return TR_AI_CATALOG_CREDITS.modelPackage;
  }
  return 0;
}

/** TRY list price per credit (rounded for display). */
export function priceTryPerCredit(): number {
  return Math.round(
    TR_AI_CATALOG_CREDITS.priceUsdPerCredit * TR_AI_CATALOG_CREDITS.tryPerUsd,
  );
}

export function creditsToUsd(credits: number): number {
  return credits * TR_AI_CATALOG_CREDITS.priceUsdPerCredit;
}

export function creditsToTry(credits: number): number {
  return credits * priceTryPerCredit();
}

export function formatCreditPriceTry(credits: number): string {
  return `${creditsToTry(credits).toLocaleString("tr-TR")} ₺`;
}

export function formatCreditPriceUsd(credits: number): string {
  const usd = creditsToUsd(credits);
  if (usd < 1) return `~$${usd.toFixed(2)}`;
  return `~$${usd.toFixed(2)}`;
}

export function formatCreditPriceBoth(credits: number): string {
  return `${formatCreditPriceTry(credits)} (${formatCreditPriceUsd(credits)})`;
}

const exampleFullCredits =
  TR_AI_CATALOG_CREDITS.productPackage + TR_AI_CATALOG_CREDITS.modelPackage;

export const TR_AI_CREDITS_INFO_LINES = [
  `Ürün katalog paketi (ön + arka): ${TR_AI_CATALOG_CREDITS.productPackage} kredi → ${formatCreditPriceBoth(TR_AI_CATALOG_CREDITS.productPackage)}`,
  `Model fotoğrafı (ön, isteğe bağlı): ${TR_AI_CATALOG_CREDITS.modelPackage} kredi → ${formatCreditPriceBoth(TR_AI_CATALOG_CREDITS.modelPackage)}`,
  `Örnek: katalog + model = ${exampleFullCredits} kredi → ${formatCreditPriceBoth(exampleFullCredits)}`,
  `1 kredi = $${TR_AI_CATALOG_CREDITS.priceUsdPerCredit.toFixed(2)} (~${priceTryPerCredit()} ₺)`,
  "Ödeme: krediler butik hesabınızdan düşülür.",
  "Tahsilat: aylık paket veya dönem sonu fatura.",
  "Bakiye yetersizse işlem yapılmaz.",
] as const;

export function describePhotoSlotCost(slotIndex: number): {
  title: string;
  subtitle: string;
  bullets: string[];
  credits: number | null;
  costPrefix: string;
} {
  if (slotIndex === 0) {
    return {
      title: "Ön yüz katalog görseli",
      subtitle:
        "Bu ham fotoğraf değil — onayda satışa hazır katalog görseli (packshot) oluşturulur.",
      bullets: [
        "Kaynak olarak seçtiğiniz kare kullanılır.",
        "Ön + arka birlikte 1 kredi (ürün paketi).",
        "Sonuç: temiz, vitrin tipi ürün görseli.",
      ],
      credits: TR_AI_CATALOG_CREDITS.productPackage,
      costPrefix: "Ürün paketi",
    };
  }

  if (slotIndex === 1) {
    return {
      title: "Arka yüz katalog görseli",
      subtitle:
        "Bu ham fotoğraf değil — onayda satışa hazır katalog görseli (packshot) oluşturulur.",
      bullets: [
        "Kaynak olarak seçtiğiniz kare kullanılır.",
        "Ön ile aynı ürün paketine dahil — ekstra kredi yok.",
      ],
      credits: null,
      costPrefix: "",
    };
  }

  return {
    title: "Ek fotoğraf",
    subtitle: "Onaylarsanız galeriye olduğu gibi eklenir.",
    bullets: ["Katalog dönüşümü uygulanmaz."],
    credits: null,
    costPrefix: "",
  };
}

/** Credits for the model package (1 shot / 1 credit, including Lila). */
export function describeModelPackageCredits(_modelId?: string | null): number {
  return TR_AI_CATALOG_CREDITS.modelPackage;
}

/** How many lifestyle shots this model run produces. */
export function describeModelPackageShots(_modelId?: string | null): number {
  return TR_AI_CATALOG_CREDITS.modelPackageShots;
}

/** @deprecated Use describeModelPackageCredits */
export function describeEnhanceCredits(_modelShots?: number): number {
  return describeModelPackageCredits();
}
