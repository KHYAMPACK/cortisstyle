/** Draft payload mirrors lookbook-studio workspace store (export-compatible). */

export interface StudioLookParameters {
  lookTitle: string;
  modelName: string;
  moodImageUrl: string | null;
  homepageOrder: "prepend" | "append";
  vibe: string;
  investmentRetail: number;
  investmentWithGuide: number;
  versatility: number;
  outfitId: string;
}

export interface StudioNodeDraft {
  id: string;
  name: string;
  category: string;
  brand: string;
  shopUrl: string;
  estPriceRange: string;
  budgetAlternativeUrl: string;
  displayModel?: string;
  worldX: number;
  worldY: number;
}

export interface StudioArtboardItemDraft {
  id: string;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  widthPx: number;
  zIndex: number;
}

export interface StudioDraftPayload {
  version: 1;
  lookId: string;
  lookParams: StudioLookParameters;
  studioNodes: StudioNodeDraft[];
  artboardItems: StudioArtboardItemDraft[];
}

export interface StudioDraftRecord {
  id: string;
  userId: string;
  lookId: string;
  title: string | null;
  payload: StudioDraftPayload;
  createdAt: string;
  updatedAt: string;
}

export interface StudioDraftSummary {
  id: string;
  lookId: string;
  title: string | null;
  updatedAt: string;
}

const LOOK_ID_PATTERN = /^look-[a-z0-9-]+$/;

export function isValidLookId(value: string): boolean {
  return LOOK_ID_PATTERN.test(value);
}

export function normalizeDraftPayload(raw: unknown): StudioDraftPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Partial<StudioDraftPayload>;

  if (
    record.version !== 1 ||
    typeof record.lookId !== "string" ||
    !isValidLookId(record.lookId) ||
    !record.lookParams ||
    typeof record.lookParams !== "object" ||
    !Array.isArray(record.studioNodes) ||
    !Array.isArray(record.artboardItems)
  ) {
    return null;
  }

  return record as StudioDraftPayload;
}
