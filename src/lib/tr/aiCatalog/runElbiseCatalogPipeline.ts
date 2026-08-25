import {
  constructionChipsEqual,
  constructionChipsForFamily,
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
import { buildElbisePackshotPrompt } from "@/lib/tr/aiCatalog/packshotPrompt";
import {
  altGiyimUsesPaca,
  constructionCatalogFamily,
  parseConstructionShopCategory,
  type ConstructionCatalogFamily,
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
  family?: ConstructionCatalogFamily | null,
  detailImageUrl?: string | null,
): ElbiseConstructionChips {
  return constructionChipsForFamily(
    withDefaultSleeves({
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
    }),
    family,
    detailImageUrl ?? "",
  );
}

function restyleListingFields(input: {
  product: Pick<TrProduct, "title" | "description" | "features" | "category">;
  draft: OwnerListingDraft;
  chips: ElbiseConfirmedChips;
  family: ConstructionCatalogFamily;
}): {
  title: string;
  description: string | null;
  features: TrProduct["features"];
  category: string | null;
} {
  const existing = input.product.features ?? {};
  const features = mergeElbiseRestyleFeatures(
    {
      ...(input.draft.features ?? existing),
      ...(existing.aiModelId ? { aiModelId: existing.aiModelId } : {}),
      ...(existing.lifestyleModelIds
        ? { lifestyleModelIds: existing.lifestyleModelIds }
        : {}),
    },
    input.chips,
    input.family,
  );
  const titled = applyConstructionListingTitle(
    {
      title: input.draft.title || input.product.title,
      description: input.draft.description,
      features,
      category: input.draft.category ?? input.product.category,
    },
    input.family,
  );
  const category =
    parseConstructionShopCategory(titled.category, input.family) ??
    parseConstructionShopCategory(input.product.category, input.family) ??
    (input.family === "elbise" ? "elbise" : input.product.category);
  return {
    title: titled.title.trim() || input.product.title,
    description:
      titled.description?.trim() || input.product.description || null,
    features,
    category,
  };
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
      proposed: proposedFromDraft(
        input.product,
        prepared.listingDraft,
        family,
        detailUrl,
      ),
      frontUrl,
      backUrl,
      detailUrl,
    };
  } catch {
    return {
      prompt: "",
      listingDraft: null,
      proposed: proposedFromDraft(input.product, null, family, detailUrl),
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

  const chips: ElbiseConstructionChips = constructionChipsForFamily(
    {
      neckline,
      sleeves,
      fit,
      length,
      decollete,
      rise,
      hem,
    },
    family,
    input.prepared.detailUrl || "",
  );
  const confirmed: ElbiseConfirmedChips = {
    neckline: chips.neckline ?? "",
    sleeves: chips.sleeves ?? "",
    fit: chips.fit ?? "",
    length: chips.length ?? "",
    decollete: chips.decollete ?? "",
    rise: chips.rise ?? "",
    hem: chips.hem ?? "",
  };
  const changed = !constructionChipsEqual(chips, input.prepared.proposed);
  let draft: OwnerListingDraft | null = input.prepared.listingDraft
    ? {
        ...input.prepared.listingDraft,
        features: mergeElbiseRestyleFeatures(
          input.prepared.listingDraft.features,
          confirmed,
          family,
        ),
      }
    : {
        title: input.product.title,
        description: input.product.description ?? "",
        features: mergeElbiseRestyleFeatures(
          input.product.features,
          confirmed,
          family,
        ),
      };
  draft = applyConstructionListingTitle(draft, family);

  if (changed) {
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
      } else if (rewritten.listingDraft?.promptFront?.trim()) {
        draft = {
          ...draft,
          promptFront: rewritten.listingDraft.promptFront,
        };
      }
    } catch {
      // Keep identify promptFront; chip lock is still stitched below.
    }
  }

  const prompt = buildElbisePackshotPrompt(
    draft.promptFront,
    chips,
    family,
    input.prepared.detailUrl || "",
  );

  const listing = restyleListingFields({
    product: input.product,
    draft,
    chips: confirmed,
    family,
  });

  input.onProgress?.("packshot", "Ön packshot üretiliyor…");
  const pack = await schedule(
    () =>
      requestOwnerPackshot({
        boutiqueId: input.boutiqueId,
        sourceImageUrl: input.prepared.frontUrl,
        productId: input.product.id,
        title: listing.title,
        category: listing.category,
        view: "front",
        numImages: 1,
        prompt,
        listingDraft: draft.title.trim() ? draft : null,
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

  await updateOwnerProduct(input.product.id, {
    title: listing.title,
    description: listing.description,
    images: slotted.images,
    marketplaceImages: slotted.marketplaceImages,
    features: listing.features,
    ...(listing.category ? { category: listing.category } : {}),
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
        title: listing.title,
        category: listing.category,
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
    title: listing.title,
    description: listing.description,
    images: slotted.images,
    marketplaceImages: slotted.marketplaceImages,
    lifestyleImages: lifestyle,
    features: featuresWithLifestyleModels(
      listing.features,
      input.modelId,
      lifestyle.length,
    ),
    ...(listing.category ? { category: listing.category } : {}),
  });
}
