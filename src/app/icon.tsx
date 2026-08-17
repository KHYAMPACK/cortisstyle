import { renderHostFavicon } from "@/lib/tr/seo/renderHostFavicon";

export const dynamic = "force-dynamic";
export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default async function Icon() {
  return renderHostFavicon(96);
}
