/**
 * Owner-facing Cortisstyle credit pricing.
 *
 * Math: product photos (2) + model package front+back (2) = 4 credits → 1 kredi = ₺5.
 * USD shown for soft perception (~47.5 ₺/$).
 */

export const TR_AI_CATALOG_CREDITS = {
  productPackage: 2,
  modelShotEach: 1,
  /** Always front + back when model shots are requested */
  modelPackageShots: 2,
  /** List price per credit */
  priceTryPerCredit: 5,
  /** Approx TRY per USD for display only */
  tryPerUsd: 47.5,
} as const;

export function creditsToTry(credits: number): number {
  return credits * TR_AI_CATALOG_CREDITS.priceTryPerCredit;
}

export function creditsToUsd(credits: number): number {
  return creditsToTry(credits) / TR_AI_CATALOG_CREDITS.tryPerUsd;
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

const modelPackageCredits =
  TR_AI_CATALOG_CREDITS.modelPackageShots *
  TR_AI_CATALOG_CREDITS.modelShotEach;

const exampleFullCredits =
  TR_AI_CATALOG_CREDITS.productPackage + modelPackageCredits;

export const TR_AI_CREDITS_INFO_LINES = [
  `Ürün katalog paketi (ön + arka): ${TR_AI_CATALOG_CREDITS.productPackage} kredi → ${formatCreditPriceBoth(TR_AI_CATALOG_CREDITS.productPackage)}`,
  `Model fotoğrafları (ön + arka, isteğe bağlı): ${modelPackageCredits} kredi → ${formatCreditPriceBoth(modelPackageCredits)}`,
  `Örnek: katalog + model = ${exampleFullCredits} kredi → ${formatCreditPriceBoth(exampleFullCredits)}`,
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
        "Sonuç: temiz, vitrin tipi ürün görseli.",
      ],
      credits: TR_AI_CATALOG_CREDITS.productPackage,
      costPrefix: "Bu işlem",
    };
  }

  if (slotIndex === 1) {
    return {
      title: "Arka yüz katalog görseli",
      subtitle:
        "Bu ham fotoğraf değil — onayda satışa hazır katalog görseli (packshot) oluşturulur.",
      bullets: [
        "Kaynak olarak seçtiğiniz kare kullanılır.",
        "Ön ile birlikte ürün katalog paketi tamamlanır.",
      ],
      credits: TR_AI_CATALOG_CREDITS.productPackage,
      costPrefix: "Bu işlem",
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

/** Credits for the fixed front+back model package. */
export function describeEnhanceCredits(
  modelShots: number = TR_AI_CATALOG_CREDITS.modelPackageShots,
): number {
  return Math.max(0, modelShots) * TR_AI_CATALOG_CREDITS.modelShotEach;
}

export function describeModelPackageCredits(): number {
  return describeEnhanceCredits(TR_AI_CATALOG_CREDITS.modelPackageShots);
}
