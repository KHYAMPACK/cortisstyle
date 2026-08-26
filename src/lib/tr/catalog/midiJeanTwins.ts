/** Midi Jean Elbise twins (Espresso / Navy) — campaign matching, not SKU ids. */

export function foldTrCatalogText(value: string): string {
  return value.replaceAll("İ", "i").replaceAll("I", "ı").toLocaleLowerCase("tr");
}

export function midiJeanCatalogText(input: {
  title?: string | null;
  features?: { color?: string | null };
  colors?: Array<{ name?: string | null }>;
}): string {
  return foldTrCatalogText(
    [
      input.title ?? "",
      input.features?.color ?? "",
      ...(input.colors ?? []).map((color) => color.name ?? ""),
    ].join(" "),
  );
}

/** True for the promoted Midi Jean Elbise pair (title or color text). */
export function isMidiJeanElbiseProduct(input: {
  title?: string | null;
  features?: { color?: string | null };
  colors?: Array<{ name?: string | null }>;
}): boolean {
  const text = midiJeanCatalogText(input);
  return (
    text.includes("midi") && text.includes("jean") && text.includes("elbise")
  );
}
