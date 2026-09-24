/**
 * Rich-text helpers with no dependencies, safe for the browser and the server. The
 * HTML sanitizer (server only) is `richTextSanitize.ts`.
 *
 * Product and category descriptions are stored as sanitized HTML in `description_html`;
 * the plain-text form (`richHtmlToPlainText`) keeps feeding the meta description, the
 * Google feed and AI fill.
 */

/** The most HTML a description may hold (a few pages of text), checked before sanitizing. */
export const RICH_TEXT_HTML_MAX_LENGTH = 60_000;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1] === "x" || entity[1] === "X"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The text of an HTML fragment: block ends and line breaks become newlines, tags are
 * dropped, entities decoded. For text output only (meta description, feed) — never
 * render the result as HTML.
 */
export function richHtmlToPlainText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|ul|ol)>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n");
  const text = decodeEntities(withBreaks.replace(/<[^>]*>/g, ""));
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isRichHtmlEmpty(html: string | null | undefined): boolean {
  return !html || richHtmlToPlainText(html) === "";
}

/** Plain text (paragraphs separated by blank lines) as HTML, for the editor's first load. */
export function plainTextToRichHtml(text: string | null | undefined): string {
  const trimmed = text?.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
