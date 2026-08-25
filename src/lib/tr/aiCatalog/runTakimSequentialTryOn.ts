import { NATURAL_TRYON_PROMPT, NATURAL_TRYON_PROMPT_BACK } from "@/lib/tr/aiModel/prompts";
import { getElbiseTryOnPlates } from "@/lib/tr/aiModel/registry";
import type { ConstructionCatalogFamily } from "@/lib/tr/catalog/garmentUploadTypes";
import {
  orderTakimItemsForTryOn,
  takimItemPackshotUrl,
  takimTryOnPrompt,
  type TakimGateChips,
} from "@/lib/tr/catalog/takimUpload";
import { requestOwnerAiModelGenerate } from "@/lib/tr/ownerClient";
import type { ScheduleAiJob } from "@/lib/tr/aiCatalog/ownerAiJobQueue";
import { runAiJobImmediately } from "@/lib/tr/aiCatalog/ownerAiJobQueue";

export type TakimTryOnProgress = {
  kind: "front" | "back";
  shotIndex: number;
  shotCount: number;
  garmentIndex: number;
  garmentCount: number;
  status: "queued" | "running";
  label: string;
};

function poseLabel(
  kind: "front" | "back",
  garmentIndex: number,
  garmentCount: number,
  status: "queued" | "running",
): string {
  const pose = kind === "back" ? "Sırt karesi" : "Ön kare";
  const piece =
    garmentCount > 1
      ? ` · parça ${garmentIndex + 1}/${garmentCount}`
      : "";
  if (status === "queued") return `${pose}${piece} sırada…`;
  return garmentIndex === 0
    ? `${pose}${piece} giydiriliyor…`
    : `${pose}${piece} ekleniyor…`;
}

export async function runTakimSequentialTryOn(input: {
  boutiqueId: string;
  modelId: string;
  title: string;
  items: Array<{
    family: ConstructionCatalogFamily | null;
    gateChips?: TakimGateChips | null;
    images: string[];
    marketplaceImages: string[];
  }>;
  scheduleAiJob?: ScheduleAiJob;
  onProgress?: (event: TakimTryOnProgress) => void;
  onShotReady?: (shotIndex: number, url: string) => void;
}): Promise<string[]> {
  const plates = getElbiseTryOnPlates(input.modelId);
  if (!plates) {
    throw new Error("Bu model için stüdyo poz plakaları yok.");
  }
  const ordered = orderTakimItemsForTryOn(
    input.items.map((item) => ({
      family: item.family,
      packshot: takimItemPackshotUrl(item),
      backManken: item.images[1]?.trim() || "",
      chips: item.gateChips ?? null,
    })),
  );
  if (ordered.some((item) => !item.packshot)) {
    throw new Error("Önce her parçanın packshot’unu üretin.");
  }

  const schedule = input.scheduleAiJob ?? runAiJobImmediately;
  const shotCount = plates.back ? 2 : 1;
  const garmentCount = ordered.length;

  async function pose(kind: "front" | "back"): Promise<string> {
    const plate =
      kind === "back" ? plates!.back?.trim() || "" : plates!.threeQuarter;
    if (!plate) {
      throw new Error("Sırt poz plakası yok.");
    }
    const poseId =
      kind === "back" ? "standing-back" : "standing-three-quarter";
    let modelRef = plate;
    let lastUrl = "";
    for (let index = 0; index < ordered.length; index += 1) {
      const item = ordered[index]!;
      const garmentUrl = kind === "back" ? item.backManken : item.packshot;
      if (!garmentUrl) {
        throw new Error(
          kind === "back"
            ? "Sırt karesi için her parçanın arka manken fotoğrafı gerekli."
            : "Packshot eksik.",
        );
      }
      const prompt = [
        kind === "back" ? NATURAL_TRYON_PROMPT_BACK : NATURAL_TRYON_PROMPT,
        takimTryOnPrompt({
          chips: item.chips,
          family: item.family,
          kind,
          keepPreviousGarment: index > 0,
        }),
      ]
        .filter(Boolean)
        .join(" ");
      const shotIndex = kind === "back" ? 1 : 0;
      input.onProgress?.({
        kind,
        shotIndex,
        shotCount,
        garmentIndex: index,
        garmentCount,
        status: "queued",
        label: poseLabel(kind, index, garmentCount, "queued"),
      });
      const result = await schedule(
        () =>
          requestOwnerAiModelGenerate({
            boutiqueId: input.boutiqueId,
            cutoutImageUrl: garmentUrl,
            title: input.title,
            category: "takim",
            modelId: input.modelId,
            shots: [
              {
                pose: poseId,
                cutoutImageUrl: garmentUrl,
                modelReferenceUrl: modelRef,
                prompt,
              },
            ],
          }),
        {
          onStart: () =>
            input.onProgress?.({
              kind,
              shotIndex,
              shotCount,
              garmentIndex: index,
              garmentCount,
              status: "running",
              label: poseLabel(kind, index, garmentCount, "running"),
            }),
        },
      );
      const url =
        result.imageUrls?.[0]?.trim() || result.imageUrl?.trim() || "";
      if (result.status !== "succeeded" || !url) {
        throw new Error(result.error ?? "Takım model karesi üretilemedi.");
      }
      lastUrl = url;
      modelRef = url;
    }
    return lastUrl;
  }

  const urls = [await pose("front")];
  input.onShotReady?.(0, urls[0]!);
  if (plates.back) {
    urls.push(await pose("back"));
    input.onShotReady?.(1, urls[1]!);
  }
  return urls;
}
