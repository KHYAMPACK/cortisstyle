export function buildBudgetAlternativeSearchUrl(
  storeUrl: string,
  searchName: string,
): string {
  try {
    const parsed = new URL(storeUrl.trim());
    if (parsed.searchParams.get("q")) {
      return parsed.toString();
    }
    const params = new URLSearchParams({ q: searchName.trim() });
    return `${parsed.origin}/search?${params.toString()}`;
  } catch {
    return storeUrl;
  }
}

export function normalizeBudgetAlternativeLink(link: {
  name: string;
  url: string;
}): { name: string; url: string } {
  const name = link.name.trim();
  const url = link.url.trim();
  return {
    name,
    url: buildBudgetAlternativeSearchUrl(url, name),
  };
}
