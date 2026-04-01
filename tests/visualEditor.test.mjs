import test from "node:test";
import assert from "node:assert/strict";

import {
  renderEditorSubviews,
  renderVisualEditor,
  renderVisualSelectionPreview,
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

test("renderVisualSelectionPreview shows empty-state guidance when nothing is selected", () => {
  const titleEl = { textContent: "" };
  const detailEl = { textContent: "" };
  const ctx = {
    clearRect() {},
    imageSmoothingEnabled: true,
  };
  renderVisualSelectionPreview({
    editor: {
      activeSubview: "tilemap",
      hoveredAtlasCell: null,
      selectedAtlasCell: null,
      selectedCell: null,
      selectedLayer: "floor",
    },
  }, {
    documentRef: {
      getElementById(id) {
        if (id === "visual-selection-preview") {
          return {
            width: 32,
            height: 32,
            getContext() {
              return ctx;
            },
          };
        }
        if (id === "visual-selection-title") return titleEl;
        if (id === "visual-selection-detail") return detailEl;
        return null;
      },
    },
    getAssignedAtlasCell: () => null,
    getAssignedPreviewToken: () => null,
    getDraftCellValue: () => null,
    getVisualLayerConfig: () => ({ label: "Floor" }),
    selectedChatBubbleTheme: () => null,
  });
  assert.equal(titleEl.textContent, "No atlas tile selected");
  assert.match(detailEl.textContent, /Click a map cell/);
  assert.equal(ctx.imageSmoothingEnabled, false);
});

test("renderVisualEditor updates summary fields and atlas state", () => {
  const elements = {
    "selected-map-cell": { textContent: "" },
    "selected-layer-cell": { textContent: "" },
    "hovered-atlas-cell": { textContent: "" },
    "atlas-picker-title": { textContent: "" },
    "atlas-picker-mode": { textContent: "" },
    "atlas-picker-image": {
      _src: "",
      clientWidth: 160,
      clientHeight: 128,
      dataset: {},
      getAttribute(name) {
        return name === "src" ? this._src : null;
      },
      setAttribute(name, value) {
        if (name === "src") this._src = value;
      },
    },
    "atlas-picker-hover": { style: {} },
    "visual-token-empty": { textContent: "" },
    "grid-cols-input": { value: "" },
    "grid-rows-input": { value: "" },
    "editor-zoom-select": { value: "" },
    "toggle-editor-agents": { checked: false },
    "region-kind-input": { value: "" },
    "region-id-input": { value: "" },
    "region-label-input": { value: "" },
    "room-region-summary": { textContent: "" },
    "room-region-list": {
      innerHTML: "",
      querySelectorAll() {
        return [];
      },
    },
    "stash-cell-summary": { textContent: "" },
    "editor-chat-bubble-preview-list": {
      innerHTML: "",
      querySelectorAll() {
        return [];
      },
    },
    "chat-bubble-text-color": { value: "" },
    "chat-bubble-slot-summary": { textContent: "" },
  };
  const layerButton = makeToggleElement({ layer: "floor" });
  const roleButton = makeToggleElement({ role: "assistant" });
  let previewCalls = 0;
  let agentPanelCalls = 0;
  let populateCalls = 0;
  renderVisualEditor({
    editor: {
      activeSubview: "tilemap",
      hoveredAtlasCell: { x: 2, y: 3 },
      hoveredRegionId: "",
      regionKind: "room",
      regionLabel: "Library",
      selectedCell: { row: 4, col: 6 },
      selectedChatBubbleRole: "assistant",
      selectedChatBubbleSlot: "mm",
      selectedLayer: "floor",
      showAgents: true,
      zoom: 2,
    },
    renderer: {
      assets: {
        layout: { stash: { col: 1, row: 2 } },
      },
    },
    roomRegions: [{ id: "library", kind: "room", label: "Library", cells: [{ row: 1, col: 2 }] }],
    tilemap: {
      layout: { stash: { col: 3, row: 4 } },
    },
  }, {
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "<div></div>",
    chatBubbleSlotOverlayMarkup: () => "<div></div>",
    deleteRoomRegion: () => {},
    documentRef: {
      activeElement: null,
      getElementById(id) {
        return elements[id] || null;
      },
      querySelectorAll(selector) {
        if (selector === "#visual-layer-toggle [data-layer]") return [layerButton];
        if (selector === ".chat-bubble-role-btn") return [roleButton];
        return [];
      },
    },
    drawRoom: () => {},
    formatRichTextHtml: (value) => value,
    getAtlasPathForLayer: () => "/atlas/floor.png",
    getDraftCellValue: () => "1:2",
    getSelectedCells: () => [{ row: 4, col: 6 }],
    getVisualLayerConfig: () => ({ cols: 5, rows: 4, label: "Floor", modeLabel: "Atlas", title: "Floor Atlas" }),
    getWorldCols: () => 20,
    getWorldRows: () => 10,
    normalizeStashPoint: (value) => value,
    populateRegionIdSelect: () => {
      populateCalls += 1;
    },
    renderAgentEditorPanel: () => {
      agentPanelCalls += 1;
    },
    renderVisualSelectionPreview: () => {
      previewCalls += 1;
    },
    selectedChatBubbleTheme: () => ({ textColor: "#abcdef" }),
    syncRendererCanvasSize: () => {},
  });
  assert.equal(elements["selected-map-cell"].textContent, "Cell 7:5");
  assert.equal(elements["selected-layer-cell"].textContent, "Floor 1:2");
  assert.equal(elements["hovered-atlas-cell"].textContent, "Atlas 2:3");
  assert.equal(elements["atlas-picker-title"].textContent, "Floor Atlas");
  assert.equal(elements["atlas-picker-image"]._src, "/atlas/floor.png");
  assert.equal(elements["chat-bubble-text-color"].value, "#abcdef");
  assert.equal(elements["stash-cell-summary"].textContent, "Stash 4:5");
  assert.equal(layerButton.classList.contains("active"), true);
  assert.equal(roleButton.classList.contains("active"), true);
  assert.equal(populateCalls, 1);
  assert.equal(agentPanelCalls, 1);
  assert.equal(previewCalls, 1);
});

test("renderVisualEditor hotspot click rerenders via callback and updates chat selection", () => {
  const hotspotListeners = [];
  const elements = {
    "selected-map-cell": { textContent: "" },
    "selected-layer-cell": { textContent: "" },
    "hovered-atlas-cell": { textContent: "" },
    "atlas-picker-title": { textContent: "" },
    "atlas-picker-mode": { textContent: "" },
    "atlas-picker-image": {
      _src: "",
      clientWidth: 160,
      clientHeight: 128,
      dataset: {},
      getAttribute(name) {
        return name === "src" ? this._src : null;
      },
      setAttribute(name, value) {
        if (name === "src") this._src = value;
      },
    },
    "atlas-picker-hover": { style: {} },
    "visual-token-empty": { textContent: "" },
    "grid-cols-input": { value: "" },
    "grid-rows-input": { value: "" },
    "editor-zoom-select": { value: "" },
    "toggle-editor-agents": { checked: true },
    "region-kind-input": { value: "" },
    "region-id-input": { value: "" },
    "region-label-input": { value: "" },
    "room-region-summary": { textContent: "" },
    "room-region-list": {
      innerHTML: "",
      querySelectorAll() {
        return [];
      },
    },
    "stash-cell-summary": { textContent: "" },
    "editor-chat-bubble-preview-list": {
      innerHTML: "",
      querySelectorAll(selector) {
        if (selector === ".chat-item.preview") return [];
        if (selector === ".chat-bubble-slot-hotspot") {
          return [{
            dataset: { role: "tool", slot: "tr" },
            addEventListener(type, fn) {
              hotspotListeners.push({ type, fn });
            },
          }];
        }
        return [];
      },
    },
    "chat-bubble-text-color": { value: "" },
    "chat-bubble-slot-summary": { textContent: "" },
  };
  const layerButton = makeToggleElement({ layer: "floor" });
  let rerenderCalls = 0;
  const state = {
    editor: {
      activeSubview: "chat-bubble",
      hoveredAtlasCell: null,
      hoveredRegionId: "",
      regionKind: "room",
      regionLabel: "Library",
      selectedCell: null,
      selectedChatBubbleRole: "assistant",
      selectedChatBubbleSlot: "mm",
      selectedLayer: "floor",
      showAgents: true,
      zoom: 2,
    },
    renderer: {
      assets: {
        layout: { stash: { col: 1, row: 2 } },
      },
    },
    roomRegions: [],
    tilemap: {
      layout: { stash: { col: 1, row: 2 } },
    },
  };
  renderVisualEditor(state, {
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "<div></div>",
    chatBubbleSlotOverlayMarkup: () => "<button class=\"chat-bubble-slot-hotspot\" data-role=\"tool\" data-slot=\"tr\"></button>",
    deleteRoomRegion: () => {},
    documentRef: {
      activeElement: null,
      getElementById(id) {
        return elements[id] || null;
      },
      querySelectorAll(selector) {
        if (selector === "#visual-layer-toggle [data-layer]") return [layerButton];
        if (selector === ".chat-bubble-role-btn") return [];
        return [];
      },
    },
    drawRoom: () => {},
    formatRichTextHtml: (value) => value,
    getAtlasPathForLayer: () => "/atlas/floor.png",
    getDraftCellValue: () => ".",
    getSelectedCells: () => [],
    getVisualLayerConfig: () => ({ cols: 5, rows: 4, label: "Floor", modeLabel: "Atlas", title: "Floor Atlas" }),
    getWorldCols: () => 20,
    getWorldRows: () => 10,
    normalizeStashPoint: (value) => value,
    populateRegionIdSelect: () => {},
    renderAgentEditorPanel: () => {},
    renderVisualSelectionPreview: () => {},
    rerenderVisualEditor: () => {
      rerenderCalls += 1;
    },
    selectedChatBubbleTheme: () => ({
      frame: {
        tr: { layer: "wall", token: "2:3" },
      },
      textColor: "#fff4d7",
    }),
    syncRendererCanvasSize: () => {},
  });

  assert.equal(hotspotListeners.length, 1);
  hotspotListeners[0].fn();
  assert.equal(state.editor.selectedChatBubbleRole, "tool");
  assert.equal(state.editor.selectedChatBubbleSlot, "tr");
  assert.equal(state.editor.selectedLayer, "wall");
  assert.equal(rerenderCalls, 1);
});
