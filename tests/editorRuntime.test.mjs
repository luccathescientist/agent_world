import test from "node:test";
import assert from "node:assert/strict";

import { createEditorRuntime } from "../src/app/editorRuntime.js";

test("editor runtime wires editor composition through injected helpers", () => {
  const calls = [];
  const state = {
    editor: { enabled: false, selectedLayer: "floor" },
    world: { agents: [] },
    renderer: {},
  };

  const runtime = createEditorRuntime(state, {
    documentRef: { body: {} },
    setText: () => {},
    setStoredJson: () => {},
    setStoredMap: () => {},
    buildTilemapState: () => ({}),
    canonicalizeAnchorId: (value) => value,
    cellsKeySet: () => new Set(),
    drawRoom: () => calls.push(["drawRoom"]),
    getWorldCols: () => 8,
    getWorldRows: () => 6,
    normalizeRoomRegions: (value) => value,
    normalizeStashPoint: (value) => value,
    populateRegionIdSelect: () => {},
    regionForCell: () => null,
    renderChat: () => calls.push(["renderChat"]),
    renderWorld: () => calls.push(["renderWorld"]),
    resizeRendererViewport: () => calls.push(["resize"]),
    selectedChatBubbleTheme: () => ({}),
    setTilemapStatus: () => {},
    shouldShowAgentSprite: () => true,
    syncGameStateTextarea: () => {},
    syncRendererCanvasSize: () => {},
    applyChatBubbleFrameStyles: () => {},
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "",
    chatBubbleSlotOverlayMarkup: () => "",
    formatRichTextHtml: (value) => value,
    mountRendererView: () => calls.push(["mount"]),
    setActiveEditorSubviewShell: (...args) => calls.push(["setSubview", ...args]),
    renderEditorSubviewsShell: (...args) => calls.push(["renderSubviews", ...args]),
    syncEditorInputsShell: (...args) => calls.push(["syncInputs", ...args]),
    renderVisualSelectionPreviewShell: (...args) => calls.push(["preview", ...args]),
    renderVisualEditorShell: (...args) => calls.push(["renderEditor", ...args]),
    renderAgentEditorPanelShell: (...args) => calls.push(["agentPanel", ...args]),
    previewSpriteFrameShell: (...args) => calls.push(["spritePreview", ...args]),
    assignRegionSelectionAction: (...args) => calls.push(["assignRegion", ...args]),
    commitDraftTilemapAction: (...args) => calls.push(["commitDraft", ...args]),
    applyVisualTokenAction: (...args) => calls.push(["applyToken", ...args]),
    assignStashSelectionAction: (...args) => calls.push(["assignStash", ...args]),
    applyEditorStateHelper: (...args) => calls.push(["applyEditorState", ...args]),
    resetEditorStateHelper: (...args) => calls.push(["resetEditorState", ...args]),
    getAtlasPointerCellHelper: (...args) => calls.push(["atlasPointer", ...args]),
  });

  runtime.setActiveEditorSubview("tilemap");
  runtime.renderEditorSubviews();
  runtime.syncEditorInputs();
  runtime.renderVisualSelectionPreview();
  runtime.renderVisualEditor();
  runtime.renderAgentEditorPanel();
  runtime.previewSpriteFrame({ id: "lucca" });
  runtime.assignRegionSelection();
  runtime.commitDraftTilemap();
  runtime.applyVisualToken(".");
  runtime.assignStashSelection();
  runtime.applyEditorState();
  runtime.resetEditorState();
  runtime.getAtlasPointerCell({ type: "move" });
  runtime.toggleEditMode();

  assert.equal(calls.length, 17);
  assert.equal(state.editor.enabled, true);
});
