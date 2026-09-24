import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDashboardWindow } from "@/lib/tr/panel/dashboardRange";
import {
  formatAxisTry,
  formatRate,
  formatWindowSpan,
  niceAxis,
  TR_DASHBOARD_METRICS,
} from "./dashboardFormat";

const NOW = Date.parse("2026-09-24T12:00:00+03:00");

function span(range: "today" | "7d" | "this_year") {
  const resolved = resolveDashboardWindow({ range, nowMs: NOW });
  assert.ok(resolved.ok);
  return formatWindowSpan(resolved.window.startMs, resolved.window.endMs);
}

describe("niceAxis", () => {
  it("rounds the ceiling up to a readable step", () => {
    assert.deepEqual(niceAxis(7, { integer: true }), { step: 2, max: 8 });
    // 2.700 TL → steps of 1.000 TL.
    assert.deepEqual(niceAxis(2_700, { integer: false }), { step: 1_000, max: 4_000 });
    assert.deepEqual(niceAxis(1_000, { integer: false }), { step: 250, max: 1_000 });
    assert.deepEqual(niceAxis(1_234_567, { integer: false }), {
      step: 500_000,
      max: 2_000_000,
    });
  });

  it("never gives a count axis a fractional step", () => {
    assert.deepEqual(niceAxis(1, { integer: true }), { step: 1, max: 4 });
    assert.deepEqual(niceAxis(0, { integer: true }), { step: 1, max: 4 });
  });

  it("keeps an empty money axis at a sensible scale", () => {
    assert.deepEqual(niceAxis(0, { integer: false }), { step: 100, max: 400 });
    assert.deepEqual(niceAxis(0.4, { integer: false }), { step: 1, max: 4 });
  });
});

describe("formatting", () => {
  it("abbreviates axis money", () => {
    assert.equal(formatAxisTry(750), "₺750");
    assert.equal(formatAxisTry(1_500), "₺1,5 bin");
    assert.equal(formatAxisTry(2_000), "₺2 bin");
    assert.equal(formatAxisTry(2_500_000), "₺2,5 Mn");
  });

  it("formats rates with a Turkish percent sign, and a dash when unmeasurable", () => {
    assert.equal(formatRate(0.1234), "%12,3");
    assert.equal(formatRate(0), "%0");
    assert.equal(formatRate(1), "%100");
    assert.equal(formatRate(null), "—");
  });

  it("describes a window by its Istanbul calendar days", () => {
    assert.equal(span("7d"), "18 Eyl – 24 Eyl 2026");
    assert.equal(span("today"), "24 Eyl 2026");
    assert.equal(span("this_year"), "1 Oca – 24 Eyl 2026");
  });
});

describe("metrics", () => {
  const averageOrder = TR_DASHBOARD_METRICS.find((m) => m.id === "averageOrder")!;
  const point = (revenueKurus: number, orderCount: number) => ({
    startMs: 0,
    label: "",
    revenueKurus,
    orderCount,
    newCustomers: 0,
    cancelledCount: 0,
  });

  it("derives a bucket's average order from its revenue and order count", () => {
    assert.equal(averageOrder.point(point(300_000, 2)), 150_000);
    assert.equal(averageOrder.point(point(100_001, 2)), 50_001);
  });

  it("plots an empty bucket as zero, not NaN", () => {
    assert.equal(averageOrder.point(point(0, 0)), 0);
  });

  it("marks only cancellations as worse when they grow", () => {
    const worseWhenUp = TR_DASHBOARD_METRICS.filter((m) => m.invertDelta).map((m) => m.id);
    assert.deepEqual(worseWhenUp, ["cancelled"]);
  });
});
