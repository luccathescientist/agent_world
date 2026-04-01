import test from "node:test";
import assert from "node:assert/strict";

import { bindEditorEvents } from "../src/features/editor/shared/editorEvents.js";

test("bindEditorEvents orchestrates all editor binders", () => {
  const state = { editor: {} };
  const calls = [];
  bindEditorEvents(state, {
    bindAgentEditorEventsHelper: (...args) => calls.push(["agent", ...args]),
    bindChatBubbleEditorEventsHelper: (...args) => calls.push(["chat", ...args]),
    bindEditorSharedPanelToggleHelper: (...args) => calls.push(["panel", ...args]),
    bindEditorSubviewTabEventsHelper: (...args) => calls.push(["tabs", ...args]),
    bindEditorUtilitiesEventsHelper: (...args) => calls.push(["utils", ...args]),
    bindRoomMappingEditorEventsHelper: (...args) => calls.push(["room", ...args]),
    bindTilemapEditorEventsHelper: (...args) => calls.push(["tilemap", ...args]),
    bindVisualWorkspaceEventsHelper: (...args) => calls.push(["workspace", ...args]),
    documentRef: { body: {} },
  });
  assert.equal(calls.length, 8);
  assert.deepEqual(calls.map((entry) => entry[0]), [
    "tabs",
    "panel",
    "tilemap",
    "room",
    "agent",
    "chat",
    "utils",
    "workspace",
  ]);
  for (const entry of calls) {
    if (entry[0] === "tabs" || entry[0] === "panel") continue;
    assert.equal(entry[1], state);
  }
});
