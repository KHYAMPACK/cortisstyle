export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function suggestItemId(name: string, existingIds: Set<string>): string {
  const base = slugify(name) || "item";
  let candidate = `${base}-01`;
  let n = 1;
  while (existingIds.has(candidate)) {
    n += 1;
    candidate = `${base}-${String(n).padStart(2, "0")}`;
  }
  return candidate;
}
