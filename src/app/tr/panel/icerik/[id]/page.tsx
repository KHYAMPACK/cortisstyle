import { redirect } from "next/navigation";
import { trPanelContentPath } from "@/lib/tr/paths";

export const metadata = {
  robots: { index: false, follow: false },
};

/** Pack detail is gated until İçerik launches — send to coming-soon hub. */
export default function Page() {
  redirect(trPanelContentPath());
}
