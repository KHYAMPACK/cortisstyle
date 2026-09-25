import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import {
  createToastStore,
  TOAST_DURATION_MS,
  TOAST_MAX_VISIBLE,
  toastMessage,
} from "./toast";

describe("toast store", () => {
  beforeEach(() => mock.timers.enable({ apis: ["setTimeout", "Date"] }));
  afterEach(() => mock.timers.reset());

  it("shows a toast and removes it after its kind's duration", () => {
    const store = createToastStore();
    store.show("success", "Kaydedildi.");
    assert.deepEqual(store.getSnapshot().map((t) => [t.kind, t.message]), [["success", "Kaydedildi."]]);
    mock.timers.tick(TOAST_DURATION_MS.success - 1);
    assert.equal(store.getSnapshot().length, 1);
    mock.timers.tick(1);
    assert.equal(store.getSnapshot().length, 0);
  });

  it("keeps errors on screen longer than successes", () => {
    assert.ok(TOAST_DURATION_MS.error > TOAST_DURATION_MS.warning);
    assert.ok(TOAST_DURATION_MS.warning > TOAST_DURATION_MS.success);
    const store = createToastStore();
    store.show("error", "Olmadı.");
    mock.timers.tick(TOAST_DURATION_MS.success);
    assert.equal(store.getSnapshot().length, 1);
    mock.timers.tick(TOAST_DURATION_MS.error);
    assert.equal(store.getSnapshot().length, 0);
  });

  it("honors a custom duration and trims the message", () => {
    const store = createToastStore();
    store.show("warning", "  Dikkat.  ", { durationMs: 500 });
    assert.equal(store.getSnapshot()[0]!.message, "Dikkat.");
    mock.timers.tick(500);
    assert.equal(store.getSnapshot().length, 0);
  });

  it("stacks oldest to newest and drops the oldest past the limit", () => {
    const store = createToastStore();
    for (let i = 1; i <= TOAST_MAX_VISIBLE + 2; i += 1) store.show("success", `Mesaj ${i}`);
    assert.deepEqual(
      store.getSnapshot().map((t) => t.message),
      ["Mesaj 3", "Mesaj 4", "Mesaj 5"],
    );
  });

  it("does not stack the same message twice; it restarts the timer instead", () => {
    const store = createToastStore();
    const first = store.show("error", "Kaydedilemedi.");
    mock.timers.tick(TOAST_DURATION_MS.error - 1_000);
    const second = store.show("error", "Kaydedilemedi.");
    assert.equal(second, first);
    assert.equal(store.getSnapshot().length, 1);
    mock.timers.tick(TOAST_DURATION_MS.error - 1);
    assert.equal(store.getSnapshot().length, 1, "the clock started over");
    mock.timers.tick(1);
    assert.equal(store.getSnapshot().length, 0);
  });

  it("treats the same text of another kind as a different toast", () => {
    const store = createToastStore();
    store.show("success", "Tamam.");
    store.show("warning", "Tamam.");
    assert.equal(store.getSnapshot().length, 2);
  });

  it("dismisses one toast and ignores unknown ids", () => {
    const store = createToastStore();
    const a = store.show("success", "A");
    store.show("success", "B");
    store.dismiss(a);
    store.dismiss(9999);
    assert.deepEqual(store.getSnapshot().map((t) => t.message), ["B"]);
  });

  it("pauses every toast while the stack is hovered and resumes with the time each had left", () => {
    const store = createToastStore();
    store.show("success", "Kaydedildi.");
    mock.timers.tick(1_000);
    store.show("error", "Olmadı.");
    mock.timers.tick(2_000);
    store.pauseAll();
    mock.timers.tick(60_000);
    assert.equal(store.getSnapshot().length, 2, "paused, so both are still there");
    store.resumeAll();
    mock.timers.tick(999);
    assert.equal(store.getSnapshot().length, 2);
    mock.timers.tick(1);
    assert.deepEqual(store.getSnapshot().map((t) => t.message), ["Olmadı."], "1 s of the success's 4 s was left");
    mock.timers.tick(4_999);
    assert.equal(store.getSnapshot().length, 1);
    mock.timers.tick(1);
    assert.equal(store.getSnapshot().length, 0, "the error had 6 s left at resume, 5 s after the first second");
  });

  it("a toast that arrives while paused waits until the stack is let go", () => {
    const store = createToastStore();
    store.pauseAll();
    store.show("success", "Yeni.");
    mock.timers.tick(TOAST_DURATION_MS.error);
    assert.equal(store.getSnapshot().length, 1);
    store.resumeAll();
    mock.timers.tick(TOAST_DURATION_MS.success);
    assert.equal(store.getSnapshot().length, 0);
  });

  it("pausing or resuming twice does no harm", () => {
    const store = createToastStore();
    store.show("success", "Kaydedildi.");
    store.resumeAll();
    store.pauseAll();
    store.pauseAll();
    store.resumeAll();
    store.resumeAll();
    mock.timers.tick(TOAST_DURATION_MS.success);
    assert.equal(store.getSnapshot().length, 0);
  });

  it("forgets the pause once the last toast is gone (its pointer can't leave any more)", () => {
    const store = createToastStore();
    const id = store.show("success", "A");
    store.pauseAll();
    store.dismiss(id);
    store.show("success", "B");
    mock.timers.tick(TOAST_DURATION_MS.success);
    assert.equal(store.getSnapshot().length, 0, "B timed out normally");
  });

  it("notifies subscribers, and keeps the snapshot identity when nothing changes", () => {
    const store = createToastStore();
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    const before = store.getSnapshot();
    store.dismiss(1);
    assert.equal(store.getSnapshot(), before);
    assert.equal(calls, 0);
    store.show("success", "A");
    assert.equal(calls, 1);
    assert.notEqual(store.getSnapshot(), before);
    unsubscribe();
    store.show("success", "B");
    assert.equal(calls, 1);
  });

  it("carries an action and clears everything", () => {
    const store = createToastStore();
    let clicked = false;
    store.show("success", "Silindi.", { action: { label: "Geri al", onClick: () => { clicked = true; } } });
    store.getSnapshot()[0]!.action!.onClick();
    assert.equal(clicked, true);
    store.clear();
    assert.equal(store.getSnapshot().length, 0);
    mock.timers.tick(TOAST_DURATION_MS.error);
    assert.equal(store.getSnapshot().length, 0);
  });
});

describe("toastMessage", () => {
  it("uses a string, an Error's message, or the fallback", () => {
    assert.equal(toastMessage("Ürün adı zorunlu."), "Ürün adı zorunlu.");
    assert.equal(toastMessage(new Error("Kategori bulunamadı."), "x"), "Kategori bulunamadı.");
    assert.equal(toastMessage(new Error(" "), "Kaydedilemedi."), "Kaydedilemedi.");
    assert.equal(toastMessage(undefined, "Kaydedilemedi."), "Kaydedilemedi.");
    assert.equal(toastMessage({ nope: true }, "Kaydedilemedi."), "Kaydedilemedi.");
    assert.match(toastMessage(null), /tekrar deneyin/);
  });
});
