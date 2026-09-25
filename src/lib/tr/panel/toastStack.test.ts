import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TOAST_GAP,
  TOAST_PEEK,
  TOAST_SCALE_STEP,
  toastStackLayout,
} from "./toastStack";

describe("toastStackLayout", () => {
  it("is empty without toasts", () => {
    assert.deepEqual(toastStackLayout([], false), { slots: [], height: 0, collapsed: false });
  });

  it("shows a single toast plainly, hovered or not", () => {
    for (const expanded of [false, true]) {
      const layout = toastStackLayout([44], expanded);
      assert.equal(layout.collapsed, false);
      assert.equal(layout.height, 44);
      assert.deepEqual(layout.slots, [
        { y: 0, scale: 1, height: 44, contentVisible: true, zIndex: 1 },
      ]);
    }
  });

  it("piles several toasts up when not hovered: the newest in front, the older ones peeking above", () => {
    const layout = toastStackLayout([44, 60, 44], false);
    assert.equal(layout.collapsed, true);
    // as tall as the front toast plus a sliver for each one behind it
    assert.equal(layout.height, 44 + TOAST_PEEK * 2);
    assert.deepEqual(
      layout.slots.map((slot) => [slot.y, Number(slot.scale.toFixed(2)), slot.height, slot.contentVisible, slot.zIndex]),
      [
        [-TOAST_PEEK * 2, Number((1 - TOAST_SCALE_STEP * 2).toFixed(2)), 44, false, 1],
        [-TOAST_PEEK, Number((1 - TOAST_SCALE_STEP).toFixed(2)), 44, false, 2],
        [0, 1, 44, true, 3],
      ],
    );
  });

  it("clips a tall toast behind the front one to the front's height", () => {
    const layout = toastStackLayout([120, 44], false);
    assert.equal(layout.slots[0]!.height, 44);
  });

  it("lays the toasts out in full when hovered, newest at the bottom", () => {
    const layout = toastStackLayout([44, 60, 44], true);
    assert.equal(layout.collapsed, false);
    assert.equal(layout.height, 44 + 60 + 44 + TOAST_GAP * 2);
    assert.deepEqual(
      layout.slots.map((slot) => [slot.y, slot.scale, slot.height, slot.contentVisible]),
      [
        [-(60 + 44 + TOAST_GAP * 2), 1, 44, true],
        [-(44 + TOAST_GAP), 1, 60, true],
        [0, 1, 44, true],
      ],
    );
    assert.deepEqual(layout.slots.map((slot) => slot.zIndex), [1, 2, 3]);
  });

  it("never overlaps two toasts once expanded", () => {
    const heights = [44, 70, 52];
    const { slots } = toastStackLayout(heights, true);
    // each slot's top edge (y - height) must sit above the next one's y by at least the gap
    for (let i = 0; i < slots.length - 1; i += 1) {
      const topOfNewer = slots[i + 1]!.y - slots[i + 1]!.height;
      const bottomOfOlder = slots[i]!.y;
      assert.ok(bottomOfOlder <= topOfNewer - TOAST_GAP + 1e-9);
    }
  });
});
