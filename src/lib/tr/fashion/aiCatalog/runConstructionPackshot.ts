import {
  constructionChipsEqual,
  constructionChipsForFamily,
  type ElbiseConstructionChips,
} from "@/lib/tr/fashion/aiCatalog/elbiseConstructionLock";
import { mergeElbiseRestyleFeatures } from "@/lib/tr/fashion/aiCatalog/elbiseRestyle";
import { applyConstructionListingTitle } from "@/lib/tr/fashion/aiCatalog/listingDraft";
import { buildElbisePackshotPrompt } from "@/lib/tr/fashion/aiCatalog/packshotPrompt";
import {
  runAiJobImmediately,
  type ScheduleAiJob,
} from "@/lib/tr/aiCatalog/ownerAiJobQueue";
import { resolveDressFeatureValue, withDefaultSleeves } from "@/lib/tr/catalog/dressFeatures";
import {
  constructionCatalogFamily,
  type ConstructionCatalogFamily,
} from "@/lib/tr/catalog/garmentUploadTypes";
import {
  requestOwnerPackshot,
  requestOwnerPackshotPrepare,
  type OwnerListingDraft,
} from "@/lib/tr/panel/ownerClient";
import type { TrProductFeatures } from "@/types/tr-marketplace";

export interface ConstructionPackshotChips {
  neckline: string;
  sleeves: string;
  fit: string;
  length: string;
  decollete: string;
  rise: string;
  hem: string;
}

export function proposedConstructionChipsFromDraft(
  draft: OwnerListingDraft | null,
  features?: TrProductFeatures | null,
  family?: ConstructionCatalogFamily | null,
  detailImageUrl?: string | null,
): ElbiseConstructionChips {
  const inferred =
    family ??
    constructionCatalogFamily(undefined, draft?.category ?? null);
  return constructionChipsForFamily(
    withDefaultSleeves({
      neckline:
        resolveDressFeatureValue(
          "neckline",
          draft?.features?.neckline ?? features?.neckline,
        ) || null,
      sleeves:
        resolveDressFeatureValue(
          "sleeves",
          draft?.features?.sleeves ?? features?.sleeves,
        ) || null,
      length:
        resolveDressFeatureValue(
          "length",
          draft?.features?.length ?? features?.length,
        ) || null,
      decollete:
        resolveDressFeatureValue(
          "decollete",
          draft?.features?.decollete ?? features?.decollete,
        ) || null,
      fit:
        resolveDressFeatureValue(
          "fit",
          draft?.features?.fit ?? features?.fit,
        ) || null,
      rise:
        resolveDressFeatureValue(
          "rise",
          draft?.features?.rise ?? features?.rise,
        ) || null,
      hem:
        resolveDressFeatureValue(
          "hem",
          draft?.features?.neckHem ?? features?.neckHem,
        ) || null,
    }),
    inferred,
    detailImageUrl ?? "",
  );
}

export async function runConstructionPackshot(input: {
  boutiqueId: string;
  frontUrl: string;
  backUrl: string;
  detailUrl?: string;
  family: ConstructionCatalogFamily;
  chips: ConstructionPackshotChips;
  proposed: ElbiseConstructionChips;
  preparedPrompt?: string;
  listingDraft: OwnerListingDraft | null;
  title?: string;
  category?: string | null;
  scheduleAiJob?: ScheduleAiJob;
}): Promise<{ packshotUrl: string; draft: OwnerListingDraft }> {
  const schedule = input.scheduleAiJob ?? runAiJobImmediately;
  const chips: ElbiseConstructionChips = constructionChipsForFamily(
    input.chips,
    input.family,
    input.detailUrl || "",
  );
  const changed = !constructionChipsEqual(chips, input.proposed);
  let draft: OwnerListingDraft = input.listingDraft
    ? {
        ...input.listingDraft,
        features: mergeElbiseRestyleFeatures(
          input.listingDraft.features,
          input.chips,
          input.family,
        ),
      }
    : {
        title: input.title?.trim() || "",
        description: "",
        features: mergeElbiseRestyleFeatures(null, input.chips, input.family),
        category: input.category,
      };
  draft = applyConstructionListingTitle(draft, input.family);

  if (changed) {
    try {
      const rewritten = await requestOwnerPackshotPrepare({
        boutiqueId: input.boutiqueId,
        sourceImageUrl: input.frontUrl,
        backImageUrl: input.backUrl,
        detailImageUrl: input.detailUrl || undefined,
        title: draft.title || input.title,
        category:
          input.family === "elbise"
            ? "elbise"
            : draft.category || input.category,
        view: "front",
        uploadType: input.family,
        existingTitle: draft.title || input.title,
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
                input.family,
              ),
              ...(ornament ? { ornament } : {}),
            },
          },
          input.family,
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
    input.family,
    input.detailUrl || "",
  );

  const pack = await schedule(() =>
    requestOwnerPackshot({
      boutiqueId: input.boutiqueId,
      sourceImageUrl: input.frontUrl,
      title: draft.title || input.title,
      category:
        input.family === "elbise"
          ? "elbise"
          : draft.category || input.category,
      view: "front",
      numImages: 1,
      prompt,
      listingDraft: draft.title.trim() ? draft : null,
      uploadType: input.family,
    }),
  );

  const packshotUrl = pack.imageUrls[0]?.trim() || "";
  if (pack.status !== "succeeded" || !packshotUrl) {
    throw new Error(pack.error?.trim() || "Ön packshot oluşturulamadı.");
  }

  return { packshotUrl, draft };
}
