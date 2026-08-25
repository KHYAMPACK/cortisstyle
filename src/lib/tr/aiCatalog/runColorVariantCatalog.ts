import { buildElbisePackshotPrompt } from "@/lib/tr/aiCatalog/packshotPrompt";
import {
  runAiJobImmediately,
  type ScheduleAiJob,
} from "@/lib/tr/aiCatalog/ownerAiJobQueue";
import type { ElbiseConstructionChips } from "@/lib/tr/aiCatalog/elbiseConstructionLock";
import { hexFromTurkishColorName } from "@/lib/tr/catalog/colorSiblings";
import type { ConstructionCatalogFamily } from "@/lib/tr/catalog/garmentUploadTypes";
import { buildElbiseTryOnShots } from "@/lib/tr/aiModel/elbiseTryOn";
import {
  requestOwnerAiModelGenerate,
  requestOwnerGarmentColor,
  requestOwnerPackshot,
} from "@/lib/tr/panel/ownerClient";

export async function runColorVariantPackshot(input: {
  boutiqueId: string;
  frontUrl: string;
  backUrl: string;
  family: ConstructionCatalogFamily;
  chips: ElbiseConstructionChips;
  /** Reused primary packshot extras — not a new construction prompt. */
  promptFront?: string | null;
  title?: string;
  category?: string | null;
  scheduleAiJob?: ScheduleAiJob;
}): Promise<{ packshotUrl: string; colorName: string; colorHex: string }> {
  const schedule = input.scheduleAiJob ?? runAiJobImmediately;
  let colorName = "";
  try {
    colorName = await requestOwnerGarmentColor({
      boutiqueId: input.boutiqueId,
      sourceImageUrl: input.frontUrl,
      backImageUrl: input.backUrl,
    });
  } catch {
    colorName = "";
  }
  const colorHex = hexFromTurkishColorName(colorName);

  const prompt = buildElbisePackshotPrompt(
    input.promptFront,
    input.chips,
    input.family,
    "",
  );

  const pack = await schedule(() =>
    requestOwnerPackshot({
      boutiqueId: input.boutiqueId,
      sourceImageUrl: input.frontUrl,
      title: input.title,
      category:
        input.family === "elbise" ? "elbise" : input.category,
      view: "front",
      numImages: 1,
      prompt,
      listingDraft: null,
      uploadType: input.family,
    }),
  );

  const packshotUrl = pack.imageUrls[0]?.trim() || "";
  if (pack.status !== "succeeded" || !packshotUrl) {
    throw new Error(pack.error?.trim() || "Renk packshot oluşturulamadı.");
  }

  return { packshotUrl, colorName, colorHex };
}

export async function runColorVariantTryOn(input: {
  boutiqueId: string;
  packshotUrl: string;
  backMankenUrl: string;
  modelId: string;
  family: ConstructionCatalogFamily;
  chips: ElbiseConstructionChips;
  title?: string;
  category?: string | null;
  scheduleAiJob?: ScheduleAiJob;
}): Promise<string[]> {
  const schedule = input.scheduleAiJob ?? runAiJobImmediately;
  const planned = buildElbiseTryOnShots({
    modelId: input.modelId,
    packshotUrl: input.packshotUrl,
    backMankenUrl: input.backMankenUrl,
    detailMankenUrl: "",
    chips: input.chips,
    family: input.family,
  });
  if (planned.error || planned.shots.length === 0) {
    throw new Error(planned.error ?? "Model kareleri hazırlanamadı.");
  }
  const result = await schedule(() =>
    requestOwnerAiModelGenerate({
      boutiqueId: input.boutiqueId,
      cutoutImageUrl: planned.shots[0]!.cutoutImageUrl,
      title: input.title,
      category: input.category,
      modelId: input.modelId,
      shots: planned.shots,
    }),
  );
  const urls = (
    result.imageUrls?.length
      ? result.imageUrls
      : result.imageUrl
        ? [result.imageUrl]
        : []
  )
    .map((url) => url.trim())
    .filter(Boolean);
  if (result.status !== "succeeded" || urls.length === 0) {
    throw new Error(result.error ?? "Renk model görseli üretilemedi.");
  }
  return urls;
}
