import test from "node:test";
import assert from "node:assert/strict";

import {
  previewSpriteFrame,
  renderAgentEditorPanel,
  renderEditorSubviews,
  renderVisualEditor,
  renderVisualSelectionPreview,
  setActiveEditorSubview,
  syncEditorInputs,
} from "../src/app/editorShell.js";

test("editor shell forwards subview and input helpers with stateful dependencies", () => {
  const state = { editor: {} };
  const calls = [];
  setActiveEditorSubview(state, "tilemap", {
    drawRoom: () => calls.push("draw"),
    mountRendererView: () => calls.push("mount"),
    renderEditorSubviews: () => calls.push("subviews"),
    renderVisualEditor: () => calls.push("visual"),
    resizeRendererViewport: () => calls.push("resize"),
    setActiveEditorSubviewHelper: (...args) => calls.push(["setSubview", ...args]),
  });
  renderEditorSubviews(state, {
    documentRef: { body: {} },
    renderEditorSubviewsHelper: (...args) => calls.push(["renderSubviews", ...args]),
    setText: () => calls.push("setText"),
  });
  syncEditorInputs(state, {
    documentRef: { body: {} },
    getWorldCols: () => 10,
    getWorldRows: () => 6,
    renderVisualEditor: () => calls.push("renderVisual"),
    setText: () => calls.push("text"),
    syncEditorInputsHelper: (...args) => calls.push(["syncInputs", ...args]),
    syncGameStateTextarea: () => calls.push("syncGame"),
  });
  assert.equal(calls.length, 3);
});

test("editor shell forwards visual editor helpers", () => {
  const state = { editor: {} };
  const calls = [];
  renderVisualSelectionPreview(state, {
    documentRef: { body: {} },
    getAssignedAtlasCell: () => null,
    getAssignedPreviewToken: () => null,
    getDraftCellValue: () => null,
    getVisualLayerConfig: () => ({ label: "Floor" }),
    renderVisualSelectionPreviewHelper: (...args) => calls.push(["preview", ...args]),
    selectedChatBubbleTheme: () => null,
  });
  renderVisualEditor(state, {
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "<div></div>",
    chatBubbleSlotOverlayMarkup: () => "<div></div>",
    deleteRoomRegion: () => {},
    documentRef: { body: {} },
    drawRoom: () => {},
    formatRichTextHtml: (value) => value,
    getAtlasPathForLayer: () => "/atlas.png",
    getDraftCellValue: () => ".",
    getSelectedCells: () => [],
    getVisualLayerConfig: () => ({ label: "Floor" }),
    getWorldCols: () => 10,
    getWorldRows: () => 6,
    normalizeStashPoint: (value) => value,
    populateRegionIdSelect: () => {},
    renderAgentEditorPanel: () => {},
    renderVisualEditorHelper: (...args) => calls.push(["visual", ...args]),
    renderVisualSelectionPreview: () => {},
    selectedChatBubbleTheme: () => null,
    syncRendererCanvasSize: () => {},
  });
  assert.equal(calls.length, 2);
});

test("editor shell forwards agent preview helpers", () => {
  const calls = [];
  const state = { renderer: {} };
  renderAgentEditorPanel(state, {
    documentRef: { body: {} },
    escapeHtml: (value) => String(value),
    previewSpriteFrame: () => ({}),
    renderAgentEditorPanelHelper: (...args) => calls.push(["panel", ...args]),
    setText: () => {},
    shouldShowAgentSprite: () => true,
  });
  previewSpriteFrame(state, { id: "lucca" }, {
    previewSpriteFrameHelper: (...args) => {
      calls.push(["previewSprite", ...args]);
      return "preview";
    },
    previewSpriteFrameName: () => "idle_0",
    shouldMirrorPreviewSprite: () => false,
  });
  assert.equal(calls.length, 2);
});
