import sanitizeHtml from "sanitize-html";
import { isRichHtmlEmpty } from "@/lib/tr/richText";

/**
 * Server-side sanitizer for owner-written rich text. Run it on every write (the editor
 * is client code and can be bypassed) and before any render of stored HTML.
 *
 * Allowed: paragraphs, line breaks, bold / italic / underline / strike, two heading
 * levels, lists, quotes, rules and links (http, https, mailto, tel; always opened in a
 * new tab with `nofollow`). Everything else — scripts, styles, images, iframes, event
 * handlers — is removed and only the text of unknown tags is kept.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "hr",
    "a",
  ],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  // Elements whose content is code or markup, not prose, disappear entirely.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe"],
  transformTags: {
    b: "strong",
    i: "em",
    strike: "s",
    del: "s",
    h1: "h2",
    h4: "h3",
    h5: "h3",
    h6: "h3",
    div: "p",
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...(attribs.href ? { href: attribs.href } : {}),
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      },
    }),
  },
};

/**
 * Sanitized HTML, or `null` when nothing but whitespace and empty tags is left, so an
 * emptied editor stores nothing instead of `<p></p>`.
 */
export function sanitizeRichHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const clean = sanitizeHtml(html, OPTIONS).trim();
  return isRichHtmlEmpty(clean) && !/<hr\b/i.test(clean) ? null : clean;
}
