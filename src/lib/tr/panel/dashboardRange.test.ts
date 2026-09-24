import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bucketIndexFor,
  bucketLabel,
  bucketStarts,
  istanbulDayString,
  resolveDashboardWindow,
  type TrDashboardRangeId,
} from "./dashboardRange";

const at = (iso: string) => Date.parse(iso);
const DAY = 86_400_000;

// Thursday 24 Sep 2026, noon in Istanbul.
const NOW = at("2026-09-24T12:00:00+03:00");

function resolve(range: TrDashboardRangeId, extra?: { from?: string; to?: string }, nowMs = NOW) {
  const result = resolveDashboardWindow({ range, nowMs, ...extra });
  assert.ok(result.ok, result.ok ? "" : result.error);
  return result.window;
}

describe("resolveDashboardWindow", () => {
  it("today runs from Istanbul midnight to now and compares with the same hours yesterday", () => {
    const w = resolve("today");
    assert.equal(w.startMs, at("2026-09-24T00:00:00+03:00"));
    assert.equal(w.endMs, NOW + 1);
    assert.equal(w.prevStartMs, at("2026-09-23T00:00:00+03:00"));
    assert.equal(w.prevEndMs - w.prevStartMs, w.endMs - w.startMs);
    assert.equal(w.bucket, "hour");
  });

  it("yesterday is the full previous day, compared with the day before", () => {
    const w = resolve("yesterday");
    assert.equal(w.startMs, at("2026-09-23T00:00:00+03:00"));
    assert.equal(w.endMs, at("2026-09-24T00:00:00+03:00"));
    assert.equal(w.prevStartMs, at("2026-09-22T00:00:00+03:00"));
    assert.equal(w.prevEndMs, w.startMs);
  });

  it("weeks start on Monday", () => {
    const thisWeek = resolve("this_week");
    assert.equal(thisWeek.startMs, at("2026-09-21T00:00:00+03:00"));
    assert.equal(thisWeek.prevStartMs, at("2026-09-14T00:00:00+03:00"));

    const lastWeek = resolve("last_week");
    assert.equal(lastWeek.startMs, at("2026-09-14T00:00:00+03:00"));
    assert.equal(lastWeek.endMs, at("2026-09-21T00:00:00+03:00"));
    assert.equal(lastWeek.prevStartMs, at("2026-09-07T00:00:00+03:00"));
  });

  it("this month compares with the same elapsed span of last month", () => {
    const w = resolve("this_month");
    assert.equal(w.startMs, at("2026-09-01T00:00:00+03:00"));
    assert.equal(w.prevStartMs, at("2026-08-01T00:00:00+03:00"));
    assert.equal(w.prevEndMs - w.prevStartMs, w.endMs - w.startMs);
  });

  it("this month never compares into the current month (short previous month)", () => {
    // 31 March: February only has 28 days, so the comparison stops at 1 March.
    const w = resolve("this_month", undefined, at("2026-03-31T12:00:00+03:00"));
    assert.equal(w.prevStartMs, at("2026-02-01T00:00:00+03:00"));
    assert.equal(w.prevEndMs, at("2026-03-01T00:00:00+03:00"));
  });

  it("last month is the full previous calendar month", () => {
    const w = resolve("last_month");
    assert.equal(w.startMs, at("2026-08-01T00:00:00+03:00"));
    assert.equal(w.endMs, at("2026-09-01T00:00:00+03:00"));
    assert.equal(w.prevStartMs, at("2026-07-01T00:00:00+03:00"));
    assert.equal(w.prevEndMs, w.startMs);
  });

  it("last month across a year boundary", () => {
    const w = resolve("last_month", undefined, at("2026-01-15T12:00:00+03:00"));
    assert.equal(w.startMs, at("2025-12-01T00:00:00+03:00"));
    assert.equal(w.prevStartMs, at("2025-11-01T00:00:00+03:00"));
  });

  it("rolling ranges include today and compare with the equal-length window before", () => {
    const w7 = resolve("7d");
    assert.equal(w7.startMs, at("2026-09-18T00:00:00+03:00"));
    assert.equal(w7.prevEndMs, w7.startMs);
    assert.equal(w7.startMs - w7.prevStartMs, w7.endMs - w7.startMs);
    assert.equal(w7.bucket, "day");

    assert.equal(resolve("30d").startMs, at("2026-08-26T00:00:00+03:00"));
    assert.equal(resolve("3m").startMs, at("2026-06-24T00:00:00+03:00"));
    assert.equal(resolve("6m").startMs, at("2026-03-24T00:00:00+03:00"));
  });

  it("clamps month arithmetic to the target month's length", () => {
    // 31 May minus 3 months has no 31 February-day: it lands on 28 Feb.
    const w = resolve("3m", undefined, at("2026-05-31T12:00:00+03:00"));
    assert.equal(w.startMs, at("2026-02-28T00:00:00+03:00"));
  });

  it("this year compares with the same span of last year", () => {
    const w = resolve("this_year");
    assert.equal(w.startMs, at("2026-01-01T00:00:00+03:00"));
    assert.equal(w.prevStartMs, at("2025-01-01T00:00:00+03:00"));
    assert.equal(w.prevEndMs - w.prevStartMs, w.endMs - w.startMs);
    assert.equal(w.bucket, "month");
  });

  it("chooses bucket size from the span", () => {
    assert.equal(resolve("30d").bucket, "day");
    assert.equal(resolve("3m").bucket, "day");
    assert.equal(resolve("6m").bucket, "week");
  });

  it("custom range is inclusive of the end day", () => {
    const w = resolve("custom", { from: "2026-09-01", to: "2026-09-10" });
    assert.equal(w.startMs, at("2026-09-01T00:00:00+03:00"));
    assert.equal(w.endMs, at("2026-09-11T00:00:00+03:00"));
    assert.equal(w.prevEndMs, w.startMs);
    assert.equal(w.endMs - w.startMs, 10 * DAY);
  });

  it("custom range ending today stops at now", () => {
    const w = resolve("custom", { from: "2026-09-20", to: "2026-09-24" });
    assert.equal(w.endMs, NOW + 1);
  });

  it("rejects bad custom ranges", () => {
    const bad = (from?: string, to?: string) =>
      resolveDashboardWindow({ range: "custom", nowMs: NOW, from, to }).ok;
    assert.equal(bad("2026-09-10", "2026-09-01"), false);
    assert.equal(bad("2026-02-31", "2026-03-05"), false);
    assert.equal(bad("2026-09-30", "2026-10-02"), false);
    assert.equal(bad("2025-01-01", "2026-09-24"), false);
    assert.equal(bad(undefined, "2026-09-01"), false);
    assert.equal(bad("not-a-date", "2026-09-01"), false);
  });
});

describe("buckets", () => {
  it("hourly buckets for today run through the current hour", () => {
    const w = resolve("today");
    const starts = bucketStarts(w.startMs, w.endMs, w.bucket);
    assert.equal(starts.length, 13);
    assert.equal(bucketLabel(starts[9]!, "hour"), "09:00");
  });

  it("daily buckets for 7 days", () => {
    const w = resolve("7d");
    const starts = bucketStarts(w.startMs, w.endMs, w.bucket);
    assert.equal(starts.length, 7);
    assert.equal(starts[6], at("2026-09-24T00:00:00+03:00"));
  });

  it("monthly buckets follow calendar months", () => {
    const w = resolve("this_year");
    const starts = bucketStarts(w.startMs, w.endMs, w.bucket);
    assert.equal(starts.length, 9);
    assert.equal(starts[8], at("2026-09-01T00:00:00+03:00"));
  });

  it("places a timestamp in its bucket and rejects ones outside the window", () => {
    const w = resolve("7d");
    const starts = bucketStarts(w.startMs, w.endMs, w.bucket);
    assert.equal(bucketIndexFor(starts, w.endMs, at("2026-09-18T00:00:00+03:00")), 0);
    assert.equal(bucketIndexFor(starts, w.endMs, at("2026-09-20T23:59:59+03:00")), 2);
    assert.equal(bucketIndexFor(starts, w.endMs, at("2026-09-24T09:00:00+03:00")), 6);
    assert.equal(bucketIndexFor(starts, w.endMs, at("2026-09-17T23:59:59+03:00")), -1);
    assert.equal(bucketIndexFor(starts, w.endMs, NOW + 5_000), -1);
  });
});

describe("istanbulDayString", () => {
  it("uses the Istanbul calendar day, not the UTC one", () => {
    // 23:30 UTC on the 23rd is already 02:30 on the 24th in Istanbul.
    assert.equal(istanbulDayString(at("2026-09-23T23:30:00Z")), "2026-09-24");
    assert.equal(istanbulDayString(at("2026-09-24T20:59:59Z")), "2026-09-24");
    assert.equal(istanbulDayString(at("2026-09-24T21:00:00Z")), "2026-09-25");
  });
});
