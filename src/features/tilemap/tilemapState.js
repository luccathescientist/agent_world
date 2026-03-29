import {
  DEFAULT_CHAT_BUBBLE_FRAME,
  DEFAULT_FLOOR_ATLAS_PATH,
  DEFAULT_OFFICE_ATLAS_PATH,
  DEFAULT_WALL_ATLAS_PATH,
  DEFAULT_WORLD_COLS,
  DEFAULT_WORLD_ROWS,
  GAME_STATE_STORAGE_KEYS,
  TILE_SIZE,
  TILEMAP_STORAGE_KEYS,
} from "../../core/constants.js";
import { normalizeMapText, parseMapText } from "./mapText.js";

export function normalizePersistenceSnapshot(rawValue = {}, layout = {}, helpers = {}) {
  const {
    normalizeRoomRegions = (value) => value,
    normalizeStashPoint = (value) => value,
    normalizeChatBubbleThemes = (value) => value,
  } = helpers;
  return {
    floorText: normalizeMapText(rawValue.floorText || ""),
    wallText: normalizeMapText(rawValue.wallText || ""),
    furnitureText: normalizeMapText(rawValue.furnitureText || ""),
    propText: normalizeMapText(rawValue.propText || ""),
    roomRegions: normalizeRoomRegions(rawValue.roomRegions || layout.roomRegions || []),
    stash: normalizeStashPoint(rawValue.stash || layout.stash || { col: 15, row: 14 }),
    chatBubbleThemes: normalizeChatBubbleThemes(rawValue.chatBubbleThemes || layout.chatBubbleThemes || DEFAULT_CHAT_BUBBLE_FRAME),
  };
}

export function defaultLayoutConfig(layout = {}) {
  return {
    name: layout.name || "Lucca Research Office",
    tileSize: layout.tileSize || TILE_SIZE,
    cols: layout.cols || DEFAULT_WORLD_COLS,
    rows: layout.rows || DEFAULT_WORLD_ROWS,
    emptyObject: layout.emptyObject || ".",
    atlasTileSize: layout.atlasTileSize || TILE_SIZE,
    floorAtlasPath: layout.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH,
    officeAtlasPath: layout.officeAtlasPath || DEFAULT_OFFICE_ATLAS_PATH,
    wallAtlasPath: layout.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH,
    anchors: layout.anchors || {},
  };
}

export function peekParsedValue(rawValue, fallback) {
  if (typeof rawValue !== "string" || !rawValue.trim()) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

export function structuredSnapshotFromGameState(rawGameState = {}, fallbackLayout = {}, helpers = {}) {
  const {
    normalizeRoomRegions = (value) => value,
    normalizeStashPoint = (value) => value,
    normalizeChatBubbleThemes = (value) => value,
  } = helpers;
  const layoutConfig = peekParsedValue(rawGameState["agent-world-layout-config"], defaultLayoutConfig(fallbackLayout));
  const normalizedLayout = {
    ...defaultLayoutConfig(fallbackLayout),
    ...(layoutConfig && typeof layoutConfig === "object" ? layoutConfig : {}),
  };
  return {
    floorText: normalizeMapText(rawGameState[TILEMAP_STORAGE_KEYS.floor] || ""),
    wallText: normalizeMapText(rawGameState[TILEMAP_STORAGE_KEYS.wall] || ""),
    furnitureText: normalizeMapText(rawGameState[TILEMAP_STORAGE_KEYS.furniture] || ""),
    propText: normalizeMapText(rawGameState[TILEMAP_STORAGE_KEYS.prop] || ""),
    roomRegions: normalizeRoomRegions(peekParsedValue(rawGameState[TILEMAP_STORAGE_KEYS.roomRegions], [])),
    stash: normalizeStashPoint(peekParsedValue(rawGameState[TILEMAP_STORAGE_KEYS.stash], fallbackLayout.stash || { col: 15, row: 14 })),
    chatBubbleThemes: normalizeChatBubbleThemes(peekParsedValue(rawGameState[TILEMAP_STORAGE_KEYS.chatBubbleFrame], fallbackLayout.chatBubbleThemes || DEFAULT_CHAT_BUBBLE_FRAME)),
    movementOverrides: peekParsedValue(rawGameState["agent-world-movement-overrides"], { agents: {} }),
    layout: normalizedLayout,
    raw: rawGameState,
  };
}

export function parseImportedAgentWorldStorageState(rawValue) {
  const source = String(rawValue || "").trim();
  if (!source) {
    throw new Error("Paste the exported JSON first.");
  }

  const candidates = [source];
  if (
    (source.startsWith("'") && source.endsWith("'"))
    || (source.startsWith('"') && source.endsWith('"'))
  ) {
    candidates.push(source.slice(1, -1));
  }

  let currentError = null;
  for (const candidate of candidates) {
    try {
      let parsed = JSON.parse(candidate);
      while (typeof parsed === "string") {
        const next = parsed.trim();
        if (!next) break;
        parsed = JSON.parse(next);
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Imported state must be a JSON object.");
      }
      return parsed;
    } catch (error) {
      currentError = error;
    }
  }
  throw new Error(`Could not parse imported state: ${currentError?.message || "invalid JSON"}`);
}

export function applyImportedAgentWorldStorageState(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Imported state must be a JSON object.");
  }
  for (const key of GAME_STATE_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage failures
    }
  }
  for (const [key, value] of Object.entries(payload)) {
    if (!GAME_STATE_STORAGE_KEYS.includes(String(key))) continue;
    try {
      if (value == null) continue;
      localStorage.setItem(key, String(value));
    } catch {
      // ignore storage failures
    }
  }
}

export function currentLayoutConfigPayload(state, helpers = {}) {
  const {
    getWorldCols = () => state.tilemap?.layout?.cols || DEFAULT_WORLD_COLS,
    getWorldRows = () => state.tilemap?.layout?.rows || DEFAULT_WORLD_ROWS,
  } = helpers;
  const layout = state.tilemap?.layout || state.renderer?.assets?.layout || {};
  return defaultLayoutConfig({
    ...layout,
    cols: getWorldCols(),
    rows: getWorldRows(),
    anchors: state.tilemap?.layout?.anchors || layout.anchors || {},
    name: state.world?.room?.name || layout.name || "Lucca Research Office",
  });
}

export function buildCurrentGameStatePayload(state, helpers = {}) {
  const {
    currentLayoutConfigPayload: getLayoutPayload = () => currentLayoutConfigPayload(state),
    normalizeStashPoint = (value) => value,
    peekStoredMap = () => "",
  } = helpers;
  const movementOverrides = state.gameStateRaw["agent-world-movement-overrides"] || peekStoredMap("agent-world-movement-overrides") || JSON.stringify({ agents: {} }, null, 2);
  return {
    [TILEMAP_STORAGE_KEYS.floor]: normalizeMapText(state.editor.draftFloorText || state.tilemap?.floorText || ""),
    [TILEMAP_STORAGE_KEYS.wall]: normalizeMapText(state.editor.draftWallText || state.tilemap?.wallText || ""),
    [TILEMAP_STORAGE_KEYS.furniture]: normalizeMapText(state.editor.draftFurnitureText || state.tilemap?.furnitureText || ""),
    [TILEMAP_STORAGE_KEYS.prop]: normalizeMapText(state.editor.draftPropText || state.tilemap?.propText || ""),
    [TILEMAP_STORAGE_KEYS.roomRegions]: JSON.stringify(state.roomRegions || [], null, 2),
    [TILEMAP_STORAGE_KEYS.stash]: JSON.stringify(
      normalizeStashPoint(state.tilemap?.layout?.stash || state.renderer?.assets?.layout?.stash || { col: 15, row: 14 }),
      null,
      2,
    ),
    [TILEMAP_STORAGE_KEYS.chatBubbleFrame]: JSON.stringify(state.chatBubbleThemes || DEFAULT_CHAT_BUBBLE_FRAME, null, 2),
    "agent-world-layout-config": JSON.stringify(getLayoutPayload(), null, 2),
    "agent-world-movement-overrides": movementOverrides,
  };
}

export function syncGameStateTextarea(state, helpers = {}) {
  const { buildCurrentGameStatePayload: buildPayload = () => buildCurrentGameStatePayload(state) } = helpers;
  const textarea = document.getElementById("tilemap-state-json");
  if (state.tilemap) state.gameStateRaw = buildPayload();
  if (textarea && document.activeElement !== textarea) {
    textarea.value = JSON.stringify(state.gameStateRaw, null, 2);
  }
  const status = document.getElementById("tilemap-source-status");
  if (status) status.textContent = `Game state JSON · ${Object.keys(state.gameStateRaw).length} keys`;
}

export function writeGameStateToLocalStorage(state, payload, helpers = {}) {
  const { syncGameStateTextarea: syncTextarea = () => syncGameStateTextarea(state) } = helpers;
  for (const key of GAME_STATE_STORAGE_KEYS) {
    if (!(key in payload)) continue;
    localStorage.setItem(key, String(payload[key]));
  }
  state.gameStateRaw = { ...payload };
  syncTextarea();
}

export function countImportedGameStateKeys(rawValue) {
  return Object.keys(rawValue || {}).length;
}

export function hasUsableImportedTilemap(snapshot) {
  return Boolean(snapshot.floorText || snapshot.wallText || snapshot.furnitureText || snapshot.propText);
}

export function normalizeDraftTextRows(text) {
  return parseMapText(text);
}
