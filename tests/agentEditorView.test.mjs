import test from "node:test";
import assert from "node:assert/strict";

import { renderAgentEditorView } from "../src/features/editor/agent/editorView.js";

test("renderAgentEditorView syncs show-agents toggle and delegates panel render", () => {
  const toggle = { checked: false };
  let panelCalls = 0;
  renderAgentEditorView({
    editor: { showAgents: true },
  }, {
    documentRef: {
      getElementById(id) {
        if (id === "toggle-editor-agents") return toggle;
        return null;
      },
    },
    renderAgentEditorPanel: () => {
      panelCalls += 1;
    },
  });
  assert.equal(toggle.checked, true);
  assert.equal(panelCalls, 1);
});
