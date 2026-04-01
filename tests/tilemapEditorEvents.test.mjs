import test from "node:test";
import assert from "node:assert/strict";

import { bindTilemapEditorEvents } from "../src/features/editor/tilemap/editorEvents.js";

function makeElement() {
  const listeners = [];
  return {
    listeners,
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
  };
}

test("bindTilemapEditorEvents wires tilemap controls to runtime actions", async () => {
  const byId = new Map([
    ["apply-tilemap", makeElement()],
    ["save-game-state", makeElement()],
    ["resize-grid", makeElement()],
    ["visual-token-empty", makeElement()],
    ["floor-map-input", makeElement()],
    ["wall-map-input", makeElement()],
    ["furniture-map-input", makeElement()],
    ["prop-map-input", makeElement()],
    ["grid-cols-input", { value: "30" }],
    ["grid-rows-input", { value: "18" }],
  ]);
  const actions = [];
  const state = { editor: {} };
  bindTilemapEditorEvents(state, {
    applyEditorState: () => actions.push("apply"),
    applyVisualToken: (value) => actions.push(`token:${value}`),
    documentRef: {
      getElementById(id) {
        return byId.get(id) || null;
      },
    },
    renderVisualEditor: () => actions.push("render"),
    resizeTilemapGrid: (cols, rows) => actions.push(`resize:${cols}x${rows}`),
    saveGameState: async () => actions.push("save"),
    setTilemapStatus: () => {},
  });

  byId.get("apply-tilemap").listeners[0].fn();
  await byId.get("save-game-state").listeners[0].fn();
  byId.get("resize-grid").listeners[0].fn();
  byId.get("visual-token-empty").listeners[0].fn();
  byId.get("floor-map-input").listeners[0].fn({ target: { value: "a b" } });

  assert.deepEqual(actions, [
    "apply",
    "apply",
    "save",
    "resize:30x18",
    "token:.",
    "render",
  ]);
  assert.equal(state.editor.draftFloorText, "a b");
});
