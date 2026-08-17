import { renderHostFavicon } from "@/lib/tr/seo/renderHostFavicon";

export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return renderHostFavicon(180);
}
