import test from "node:test";
import assert from "node:assert/strict";

import {
  applyVisualAtlasCell,
  applyVisualToken,
  assignChatBubbleTile,
  assignRegionSelection,
  assignStashSelection,
  clearRegionSelection,
  clearStashSelection,
  commitDraftTilemap,
  deleteRoomRegion,
  getAssignedAtlasCell,
  getAssignedPreviewToken,
  getAtlasPathForLayer,
  getDraftCellValue,
  getDraftFloorLines,
  getDraftObjectLines,
  getSelectedCells,
  getSelectionBounds,
  getVisualLayerConfig,
  resetChatBubbleFrame,
  resolveRoomRegion,
  resizeGridText,
  resizeTilemapGrid,
  setChatBubbleTextColor,
  setHoveredMapCell,
  setRegionLabelPosition,
  setSelectedMapCell,
  setVisualLayer,
  updateDraftCell,
} from "../src/app/editorActions.js";

function makeState() {
  return {
    chatBubbleThemes: {
      assistant: { frame: {}, textColor: "#ffffff" },
    },
    detail: { session: { history: [] } },
    editor: {
      draftFloorText: "a b\nc d",
      draftWallText: ". .\n. .",
      draftFurnitureText: "x y\nz w",
      draftPropText: ". .\n. .",
      hoveredCell: null,
      hoveredRegionId: "",
      regionId: "library",
      regionKind: "room",
      regionLabel: "Library",
      selectedAtlasCell: { x: 2, y: 3 },
      selectedCell: { row: 1, col: 1 },
      selectedChatBubbleRole: "assistant",
      selectedChatBubbleSlot: "mm",
      selectedLayer: "floor",
      selectionAnchor: { row: 0, col: 0 },
      selectionFocus: { row: 1, col: 1 },
    },
    renderer: {
      assets: {
        layout: {
          floorAtlasPath: "/floor.png",
          officeAtlasPath: "/office.png",
          rows: 4,
          cols: 4,
        },
        tileManifest: {},
      },
    },
    roomRegions: [{ id: "library", label: "Library", kind: "room", cells: [{ row: 1, col: 1 }] }],
    tilemap: {
      layout: { stash: { row: 1, col: 2 } },
      manifest: { a: { grid: [4, 5] } },
    },
    world: { agents: [] },
  };
}

test("draft helpers parse, update, and read editor grid text", () => {
  const state = makeState();
  const floorLines = getDraftFloorLines(state, {
    parseFloorRow: (row) => row.split(" "),
    parseMapText: (text) => text.split("\n"),
  });
  const objectLines = getDraftObjectLines(state, "furniture", {
    parseMapText: (text) => text.split("\n"),
    parseObjectRow: (row) => row.split(" "),
  });
  assert.deepEqual(floorLines[0], ["a", "b"]);
  assert.deepEqual(objectLines[1], ["z", "w"]);

  updateDraftCell(state, "floor", 0, 1, "q", {
    getDraftFloorLines: () => [["a", "b"], ["c", "d"]],
    getDraftObjectLines: () => [],
    serializeFloorLines: (lines) => lines.map((row) => row.join(" ")).join("\n"),
    serializeObjectLines: () => "",
  });
  assert.equal(state.editor.draftFloorText, "a q\nc d");

  updateDraftCell(state, "wall", 1, 0, "door", {
    getDraftFloorLines: () => [],
    getDraftObjectLines: () => [[".", "."], [".", "."]],
    serializeFloorLines: () => "",
    serializeObjectLines: (lines) => lines.map((row) => row.join(" ")).join("\n"),
  });
  assert.equal(state.editor.draftWallText, ". .\ndoor .");

  assert.equal(getDraftCellValue(state, "floor", 0, 0, { getDraftFloorLines: () => [["a"]], getDraftObjectLines: () => [] }), "a");
  assert.equal(getDraftCellValue(state, "wall", 0, 0, { getDraftFloorLines: () => [], getDraftObjectLines: () => [["wall"]] }), "wall");
});

test("selection and atlas helpers derive editor state views", () => {
  const state = makeState();
  assert.deepEqual(getSelectionBounds(state), { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 1 });
  assert.deepEqual(getSelectedCells(state, { getSelectionBounds }), [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ]);
  assert.equal(getVisualLayerConfig(state).label, "Floor");
  assert.equal(getAtlasPathForLayer(state, "floor"), "/floor.png");
  assert.equal(getAtlasPathForLayer(state, "furniture"), "/office.png");
  assert.deepEqual(getAssignedAtlasCell(state, "floor", "a", {
    parseFloorToken: () => ({ kind: "code", code: "a" }),
    parseObjectToken: () => ({}),
  }), { x: 5, y: 6 });
  assert.deepEqual(getAssignedPreviewToken("wall", "2:3", {
    parseFloorToken: (value) => ({ floor: value }),
    parseObjectToken: (value) => ({ object: value }),
  }), { object: "2:3" });
});

test("editor action adapters forward helpers with expected dependencies", () => {
  const state = makeState();
  const calls = [];
  assignRegionSelection(state, {
    assignRegionSelectionHelper: (...args) => calls.push(["assignRegion", ...args]),
    canonicalizeAnchorId: (value) => value,
    cellsKeySet: () => new Set(),
    commitDraftTilemap: () => {},
    getSelectedCells: () => [],
    normalizeRoomRegions: (value) => value,
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  resolveRoomRegion(state, "library", null, {
    canonicalizeAnchorId: (value) => value,
    regionForCell: () => null,
    resolveRoomRegionHelper: (...args) => {
      calls.push(["resolveRegion", ...args]);
      return null;
    },
  });
  deleteRoomRegion(state, "library", {
    canonicalizeAnchorId: (value) => value,
    commitDraftTilemap: () => {},
    deleteRoomRegionHelper: (...args) => calls.push(["deleteRegion", ...args]),
    normalizeRoomRegions: (value) => value,
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  clearRegionSelection(state, {
    cellsKeySet: () => new Set(),
    clearRegionSelectionHelper: (...args) => calls.push(["clearRegion", ...args]),
    commitDraftTilemap: () => {},
    getSelectedCells: () => [],
    normalizeRoomRegions: (value) => value,
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  commitDraftTilemap(state, "Saved", {
    buildTilemapState: () => ({}),
    commitDraftTilemapHelper: (...args) => calls.push(["commit", ...args]),
    drawRoom: () => {},
    renderWorld: () => {},
    resizeRendererViewport: () => {},
    setStoredJson: () => {},
    setStoredMap: () => {},
    setTilemapStatus: () => {},
    syncEditorInputs: () => {},
  });
  assert.equal(calls.length, 5);
});

test("editor action helpers cover grid resize, visual application, and stash/chat flows", () => {
  const state = makeState();
  const calls = [];
  assert.equal(
    resizeGridText("a\nb", 2, 2, ".", (row) => row.split(" "), (grid) => grid.map((row) => row.join(" ")).join("\n"), {
      parseMapText: (text) => text.split("\n"),
      resizeGridTextHelper: (...args) => {
        calls.push(["resizeText", ...args]);
        return "resized";
      },
    }),
    "resized",
  );
  resizeTilemapGrid(state, 4, 4, {
    buildTilemapState: () => ({}),
    drawRoom: () => {},
    getWorldCols: () => 4,
    getWorldRows: () => 4,
    parseFloorRow: (value) => value,
    parseObjectRow: (value) => value,
    renderWorld: () => {},
    resizeGridText: () => "",
    resizeRendererViewport: () => {},
    resizeTilemapGridHelper: (...args) => calls.push(["resizeGrid", ...args]),
    serializeFloorLines: (value) => value,
    serializeObjectLines: (value) => value,
    setStoredJson: () => {},
    setStoredMap: () => {},
    setTilemapStatus: () => {},
    syncEditorInputs: () => {},
  });
  applyVisualToken(state, "2:3", {
    applyVisualTokenHelper: (...args) => calls.push(["applyToken", ...args]),
    commitDraftTilemap: () => {},
    getSelectedCells: () => [],
    setTilemapStatus: () => {},
    updateDraftCell: () => {},
  });
  applyVisualAtlasCell(state, { x: 2, y: 3 }, {
    applyVisualAtlasCellHelper: (...args) => calls.push(["applyAtlas", ...args]),
    applyVisualToken: () => {},
  });
  assignChatBubbleTile(state, {
    applyChatBubbleFrameStyles: () => {},
    assignChatBubbleTileHelper: (...args) => calls.push(["assignBubble", ...args]),
    renderChat: () => {},
    renderVisualEditor: () => {},
    selectedChatBubbleTheme: () => state.chatBubbleThemes.assistant,
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  resetChatBubbleFrame(state, {
    applyChatBubbleFrameStyles: () => {},
    normalizeChatBubbleTheme: (value) => value,
    renderChat: () => {},
    renderVisualEditor: () => {},
    resetChatBubbleFrameHelper: (...args) => calls.push(["resetBubble", ...args]),
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  setChatBubbleTextColor(state, "#abcdef", {
    applyChatBubbleFrameStyles: () => {},
    renderChat: () => {},
    renderVisualEditor: () => {},
    selectedChatBubbleTheme: () => state.chatBubbleThemes.assistant,
    setChatBubbleTextColorHelper: (...args) => calls.push(["bubbleColor", ...args]),
    setStoredJson: () => {},
  });
  setVisualLayer(state, "wall", {
    renderVisualEditor: () => {},
    setVisualLayerHelper: (...args) => calls.push(["layer", ...args]),
  });
  setSelectedMapCell(state, 2, 2, {
    drawRoom: () => {},
    regionForCell: () => null,
    renderVisualEditor: () => {},
    setSelectedMapCellHelper: (...args) => calls.push(["selectCell", ...args]),
  });
  setHoveredMapCell(state, 2, 2, {
    drawRoom: () => {},
    setHoveredMapCellHelper: (...args) => calls.push(["hoverCell", ...args]),
  });
  assignStashSelection(state, {
    assignStashSelectionHelper: (...args) => calls.push(["assignStash", ...args]),
    drawRoom: () => {},
    normalizeStashPoint: (value) => value,
    renderVisualEditor: () => {},
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  clearStashSelection(state, {
    clearStashSelectionHelper: (...args) => calls.push(["clearStash", ...args]),
    drawRoom: () => {},
    normalizeStashPoint: (value) => value,
    renderVisualEditor: () => {},
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  setRegionLabelPosition(state, {
    drawRoom: () => {},
    normalizeRoomRegions: (value) => value,
    renderVisualEditor: () => {},
    resolveRoomRegion: () => null,
    setRegionLabelPositionHelper: (...args) => calls.push(["labelPos", ...args]),
    setStoredJson: () => {},
    setTilemapStatus: () => {},
  });
  assert.ok(calls.length >= 11);
});
