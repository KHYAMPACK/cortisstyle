import { redirect } from "next/navigation";
import { getNotifyDeployPath, isAuthGateEnabled } from "@/lib/launchGates";
import { isWardrobeGateEnabled } from "@/lib/wardrobeGate";

/** Legacy / bookmarked URL — route to the right gate or full app. */
export default function OnboardingPage() {
  if (!isWardrobeGateEnabled()) {
    redirect("/wardrobe");
  }

  if (isAuthGateEnabled()) {
    redirect(getNotifyDeployPath());
  }

  redirect("/");
}
