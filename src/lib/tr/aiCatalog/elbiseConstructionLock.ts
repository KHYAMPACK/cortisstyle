import {
  dressFeatureOptionId,
  resolveDressFeatureValue,
} from "@/lib/tr/catalog/dressFeatures";

export interface ElbiseConstructionChips {
  neckline?: string | null;
  sleeves?: string | null;
  length?: string | null;
  decollete?: string | null;
}

const LENGTH_EN: Record<string, string> = {
  mikro: "micro mini — hem well above mid-thigh. Do not lengthen.",
  mini: "mini length. Do not lengthen to midi or maxi.",
  "diz-ustu": "above-the-knee length. Do not shorten to micro or lengthen to midi.",
  "diz-boyu": "knee-length. Do not shorten to mini or lengthen to midi/maxi.",
  midi: "midi length, about mid-calf. Do not shorten or lengthen to maxi.",
  maxi: "maxi / floor length. Do not shorten.",
  asimetrik: "asymmetric hem as photographed. Do not even the hem.",
};

const DECOLLETE_EN: Record<string, string> = {
  yok: "no decollete cutout.",
  hafif: "slight decollete only, as photographed.",
  gogus: "chest decollete as photographed. Do not deepen.",
  sirt: "back decollete as photographed. Front is not a plunging cut.",
  omuz: "shoulder decollete as photographed. Do not add sleeves to cover it.",
  "derin-v": "deep V decollete as photographed. Do not add extra cutouts.",
};

const SLEEVES_EN: Record<string, string> = {
  kolsuz:
    "Sleeves: sleeveless. No sleeves, no invented arm flaps or hanging shoulder fabric. Do not add sleeves.",
  kisa:
    "Sleeves: short sleeves as photographed. Keep cuffs, buttons, and slits. Do not remove the sleeves or lengthen them.",
  "uc-ceyrek":
    "Sleeves: three-quarter length as photographed. Do not shorten to short or lengthen to long.",
  uzun:
    "Sleeves: long sleeves as photographed. Do not crop or shorten.",
};

function necklineLock(id: string | null, label: string): string {
  if (id === "straplez") {
    return `Neckline is strapless (${label}). No straps, no off-shoulder drape.`;
  }
  if (id === "ince-aski") {
    return `Neckline is thin spaghetti straps (${label}). Thin straps only. No extra arm flaps, no off-shoulder drape.`;
  }
  if (id === "halter") {
    return `Neckline is halter (${label}). Halter straps only. No extra arm flaps, no off-shoulder drape.`;
  }
  if (id === "tek-omuz") {
    return `Neckline is one-shoulder (${label}). One-shoulder only. No strap on the bare shoulder. No invented off-shoulder drape.`;
  }
  return `Neckline is ${label}. Do not add straps unless they are clearly this neckline. Do not invent off-shoulder drape.`;
}

function sleevesLock(id: string | null, label: string): string {
  return SLEEVES_EN[id ?? ""] ?? `Sleeves: ${label} as photographed. Do not invent or remove sleeves.`;
}

export function hasElbiseLockedConstruction(
  chips: ElbiseConstructionChips | null | undefined,
): boolean {
  return Boolean(
    resolveDressFeatureValue("neckline", chips?.neckline) &&
      resolveDressFeatureValue("length", chips?.length) &&
      resolveDressFeatureValue("sleeves", chips?.sleeves),
  );
}

/** English FASHN lock from owner-confirmed boy / yaka / kol / detay. */
export function buildElbiseConstructionLock(
  chips: ElbiseConstructionChips | null | undefined,
): string {
  const neckline = resolveDressFeatureValue("neckline", chips?.neckline);
  const sleeves = resolveDressFeatureValue("sleeves", chips?.sleeves);
  const length = resolveDressFeatureValue("length", chips?.length);
  const decollete = resolveDressFeatureValue("decollete", chips?.decollete);
  const parts: string[] = [];

  if (neckline) {
    parts.push(
      necklineLock(dressFeatureOptionId("neckline", neckline), neckline),
    );
  }
  if (sleeves) {
    parts.push(sleevesLock(dressFeatureOptionId("sleeves", sleeves), sleeves));
  }
  if (length) {
    const id = dressFeatureOptionId("length", length);
    parts.push(
      `Exact length: ${LENGTH_EN[id ?? ""] ?? `${length}. Do not change the hem length.`}`,
    );
  }
  if (decollete) {
    const id = dressFeatureOptionId("decollete", decollete);
    parts.push(
      `Detail/decollete: ${DECOLLETE_EN[id ?? ""] ?? decollete}`,
    );
  }

  if (parts.length === 0) return "";
  return `Construction lock: ${parts.join(" ")}`;
}

/**
 * Try-on lock: length first (hem must stay visible), then yaka, kol, detay.
 */
export function buildElbiseTryOnConstructionLock(
  chips: ElbiseConstructionChips | null | undefined,
): string {
  const neckline = resolveDressFeatureValue("neckline", chips?.neckline);
  const sleeves = resolveDressFeatureValue("sleeves", chips?.sleeves);
  const length = resolveDressFeatureValue("length", chips?.length);
  const decollete = resolveDressFeatureValue("decollete", chips?.decollete);
  const parts: string[] = [];

  if (length) {
    const id = dressFeatureOptionId("length", length);
    parts.push(
      `LENGTH IS THE MOST IMPORTANT FACT. Full body from head to toe; the hem must be fully visible. Exact length: ${LENGTH_EN[id ?? ""] ?? `${length}. Do not change the hem length.`}`,
    );
  } else {
    parts.push(
      "LENGTH IS THE MOST IMPORTANT FACT. Full body from head to toe; keep the exact hem length from the product image.",
    );
  }
  if (neckline) {
    parts.push(
      `Yaka/neckline is also critical. ${necklineLock(dressFeatureOptionId("neckline", neckline), neckline)}`,
    );
  }
  if (sleeves) {
    parts.push(
      `Kol/sleeves are also critical. ${sleevesLock(dressFeatureOptionId("sleeves", sleeves), sleeves)}`,
    );
  }
  const decolleteId = decollete
    ? dressFeatureOptionId("decollete", decollete)
    : null;
  if (decollete && decolleteId && decolleteId !== "yok") {
    parts.push(
      `Detail/decollete is important: ${DECOLLETE_EN[decolleteId] ?? decollete}`,
    );
  }

  return `Construction lock: ${parts.join(" ")}`;
}

export function constructionChipsEqual(
  a: ElbiseConstructionChips,
  b: ElbiseConstructionChips,
): boolean {
  return (
    resolveDressFeatureValue("neckline", a.neckline) ===
      resolveDressFeatureValue("neckline", b.neckline) &&
    resolveDressFeatureValue("sleeves", a.sleeves) ===
      resolveDressFeatureValue("sleeves", b.sleeves) &&
    resolveDressFeatureValue("length", a.length) ===
      resolveDressFeatureValue("length", b.length) &&
    resolveDressFeatureValue("decollete", a.decollete) ===
      resolveDressFeatureValue("decollete", b.decollete)
  );
}
