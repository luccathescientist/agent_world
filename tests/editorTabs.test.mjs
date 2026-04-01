import test from "node:test";
import assert from "node:assert/strict";

import {
  bindEditorSubviewTabEvents,
  normalizeEditorSubviewName,
  renderEditorSubviewShell,
} from "../src/features/editor/shared/editorTabs.js";

function makeToggleElement(dataset = {}) {
  const classes = new Set();
  return {
    dataset,
    hidden: false,
    textContent: "",
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
}

test("normalizeEditorSubviewName falls back to tilemap for unknown views", () => {
  assert.equal(normalizeEditorSubviewName("agent"), "agent");
  assert.equal(normalizeEditorSubviewName("unknown"), "tilemap");
});

test("renderEditorSubviewShell updates shell visibility, titles, and layer limits", () => {
  const subtab = makeToggleElement({ editorView: "chat-bubble" });
  const subview = makeToggleElement({ editorViews: "tilemap chat-bubble" });
  const preview = makeToggleElement({ editorPreview: "chat-bubble" });
  const editorOnly = makeToggleElement({ editorOnly: "chat-bubble" });
  const wallLayerButton = makeToggleElement({ layer: "wall" });
  const furnitureLayerButton = makeToggleElement({ layer: "furniture" });
  const visualToolTitle = { textContent: "" };
  const previewTitle = { textContent: "" };
  const texts = new Map();
  const state = {
    editor: {
      activeSubview: "chat-bubble",
      selectedLayer: "furniture",
    },
  };
  renderEditorSubviewShell(state, {
    documentRef: {
      getElementById(id) {
        if (id === "visual-tool-title") return visualToolTitle;
        if (id === "editor-preview-title") return previewTitle;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === ".editor-subtab-btn") return [subtab];
        if (selector === ".editor-subview") return [subview];
        if (selector === ".editor-preview-mode") return [preview];
        if (selector === "[data-editor-only]") return [editorOnly];
        if (selector === "#visual-layer-toggle [data-layer]") return [wallLayerButton, furnitureLayerButton];
        return [];
      },
    },
    setText: (id, value) => texts.set(id, value),
  });
  assert.equal(state.editor.selectedLayer, "wall");
  assert.equal(subtab.classList.contains("active"), true);
  assert.equal(subview.classList.contains("active"), true);
  assert.equal(preview.classList.contains("active"), true);
  assert.equal(editorOnly.hidden, false);
  assert.equal(wallLayerButton.hidden, false);
  assert.equal(furnitureLayerButton.hidden, true);
  assert.equal(visualToolTitle.textContent, "Bubble Tile Palette");
  assert.equal(previewTitle.textContent, "Chat Bubble Preview");
  assert.equal(texts.get("editor-subview-pill"), "Chat Bubble");
});

test("bindEditorSubviewTabEvents wires click handlers to set the active subview", () => {
  const listeners = [];
  const tabButton = {
    dataset: { editorView: "room-mapping" },
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
  };
  const calls = [];
  bindEditorSubviewTabEvents({
    documentRef: {
      querySelectorAll(selector) {
        if (selector === ".editor-subtab-btn") return [tabButton];
        return [];
      },
    },
    setActiveEditorSubview: (viewName) => calls.push(viewName),
  });
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].type, "click");
  listeners[0].fn();
  assert.deepEqual(calls, ["room-mapping"]);
});
