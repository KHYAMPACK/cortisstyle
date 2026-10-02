import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginPanelTask,
  getPanelTasks,
  panelBusyLabel,
  panelRequestLabel,
  subscribePanelTasks,
  trackPanelTask,
} from "./panelBusy";

describe("panel busy tasks", () => {
  it("tracks tasks, notifies, and ends each once", () => {
    let calls = 0;
    const unsubscribe = subscribePanelTasks(() => {
      calls += 1;
    });
    const endA = beginPanelTask("Kaydediliyor…");
    const endB = beginPanelTask("Siliniyor…");
    assert.equal(getPanelTasks().length, 2);
    assert.equal(panelBusyLabel(getPanelTasks()), "Siliniyor… (2)");
    endB();
    endB();
    assert.equal(panelBusyLabel(getPanelTasks()), "Kaydediliyor…");
    endA();
    assert.equal(getPanelTasks().length, 0);
    assert.equal(panelBusyLabel(getPanelTasks()), null);
    assert.equal(calls, 4);
    unsubscribe();
  });

  it("ends a tracked task when it fails too", async () => {
    await assert.rejects(
      trackPanelTask("Fotoğraf yükleniyor…", async () => {
        assert.equal(getPanelTasks().length, 1);
        throw new Error("x");
      }),
    );
    assert.equal(getPanelTasks().length, 0);
    assert.equal(await trackPanelTask("a", async () => 5), 5);
  });

  it("labels requests that change something", () => {
    assert.equal(panelRequestLabel(undefined), null);
    assert.equal(panelRequestLabel("get"), null);
    assert.equal(panelRequestLabel("POST"), "Kaydediliyor…");
    assert.equal(panelRequestLabel("PATCH"), "Kaydediliyor…");
    assert.equal(panelRequestLabel("DELETE"), "Siliniyor…");
  });
});
