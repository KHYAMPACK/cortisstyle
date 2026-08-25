import {
  buildElbiseTryOnConstructionLock,
  constructionChipsForFamily,
  type ElbiseConstructionChips,
} from "@/lib/tr/aiCatalog/elbiseConstructionLock";
import {
  NATURAL_TRYON_PROMPT,
  NATURAL_TRYON_PROMPT_BACK,
} from "@/lib/tr/aiModel/prompts";
import { getElbiseTryOnPlates } from "@/lib/tr/aiModel/registry";
import type {
  TrAiModelGenerateShot,
  TrAiModelPose,
} from "@/lib/tr/aiModel/types";
import {
  dressFeatureOptionId,
  resolveDressFeatureValue,
} from "@/lib/tr/catalog/dressFeatures";
import type { ConstructionCatalogFamily } from "@/lib/tr/catalog/garmentUploadTypes";

export type { ElbiseConstructionChips };

const HEM_VISIBLE =
  "Full body: the hem must be fully visible. Do not crop at the knees or thighs. Keep closed-toe black heels on both feet — never barefoot.";

const DETAIL_EXTRA =
  "Show the locked detail clearly (decollete, lace, straps, or hem finish) without cropping the hem — keep full body so exact length remains visible.";

export function hasElbiseDetay(
  chips: ElbiseConstructionChips | null | undefined,
): boolean {
  const value = resolveDressFeatureValue("decollete", chips?.decollete);
  if (!value) return false;
  return dressFeatureOptionId("decollete", value) !== "yok";
}

function wantsDetailShot(
  chips: ElbiseConstructionChips | null | undefined,
  family: ConstructionCatalogFamily | null | undefined,
  detailImageUrl?: string | null,
): boolean {
  if (!detailImageUrl?.trim()) return false;
  if (family === "alt-giyim") return true;
  return hasElbiseDetay(chips);
}

export function elbiseModelShotCount(
  chips: ElbiseConstructionChips | null | undefined,
  modelId?: string | null,
  detailImageUrl?: string | null,
  family?: ConstructionCatalogFamily | null,
): 1 | 2 | 3 {
  const detail = wantsDetailShot(chips, family, detailImageUrl);
  if (modelId?.trim()) {
    const plates = getElbiseTryOnPlates(modelId);
    if (plates && !plates.back) {
      return detail ? 2 : 1;
    }
  }
  return detail ? 3 : 2;
}

/** Owner-facing label for lifestyle slot i (matches `buildElbiseTryOnShots` order). */
export function elbiseLifestyleShotLabel(
  index: number,
  shotCount: number,
  hasBackPlate = true,
): string {
  if (shotCount <= 1) return "Model karesi";
  if (index === 0) return "Üç-çeyrek";
  if (hasBackPlate) {
    if (index === 1) return "Sırt";
    if (index === 2) return "Detay";
  } else if (index === 1) {
    return "Detay";
  }
  return `Kare ${index + 1}`;
}

export function chipsFromProductFeatures(
  features:
    | {
        neckline?: string | null;
        length?: string | null;
        decollete?: string | null;
        sleeves?: string | null;
        fit?: string | null;
        rise?: string | null;
        neckHem?: string | null;
      }
    | null
    | undefined,
  family?: ConstructionCatalogFamily | null,
): ElbiseConstructionChips {
  return constructionChipsForFamily(
    {
      neckline: features?.neckline ?? null,
      sleeves: features?.sleeves ?? null,
      fit: features?.fit ?? null,
      length: features?.length ?? null,
      decollete: features?.decollete ?? null,
      rise: features?.rise ?? null,
      hem: features?.neckHem ?? null,
    },
    family,
  );
}

function tryOnPrompt(
  chips: ElbiseConstructionChips,
  kind: "front" | "back" | "detail",
  family?: ConstructionCatalogFamily | null,
): string {
  const base =
    kind === "back" ? NATURAL_TRYON_PROMPT_BACK : NATURAL_TRYON_PROMPT;
  const lock = buildElbiseTryOnConstructionLock(chips, family);
  const extra = kind === "detail" ? DETAIL_EXTRA : HEM_VISIBLE;
  return [base, lock, extra].filter(Boolean).join(" ");
}

export interface BuildElbiseTryOnShotsInput {
  modelId: string;
  packshotUrl: string;
  backMankenUrl: string;
  detailMankenUrl?: string | null;
  chips?: ElbiseConstructionChips | null;
  family?: ConstructionCatalogFamily | null;
}

export interface BuildElbiseTryOnShotsResult {
  shots: TrAiModelGenerateShot[];
  error?: string;
}

function shot(
  pose: TrAiModelPose,
  cutoutImageUrl: string,
  modelReferenceUrl: string,
  prompt: string,
): TrAiModelGenerateShot {
  return { pose, cutoutImageUrl, modelReferenceUrl, prompt };
}

/**
 * Elbise lifestyle shots: 2 (3/4 + back) or 3 when detay chip and photo exist.
 * Garment: packshot → front; arka manken → back; detay photo → third.
 */
export function buildElbiseTryOnShots(
  input: BuildElbiseTryOnShotsInput,
): BuildElbiseTryOnShotsResult {
  const chips = input.chips ?? {};
  const plates = getElbiseTryOnPlates(input.modelId);
  if (!plates) {
    return { shots: [], error: "Bu model için elbise poz plakaları yok." };
  }

  const packshot = input.packshotUrl.trim();
  if (!packshot) {
    return {
      shots: [],
      error: "Model için ön packshot gerekli. Önce katalogu onaylayın.",
    };
  }

  const backManken = input.backMankenUrl.trim();
  const detailManken = input.detailMankenUrl?.trim() || "";
  const wantDetail = wantsDetailShot(
    chips,
    input.family,
    detailManken,
  );

  const shots: TrAiModelGenerateShot[] = [
    shot(
      "standing-three-quarter",
      packshot,
      plates.threeQuarter,
      tryOnPrompt(chips, "front", input.family),
    ),
  ];

  if (plates.back) {
    if (!backManken) {
      return {
        shots: [],
        error: "Sırt model karesi için arka manken fotoğrafı gerekli.",
      };
    }
    shots.push(
      shot(
        "standing-back",
        backManken,
        plates.back,
        tryOnPrompt(chips, "back", input.family),
      ),
    );
  }

  if (wantDetail) {
    shots.push(
      shot(
        "standing-three-quarter",
        detailManken,
        plates.threeQuarter,
        tryOnPrompt(chips, "detail", input.family),
      ),
    );
  }

  return { shots };
}
