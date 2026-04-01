import test from "node:test";
import assert from "node:assert/strict";

import { createRoomMappingEditorRuntime } from "../src/features/editor/roomMapping/editorRuntime.js";

test("room-mapping runtime updates region form state", () => {
  const state = { editor: { regionKind: "room", regionId: "", regionLabel: "" } };
  const runtime = createRoomMappingEditorRuntime(state);
  runtime.updateRegionKind("door");
  runtime.updateRegionId("library");
  runtime.updateRegionLabel("Library");
  assert.equal(state.editor.regionKind, "door");
  assert.equal(state.editor.regionId, "library");
  assert.equal(state.editor.regionLabel, "Library");
});

test("room-mapping runtime wraps action errors with tilemap status", () => {
  const messages = [];
  const runtime = createRoomMappingEditorRuntime({ editor: {} }, {
    assignRegionSelection: () => {
      throw new Error("assign failed");
    },
    assignStashSelection: () => {
      throw new Error("stash failed");
    },
    clearRegionSelection: () => {
      throw new Error("clear failed");
    },
    clearStashSelection: () => {
      throw new Error("clear stash failed");
    },
    setRegionLabelPosition: () => {
      throw new Error("label failed");
    },
    setTilemapStatus: (message, isError) => messages.push({ message, isError }),
  });
  runtime.assignRegion();
  runtime.clearRegion();
  runtime.placeRegionLabel();
  runtime.assignStash();
  runtime.clearStash();
  assert.deepEqual(messages, [
    { message: "assign failed", isError: true },
    { message: "clear failed", isError: true },
    { message: "label failed", isError: true },
    { message: "stash failed", isError: true },
    { message: "clear stash failed", isError: true },
  ]);
});
