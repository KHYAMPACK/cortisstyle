import { permanentRedirect } from "next/navigation";
import { trCartPath } from "@/lib/tr/paths";

/** Legacy English path — redirects to /tr/sepet. */
export default function LegacyTrCartPage() {
  permanentRedirect(trCartPath());
}
