import html2canvas from "html2canvas";

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || "untitled-look";
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function exportLookCardAsPng(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png", 1);
  });

  if (!blob) {
    throw new Error("Unable to generate look card image.");
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${sanitizeFileName(fileName)}.png`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
