import {
  CANONICAL_ANCHOR_ALIASES,
  DEFAULT_ANCHOR_TILES,
  DEFAULT_WORLD_COLS,
  DEFAULT_WORLD_ROWS,
  TILE_SIZE,
  WORLD_TOP_PADDING,
} from "../../core/constants.js";
import {
  normalizeMapText,
  parseFloorRow,
  parseFloorToken,
  parseMapText,
  parseObjectRow,
  parseObjectToken,
  resolveGridShape,
  validateObjectGrid,
} from "../tilemap/mapText.js";

export function getAnchorTile(state, anchorId) {
  return state.tilemap?.layout?.anchors?.[anchorId] || DEFAULT_ANCHOR_TILES[anchorId] || DEFAULT_ANCHOR_TILES.lounge;
}

export function canonicalizeAnchorId(rawId) {
  const cleaned = String(rawId || "").trim();
  if (!cleaned) return "";
  const compact = cleaned.toLowerCase().replace(/[^a-z]/g, "");
  return CANONICAL_ANCHOR_ALIASES[compact] || cleaned;
}

export function getWorldCols(state) {
  return state.tilemap?.layout?.cols || state.renderer?.assets?.layout?.cols || DEFAULT_WORLD_COLS;
}

export function getWorldRows(state) {
  return state.tilemap?.layout?.rows || state.renderer?.assets?.layout?.rows || DEFAULT_WORLD_ROWS;
}

export function getWorldWidth(state) {
  return getWorldCols(state) * TILE_SIZE;
}

export function getWorldHeight(state) {
  return getWorldRows(state) * TILE_SIZE;
}

export function getSceneTopPadding(state) {
  return state.activeTab === "world" ? WORLD_TOP_PADDING : 0;
}

export function getRenderHeight(state) {
  return getWorldHeight(state) + getSceneTopPadding(state);
}

export function normalizeRegionCells(state, cells) {
  const maxRows = state.renderer?.assets?.layout?.rows || state.tilemap?.layout?.rows || DEFAULT_WORLD_ROWS;
  const maxCols = state.renderer?.assets?.layout?.cols || state.tilemap?.layout?.cols || DEFAULT_WORLD_COLS;
  const rawCells = (cells || [])
    .filter((cell) => Number.isInteger(cell?.row) && Number.isInteger(cell?.col))
    .map((cell) => ({ row: cell.row, col: cell.col }));
  const needsOneBasedShift = rawCells.some((cell) => cell.row >= maxRows || cell.col >= maxCols)
    && rawCells.every((cell) => cell.row > 0 && cell.col > 0);
  const adjusted = needsOneBasedShift
    ? rawCells.map((cell) => ({ row: cell.row - 1, col: cell.col - 1 }))
    : rawCells;
  return adjusted.filter((cell) => cell.row >= 0 && cell.col >= 0 && cell.row < maxRows && cell.col < maxCols);
}

export function normalizeRoomRegions(state, rawRegions) {
  if (!Array.isArray(rawRegions)) return [];
  return rawRegions
    .filter((region) => region && Array.isArray(region.cells) && region.id)
    .map((region) => ({
      id: canonicalizeAnchorId(region.id),
      label: String(region.label || region.id).trim() || String(region.id),
      kind: region.kind === "door" ? "door" : "room",
      cells: normalizeRegionCells(state, region.cells),
      labelCell: normalizeRegionCells(state, region.labelCell ? [region.labelCell] : [])[0] || null,
    }))
    .filter((region) => region.cells.length);
}

export function normalizeStashPoint(state, rawStash) {
  const maxRows = state.renderer?.assets?.layout?.rows || state.tilemap?.layout?.rows || DEFAULT_WORLD_ROWS;
  const maxCols = state.renderer?.assets?.layout?.cols || state.tilemap?.layout?.cols || DEFAULT_WORLD_COLS;
  const row = Number.isInteger(rawStash?.row) ? rawStash.row : 14;
  const col = Number.isInteger(rawStash?.col) ? rawStash.col : 15;
  return {
    row: Math.max(0, Math.min(maxRows - 1, row)),
    col: Math.max(0, Math.min(maxCols - 1, col)),
  };
}

export function cellsKeySet(cells) {
  return new Set(cells.map((cell) => `${cell.row}:${cell.col}`));
}

export function regionForCell(state, row, col) {
  const key = `${row}:${col}`;
  return state.roomRegions.find((region) => region.cells.some((cell) => `${cell.row}:${cell.col}` === key)) || null;
}

export function regionForAnchor(state, anchorId) {
  const canonical = canonicalizeAnchorId(anchorId);
  return state.roomRegions.find((region) => canonicalizeAnchorId(region.id) === canonical) || null;
}

export function furnitureTokenAt(state, row, col) {
  return state.tilemap?.furnitureGrid?.[row]?.[col] || ".";
}

export function propTokenAt(state, row, col) {
  return state.tilemap?.propGrid?.[row]?.[col] || ".";
}

export function regionCenter(region) {
  if (!region?.cells?.length) return null;
  return {
    row: region.cells.reduce((sum, cell) => sum + cell.row, 0) / region.cells.length,
    col: region.cells.reduce((sum, cell) => sum + cell.col, 0) / region.cells.length,
  };
}

export function deriveAnchorsFromRegions(layout, roomRegions) {
  const anchors = {};
  for (const [anchorId, fallback] of Object.entries(DEFAULT_ANCHOR_TILES)) {
    const existing = layout.anchors?.[anchorId];
    anchors[anchorId] = {
      col: existing?.col ?? fallback.col,
      row: existing?.row ?? fallback.row,
      label: existing?.label ?? fallback.label,
    };
  }
  for (const region of roomRegions) {
    if (region.kind !== "room" || !region.cells.length) continue;
    const avgRow = region.cells.reduce((sum, cell) => sum + cell.row, 0) / region.cells.length;
    const avgCol = region.cells.reduce((sum, cell) => sum + cell.col, 0) / region.cells.length;
    const nearest = region.cells.reduce((best, cell) => {
      const score = Math.abs(cell.row - avgRow) + Math.abs(cell.col - avgCol);
      return !best || score < best.score ? { ...cell, score } : best;
    }, null);
    anchors[region.id] = {
      col: nearest?.col ?? anchors[region.id]?.col ?? 0,
      row: nearest?.row ?? anchors[region.id]?.row ?? 0,
      label: region.label || anchors[region.id]?.label || region.id.toUpperCase(),
    };
  }
  return anchors;
}

export function buildTilemapState(
  floorText,
  wallText,
  furnitureText,
  propText,
  manifest,
  layout,
  roomRegions = [],
  deps = {},
) {
  const {
    normalizeRoomRegions: normalizeRoomRegionsRef = (_state, value) => value,
    normalizeStashPoint: normalizeStashPointRef = (_state, value) => value,
    serializeFloorText = normalizeMapText,
    serializeWallText = normalizeMapText,
    state = {},
  } = deps;

  const floorLines = parseMapText(floorText).map(parseFloorRow);
  const wallLines = parseMapText(wallText).map(parseObjectRow);
  const furnitureLines = parseMapText(furnitureText).map(parseObjectRow);
  const propLines = parseMapText(propText).map(parseObjectRow);
  const resolvedShape = resolveGridShape(layout, floorLines, wallLines, furnitureLines, propLines);
  const cols = resolvedShape.cols;
  const rows = resolvedShape.rows;
  validateObjectGrid(floorLines, cols, rows);
  validateObjectGrid(wallLines, cols, rows);
  validateObjectGrid(furnitureLines, cols, rows);
  validateObjectGrid(propLines, cols, rows);

  const walkableGrid = [];
  let walkableTiles = 0;
  let solidTiles = 0;
  let doorTiles = 0;
  for (let row = 0; row < rows; row += 1) {
    const walkRow = [];
    for (let col = 0; col < cols; col += 1) {
      const floorToken = parseFloorToken(floorLines[row][col]);
      const wallToken = parseObjectToken(wallLines[row][col]);
      parseObjectToken(furnitureLines[row][col]);
      parseObjectToken(propLines[row][col]);
      if (floorToken.kind === "code" && (!manifest[floorToken.code] || manifest[floorToken.code].kind !== "floor")) {
        throw new Error(`Unknown floor code "${floorToken.code}" at ${row + 1}:${col + 1}`);
      }
      const passable = floorToken.passable && wallToken.passable;
      walkRow.push(passable);
      if (passable) walkableTiles += 1;
      else solidTiles += 1;
      if (wallToken.door) doorTiles += 1;
    }
    walkableGrid.push(walkRow);
  }

  const normalizedRegions = normalizeRoomRegionsRef(state, roomRegions);
  const nextLayout = {
    ...layout,
    cols,
    rows,
    stash: normalizeStashPointRef(state, layout.stash),
    roomRegions: normalizedRegions,
  };
  nextLayout.anchors = deriveAnchorsFromRegions(nextLayout, normalizedRegions);

  return {
    manifest,
    layout: nextLayout,
    floorText: serializeFloorText(floorText),
    wallText: serializeWallText(wallText),
    furnitureText: normalizeMapText(furnitureText),
    propText: normalizeMapText(propText),
    floorGrid: floorLines,
    wallGrid: wallLines,
    furnitureGrid: furnitureLines,
    propGrid: propLines,
    walkableGrid,
    walkableTiles,
    solidTiles,
    doorTiles,
  };
}
