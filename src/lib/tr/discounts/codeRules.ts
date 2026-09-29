/**
 * Rules for a `kind: 'code'` campaign's Kuponlar tab: one shared shape for a code's
 * own usage limits, and the two ways to add one — "Özel Kupon" (one typed code) or
 * "Otomatik Kod Üret" (a prefix generates several at once). Pure, no I/O; the database
 * side (uniqueness, the actual insert) is `catalog/discountCampaigns.ts`.
 */

export const CODE_LIMITS = {
  codeMax: 50,
  prefixMax: 50,
  /** How many codes "Otomatik Kod Üret" can make in one go. */
  generateMax: 500,
  usageLimitMax: 1_000_000,
} as const;

/** Only letters, digits, dash and underscore — safe to type, read aloud, and put in a URL. */
const CODE_CHARS = /^[a-z0-9_-]+$/;

/** Codes are matched case-insensitively; this is the one stored and compared form. */
export function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase();
}

export interface CodeLimitsInput {
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
}

function readOptionalPositiveInt(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > CODE_LIMITS.usageLimitMax) {
    throw new Error(`${label} geçersiz.`);
  }
  return n;
}

/** The Limitler block shared by both "add a code" modes; each toggle is independent. */
export function readCodeLimitsBody(body: Record<string, unknown>): CodeLimitsInput {
  return {
    usageLimitTotal: readOptionalPositiveInt(body.usageLimitTotal, "Toplam kullanım limiti"),
    usageLimitPerCustomer: readOptionalPositiveInt(
      body.usageLimitPerCustomer,
      "Müşteri başına kullanım limiti",
    ),
  };
}

/** "Özel Kupon": one code the owner typed. Throws a sentence for the owner when invalid. */
export function readCustomCodeBody(
  body: Record<string, unknown>,
): { code: string } & CodeLimitsInput {
  const raw = typeof body.code === "string" ? body.code : "";
  const code = normalizeCode(raw);
  if (!code) throw new Error("Kupon kodu zorunlu.");
  if (code.length > CODE_LIMITS.codeMax) {
    throw new Error(`Kupon kodu en fazla ${CODE_LIMITS.codeMax} karakter olabilir.`);
  }
  if (!CODE_CHARS.test(code)) {
    throw new Error("Kupon kodu yalnızca harf, rakam, tire ve alt çizgi içerebilir.");
  }
  return { code, ...readCodeLimitsBody(body) };
}

/** "Otomatik Kod Üret": a prefix and how many codes to make from it. */
export function readGenerateCodesBody(
  body: Record<string, unknown>,
): { prefix: string; count: number } & CodeLimitsInput {
  const rawPrefix = typeof body.prefix === "string" ? body.prefix.trim() : "";
  const prefix = normalizeCode(rawPrefix);
  if (!prefix) throw new Error("Kod ön eki zorunlu.");
  if (prefix.length > CODE_LIMITS.prefixMax) {
    throw new Error(`Kod ön eki en fazla ${CODE_LIMITS.prefixMax} karakter olabilir.`);
  }
  if (!CODE_CHARS.test(prefix)) {
    throw new Error("Kod ön eki yalnızca harf, rakam, tire ve alt çizgi içerebilir.");
  }

  const count = typeof body.count === "number" ? body.count : Number(body.count);
  if (!Number.isFinite(count) || !Number.isInteger(count) || count < 1) {
    throw new Error("Adet en az 1 olmalı.");
  }
  if (count > CODE_LIMITS.generateMax) {
    throw new Error(`En fazla ${CODE_LIMITS.generateMax} kupon üretebilirsiniz.`);
  }

  return { prefix, count, ...readCodeLimitsBody(body) };
}

const SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LENGTH = 6;

function randomSuffix(random: () => number): string {
  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) {
    suffix += SUFFIX_CHARS[Math.floor(random() * SUFFIX_CHARS.length)];
  }
  return suffix;
}

/**
 * `count` codes shaped `<prefix><6 random letters/digits>`, none of them in `existing`
 * (the codes already taken in this boutique). `random` defaults to `Math.random`; pass
 * a seeded generator in tests. Throws if it runs out of attempts, which — at 36⁶
 * possible suffixes — only happens if `existing` already covers nearly the whole space.
 */
export function generateCampaignCodes(
  prefix: string,
  count: number,
  existing: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): string[] {
  const taken = new Set(existing);
  const codes: string[] = [];
  const maxAttempts = count * 50 + 100;
  for (let attempt = 0; codes.length < count && attempt < maxAttempts; attempt += 1) {
    const candidate = `${prefix}${randomSuffix(random)}`;
    if (taken.has(candidate)) continue;
    taken.add(candidate);
    codes.push(candidate);
  }
  if (codes.length < count) {
    throw new Error("Yeterli sayıda benzersiz kupon kodu üretilemedi.");
  }
  return codes;
}
