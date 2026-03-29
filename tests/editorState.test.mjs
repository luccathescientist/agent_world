import test from "node:test";
import assert from "node:assert/strict";

import {
  applyEditorState,
  applyVisualToken,
  getAtlasPointerCell,
  getCanvasCellFromEvent,
  resetEditorState,
  resizeGridText,
  setHoveredMapCell,
  setSelectedMapCell,
  setVisualLayer,
} from "../src/features/editor/editorState.js";

function makeEditorState() {
  return {
    editor: {
      baseCols: 8,
      baseFloorText: ". .\n. .",
      baseFurnitureText: ". .\n. .",
      basePropText: ". .\n. .",
      baseRows: 6,
      baseWallText: ". .\n. .",
      draftFloorText: "",
      draftFurnitureText: "",
      draftPropText: "",
      draftWallText: "",
      hoveredCell: null,
      regionId: "",
      regionKind: "room",
      regionLabel: "",
      selectedAtlasCell: null,
      selectedCell: null,
      selectedLayer: "floor",
      selectionAnchor: null,
      selectionFocus: null,
    },
    renderer: {
      assets: {
        layout: {
          cols: 4,
          rows: 4,
        },
      },
    },
    tilemap: {
      layout: {},
    },
  };
}

test("resizeGridText pads missing cells and rows", () => {
  const next = resizeGridText("a b\nc", 3, 2, ".", (row) => row.trim().split(/\s+/), (grid) => grid.map((row) => row.join(" ")).join("\n"));
  assert.equal(next, "a b .\nc . .");
});

test("setVisualLayer falls back to floor for unknown layers", () => {
  const state = makeEditorState();
  let renders = 0;
  setVisualLayer(state, "unknown-layer", {
    renderVisualEditor: () => {
      renders += 1;
    },
  });
  assert.equal(state.editor.selectedLayer, "floor");
  assert.equal(renders, 1);
});

test("setSelectedMapCell updates selection and syncs room metadata", () => {
  const state = makeEditorState();
  const calls = [];
  setSelectedMapCell(state, 3, 5, {
    drawRoom: () => calls.push("draw"),
    regionForCell: () => ({ id: "library", kind: "room", label: "Library" }),
    renderVisualEditor: () => calls.push("render"),
  });
  assert.deepEqual(state.editor.selectedCell, { row: 3, col: 5 });
  assert.deepEqual(state.editor.selectionAnchor, { row: 3, col: 5 });
  assert.deepEqual(state.editor.selectionFocus, { row: 3, col: 5 });
  assert.equal(state.editor.regionId, "library");
  assert.equal(state.editor.regionKind, "room");
  assert.equal(state.editor.regionLabel, "Library");
  assert.deepEqual(calls, ["draw", "render"]);
});

test("setHoveredMapCell avoids redraw when the hovered cell is unchanged", () => {
  const state = makeEditorState();
  let draws = 0;
  setHoveredMapCell(state, 1, 2, {
    drawRoom: () => {
      draws += 1;
    },
  });
  setHoveredMapCell(state, 1, 2, {
    drawRoom: () => {
      draws += 1;
    },
  });
  assert.equal(draws, 1);
  assert.deepEqual(state.editor.hoveredCell, { row: 1, col: 2 });
});

test("applyVisualToken updates all selected cells and commits once", () => {
  const state = makeEditorState();
  state.editor.selectedCell = { row: 0, col: 0 };
  state.editor.selectedLayer = "wall";
  const updates = [];
  const messages = [];
  applyVisualToken(state, "4:2", {
    commitDraftTilemap: (message) => messages.push(message),
    getSelectedCells: () => [{ row: 0, col: 0 }, { row: 0, col: 1 }],
    setTilemapStatus: () => {
      throw new Error("should not set error status");
    },
    updateDraftCell: (layer, row, col, value) => updates.push({ layer, row, col, value }),
  });
  assert.deepEqual(updates, [
    { layer: "wall", row: 0, col: 0, value: "4:2" },
    { layer: "wall", row: 0, col: 1, value: "4:2" },
  ]);
  assert.deepEqual(messages, ["Updated 2 wall cells to 4:2."]);
});

test("applyEditorState normalizes textarea contents before commit", () => {
  const state = makeEditorState();
  const documentRef = {
    getElementById(id) {
      const values = {
        "floor-map-input": { value: "a b  \n\n" },
        "wall-map-input": { value: ". .\n" },
        "furniture-map-input": { value: "c d\n" },
        "prop-map-input": { value: "e f\n" },
      };
      return values[id];
    },
  };
  const commits = [];
  applyEditorState(state, {
    commitDraftTilemap: (message) => commits.push(message),
    documentRef,
  });
  assert.equal(state.editor.draftFloorText, "a b");
  assert.equal(state.editor.draftWallText, ". .");
  assert.equal(state.editor.draftFurnitureText, "c d");
  assert.equal(state.editor.draftPropText, "e f");
  assert.deepEqual(commits, ["Applied draft tilemap."]);
});

test("resetEditorState restores base texts and persists them before reapplying", () => {
  const state = makeEditorState();
  const inputs = {
    "floor-map-input": { value: "" },
    "wall-map-input": { value: "" },
    "furniture-map-input": { value: "" },
    "prop-map-input": { value: "" },
  };
  const writes = [];
  let reapplied = 0;
  resetEditorState(state, {
    applyEditorState: () => {
      reapplied += 1;
    },
    documentRef: {
      getElementById(id) {
        return inputs[id];
      },
    },
    setStoredMap: (key, value) => writes.push([key, value]),
  });
  assert.equal(inputs["floor-map-input"].value, ". .\n. .");
  assert.equal(inputs["wall-map-input"].value, ". .\n. .");
  assert.equal(state.renderer.assets.layout.cols, 8);
  assert.equal(state.renderer.assets.layout.rows, 6);
  assert.equal(reapplied, 1);
  assert.equal(writes.length, 4);
});

test("getAtlasPointerCell converts client coordinates into atlas cells", () => {
  const cell = getAtlasPointerCell({
    clientX: 75,
    clientY: 30,
  }, {
    documentRef: {
      getElementById() {
        return {
          getBoundingClientRect() {
            return { left: 0, top: 0, width: 100, height: 80 };
          },
        };
      },
    },
    getVisualLayerConfig: () => ({ cols: 5, rows: 4 }),
  });
  assert.deepEqual(cell, { x: 4, y: 2 });
});

test("getCanvasCellFromEvent maps pointer position into world tile coordinates", () => {
  const cell = getCanvasCellFromEvent({
    clientX: 80,
    clientY: 48,
  }, {
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 160, height: 96 };
    },
  }, {
    getWorldCols: () => 10,
    getWorldHeight: () => 192,
    getWorldRows: () => 6,
    getWorldWidth: () => 320,
  });
  assert.deepEqual(cell, { row: 3, col: 5 });
});
