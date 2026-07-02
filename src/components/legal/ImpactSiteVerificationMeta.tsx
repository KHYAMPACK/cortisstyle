import { createElement } from "react";

/** Impact/CJ site verification — must read env at request time on Vercel. */
export async function ImpactSiteVerificationMeta() {
  const token = process.env.IMPACT_SITE_VERIFICATION?.trim();
  if (!token) return null;

  return createElement("meta", {
    name: "impact-site-verification",
    value: token,
    content: token,
  } as Record<string, string>);
}
