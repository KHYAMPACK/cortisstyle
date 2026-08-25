import {
  buildElbiseConstructionLock,
  constructionChipsEqual,
  type ElbiseConstructionChips,
} from "@/lib/tr/aiCatalog/elbiseConstructionLock";
import {
  applyElbisePipelineImages,
  elbiseSourceUrls,
  featuresWithLifestyleModels,
  mergeElbiseRestyleFeatures,
} from "@/lib/tr/aiCatalog/elbiseRestyle";
import { buildElbiseTryOnShots } from "@/lib/tr/aiModel/elbiseTryOn";
import { resolveDressFeatureValue, withDefaultSleeves } from "@/lib/tr/catalog/dressFeatures";
import { applyConstructionListingTitle } from "@/lib/tr/aiCatalog/listingDraft";
import {
  altGiyimUsesPaca,
  constructionCatalogFamily,
  parseConstructionShopCategory,
} from "@/lib/tr/catalog/garmentUploadTypes";
import {
  runAiJobImmediately,
  type ScheduleAiJob,
} from "@/lib/tr/aiCatalog/ownerAiJobQueue";
import {
  requestOwnerAiModelGenerate,
  requestOwnerPackshot,
  requestOwnerPackshotPrepare,
  updateOwnerProduct,
  type OwnerListingDraft,
} from "@/lib/tr/ownerClient";
import type { TrProduct } from "@/types/tr-marketplace";

export type ElbiseRestyleProgressPhase = "prepare" | "packshot" | "tryon";

export interface ElbiseCatalogPrepareResult {
  prompt: string;
  listingDraft: OwnerListingDraft | null;
  proposed: ElbiseConstructionChips;
  frontUrl: string;
  backUrl: string;
  detailUrl: string;
}

export interface ElbiseConfirmedChips {
  neckline: string;
  sleeves: string;
  fit: string;
  length: string;
  decollete: string;
  rise: string;
  hem: string;
}

function proposedFromDraft(
  product: Pick<TrProduct, "features">,
  draft: OwnerListingDraft | null,
): ElbiseConstructionChips {
  return withDefaultSleeves({
    neckline:
      resolveDressFeatureValue(
        "neckline",
        draft?.features?.neckline ?? product.features?.neckline,
      ) || null,
    sleeves:
      resolveDressFeatureValue(
        "sleeves",
        draft?.features?.sleeves ?? product.features?.sleeves,
      ) || null,
    length:
      resolveDressFeatureValue(
        "length",
        draft?.features?.length ?? product.features?.length,
      ) || null,
    decollete:
      resolveDressFeatureValue(
        "decollete",
        draft?.features?.decollete ?? product.features?.decollete,
      ) || null,
    fit:
      resolveDressFeatureValue(
        "fit",
        draft?.features?.fit ?? product.features?.fit,
      ) || null,
    rise:
      resolveDressFeatureValue(
        "rise",
        draft?.features?.rise ?? product.features?.rise,
      ) || null,
    hem:
      resolveDressFeatureValue(
        "hem",
        draft?.features?.neckHem ?? product.features?.neckHem,
      ) || null,
  });
}

export async function prepareElbiseCatalogRestyle(input: {
  boutiqueId: string;
  product: Pick<
    TrProduct,
    "title" | "description" | "images" | "features" | "category"
  >;
}): Promise<ElbiseCatalogPrepareResult> {
  const { frontUrl, backUrl, detailUrl } = elbiseSourceUrls(input.product);
  if (!frontUrl || !backUrl) {
    throw new Error("Ön ve arka manken fotoğrafı gerekli.");
  }

  const family =
    constructionCatalogFamily(undefined, input.product.category) ?? "elbise";

  try {
    const prepared = await requestOwnerPackshotPrepare({
      boutiqueId: input.boutiqueId,
      sourceImageUrl: frontUrl,
      backImageUrl: backUrl,
      detailImageUrl: detailUrl || undefined,
      title: input.product.title,
      category: family === "elbise" ? "elbise" : input.product.category,
      view: "front",
      uploadType: family,
      existingTitle: input.product.title,
      existingDescription: input.product.description,
    });

    return {
      prompt: prepared.prompt,
      listingDraft: prepared.listingDraft,
      proposed: proposedFromDraft(input.product, prepared.listingDraft),
      frontUrl,
      backUrl,
      detailUrl,
    };
  } catch {
    return {
      prompt: "",
      listingDraft: null,
      proposed: proposedFromDraft(input.product, null),
      frontUrl,
      backUrl,
      detailUrl,
    };
  }
}

export async function commitElbiseCatalogRestyle(input: {
  boutiqueId: string;
  product: TrProduct;
  modelId: string;
  chips: ElbiseConfirmedChips;
  prepared: ElbiseCatalogPrepareResult;
  scheduleAiJob?: ScheduleAiJob;
  onProgress?: (phase: ElbiseRestyleProgressPhase, label: string) => void;
}): Promise<TrProduct> {
  const schedule = input.scheduleAiJob ?? runAiJobImmediately;
  const family =
    constructionCatalogFamily(undefined, input.product.category) ?? "elbise";
  const neckline = input.chips.neckline.trim();
  const sleeves = input.chips.sleeves.trim();
  const fit = input.chips.fit.trim();
  const length = input.chips.length.trim();
  const decollete = input.chips.decollete.trim();
  const rise = input.chips.rise.trim();
  const hem = input.chips.hem.trim();
  if (family === "alt-giyim") {
    if (!length || !rise || !fit) {
      throw new Error("Boy, bel ve kalıp seçin.");
    }
    if (altGiyimUsesPaca(input.product.category) && !hem) {
      throw new Error("Paça seçin.");
    }
  } else if (!neckline || !sleeves || !length) {
    throw new Error("Boy, yaka ve kol seçin.");
  }
  if (family === "ust-giyim" && !fit) {
    throw new Error("Kalıp seçin.");
  }

  const chips: ElbiseConstructionChips = {
    neckline,
    sleeves,
    fit,
    length,
    decollete,
    rise,
    hem,
  };
  const changed = !constructionChipsEqual(chips, input.prepared.proposed);
  let prompt = input.prepared.prompt;
  let draft: OwnerListingDraft | null = input.prepared.listingDraft
    ? {
        ...input.prepared.listingDraft,
        features: mergeElbiseRestyleFeatures(
          input.prepared.listingDraft.features,
          input.chips,
          family,
        ),
      }
    : {
        title: input.product.title,
        description: input.product.description ?? "",
        features: mergeElbiseRestyleFeatures(input.product.features, input.chips, family),
      };
  draft = applyConstructionListingTitle(draft, family);

  if (changed || !prompt.trim()) {
    input.onProgress?.("prepare", "Prompt güncelleniyor…");
    try {
      const rewritten = await requestOwnerPackshotPrepare({
        boutiqueId: input.boutiqueId,
        sourceImageUrl: input.prepared.frontUrl,
        backImageUrl: input.prepared.backUrl,
        detailImageUrl: input.prepared.detailUrl || undefined,
        title: draft.title || input.product.title,
        category:
          family === "elbise"
            ? "elbise"
            : draft.category || input.product.category,
        view: "front",
        uploadType: family,
        existingTitle: draft.title || input.product.title,
        existingDescription: draft.description,
        lockedConstruction: chips,
      });
      prompt = rewritten.prompt;
      if (rewritten.listingDraft?.title?.trim()) {
        const ornament =
          rewritten.listingDraft.features?.ornament?.trim() ||
          draft.features?.ornament?.trim();
        draft = applyConstructionListingTitle(
          {
            ...rewritten.listingDraft,
            features: {
              ...mergeElbiseRestyleFeatures(
                rewritten.listingDraft.features,
                input.chips,
                family,
              ),
              ...(ornament ? { ornament } : {}),
            },
          },
          family,
        );
      }
    } catch {
      prompt = [prompt, buildElbiseConstructionLock(chips)]
        .filter(Boolean)
        .join(" ");
    }
  }

  if (!prompt.trim()) {
    prompt = buildElbiseConstructionLock(chips);
  }

  input.onProgress?.("packshot", "Ön packshot üretiliyor…");
  const pack = await schedule(
    () =>
      requestOwnerPackshot({
        boutiqueId: input.boutiqueId,
        sourceImageUrl: input.prepared.frontUrl,
        productId: input.product.id,
        title: draft.title || input.product.title,
        category:
          family === "elbise"
            ? "elbise"
            : draft.category || input.product.category,
        view: "front",
        numImages: 1,
        prompt,
        listingDraft: draft.title.trim() ? draft : null,
        skipPhotoroom: true,
        uploadType: family,
      }),
    { onStart: () => input.onProgress?.("packshot", "Ön packshot üretiliyor…") },
  );

  const packshotUrl = pack.imageUrls[0]?.trim() || "";
  if (pack.status !== "succeeded" || !packshotUrl) {
    throw new Error(pack.error?.trim() || "Ön packshot oluşturulamadı.");
  }

  const slotted = applyElbisePipelineImages({
    images: input.product.images,
    marketplaceImages: input.product.marketplaceImages ?? [],
    packshotUrl,
  });
  const features = mergeElbiseRestyleFeatures(
    input.product.features,
    input.chips,
    family,
  );

  const nextCategory =
    parseConstructionShopCategory(draft.category, family) ??
    parseConstructionShopCategory(input.product.category, family) ??
    (family === "elbise" ? "elbise" : input.product.category);

  await updateOwnerProduct(input.product.id, {
    images: slotted.images,
    marketplaceImages: slotted.marketplaceImages,
    features,
    ...(nextCategory ? { category: nextCategory } : {}),
  });

  const planned = buildElbiseTryOnShots({
    modelId: input.modelId,
    packshotUrl,
    backMankenUrl: input.prepared.backUrl,
    detailMankenUrl: input.prepared.detailUrl,
    chips,
    family,
  });
  if (planned.error || planned.shots.length === 0) {
    throw new Error(planned.error ?? "Model kareleri hazırlanamadı.");
  }

  input.onProgress?.("tryon", "Model kareleri üretiliyor…");
  const tryOn = await schedule(
    () =>
      requestOwnerAiModelGenerate({
        boutiqueId: input.boutiqueId,
        cutoutImageUrl: planned.shots[0]!.cutoutImageUrl,
        productId: input.product.id,
        title: draft.title || input.product.title,
        category:
          family === "elbise"
            ? "elbise"
            : draft.category || input.product.category,
        modelId: input.modelId,
        shots: planned.shots,
      }),
    { onStart: () => input.onProgress?.("tryon", "Model kareleri üretiliyor…") },
  );

  const lifestyle = (tryOn.imageUrls?.length
    ? tryOn.imageUrls
    : tryOn.imageUrl
      ? [tryOn.imageUrl]
      : []
  )
    .map((url) => url.trim())
    .filter(Boolean);

  if (tryOn.status !== "succeeded" || lifestyle.length === 0) {
    throw new Error(
      tryOn.error?.trim() ||
        "Packshot kaydedildi; model kareleri üretilemedi. Tekrar deneyin.",
    );
  }

  return updateOwnerProduct(input.product.id, {
    images: slotted.images,
    marketplaceImages: slotted.marketplaceImages,
    lifestyleImages: lifestyle,
    features: featuresWithLifestyleModels(features, input.modelId, lifestyle.length),
    ...(nextCategory ? { category: nextCategory } : {}),
  });
}
