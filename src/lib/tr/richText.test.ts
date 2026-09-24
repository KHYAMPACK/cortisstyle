import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isRichHtmlEmpty,
  plainTextToRichHtml,
  richHtmlToPlainText,
} from "@/lib/tr/richText";
import { sanitizeRichHtml } from "@/lib/tr/richTextSanitize";

describe("richHtmlToPlainText", () => {
  it("turns blocks and breaks into lines and decodes entities", () => {
    assert.equal(
      richHtmlToPlainText("<p>Merhaba &amp; hoş geldiniz</p><p>İkinci<br>satır</p>"),
      "Merhaba & hoş geldiniz\nİkinci\nsatır",
    );
    assert.equal(
      richHtmlToPlainText("<ul><li>Bir</li><li>İki</li></ul>"),
      "Bir\nİki",
    );
  });

  it("drops tags and collapses whitespace", () => {
    assert.equal(
      richHtmlToPlainText("<p>  a   <strong>b</strong>&nbsp;c </p>"),
      "a b c",
    );
  });
});

describe("isRichHtmlEmpty", () => {
  it("treats empty tags and whitespace as empty", () => {
    assert.equal(isRichHtmlEmpty(""), true);
    assert.equal(isRichHtmlEmpty(null), true);
    assert.equal(isRichHtmlEmpty("<p></p>"), true);
    assert.equal(isRichHtmlEmpty("<p><br></p>"), true);
    assert.equal(isRichHtmlEmpty("<p>x</p>"), false);
  });
});

describe("plainTextToRichHtml", () => {
  it("makes paragraphs and escapes markup", () => {
    assert.equal(
      plainTextToRichHtml("Bir\nsatır\n\nİkinci <b>paragraf</b>"),
      "<p>Bir<br>satır</p><p>İkinci &lt;b&gt;paragraf&lt;/b&gt;</p>",
    );
    assert.equal(plainTextToRichHtml("  "), "");
    assert.equal(plainTextToRichHtml(null), "");
  });
});

describe("sanitizeRichHtml", () => {
  it("keeps the formatting the editor produces", () => {
    const html =
      "<h2>Başlık</h2><p>Metin <strong>kalın</strong> <em>eğik</em> <u>alt</u> <s>çizili</s></p><ul><li><p>Bir</p></li></ul><blockquote><p>Alıntı</p></blockquote>";
    assert.equal(sanitizeRichHtml(html), html);
  });

  it("removes scripts, handlers, styles and frames", () => {
    const clean = sanitizeRichHtml(
      '<p onclick="x()">Merhaba</p><script>alert(1)</script><style>p{}</style><iframe src="https://e.com"></iframe><img src=x onerror=alert(1)>',
    );
    assert.equal(clean, "<p>Merhaba</p>");
  });

  it("only allows safe link schemes and hardens every link", () => {
    assert.equal(
      sanitizeRichHtml('<a href="javascript:alert(1)">tıkla</a>'),
      '<a target="_blank" rel="noopener noreferrer nofollow">tıkla</a>',
    );
    assert.equal(
      sanitizeRichHtml('<a href="https://ornek.com/x" target="_self" onclick="x()">git</a>'),
      '<a href="https://ornek.com/x" target="_blank" rel="noopener noreferrer nofollow">git</a>',
    );
    assert.match(sanitizeRichHtml('<a href="mailto:a@b.co">m</a>') ?? "", /href="mailto:a@b\.co"/);
    assert.doesNotMatch(
      sanitizeRichHtml('<a href="//evil.example/x">x</a>') ?? "",
      /href=/,
    );
  });

  it("maps stray formatting tags onto the allowed set", () => {
    assert.equal(
      sanitizeRichHtml("<h1>Büyük</h1><p><b>a</b><i>b</i></p>"),
      "<h2>Büyük</h2><p><strong>a</strong><em>b</em></p>",
    );
  });

  it("returns null for an emptied editor", () => {
    assert.equal(sanitizeRichHtml("<p></p>"), null);
    assert.equal(sanitizeRichHtml("<p> <br> </p>"), null);
    assert.equal(sanitizeRichHtml(""), null);
    assert.equal(sanitizeRichHtml(null), null);
    assert.equal(sanitizeRichHtml("<script>x</script>"), null);
  });
});
