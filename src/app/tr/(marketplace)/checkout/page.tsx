import { permanentRedirect } from "next/navigation";
import { trCheckoutPath } from "@/lib/tr/paths";

/** Legacy English path — redirects to /tr/odeme. */
export default function LegacyTrCheckoutPage() {
  permanentRedirect(trCheckoutPath());
}
