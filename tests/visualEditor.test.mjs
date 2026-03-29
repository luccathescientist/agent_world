import test from "node:test";
import assert from "node:assert/strict";

import {
  renderEditorSubviews,
  setActiveEditorSubview,
  syncEditorInputs,
} from "../src/features/editor/visualEditor.js";

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

test("setActiveEditorSubview normalizes invalid view names and refreshes renderer for tilemap views", () => {
  const state = {
    editor: { activeSubview: "agent" },
    renderer: { ok: true },
  };
  const calls = [];
  setActiveEditorSubview(state, "unknown", {
    drawRoom: () => calls.push("draw"),
    mountRendererView: () => calls.push("mount"),
    renderEditorSubviews: () => calls.push("subviews"),
    renderVisualEditor: () => calls.push("visual"),
    resizeRendererViewport: () => calls.push("resize"),
  });
  assert.equal(state.editor.activeSubview, "tilemap");
  assert.deepEqual(calls, ["subviews", "mount", "resize", "draw", "visual"]);
});

test("renderEditorSubviews updates panel visibility and constrains chat bubble layers", () => {
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
  renderEditorSubviews(state, {
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

test("syncEditorInputs mirrors draft text into inputs and refreshes summaries", () => {
  const texts = new Map();
  let synced = 0;
  let rendered = 0;
  const inputs = {
    "floor-map-input": { value: "" },
    "wall-map-input": { value: "" },
    "furniture-map-input": { value: "" },
    "prop-map-input": { value: "" },
  };
  const state = {
    editor: {
      draftFloorText: "a b",
      draftWallText: ". .",
      draftFurnitureText: "c d",
      draftPropText: "e f",
    },
    tilemap: {
      manifest: { a: true, b: true, c: true },
      walkableTiles: 10,
      solidTiles: 4,
      doorTiles: 1,
    },
  };
  syncEditorInputs(state, {
    documentRef: {
      getElementById(id) {
        return inputs[id] || null;
      },
    },
    getWorldCols: () => 12,
    getWorldRows: () => 9,
    renderVisualEditor: () => {
      rendered += 1;
    },
    setText: (id, value) => texts.set(id, value),
    syncGameStateTextarea: () => {
      synced += 1;
    },
  });
  assert.equal(inputs["floor-map-input"].value, "a b");
  assert.equal(inputs["prop-map-input"].value, "e f");
  assert.equal(texts.get("tilemap-summary"), "12x9 grid · 3 codes");
  assert.equal(texts.get("tilemap-walkability"), "10 walkable · 4 solid · 1 doors");
  assert.equal(synced, 1);
  assert.equal(rendered, 1);
});
