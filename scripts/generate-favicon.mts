import sharp from "sharp";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const INPUT = path.join(ROOT, "public/brand/cortisstyle-logo-light.png");
const APP_ICON = path.join(ROOT, "src/app/icon.png");
const APPLE_ICON = path.join(ROOT, "src/app/apple-icon.png");

async function generateFavicon() {
  await sharp(INPUT)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(APP_ICON);

  await sharp(INPUT)
    .resize(180, 180, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(APPLE_ICON);

  console.log("Generated favicon assets:");
  console.log(`  ${path.relative(ROOT, APP_ICON)}`);
  console.log(`  ${path.relative(ROOT, APPLE_ICON)}`);
}

await generateFavicon();
