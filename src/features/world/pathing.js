/*
 * World pathing and movement helpers.
 * This file owns tile/point conversion, walkability checks, pathfinding, and
 * ambient movement goal selection for rendered agents.
 */
import {
  ROOM_LANDMARK_TOKENS,
  SEAT_FURNITURE_TILES,
  TILE_SIZE,
} from "../../core/constants.js";

export function roomIdForAgent(agent, helpers = {}) {
  const { isIdleLikeAgent = () => false } = helpers;
  return isIdleLikeAgent(agent)
    ? "lounge"
    : agent.targetAnchor || agent.currentAnchor || "lounge";
}

export function roomGoalTile(anchorId, startTile = null, helpers = {}) {
  const {
    findPath = () => [],
    furnitureTokenAt = () => ".",
    getAnchorTile = () => ({ row: 0, col: 0 }),
    isWalkable = () => false,
    nearestWalkableTile = (row, col) => ({ row, col }),
    regionCenter = () => null,
    regionForAnchor = () => null,
  } = helpers;
  const region = regionForAnchor(anchorId);
  if (region?.cells?.length && startTile) {
    const center = regionCenter(region);
    const candidates = [];
    for (const cell of region.cells) {
      if (!isWalkable(cell.row, cell.col)) continue;
      const path = findPath(startTile, cell);
      if (!path.length) continue;
      const isSeat = SEAT_FURNITURE_TILES.has(furnitureTokenAt(cell.row, cell.col));
      const centerDistance = center
        ? Math.abs(cell.row - center.row) + Math.abs(cell.col - center.col)
        : 0;
      candidates.push({
        cell,
        pathLength: path.length,
        isSeat,
        centerDistance,
      });
    }
    if (candidates.length) {
      candidates.sort((a, b) => {
        if (a.isSeat !== b.isSeat) return a.isSeat ? -1 : 1;
        if (a.centerDistance !== b.centerDistance) return a.centerDistance - b.centerDistance;
        return a.pathLength - b.pathLength;
      });
      return candidates[0].cell;
    }
  }
  const anchor = getAnchorTile(anchorId);
  return nearestWalkableTile(anchor.row, anchor.col);
}

export function roomWaypointTiles(anchorId, startTile = null, helpers = {}) {
  const {
    findPath = () => [],
    furnitureTokenAt = () => ".",
    inBounds = () => false,
    isWalkable = () => false,
    propTokenAt = () => ".",
    regionCenter = () => null,
    regionForAnchor = () => null,
  } = helpers;
  const region = regionForAnchor(anchorId);
  if (!region?.cells?.length) return [];
  const regionCellKeys = new Set(region.cells.map((cell) => `${cell.row}:${cell.col}`));
  const points = [];
  const seen = new Set();
  const pushPoint = (row, col, type, label) => {
    if (!inBounds(row, col) || !isWalkable(row, col)) return;
    const key = `${row}:${col}`;
    if (seen.has(key)) return;
    if (regionCellKeys.size && !regionCellKeys.has(key)) return;
    if (startTile) {
      const path = findPath(startTile, { row, col });
      if (!path.length) return;
    }
    seen.add(key);
    points.push({ row, col, type, label });
  };

  for (const cell of region.cells) {
    const furnitureToken = furnitureTokenAt(cell.row, cell.col);
    if (SEAT_FURNITURE_TILES.has(furnitureToken)) {
      pushPoint(cell.row, cell.col, "seat", furnitureToken);
    }
    for (const landmark of ROOM_LANDMARK_TOKENS) {
      const token = landmark.layer === "prop" ? propTokenAt(cell.row, cell.col) : furnitureToken;
      if (token === landmark.token) {
        const offset = landmark.offset || { row: 1, col: 0 };
        pushPoint(cell.row + offset.row, cell.col + offset.col, "landmark", landmark.label);
      }
    }
  }

  if (!points.length) {
    const center = regionCenter(region);
    if (center) pushPoint(Math.round(center.row), Math.round(center.col), "center", "center");
  }
  return points;
}

export function tilePoint(row, col) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE - 2,
  };
}

export function tileFromWorldPoint(x, y, helpers = {}) {
  const {
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    nearestWalkableTile = (row, col) => ({ row, col }),
  } = helpers;
  const col = Math.round((x - TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.round((y - (TILE_SIZE - 2)) / TILE_SIZE);
  return nearestWalkableTile(
    Math.max(0, Math.min(getWorldRows() - 1, row)),
    Math.max(0, Math.min(getWorldCols() - 1, col)),
  );
}

export function inBounds(state, row, col, helpers = {}) {
  const {
    getWorldCols = () => 0,
    getWorldRows = () => 0,
  } = helpers;
  return row >= 0 && col >= 0 && row < getWorldRows(state) && col < getWorldCols(state);
}

export function isWalkable(state, row, col) {
  return Boolean(state.tilemap?.walkableGrid?.[row]?.[col]);
}

export function nearestWalkableTile(state, row, col, helpers = {}) {
  const {
    inBounds = () => false,
    isWalkable = () => false,
  } = helpers;
  if (isWalkable(row, col)) return { row, col };
  const visited = new Set([`${row}:${col}`]);
  const queue = [{ row, col }];
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  while (queue.length) {
    const current = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const key = `${nr}:${nc}`;
      if (!inBounds(nr, nc) || visited.has(key)) continue;
      if (isWalkable(nr, nc)) return { row: nr, col: nc };
      visited.add(key);
      queue.push({ row: nr, col: nc });
    }
  }
  return { row, col };
}

export function goalTileForAgent(agent, startTile = null, helpers = {}) {
  const { roomGoalTile = () => null } = helpers;
  return roomGoalTile(agent.targetAnchor || agent.currentAnchor || "lounge", startTile);
}

export function currentTileForAgent(agent, helpers = {}) {
  const {
    getAnchorTile = () => ({ row: 0, col: 0 }),
    nearestWalkableTile = (row, col) => ({ row, col }),
  } = helpers;
  const anchor = getAnchorTile(agent.currentAnchor || agent.targetAnchor || "lounge");
  return nearestWalkableTile(anchor.row, anchor.col);
}

export function findPath(startTile, goalTile, helpers = {}) {
  const {
    inBounds = () => false,
    isWalkable = () => false,
  } = helpers;
  if (!startTile || !goalTile) return [];
  const startKey = `${startTile.row}:${startTile.col}`;
  const goalKey = `${goalTile.row}:${goalTile.col}`;
  if (startKey === goalKey) return [startTile];
  const queue = [startTile];
  const seen = new Set([startKey]);
  const cameFrom = new Map();
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  while (queue.length) {
    const current = queue.shift();
    for (const [dr, dc] of dirs) {
      const next = { row: current.row + dr, col: current.col + dc };
      const key = `${next.row}:${next.col}`;
      if (!inBounds(next.row, next.col) || seen.has(key) || !isWalkable(next.row, next.col)) continue;
      cameFrom.set(key, current);
      if (key === goalKey) {
        const path = [next];
        let cursor = current;
        while (cursor) {
          path.push(cursor);
          const parent = cameFrom.get(`${cursor.row}:${cursor.col}`);
          cursor = parent || null;
        }
        return path.reverse();
      }
      seen.add(key);
      queue.push(next);
    }
  }
  return [];
}

export function effectiveGoalTileForAgent(state, sprite, agent, currentTile, helpers = {}) {
  const {
    nextAmbientRandom = () => 0,
    regionForAnchor = () => null,
    regionForCell = () => null,
    roomGoalTile = () => currentTile,
    roomIdForAgent = () => "lounge",
    roomWaypointTiles = () => [],
  } = helpers;
  const spriteState = sprite._state;
  const desiredRoomId = roomIdForAgent(agent);
  const desiredRegion = regionForAnchor(desiredRoomId);
  const currentRegion = regionForCell(currentTile.row, currentTile.col);
  if (spriteState.ambientRoomKey !== desiredRoomId) {
    spriteState.ambientRoomKey = desiredRoomId;
    spriteState.ambientGoalTile = null;
    spriteState.ambientPauseUntil = 0;
    spriteState.ambientWaypointIndex = 0;
    spriteState.lastAmbientKey = "";
  }
  if (!desiredRegion || currentRegion?.id !== desiredRegion.id) {
    spriteState.ambientGoalTile = null;
    spriteState.ambientPauseUntil = 0;
    return roomGoalTile(desiredRoomId, currentTile);
  }

  const waypoints = roomWaypointTiles(desiredRoomId, currentTile);
  if (!waypoints.length) return roomGoalTile(desiredRoomId, currentTile);

  const now = Date.now();
  const atAmbientGoal = spriteState.ambientGoalTile
    && spriteState.ambientGoalTile.row === currentTile.row
    && spriteState.ambientGoalTile.col === currentTile.col;
  if (atAmbientGoal) {
    if (!spriteState.ambientPauseUntil) {
      spriteState.ambientPauseUntil = now + 900 + Math.round(nextAmbientRandom(state) * 1800);
    }
    if (now < spriteState.ambientPauseUntil) {
      return currentTile;
    }
    spriteState.ambientGoalTile = null;
    spriteState.ambientPauseUntil = 0;
  }
  if (!spriteState.ambientGoalTile) {
    const options = waypoints.filter((point) => point.row !== currentTile.row || point.col !== currentTile.col);
    let pool = options.length ? options : waypoints;
    if (pool.length > 1 && spriteState.lastAmbientKey) {
      const filtered = pool.filter((point) => `${point.row}:${point.col}` !== spriteState.lastAmbientKey);
      if (filtered.length) pool = filtered;
    }
    const ranked = pool
      .map((point) => ({
        point,
        score: nextAmbientRandom(state) + (point.type === "seat" ? 0.12 : point.type === "landmark" ? 0.06 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    const next = ranked[0]?.point || pool[0];
    spriteState.ambientWaypointIndex = (spriteState.ambientWaypointIndex + 1) % pool.length;
    spriteState.ambientGoalTile = { row: next.row, col: next.col };
    spriteState.lastAmbientKey = `${next.row}:${next.col}`;
    spriteState.ambientPauseUntil = 0;
  }
  return spriteState.ambientGoalTile || currentTile;
}

export function applyPathing(state, sprite, agent, helpers = {}) {
  const {
    effectiveGoalTileForAgent = () => null,
    findPath = () => [],
    goalTileForAgent = () => null,
    isWalkable = () => false,
    nearestWalkableTile = (row, col) => ({ row, col }),
    tileFromWorldPoint = () => null,
    tilePoint = () => null,
  } = helpers;
  const spriteState = sprite._state;
  const currentAnchorKey = agent.currentAnchor || "";
  const targetAnchorKey = agent.targetAnchor || agent.currentAnchor || "";
  if (spriteState.currentAnchorKey !== currentAnchorKey) {
    spriteState.currentAnchorKey = currentAnchorKey;
    spriteState.currentTile = tileFromWorldPoint(sprite.x, sprite.y);
    spriteState.path = [spriteState.currentTile];
    spriteState.ambientGoalTile = null;
    spriteState.ambientPauseUntil = 0;
  }
  const fallbackTile = goalTileForAgent(agent, spriteState.currentTile || null);
  const currentTile = spriteState.currentTile && isWalkable(spriteState.currentTile.row, spriteState.currentTile.col)
    ? spriteState.currentTile
    : nearestWalkableTile(fallbackTile.row, fallbackTile.col);
  const goalTile = effectiveGoalTileForAgent(sprite, agent, currentTile);
  const goalKey = `${goalTile.row}:${goalTile.col}`;
  if (spriteState.targetAnchorKey !== targetAnchorKey) {
    spriteState.targetAnchorKey = targetAnchorKey;
    spriteState.goalKey = "";
    spriteState.ambientGoalTile = null;
    spriteState.ambientPauseUntil = 0;
  }
  if (spriteState.goalKey !== goalKey) {
    spriteState.goalKey = goalKey;
    spriteState.path = findPath(currentTile, goalTile);
  }
  if (!spriteState.path?.length) {
    spriteState.path = [currentTile];
  }
  const nextStep = spriteState.path[1] || spriteState.path[0];
  return {
    target: tilePoint(nextStep.row, nextStep.col),
    nextTile: nextStep,
    goalTile,
  };
}
