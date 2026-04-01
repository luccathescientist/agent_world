import test from "node:test";
import assert from "node:assert/strict";

import { createTilemapEditorRuntime } from "../src/features/editor/tilemap/editorRuntime.js";

test("tilemap runtime updates draft map text and refreshes visual editor", () => {
  const calls = [];
  const state = { editor: {} };
  const runtime = createTilemapEditorRuntime(state, {
    renderVisualEditor: () => calls.push("render"),
  });
  runtime.updateDraftMap("floor", "a b");
  runtime.updateDraftMap("wall", "c d");
  runtime.updateDraftMap("furniture", "e f");
  runtime.updateDraftMap("prop", "g h");
  assert.equal(state.editor.draftFloorText, "a b");
  assert.equal(state.editor.draftWallText, "c d");
  assert.equal(state.editor.draftFurnitureText, "e f");
  assert.equal(state.editor.draftPropText, "g h");
  assert.equal(calls.length, 4);
});

test("tilemap runtime apply/save/resize routes failures to tilemap status", async () => {
  const messages = [];
  const runtime = createTilemapEditorRuntime({ editor: {} }, {
    applyEditorState: () => {
      throw new Error("apply failed");
    },
    documentRef: {
      getElementById(id) {
        if (id === "grid-cols-input") return { value: "40" };
        if (id === "grid-rows-input") return { value: "20" };
        return null;
      },
    },
    resizeTilemapGrid: () => {
      throw new Error("resize failed");
    },
    saveGameState: async () => {
      throw new Error("save failed");
    },
    setTilemapStatus: (message, isError) => messages.push({ message, isError }),
  });
  runtime.applyTilemap();
  await runtime.saveTilemapGameState();
  runtime.resizeGridFromInputs();
  assert.deepEqual(messages, [
    { message: "apply failed", isError: true },
    { message: "apply failed", isError: true },
    { message: "resize failed", isError: true },
  ]);
});

test("tilemap runtime applies empty token via visual token helper", () => {
  const calls = [];
  const runtime = createTilemapEditorRuntime({ editor: {} }, {
    applyVisualToken: (value) => calls.push(value),
    setTilemapStatus: () => {},
  });
  runtime.applyEmptyToken();
  assert.deepEqual(calls, ["."]);
});
