import html2canvas from "html2canvas-pro";
import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
  MOODBOARD_FOOTER_HEIGHT_PX,
} from "@/lib/lookCanvasReference";

export interface ExportLookCardOptions {
  /** Letterbox color behind transparent export areas (footer strip). */
  backgroundColor?: string;
  /** Prefer the native share sheet when available (mobile). */
  preferNativeShare?: boolean;
}

const EXPORT_TIMEOUT_MS = 45_000;
const SHARE_TIMEOUT_MS = 12_000;
const MOODBOARD_EXPORT_HEIGHT_PX =
  LOOK_CANVAS_REFERENCE_HEIGHT + MOODBOARD_FOOTER_HEIGHT_PX;

const UNSUPPORTED_COLOR_PATTERN = /(lab|oklch|oklab|lch|color)\(/i;

interface StyleSnapshot {
  element: HTMLElement;
  transform: string;
  width: string;
  height: string;
  maxWidth: string;
  minWidth: string;
  overflow: string;
  opacity: string;
  visibility: string;
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || "untitled-look";
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCanvasSafeColor(color: string, view: Window): string {
  const normalized = color.trim();
  if (
    !normalized ||
    normalized === "transparent" ||
    normalized === "rgba(0, 0, 0, 0)"
  ) {
    return normalized;
  }

  if (!UNSUPPORTED_COLOR_PATTERN.test(normalized)) {
    return normalized;
  }

  const canvas = view.document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return "#ffffff";

  try {
    context.fillStyle = "#000000";
    context.fillStyle = normalized;
    return context.fillStyle;
  } catch {
    return "#ffffff";
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const timeout = window.setTimeout(() => resolve(), 8_000);
          img.addEventListener(
            "load",
            () => {
              window.clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );
          img.addEventListener(
            "error",
            () => {
              window.clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );
        }),
    ),
  );
}

async function waitForCollageReady(root: HTMLElement): Promise<void> {
  const deadline = Date.now() + 12_000;

  while (Date.now() < deadline) {
    const busy = root.querySelector('[aria-busy="true"]');
    if (!busy) return;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
  }
}

function ancestorNeedsExportPrep(computed: CSSStyleDeclaration): boolean {
  if (computed.transform !== "none") return true;
  if (computed.overflow !== "visible") return true;
  if (computed.overflowX !== "visible" && computed.overflowX !== "clip") {
    return true;
  }
  if (computed.overflowY !== "visible") return true;

  const maxWidth = Number.parseFloat(computed.maxWidth);
  if (
    computed.maxWidth !== "none" &&
    !Number.isNaN(maxWidth) &&
    maxWidth < LOOK_CANVAS_REFERENCE_WIDTH
  ) {
    return true;
  }

  return false;
}

/**
 * The live preview scales the moodboard down with CSS transform + overflow
 * clipping. html2canvas captures the unscaled DOM box, so ancestors must be
 * expanded before capture or the PNG gets cropped / misaligned.
 */
function prepareElementForExportCapture(target: HTMLElement): () => void {
  const snapshots: StyleSnapshot[] = [];
  let ancestor: HTMLElement | null = target.parentElement;

  while (ancestor && ancestor !== document.body) {
    const computed = window.getComputedStyle(ancestor);

    if (ancestorNeedsExportPrep(computed)) {
      snapshots.push({
        element: ancestor,
        transform: ancestor.style.transform,
        width: ancestor.style.width,
        height: ancestor.style.height,
        maxWidth: ancestor.style.maxWidth,
        minWidth: ancestor.style.minWidth,
        overflow: ancestor.style.overflow,
        opacity: ancestor.style.opacity,
        visibility: ancestor.style.visibility,
      });

      ancestor.style.transform = "none";
      ancestor.style.width = `${LOOK_CANVAS_REFERENCE_WIDTH}px`;
      ancestor.style.height = `${MOODBOARD_EXPORT_HEIGHT_PX}px`;
      ancestor.style.maxWidth = "none";
      ancestor.style.minWidth = `${LOOK_CANVAS_REFERENCE_WIDTH}px`;
      ancestor.style.overflow = "visible";
      ancestor.style.opacity = "1";
      ancestor.style.visibility = "visible";
    }

    ancestor = ancestor.parentElement;
  }

  return () => {
    for (const snapshot of snapshots) {
      snapshot.element.style.transform = snapshot.transform;
      snapshot.element.style.width = snapshot.width;
      snapshot.element.style.height = snapshot.height;
      snapshot.element.style.maxWidth = snapshot.maxWidth;
      snapshot.element.style.minWidth = snapshot.minWidth;
      snapshot.element.style.overflow = snapshot.overflow;
      snapshot.element.style.opacity = snapshot.opacity;
      snapshot.element.style.visibility = snapshot.visibility;
    }
  };
}

function syncClonedImages(sourceRoot: HTMLElement, clonedRoot: HTMLElement): void {
  const sourceImages = sourceRoot.querySelectorAll("img");
  const clonedImages = clonedRoot.querySelectorAll("img");

  sourceImages.forEach((sourceImage, index) => {
    const clonedImage = clonedImages[index];
    if (!clonedImage) return;

    const resolvedSrc =
      sourceImage.currentSrc ||
      sourceImage.getAttribute("src") ||
      sourceImage.src;

    if (resolvedSrc) {
      clonedImage.src = resolvedSrc;
    }

    clonedImage.crossOrigin = "anonymous";
    clonedImage.removeAttribute("srcset");
    clonedImage.removeAttribute("sizes");

    const computed = window.getComputedStyle(sourceImage);
    clonedImage.style.width = computed.width;
    clonedImage.style.height = computed.height;
    clonedImage.style.maxWidth = computed.maxWidth;
    clonedImage.style.objectFit = computed.objectFit;
    clonedImage.style.objectPosition = computed.objectPosition;
  });
}

function prepareClonedExportRoot(
  sourceRoot: HTMLElement,
  clonedDocument: Document,
  clonedRoot: HTMLElement,
): void {
  const view = clonedDocument.defaultView;
  if (!view) return;

  clonedRoot.style.transform = "none";
  clonedRoot.style.opacity = "1";
  clonedRoot.style.visibility = "visible";
  clonedRoot.style.width = `${LOOK_CANVAS_REFERENCE_WIDTH}px`;

  clonedRoot.querySelectorAll<HTMLElement>('[aria-busy="true"]').forEach((node) => {
    node.closest('[class*="absolute"]')?.remove();
  });

  clonedRoot.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.style.opacity = "1";
    element.style.visibility = "visible";

    const computed = view.getComputedStyle(element);
    const colorProps = [
      "color",
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
    ] as const;

    for (const prop of colorProps) {
      const value = computed.getPropertyValue(prop);
      if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)") {
        continue;
      }

      if (UNSUPPORTED_COLOR_PATTERN.test(value)) {
        element.style.setProperty(prop, toCanvasSafeColor(value, view));
      }
    }
  });

  syncClonedImages(sourceRoot, clonedRoot);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${sanitizeFileName(fileName)}.png`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
}

async function tryNativeShare(blob: Blob, fileName: string): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.share ||
    !navigator.canShare
  ) {
    return false;
  }

  const file = new File([blob], `${sanitizeFileName(fileName)}.png`, {
    type: "image/png",
  });

  if (!navigator.canShare({ files: [file] })) {
    return false;
  }

  try {
    await Promise.race([
      navigator.share({
        files: [file],
        title: fileName,
        text: "Cortisstyle look card",
      }),
      new Promise<never>((_, reject) => {
        window.setTimeout(
          () => reject(new Error("Native share timed out.")),
          SHARE_TIMEOUT_MS,
        );
      }),
    ]);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }

    return false;
  }
}

function resolveCaptureScale(): number {
  if (typeof window === "undefined") return 2;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const dpr = window.devicePixelRatio || 1;

  if (isMobile) {
    return Math.min(2, Math.max(1.25, dpr));
  }

  return Math.min(2.5, Math.max(2, dpr));
}

async function captureLookCardCanvas(
  sourceElement: HTMLElement,
  backgroundColor: string,
): Promise<HTMLCanvasElement> {
  return html2canvas(sourceElement, {
    backgroundColor,
    scale: resolveCaptureScale(),
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15_000,
    width: LOOK_CANVAS_REFERENCE_WIDTH,
    height: sourceElement.scrollHeight || MOODBOARD_EXPORT_HEIGHT_PX,
    onclone: (clonedDocument, clonedRoot) => {
      prepareClonedExportRoot(sourceElement, clonedDocument, clonedRoot);
    },
  });
}

async function exportLookCardAsPngInternal(
  element: HTMLElement,
  fileName: string,
  options: ExportLookCardOptions,
): Promise<void> {
  const backgroundColor = options.backgroundColor ?? "#ffffff";
  const restoreAncestors = prepareElementForExportCapture(element);

  try {
    await waitForCollageReady(element);
    await waitForImages(element);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    const canvas = await captureLookCardCanvas(element, backgroundColor);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/png", 1);
    });

    if (!blob) {
      throw new Error("Unable to generate look card image.");
    }

    if (options.preferNativeShare) {
      const shared = await tryNativeShare(blob, fileName);
      if (shared) return;
    }

    downloadBlob(blob, fileName);
  } finally {
    restoreAncestors();
  }
}

export async function exportLookCardAsPng(
  element: HTMLElement,
  fileName: string,
  options: ExportLookCardOptions = {},
): Promise<void> {
  await Promise.race([
    exportLookCardAsPngInternal(element, fileName, options),
    new Promise<never>((_, reject) => {
      window.setTimeout(
        () =>
          reject(
            new Error(
              "Image generation timed out. Check your connection and try again.",
            ),
          ),
        EXPORT_TIMEOUT_MS,
      );
    }),
  ]);
}
