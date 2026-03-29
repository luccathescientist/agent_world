import test from "node:test";
import assert from "node:assert/strict";

import {
  applyPathing,
  currentTileForAgent,
  findPath,
  goalTileForAgent,
  nearestWalkableTile,
  roomGoalTile,
  roomIdForAgent,
  tileFromWorldPoint,
  tilePoint,
} from "../src/features/world/pathing.js";

test("roomIdForAgent prefers lounge for idle-like agents", () => {
  assert.equal(
    roomIdForAgent({ visualState: "idle", targetAnchor: "library" }, {
      isIdleLikeAgent: () => true,
    }),
    "lounge",
  );
  assert.equal(
    roomIdForAgent({ visualState: "working", targetAnchor: "library" }, {
      isIdleLikeAgent: () => false,
    }),
    "library",
  );
});

test("roomGoalTile prefers reachable seat cells near the room center", () => {
  const target = roomGoalTile("library", { row: 0, col: 0 }, {
    findPath: () => [{ row: 0, col: 0 }, { row: 1, col: 1 }],
    furnitureTokenAt: (row, col) => (row === 1 && col === 1 ? "chair_e" : "."),
    getAnchorTile: () => ({ row: 5, col: 5 }),
    isWalkable: () => true,
    nearestWalkableTile: (row, col) => ({ row, col }),
    regionCenter: () => ({ row: 1, col: 1 }),
    regionForAnchor: () => ({
      cells: [{ row: 1, col: 1 }, { row: 2, col: 2 }],
    }),
  });
  assert.deepEqual(target, { row: 1, col: 1 });
});

test("nearestWalkableTile expands outward until it finds a walkable cell", () => {
  const state = {
    tilemap: {
      walkableGrid: [
        [false, false, false],
        [false, false, true],
        [false, false, false],
      ],
    },
  };
  const result = nearestWalkableTile(state, 1, 1, {
    inBounds: (row, col) => row >= 0 && col >= 0 && row < 3 && col < 3,
    isWalkable: (row, col) => Boolean(state.tilemap.walkableGrid[row]?.[col]),
  });
  assert.deepEqual(result, { row: 1, col: 2 });
});

test("findPath returns a shortest orthogonal path across walkable cells", () => {
  const walkable = new Set(["0:0", "0:1", "0:2", "1:2", "2:2"]);
  const path = findPath({ row: 0, col: 0 }, { row: 2, col: 2 }, {
    inBounds: (row, col) => row >= 0 && col >= 0 && row < 3 && col < 3,
    isWalkable: (row, col) => walkable.has(`${row}:${col}`),
  });
  assert.deepEqual(path, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 1, col: 2 },
    { row: 2, col: 2 },
  ]);
});

test("tilePoint and tileFromWorldPoint round-trip through tile centers", () => {
  const point = tilePoint(3, 4);
  const tile = tileFromWorldPoint(point.x, point.y, {
    getWorldCols: () => 10,
    getWorldRows: () => 10,
    nearestWalkableTile: (row, col) => ({ row, col }),
  });
  assert.deepEqual(tile, { row: 3, col: 4 });
});

test("goalTileForAgent and currentTileForAgent defer to anchor helpers", () => {
  const goal = goalTileForAgent({ targetAnchor: "library" }, null, {
    roomGoalTile: (anchorId) => ({ row: 2, col: anchorId === "library" ? 3 : 0 }),
  });
  const current = currentTileForAgent({ currentAnchor: "desk" }, {
    getAnchorTile: () => ({ row: 7, col: 8 }),
    nearestWalkableTile: (row, col) => ({ row, col }),
  });
  assert.deepEqual(goal, { row: 2, col: 3 });
  assert.deepEqual(current, { row: 7, col: 8 });
});

test("applyPathing resets stale anchor state and returns the next tile target", () => {
  const state = {};
  const sprite = {
    x: 0,
    y: 0,
    _state: {
      ambientGoalTile: { row: 9, col: 9 },
      ambientPauseUntil: 5000,
      currentAnchorKey: "old",
      currentTile: { row: 0, col: 0 },
      goalKey: "",
      path: [],
      targetAnchorKey: "old",
    },
  };
  const result = applyPathing(state, sprite, {
    currentAnchor: "desk",
    targetAnchor: "desk",
  }, {
    effectiveGoalTileForAgent: () => ({ row: 1, col: 2 }),
    findPath: () => [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    goalTileForAgent: () => ({ row: 0, col: 1 }),
    isWalkable: () => true,
    nearestWalkableTile: (row, col) => ({ row, col }),
    tileFromWorldPoint: () => ({ row: 0, col: 1 }),
    tilePoint,
  });
  assert.deepEqual(sprite._state.currentTile, { row: 0, col: 1 });
  assert.equal(sprite._state.currentAnchorKey, "desk");
  assert.equal(sprite._state.targetAnchorKey, "desk");
  assert.deepEqual(result.nextTile, { row: 1, col: 1 });
  assert.deepEqual(result.goalTile, { row: 1, col: 2 });
  assert.deepEqual(result.target, tilePoint(1, 1));
});
