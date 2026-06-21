/** Official Cortis Style social routing — single source of truth. */
export const CORTIS_SOCIAL = {
  instagram: {
    href: "https://instagram.com/cortisstyl",
    label: "[ INSTAGRAM ]",
  },
  tiktok: {
    href: "https://tiktok.com/@cortisstyl",
    label: "[ TIKTOK ]",
  },
} as const;

export const CORTIS_SOCIAL_LINKS = [
  CORTIS_SOCIAL.instagram,
  CORTIS_SOCIAL.tiktok,
] as const;
