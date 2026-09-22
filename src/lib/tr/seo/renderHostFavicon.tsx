import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { BOUTIQUE_SLUG_HEADER } from "@/lib/introLoader";
import { resolveHostFaviconPublicPath } from "@/lib/tr/seo/hostFavicon";

async function boutiqueSlugFromRequest(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get(BOUTIQUE_SLUG_HEADER)?.trim() || null;
}

export async function renderHostFavicon(px: number): Promise<ImageResponse> {
  const slug = await boutiqueSlugFromRequest();
  const publicPath = resolveHostFaviconPublicPath(slug);
  const file = await readFile(
    join(process.cwd(), "public", publicPath.replace(/^\//, "")),
  );
  const src = `data:image/png;base64,${file.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={src} width={px} height={px} />
      </div>
    ),
    { width: px, height: px },
  );
}
