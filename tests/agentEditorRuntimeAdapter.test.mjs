import test from "node:test";
import assert from "node:assert/strict";

import { createAgentEditorRuntime } from "../src/features/editor/agent/editorRuntime.js";

test("agent editor runtime toggles show-agents flag and rerenders world", () => {
  const calls = [];
  const state = {
    editor: { showAgents: true },
    world: { agents: [] },
  };
  const runtime = createAgentEditorRuntime(state, {
    renderWorld: (world) => calls.push(world),
  });
  runtime.setShowAgents(false);
  assert.equal(state.editor.showAgents, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], state.world);
});

test("agent editor runtime skips world render when world state is unavailable", () => {
  const state = {
    editor: { showAgents: false },
    world: null,
  };
  const runtime = createAgentEditorRuntime(state, {
    renderWorld: () => {
      throw new Error("should not be called");
    },
  });
  runtime.setShowAgents(true);
  assert.equal(state.editor.showAgents, true);
});
