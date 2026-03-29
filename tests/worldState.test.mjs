import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTilemapState,
  canonicalizeAnchorId,
  cellsKeySet,
  deriveAnchorsFromRegions,
  getRenderHeight,
  getSceneTopPadding,
  getWorldCols,
  getWorldHeight,
  getWorldRows,
  getWorldWidth,
  normalizeRoomRegions,
  normalizeStashPoint,
  regionCenter,
  regionForAnchor,
  regionForCell,
} from "../src/features/world/worldState.js";

test("canonicalizeAnchorId normalizes common aliases", () => {
  assert.equal(canonicalizeAnchorId(" communications "), "comms");
  assert.equal(canonicalizeAnchorId("work desk"), "desk");
  assert.equal(canonicalizeAnchorId(""), "");
});

test("normalizeRoomRegions clamps bounds and converts one-based coordinates", () => {
  const state = {
    renderer: {
      assets: {
        layout: { rows: 4, cols: 5 },
      },
    },
  };
  const regions = normalizeRoomRegions(state, [
    {
      id: "communications",
      label: "Comms",
      cells: [{ row: 1, col: 1 }, { row: 4, col: 5 }, { row: 9, col: 9 }],
      labelCell: { row: 2, col: 2 },
    },
  ]);
  assert.equal(regions[0].id, "comms");
  assert.deepEqual(regions[0].cells, [{ row: 0, col: 0 }, { row: 3, col: 4 }]);
  assert.deepEqual(regions[0].labelCell, { row: 2, col: 2 });
});

test("normalizeStashPoint keeps stash within world bounds", () => {
  const state = {
    tilemap: {
      layout: { rows: 6, cols: 8 },
    },
  };
  assert.deepEqual(normalizeStashPoint(state, { row: -1, col: 99 }), { row: 0, col: 7 });
  assert.deepEqual(normalizeStashPoint(state, {}), { row: 5, col: 7 });
});

test("region selectors and center helpers use normalized room state", () => {
  const state = {
    roomRegions: [
      {
        id: "comms",
        cells: [{ row: 1, col: 2 }, { row: 1, col: 3 }],
      },
    ],
  };
  assert.equal(regionForCell(state, 1, 3)?.id, "comms");
  assert.equal(regionForAnchor(state, "communications")?.id, "comms");
  assert.deepEqual(regionCenter(state.roomRegions[0]), { row: 1, col: 2.5 });
  assert.deepEqual(cellsKeySet(state.roomRegions[0].cells), new Set(["1:2", "1:3"]));
});

test("world dimension selectors derive tile and render sizes from state", () => {
  const state = {
    activeTab: "world",
    tilemap: {
      layout: { cols: 10, rows: 6 },
    },
  };
  assert.equal(getWorldCols(state), 10);
  assert.equal(getWorldRows(state), 6);
  assert.equal(getWorldWidth(state), 320);
  assert.equal(getWorldHeight(state), 192);
  assert.equal(getSceneTopPadding(state), 48);
  assert.equal(getRenderHeight(state), 240);
});

test("deriveAnchorsFromRegions preserves defaults and adds region anchors", () => {
  const anchors = deriveAnchorsFromRegions(
    { anchors: { lounge: { row: 9, col: 10, label: "Lounge" } } },
    [
      {
        id: "library",
        kind: "room",
        label: "Library",
        cells: [{ row: 2, col: 3 }, { row: 2, col: 4 }, { row: 3, col: 3 }],
      },
    ],
  );
  assert.deepEqual(anchors.library, { row: 2, col: 3, label: "Library" });
  assert.deepEqual(anchors.lounge, { row: 9, col: 10, label: "Lounge" });
});

test("buildTilemapState parses layers, counts walkable tiles, and derives anchors", () => {
  const state = {
    renderer: {
      assets: {
        layout: { rows: 2, cols: 2 },
      },
    },
  };
  const tilemap = buildTilemapState(
    "a a\na a",
    ". door\nwall .",
    ". .\n. .",
    ". .\n. .",
    { a: { kind: "floor" } },
    { stash: { row: 7, col: -1 } },
    [{ id: "Library", label: "Library", kind: "room", cells: [{ row: 1, col: 1 }, { row: 1, col: 2 }] }],
    {
      normalizeRoomRegions,
      normalizeStashPoint,
      state,
    },
  );
  assert.equal(tilemap.walkableTiles, 3);
  assert.equal(tilemap.solidTiles, 1);
  assert.equal(tilemap.doorTiles, 1);
  assert.deepEqual(tilemap.layout.stash, { row: 1, col: 0 });
  assert.equal(tilemap.layout.roomRegions[0].id, "library");
  assert.deepEqual(tilemap.layout.anchors.library, { row: 0, col: 0, label: "Library" });
  assert.equal(tilemap.floorText, "a a\na a");
  assert.equal(tilemap.wallText, ". door\nwall .");
});
