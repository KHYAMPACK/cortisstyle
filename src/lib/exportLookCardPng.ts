import html2canvas from "html2canvas-pro";

export interface ExportLookCardOptions {
  /** Letterbox color behind transparent export areas (footer strip). */
  backgroundColor?: string;
  /** Prefer the native share sheet when available (mobile). */
  preferNativeShare?: boolean;
}

const EXPORT_TIMEOUT_MS = 45_000;
const SHARE_TIMEOUT_MS = 12_000;

const UNSUPPORTED_COLOR_PATTERN = /(lab|oklch|oklab|lch|color)\(/i;

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
          if (img.complete) {
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

function stripUnsupportedStylesheets(doc: Document): void {
  doc
    .querySelectorAll('link[rel="stylesheet"], style[data-nextjs-href], style')
    .forEach((node) => {
      node.parentNode?.removeChild(node);
    });
}

function sanitizeElementColors(element: HTMLElement, view: Window): void {
  const computed = view.getComputedStyle(element);
  const colorProps = [
    "color",
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
  ] as const;

  for (const prop of colorProps) {
    const value = computed.getPropertyValue(prop);
    if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)") {
      continue;
    }

    element.style.setProperty(prop, toCanvasSafeColor(value, view));
  }
}

function inlineExportSubtreeStyles(root: HTMLElement, view: Window): void {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const element of elements) {
    const computed = view.getComputedStyle(element);

    sanitizeElementColors(element, view);

    element.style.fontFamily = computed.fontFamily;
    element.style.fontSize = computed.fontSize;
    element.style.fontWeight = computed.fontWeight;
    element.style.letterSpacing = computed.letterSpacing;
    element.style.lineHeight = computed.lineHeight;
    element.style.textAlign = computed.textAlign;
    element.style.textTransform = computed.textTransform;

    if (!element.style.width && computed.width) {
      element.style.width = computed.width;
    }
    if (!element.style.height && computed.height) {
      element.style.height = computed.height;
    }
    if (!element.style.display && computed.display) {
      element.style.display = computed.display;
    }
    if (!element.style.position && computed.position) {
      element.style.position = computed.position;
    }
    if (!element.style.border && computed.borderStyle !== "none") {
      element.style.borderWidth = computed.borderWidth;
      element.style.borderStyle = computed.borderStyle;
    }
    if (!element.style.padding && computed.padding !== "0px") {
      element.style.padding = computed.padding;
    }
    if (!element.style.margin && computed.margin !== "0px") {
      element.style.margin = computed.margin;
    }
    if (!element.style.objectFit && computed.objectFit) {
      element.style.objectFit = computed.objectFit;
    }
  }
}

function prepareClonedExportRoot(
  clonedDocument: Document,
  clonedRoot: HTMLElement,
): void {
  const view = clonedDocument.defaultView;
  if (!view) return;

  inlineExportSubtreeStyles(clonedRoot, view);
  stripUnsupportedStylesheets(clonedDocument);

  clonedRoot.style.position = "static";
  clonedRoot.style.left = "auto";
  clonedRoot.style.top = "auto";
  clonedRoot.style.transform = "none";
  clonedRoot.style.opacity = "1";
  clonedRoot.style.visibility = "visible";
  clonedRoot.style.overflow = "visible";
  clonedRoot.style.maxHeight = "none";
  clonedRoot.style.height = "auto";
  clonedRoot.style.clipPath = "none";

  clonedRoot.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.style.overflow = "visible";
    element.style.maxHeight = "none";
    element.style.visibility = "visible";
    element.style.opacity = "1";
    sanitizeElementColors(element, view);

    if (element.classList.contains("mix-blend-multiply")) {
      element.style.mixBlendMode = "normal";
    }

    if (element.dataset.exportBlendLayer !== undefined) {
      element.style.mixBlendMode = "normal";
    }
  });

  clonedRoot.querySelectorAll("img").forEach((img) => {
    img.crossOrigin = "anonymous";
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
  element: HTMLElement,
  backgroundColor: string,
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    backgroundColor,
    scale: resolveCaptureScale(),
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15_000,
    onclone: (clonedDocument, clonedRoot) => {
      prepareClonedExportRoot(clonedDocument, clonedRoot);
    },
  });
}

async function exportLookCardAsPngInternal(
  element: HTMLElement,
  fileName: string,
  options: ExportLookCardOptions,
): Promise<void> {
  const backgroundColor = options.backgroundColor ?? "#ffffff";

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
