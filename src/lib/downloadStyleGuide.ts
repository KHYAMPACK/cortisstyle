export async function downloadStyleGuidePdf(
  lookId: string,
  buyerName: string,
): Promise<void> {
  const response = await fetch("/api/generate-guide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lookId, buyerName }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Unable to generate the style guide PDF.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `cortis-style-guide-${lookId}.pdf`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
