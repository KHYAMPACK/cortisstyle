import html2canvas from "html2canvas";

export interface ExportLookCardOptions {
  /** Letterbox color behind transparent export areas (footer strip). */
  backgroundColor?: string;
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || "untitled-look";
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

function prepareClonedExportRoot(clonedRoot: HTMLElement): void {
  clonedRoot.style.position = "static";
  clonedRoot.style.left = "auto";
  clonedRoot.style.top = "auto";
  clonedRoot.style.transform = "none";
  clonedRoot.style.opacity = "1";
  clonedRoot.style.visibility = "visible";
  clonedRoot.style.overflow = "visible";
  clonedRoot.style.maxHeight = "none";
  clonedRoot.style.height = "auto";

  clonedRoot.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.style.overflow = "visible";
    element.style.maxHeight = "none";

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

async function shareLookCardBlob(blob: Blob, fileName: string): Promise<boolean> {
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
    await navigator.share({
      files: [file],
      title: fileName,
      text: "Cortisstyle look card",
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }

    return false;
  }
}

export async function exportLookCardAsPng(
  element: HTMLElement,
  fileName: string,
  options: ExportLookCardOptions = {},
): Promise<void> {
  const backgroundColor = options.backgroundColor ?? "#ffffff";

  await waitForImages(element);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const canvas = await html2canvas(element, {
    backgroundColor,
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (_document, clonedRoot) => {
      prepareClonedExportRoot(clonedRoot);
    },
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png", 1);
  });

  if (!blob) {
    throw new Error("Unable to generate look card image.");
  }

  const shared = await shareLookCardBlob(blob, fileName);
  if (shared) {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${sanitizeFileName(fileName)}.png`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
