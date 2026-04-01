import test from "node:test";
import assert from "node:assert/strict";

import {
  bindEditorSharedPanelToggle,
  toggleEditorSharedPanel,
} from "../src/features/editor/shared/editorSharedPanel.js";

test("toggleEditorSharedPanel flips details open state", () => {
  const panel = { open: false };
  const documentRef = {
    getElementById(id) {
      if (id === "editor-shared-panel") return panel;
      return null;
    },
  };
  toggleEditorSharedPanel(documentRef);
  assert.equal(panel.open, true);
  toggleEditorSharedPanel(documentRef);
  assert.equal(panel.open, false);
});

test("bindEditorSharedPanelToggle wires click handler for gear button", () => {
  const panel = { open: false };
  const listeners = [];
  const toggle = {
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
  };
  bindEditorSharedPanelToggle({
    documentRef: {
      getElementById(id) {
        if (id === "editor-shared-toggle") return toggle;
        if (id === "editor-shared-panel") return panel;
        return null;
      },
    },
  });
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].type, "click");
  listeners[0].fn();
  assert.equal(panel.open, true);
});
