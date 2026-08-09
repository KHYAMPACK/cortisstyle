import { readFile } from "node:fs/promises";
import path from "node:path";

function isLocalHostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/**
 * FASHN cannot fetch localhost. Map public studio paths (or local absolute URLs)
 * to a data URI from disk so try-on works in local dev.
 */
export async function resolveModelImageForRemoteApi(
  imageUrl: string,
): Promise<string> {
  const raw = imageUrl.trim();
  if (!raw) {
    throw new Error("Model referans URL boş.");
  }
  if (raw.startsWith("data:")) return raw;

  let publicPath: string | null = null;
  if (raw.startsWith("/tr/ai-models/")) {
    publicPath = raw.split("?")[0] ?? raw;
  } else if (isLocalHostUrl(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/tr/ai-models/")) {
        publicPath = parsed.pathname;
      }
    } catch {
      // fall through
    }
  }

  if (publicPath) {
    const filePath = path.join(process.cwd(), "public", publicPath);
    try {
      const bytes = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
      return `data:${mime};base64,${bytes.toString("base64")}`;
    } catch {
      throw new Error(
        `Yerel model referansı okunamadı (${publicPath}). npm run tr:generate-studio-models çalıştırın.`,
      );
    }
  }

  if (isLocalHostUrl(raw)) {
    throw new Error(
      "Model referansı localhost — FASHN erişemez. public/tr/ai-models dosyalarını kullanın veya TR_AI_STUDIO_*_REF_URLS ile herkese açık URL verin.",
    );
  }

  return raw;
}
