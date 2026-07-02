import { createElement } from "react";

/** Awin publisher signup — "Awin" must appear in page source for ownership check. */
export function AwinSiteVerificationMeta() {
  return createElement("meta", {
    name: "awin-verification",
    content: "Awin",
  });
}
