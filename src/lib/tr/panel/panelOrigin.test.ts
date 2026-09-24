import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PANEL_ORIGIN_PARAM,
  panelOriginLabel,
  parsePanelOrigin,
  withPanelOrigin,
} from "./panelOrigin";

describe("parsePanelOrigin", () => {
  it("accepts panel pages, with or without a query", () => {
    for (const path of [
      "/tr/panel",
      "/tr/panel/",
      "/tr/panel/musteriler/abc-123",
      "/tr/panel/siparisler?page=2",
      "/tr/panel/siparisler/abc?from=%2Ftr%2Fpanel%2Fmusteriler%2Fxyz",
    ]) {
      assert.equal(parsePanelOrigin(path), path, path);
    }
  });

  it("rejects anything that could lead outside the panel", () => {
    for (const value of [
      "https://evil.example/tr/panel",
      "//evil.example",
      "/\\evil.example",
      "/tr/panelx",
      "/tr/panel.evil",
      "/tr/other",
      "/",
      "javascript:alert(1)",
      "/tr/panel/x y",
      "/tr/panel/x\nSet-Cookie: a=b",
      "\\tr\\panel",
    ]) {
      assert.equal(parsePanelOrigin(value), null, JSON.stringify(value));
    }
  });

  it("rejects missing, empty, non-string and oversized values", () => {
    assert.equal(parsePanelOrigin(null), null);
    assert.equal(parsePanelOrigin(undefined), null);
    assert.equal(parsePanelOrigin(""), null);
    assert.equal(parsePanelOrigin(`/tr/panel/${"a".repeat(700)}`), null);
    assert.equal(parsePanelOrigin(42 as unknown as string), null);
  });
});

describe("panelOriginLabel", () => {
  it("names the pages an editor page can be reached from", () => {
    assert.equal(panelOriginLabel("/tr/panel"), "Giriş");
    assert.equal(panelOriginLabel("/tr/panel/siparisler"), "Siparişler");
    assert.equal(panelOriginLabel("/tr/panel/siparisler/abc"), "Sipariş Detayı");
    assert.equal(panelOriginLabel("/tr/panel/musteriler"), "Müşteriler");
    assert.equal(panelOriginLabel("/tr/panel/musteriler/abc"), "Müşteri Detayı");
  });

  it("looks only at the path, not the query", () => {
    assert.equal(
      panelOriginLabel("/tr/panel/musteriler/abc?from=%2Ftr%2Fpanel%2Fsiparisler"),
      "Müşteri Detayı",
    );
  });

  it("has no label for a page it doesn't know, so the caller falls back", () => {
    assert.equal(panelOriginLabel("/tr/panel/ayarlar"), null);
    assert.equal(panelOriginLabel("/tr/panel/urun/abc"), null);
  });
});

describe("withPanelOrigin", () => {
  it("adds the origin as an encoded from parameter", () => {
    assert.equal(
      withPanelOrigin("/tr/panel/siparisler/abc", "/tr/panel/musteriler/xyz"),
      `/tr/panel/siparisler/abc?${PANEL_ORIGIN_PARAM}=%2Ftr%2Fpanel%2Fmusteriler%2Fxyz`,
    );
  });

  it("keeps a query the link already has", () => {
    assert.equal(
      withPanelOrigin("/tr/panel/siparisler/abc?tab=1", "/tr/panel"),
      "/tr/panel/siparisler/abc?tab=1&from=%2Ftr%2Fpanel",
    );
  });

  it("round-trips through parsePanelOrigin, including a nested origin", () => {
    const first = withPanelOrigin("/tr/panel/siparisler/o1", "/tr/panel");
    const second = withPanelOrigin("/tr/panel/musteriler/c1", first);
    const readBack = new URL(second, "http://x").searchParams.get(PANEL_ORIGIN_PARAM);
    assert.equal(parsePanelOrigin(readBack), first);
    const inner = new URL(first, "http://x").searchParams.get(PANEL_ORIGIN_PARAM);
    assert.equal(parsePanelOrigin(inner), "/tr/panel");
  });
});
