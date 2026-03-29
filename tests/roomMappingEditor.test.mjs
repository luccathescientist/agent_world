import test from "node:test";
import assert from "node:assert/strict";

import {
  assignRegionSelection,
  clearRegionSelection,
  deleteRoomRegion,
  resolveRoomRegion,
  setRegionLabelPosition,
} from "../src/features/editor/roomMappingEditor.js";

function makeState() {
  return {
    editor: {
      hoveredRegionId: "",
      regionId: "",
      regionKind: "room",
      regionLabel: "",
      selectedCell: null,
    },
    renderer: { assets: {} },
    roomRegions: [],
  };
}

test("assignRegionSelection creates a normalized region and commits it", () => {
  const state = makeState();
  state.editor.regionId = " Library ";
  state.editor.regionLabel = "Main Library";
  const writes = [];
  const commits = [];
  assignRegionSelection(state, {
    canonicalizeAnchorId: (value) => String(value).trim().toLowerCase(),
    cellsKeySet: (cells) => new Set(cells.map((cell) => `${cell.row}:${cell.col}`)),
    commitDraftTilemap: (message) => commits.push(message),
    getSelectedCells: () => [{ row: 1, col: 2 }, { row: 1, col: 3 }],
    normalizeRoomRegions: (regions) => regions,
    setStoredJson: (key, value) => writes.push([key, value]),
    setTilemapStatus: () => {
      throw new Error("unexpected error status");
    },
  });
  assert.equal(state.roomRegions.length, 1);
  assert.equal(state.roomRegions[0].id, "library");
  assert.equal(state.roomRegions[0].label, "Main Library");
  assert.equal(writes.length, 1);
  assert.deepEqual(commits, ["Assigned 2 cells to room library."]);
});

test("resolveRoomRegion matches by id, label, then selected cell", () => {
  const state = makeState();
  state.roomRegions = [
    { id: "lab", label: "Research Lab", cells: [] },
    { id: "library", label: "Library", cells: [] },
  ];
  assert.equal(
    resolveRoomRegion(state, " LIBRARY ", null, {
      canonicalizeAnchorId: (value) => String(value).trim().toLowerCase(),
      regionForCell: () => null,
    }).id,
    "library",
  );
  assert.equal(
    resolveRoomRegion(state, "research lab", null, {
      canonicalizeAnchorId: (value) => String(value).trim().toLowerCase(),
      regionForCell: () => null,
    }).id,
    "lab",
  );
  assert.equal(
    resolveRoomRegion(state, "", { row: 2, col: 1 }, {
      canonicalizeAnchorId: (value) => String(value).trim().toLowerCase(),
      regionForCell: () => ({ id: "fallback" }),
    }).id,
    "fallback",
  );
});

test("deleteRoomRegion clears hovered selection and commits removal", () => {
  const state = makeState();
  state.editor.hoveredRegionId = "lab";
  state.roomRegions = [{ id: "lab", label: "Lab", cells: [{ row: 0, col: 0 }] }];
  const commits = [];
  deleteRoomRegion(state, "Lab", {
    canonicalizeAnchorId: (value) => String(value).trim().toLowerCase(),
    commitDraftTilemap: (message) => commits.push(message),
    normalizeRoomRegions: (regions) => regions,
    setStoredJson: () => {},
    setTilemapStatus: () => {
      throw new Error("unexpected error status");
    },
  });
  assert.equal(state.roomRegions.length, 0);
  assert.equal(state.editor.hoveredRegionId, "");
  assert.deepEqual(commits, ["Deleted room region lab."]);
});

test("setRegionLabelPosition writes labelCell for resolved region", () => {
  const state = makeState();
  state.editor.regionId = "library";
  state.editor.selectedCell = { row: 4, col: 6 };
  state.roomRegions = [{ id: "library", label: "Library", cells: [{ row: 4, col: 6 }], labelCell: null }];
  const statuses = [];
  setRegionLabelPosition(state, {
    drawRoom: () => {},
    normalizeRoomRegions: (regions) => regions,
    renderVisualEditor: () => {},
    resolveRoomRegion: () => ({ id: "library", label: "Library" }),
    setStoredJson: () => {},
    setTilemapStatus: (message) => statuses.push(message),
  });
  assert.deepEqual(state.roomRegions[0].labelCell, { row: 4, col: 6 });
  assert.deepEqual(statuses, ["Set label position for library to 7:5."]);
});

test("clearRegionSelection removes selected cells and commits", () => {
  const state = makeState();
  state.roomRegions = [
    {
      id: "library",
      label: "Library",
      cells: [{ row: 1, col: 2 }, { row: 1, col: 3 }],
    },
    {
      id: "lab",
      label: "Lab",
      cells: [{ row: 9, col: 9 }],
    },
  ];
  const commits = [];
  clearRegionSelection(state, {
    cellsKeySet: (cells) => new Set(cells.map((cell) => `${cell.row}:${cell.col}`)),
    commitDraftTilemap: (message) => commits.push(message),
    getSelectedCells: () => [{ row: 1, col: 2 }],
    normalizeRoomRegions: (regions) => regions,
    setStoredJson: () => {},
    setTilemapStatus: () => {
      throw new Error("unexpected error status");
    },
  });
  assert.deepEqual(state.roomRegions, [
    {
      id: "library",
      label: "Library",
      cells: [{ row: 1, col: 3 }],
    },
    {
      id: "lab",
      label: "Lab",
      cells: [{ row: 9, col: 9 }],
    },
  ]);
  assert.deepEqual(commits, ["Cleared room mappings from 1 cells."]);
});
