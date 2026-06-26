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

interface LiveImageInlineSnapshot {
  element: HTMLImageElement;
  originalSrc: string;
  originalSrcset: string | null;
  originalCrossOrigin: string | null;
  dataUrl: string;
  absoluteSrc: string;
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || "untitled-look";
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveAbsoluteImageUrl(src: string): string {
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  return new URL(src, window.location.href).href;
}

function resolveImageSource(img: HTMLImageElement): string {
  return (
    img.getAttribute("src") ||
    img.currentSrc ||
    img.src ||
    ""
  ).trim();
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

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read image data."));
    };
    reader.onerror = () => reject(new Error("Unable to read image data."));
    reader.readAsDataURL(blob);
  });
}

function rasterizeImageElement(img: HTMLImageElement): string | null {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  try {
    context.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";

    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error(`Unable to load image: ${src}`));
    };

    image.src = src;
  });
}

async function fetchImageAsDataUrl(absoluteSrc: string): Promise<string | null> {
  if (absoluteSrc.startsWith("data:")) {
    return absoluteSrc;
  }

  if (absoluteSrc.startsWith("blob:")) {
    try {
      const response = await fetch(absoluteSrc);
      if (!response.ok) return null;
      return await readBlobAsDataUrl(await response.blob());
    } catch {
      return null;
    }
  }

  try {
    const response = await fetch(absoluteSrc, {
      credentials: "same-origin",
      cache: "force-cache",
    });

    if (!response.ok) {
      return null;
    }

    return await readBlobAsDataUrl(await response.blob());
  } catch {
    return null;
  }
}

async function resolveExportableDataUrl(src: string): Promise<string> {
  const trimmed = src.trim();
  if (!trimmed) {
    throw new Error("Look card export found an image without a source URL.");
  }

  if (trimmed.startsWith("data:")) {
    const loaded = await loadImageElement(trimmed);
    const rasterized = rasterizeImageElement(loaded);
    if (rasterized) {
      return rasterized;
    }

    throw new Error("Unable to prepare uploaded mood image for export.");
  }

  const absoluteSrc = resolveAbsoluteImageUrl(trimmed);

  const fetched = await fetchImageAsDataUrl(absoluteSrc);
  if (fetched?.startsWith("data:")) {
    const loaded = await loadImageElement(fetched);
    const rasterized = rasterizeImageElement(loaded);
    if (rasterized) {
      return rasterized;
    }
  }

  const loaded = await loadImageElement(absoluteSrc);
  const rasterized = rasterizeImageElement(loaded);
  if (rasterized) {
    return rasterized;
  }

  throw new Error(
    `Unable to prepare image for export: ${absoluteSrc}. Reload and try again.`,
  );
}

async function prepareMoodImageFrames(root: HTMLElement): Promise<Map<string, string>> {
  const moodSources = new Map<string, string>();
  const frames = root.querySelectorAll<HTMLElement>("[data-mood-image-frame]");

  for (const frame of frames) {
    const src = frame.getAttribute("data-mood-image-src")?.trim();
    if (!src) continue;

    const dataUrl = await resolveExportableDataUrl(src);
    moodSources.set(src, dataUrl);
    moodSources.set(resolveAbsoluteImageUrl(src), dataUrl);

    const img = frame.querySelector("img");
    if (img) {
      img.removeAttribute("crossorigin");
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.src = dataUrl;
    }
  }

  if (moodSources.size > 0) {
    await waitForImages(root);
  }

  return moodSources;
}

async function resolveImageDataUrl(img: HTMLImageElement): Promise<string> {
  const src = resolveImageSource(img);

  if (!src) {
    throw new Error("Look card export found an image without a source URL.");
  }

  img.removeAttribute("crossorigin");
  return resolveExportableDataUrl(src);
}

async function inlineAllImagesOnLiveRoot(root: HTMLElement): Promise<{
  restore: () => void;
  dataUrlByAbsoluteSrc: Map<string, string>;
  dataUrlsInOrder: string[];
}> {
  const moodSources = await prepareMoodImageFrames(root);
  const images = Array.from(root.querySelectorAll("img"));
  const snapshots: LiveImageInlineSnapshot[] = [];

  for (const img of images) {
    const originalSrc = resolveImageSource(img);
    const dataUrl = await resolveImageDataUrl(img);

    snapshots.push({
      element: img,
      originalSrc,
      originalSrcset: img.getAttribute("srcset"),
      originalCrossOrigin: img.getAttribute("crossorigin"),
      dataUrl,
      absoluteSrc: resolveAbsoluteImageUrl(originalSrc || dataUrl),
    });
  }

  for (const snapshot of snapshots) {
    snapshot.element.removeAttribute("crossorigin");
    snapshot.element.removeAttribute("srcset");
    snapshot.element.removeAttribute("sizes");
    snapshot.element.src = snapshot.dataUrl;
  }

  await waitForImages(root);

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const dataUrlByAbsoluteSrc = new Map<string, string>(moodSources);
  for (const snapshot of snapshots) {
    dataUrlByAbsoluteSrc.set(snapshot.absoluteSrc, snapshot.dataUrl);
    dataUrlByAbsoluteSrc.set(snapshot.dataUrl, snapshot.dataUrl);
  }

  return {
    restore: () => {
      for (const snapshot of snapshots) {
        snapshot.element.src = snapshot.originalSrc;

        if (snapshot.originalSrcset) {
          snapshot.element.setAttribute("srcset", snapshot.originalSrcset);
        } else {
          snapshot.element.removeAttribute("srcset");
        }

        if (snapshot.originalCrossOrigin) {
          snapshot.element.setAttribute(
            "crossorigin",
            snapshot.originalCrossOrigin,
          );
        } else {
          snapshot.element.removeAttribute("crossorigin");
        }
      }
    },
    dataUrlByAbsoluteSrc,
    dataUrlsInOrder: snapshots.map((snapshot) => snapshot.dataUrl),
  };
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

function prepareElementForExportCapture(target: HTMLElement): () => void {
  const snapshots: StyleSnapshot[] = [];
  const targetSnapshot = {
    width: target.style.width,
    height: target.style.height,
    overflow: target.style.overflow,
  };

  target.style.width = `${LOOK_CANVAS_REFERENCE_WIDTH}px`;
  target.style.height = `${MOODBOARD_EXPORT_HEIGHT_PX}px`;
  target.style.overflow = "hidden";

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
    target.style.width = targetSnapshot.width;
    target.style.height = targetSnapshot.height;
    target.style.overflow = targetSnapshot.overflow;

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

function sanitizeClonedImages(
  clonedRoot: HTMLElement,
  dataUrlByAbsoluteSrc: Map<string, string>,
  dataUrlsInOrder: string[],
): void {
  clonedRoot.querySelectorAll("img").forEach((img, index) => {
    const orderedDataUrl = dataUrlsInOrder[index];
    const rawSrc = img.getAttribute("src") || img.src || "";
    let dataUrl = orderedDataUrl;

    if (!dataUrl?.startsWith("data:") && rawSrc) {
      try {
        dataUrl =
          dataUrlByAbsoluteSrc.get(resolveAbsoluteImageUrl(rawSrc)) ?? dataUrl;
      } catch {
        dataUrl = dataUrlByAbsoluteSrc.get(rawSrc) ?? dataUrl;
      }
    }

    img.removeAttribute("crossorigin");
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");

    if (dataUrl?.startsWith("data:")) {
      img.src = dataUrl;
      return;
    }

    img.style.opacity = "0";
    img.style.visibility = "hidden";
    img.removeAttribute("src");
  });
}

function prepareClonedExportRoot(
  clonedDocument: Document,
  clonedRoot: HTMLElement,
  dataUrlByAbsoluteSrc: Map<string, string>,
  dataUrlsInOrder: string[],
): void {
  const view = clonedDocument.defaultView;
  if (!view) return;

  clonedRoot.style.transform = "none";
  clonedRoot.style.opacity = "1";
  clonedRoot.style.visibility = "visible";
  clonedRoot.style.width = `${LOOK_CANVAS_REFERENCE_WIDTH}px`;
  clonedRoot.style.height = `${MOODBOARD_EXPORT_HEIGHT_PX}px`;
  clonedRoot.style.overflow = "hidden";

  clonedRoot.querySelectorAll<HTMLElement>('[aria-busy="true"]').forEach((node) => {
    node.closest('[class*="absolute"]')?.remove();
  });

  clonedRoot.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.style.opacity = element.style.opacity || "1";
    element.style.visibility = element.style.visibility || "visible";

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

    const backgroundImage = computed.backgroundImage;
    if (backgroundImage && backgroundImage.includes("url(")) {
      element.style.backgroundImage = "none";
    }
  });

  sanitizeClonedImages(clonedRoot, dataUrlByAbsoluteSrc, dataUrlsInOrder);
  rebuildMoodImageFrames(clonedDocument, clonedRoot, dataUrlByAbsoluteSrc);
}

function rebuildMoodImageFrames(
  clonedDocument: Document,
  clonedRoot: HTMLElement,
  dataUrlByAbsoluteSrc: Map<string, string>,
): void {
  clonedRoot.querySelectorAll<HTMLElement>("[data-mood-image-frame]").forEach((frame) => {
    const src = frame.getAttribute("data-mood-image-src")?.trim();
    if (!src) return;

    const dataUrl =
      dataUrlByAbsoluteSrc.get(src) ??
      dataUrlByAbsoluteSrc.get(resolveAbsoluteImageUrl(src));

    if (!dataUrl?.startsWith("data:")) {
      frame.remove();
      return;
    }

    frame.replaceChildren();
    frame.style.position = "absolute";
    frame.style.top = "1rem";
    frame.style.right = "1rem";
    frame.style.zIndex = "10";
    frame.style.width = "120px";
    frame.style.aspectRatio = "3 / 4";
    frame.style.overflow = "hidden";

    const img = clonedDocument.createElement("img");
    img.src = dataUrl;
    img.alt = "";
    img.style.position = "absolute";
    img.style.inset = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    frame.appendChild(img);
  });
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
  dataUrlByAbsoluteSrc: Map<string, string>,
  dataUrlsInOrder: string[],
  backgroundColor: string,
): Promise<HTMLCanvasElement> {
  return html2canvas(sourceElement, {
    backgroundColor,
    scale: resolveCaptureScale(),
    useCORS: false,
    allowTaint: false,
    logging: false,
    imageTimeout: 15_000,
    onclone: (clonedDocument, clonedRoot) => {
      prepareClonedExportRoot(
        clonedDocument,
        clonedRoot,
        dataUrlByAbsoluteSrc,
        dataUrlsInOrder,
      );
    },
  });
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    try {
      canvas.toBlob((result) => resolve(result), "image/png", 1);
    } catch (error) {
      reject(error);
    }
  });

  if (!blob) {
    throw new Error(
      "Unable to export look card image. An image asset blocked canvas export.",
    );
  }

  return blob;
}

async function exportLookCardAsPngInternal(
  element: HTMLElement,
  fileName: string,
  options: ExportLookCardOptions,
): Promise<void> {
  const backgroundColor = options.backgroundColor ?? "#ffffff";
  const restoreCaptureStyles = prepareElementForExportCapture(element);
  let restoreInlineImages = () => {};

  try {
    await waitForCollageReady(element);
    await waitForImages(element);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    const inlineResult = await inlineAllImagesOnLiveRoot(element);
    restoreInlineImages = inlineResult.restore;

    const canvas = await captureLookCardCanvas(
      element,
      inlineResult.dataUrlByAbsoluteSrc,
      inlineResult.dataUrlsInOrder,
      backgroundColor,
    );
    const blob = await canvasToPngBlob(canvas);

    if (options.preferNativeShare) {
      const shared = await tryNativeShare(blob, fileName);
      if (shared) return;
    }

    downloadBlob(blob, fileName);
  } finally {
    restoreInlineImages();
    restoreCaptureStyles();
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
