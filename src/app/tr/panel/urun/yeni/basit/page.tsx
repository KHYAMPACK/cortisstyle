import { redirect } from "next/navigation";
import { trPanelNewProductPath } from "@/lib/tr/paths";

/** Old create flow (removed in F3): products are added with the one editor now. */
export default function TrPanelOldCreateRoute() {
  redirect(trPanelNewProductPath());
}
