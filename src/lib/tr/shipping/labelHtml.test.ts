import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wrapShipmentLabelHtml, wrapShipmentLabelsHtml } from "./labelHtml";

const svg = (id: string) => `<svg data-id="${id}"></svg>`;

describe("wrapShipmentLabelsHtml", () => {
  it("puts every etiket on its own sheet, in order", () => {
    const html = wrapShipmentLabelsHtml([svg("a"), svg("b"), svg("c")]);
    assert.equal((html.match(/<section class="label">/g) ?? []).length, 3);
    assert.ok(html.indexOf('data-id="a"') < html.indexOf('data-id="b"'));
    assert.ok(html.indexOf('data-id="b"') < html.indexOf('data-id="c"'));
  });

  it("breaks the page after each sheet but not after the last", () => {
    const html = wrapShipmentLabelsHtml([svg("a"), svg("b")]);
    assert.ok(html.includes(".label { break-after: page; }"));
    assert.ok(html.includes(".label:last-child { break-after: auto; }"));
  });

  it("is a complete HTML document, not raw SVG", () => {
    const html = wrapShipmentLabelsHtml([svg("a")]);
    assert.ok(html.startsWith("<!doctype html>"));
    assert.ok(html.includes("</html>"));
  });
});

describe("wrapShipmentLabelHtml", () => {
  it("is the one-etiket case", () => {
    assert.equal(wrapShipmentLabelHtml(svg("a")), wrapShipmentLabelsHtml([svg("a")]));
  });
});
