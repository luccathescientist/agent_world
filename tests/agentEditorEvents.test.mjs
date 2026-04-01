import test from "node:test";
import assert from "node:assert/strict";

import { bindAgentEditorEvents } from "../src/features/editor/agent/editorEvents.js";

test("bindAgentEditorEvents wires show-agents checkbox to runtime toggle", () => {
  const listeners = [];
  const state = {
    editor: { showAgents: true },
    world: { agents: [] },
  };
  const calls = [];
  bindAgentEditorEvents(state, {
    documentRef: {
      getElementById(id) {
        if (id !== "toggle-editor-agents") return null;
        return {
          addEventListener(type, fn) {
            listeners.push({ type, fn });
          },
        };
      },
    },
    renderWorld: () => calls.push("render"),
  });
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].type, "change");
  listeners[0].fn({ target: { checked: false } });
  assert.equal(state.editor.showAgents, false);
  assert.deepEqual(calls, ["render"]);
});
