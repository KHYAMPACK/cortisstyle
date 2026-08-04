import { redirect } from "next/navigation";
import { trPanelCampaignsPath } from "@/lib/tr/paths";

export default function Page() {
  redirect(trPanelCampaignsPath());
}
