import test from "node:test";
import assert from "node:assert/strict";

import { bindRoomMappingEditorEvents } from "../src/features/editor/roomMapping/editorEvents.js";

function makeElement() {
  const listeners = [];
  return {
    listeners,
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
  };
}

test("bindRoomMappingEditorEvents wires room controls and actions", () => {
  const elements = new Map([
    ["region-kind-input", makeElement()],
    ["region-id-input", makeElement()],
    ["region-label-input", makeElement()],
    ["assign-region", makeElement()],
    ["clear-region", makeElement()],
    ["set-region-label-position", makeElement()],
    ["assign-stash", makeElement()],
    ["clear-stash", makeElement()],
  ]);
  const calls = [];
  const state = { editor: { regionKind: "room", regionId: "", regionLabel: "" } };
  bindRoomMappingEditorEvents(state, {
    assignRegionSelection: () => calls.push("assign"),
    assignStashSelection: () => calls.push("stash"),
    clearRegionSelection: () => calls.push("clear"),
    clearStashSelection: () => calls.push("clear-stash"),
    documentRef: {
      getElementById(id) {
        return elements.get(id) || null;
      },
    },
    setRegionLabelPosition: () => calls.push("label"),
    setTilemapStatus: () => {},
  });

  elements.get("region-kind-input").listeners[0].fn({ target: { value: "door" } });
  elements.get("region-id-input").listeners[0].fn({ target: { value: "library" } });
  elements.get("region-label-input").listeners[0].fn({ target: { value: "Library" } });
  elements.get("assign-region").listeners[0].fn();
  elements.get("clear-region").listeners[0].fn();
  elements.get("set-region-label-position").listeners[0].fn();
  elements.get("assign-stash").listeners[0].fn();
  elements.get("clear-stash").listeners[0].fn();

  assert.equal(state.editor.regionKind, "door");
  assert.equal(state.editor.regionId, "library");
  assert.equal(state.editor.regionLabel, "Library");
  assert.deepEqual(calls, ["assign", "clear", "label", "stash", "clear-stash"]);
});
