/** Optional “how did you find us” answers at boutique signup. */

export const SIGNUP_DISCOVERY_SOURCES = [
  { id: "instagram", labelTr: "Instagram", labelEn: "Instagram" },
  { id: "internet", labelTr: "İnternet", labelEn: "Internet" },
  { id: "ai", labelTr: "Yapay zeka", labelEn: "AI" },
  { id: "word_of_mouth", labelTr: "Tavsiye", labelEn: "Word of mouth" },
] as const;

export type SignupDiscoverySourceId =
  (typeof SIGNUP_DISCOVERY_SOURCES)[number]["id"];

export function isSignupDiscoverySourceId(
  value: string,
): value is SignupDiscoverySourceId {
  return SIGNUP_DISCOVERY_SOURCES.some((source) => source.id === value);
}
