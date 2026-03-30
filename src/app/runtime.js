/*
 * App runtime flows for save/load, movement, and command submission.
 * These helpers coordinate stateful app actions that span persistence, HTTP,
 * renderer refreshes, and world selection state.
 */
import { DEFAULT_SELECTED_AGENT_ID, DEFAULT_WORLD_COLS, DEFAULT_WORLD_ROWS } from "../core/constants.js";

export function applyStructuredGameState(state, snapshot, successMessage = "Loaded game state.", deps = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    buildCurrentGameStatePayload = () => ({}),
    buildTilemapState = () => null,
    defaultLayoutConfig = (value) => value,
    drawRoom = () => {},
    normalizePersistenceSnapshot = (value) => value,
    renderWorld = () => {},
    resizeRendererViewport = () => {},
    setTilemapStatus = () => {},
    syncEditorInputs = () => {},
  } = deps;

  if (!snapshot || !state.renderer?.assets?.tileManifest) return;
  const normalized = normalizePersistenceSnapshot(snapshot, snapshot.layout || state.renderer.assets.layout || {});
  const nextLayout = {
    ...defaultLayoutConfig(state.renderer.assets.layout || {}),
    ...(snapshot.layout || {}),
    stash: normalized.stash,
    roomRegions: normalized.roomRegions,
  };
  const nextTilemap = buildTilemapState(
    normalized.floorText,
    normalized.wallText,
    normalized.furnitureText,
    normalized.propText,
    state.renderer.assets.tileManifest,
    nextLayout,
    normalized.roomRegions,
  );
  state.tilemap = nextTilemap;
  state.roomRegions = nextTilemap.layout.roomRegions || [];
  state.chatBubbleThemes = normalized.chatBubbleThemes;
  state.renderer.assets.layout = nextTilemap.layout;
  state.editor.baseFloorText = nextTilemap.floorText;
  state.editor.baseWallText = nextTilemap.wallText;
  state.editor.baseFurnitureText = nextTilemap.furnitureText;
  state.editor.basePropText = nextTilemap.propText;
  state.editor.baseCols = nextTilemap.layout.cols || DEFAULT_WORLD_COLS;
  state.editor.baseRows = nextTilemap.layout.rows || DEFAULT_WORLD_ROWS;
  state.editor.draftFloorText = nextTilemap.floorText;
  state.editor.draftWallText = nextTilemap.wallText;
  state.editor.draftFurnitureText = nextTilemap.furnitureText;
  state.editor.draftPropText = nextTilemap.propText;
  state.gameStateRaw = snapshot.raw || buildCurrentGameStatePayload();
  applyChatBubbleFrameStyles();
  resizeRendererViewport();
  drawRoom(state.renderer);
  if (state.world) renderWorld(state.world);
  syncEditorInputs();
  setTilemapStatus(successMessage);
}

export async function saveGameState(state, deps = {}) {
  const {
    applyStructuredGameState = () => {},
    buildCurrentGameStatePayload = () => ({}),
    postJson = async () => ({}),
    structuredSnapshotFromGameState = () => ({}),
    writeGameStateToLocalStorage = () => {},
  } = deps;

  const payload = buildCurrentGameStatePayload();
  writeGameStateToLocalStorage(payload);
  const response = await postJson("/api/agent-world/game-state", payload);
  const snapshot = structuredSnapshotFromGameState(response, state.renderer?.assets?.layout || {});
  writeGameStateToLocalStorage(snapshot.raw);
  applyStructuredGameState(snapshot, "Saved game state to game_state.json.");
}

export async function moveSelectedAgentToAnchor(state, deps = {}) {
  const {
    currentTileForAgent = () => null,
    documentRef = document,
    findPath = () => [],
    formatTime = (value) => String(value || ""),
    goalTileForAgent = () => null,
    isWalkable = () => false,
    load = async () => {},
    postJson = async () => ({}),
    renderInspector = () => {},
    renderWorld = () => {},
  } = deps;

  const result = documentRef.getElementById("command-result");
  if (!state.selectedAgentId) {
    if (result) result.textContent = "No agent selected.";
    return;
  }
  const select = documentRef.getElementById("move-anchor-select");
  const anchorId = select?.value;
  if (!anchorId) {
    if (result) result.textContent = "No destination selected.";
    return;
  }
  const response = await postJson(`/api/agent-world/agents/${encodeURIComponent(state.selectedAgentId)}/move`, {
    anchorId,
    source: "world-ui",
  });
  let debugSuffix = "";
  if (response.status === "accepted") {
    if (state.world?.agents?.length) {
      state.world = {
        ...state.world,
        agents: state.world.agents.map((agent) => agent.id === state.selectedAgentId ? {
          ...agent,
          targetAnchor: anchorId,
        } : agent),
      };
      renderWorld(state.world);
    }
    if (state.detail?.agent?.id === state.selectedAgentId) {
      state.detail = {
        ...state.detail,
        agent: {
          ...state.detail.agent,
          targetAnchor: anchorId,
        },
      };
      renderInspector(state.detail);
    }
    const sprite = state.renderer?.agents?.get(state.selectedAgentId);
    const agent = state.world?.agents?.find((item) => item.id === state.selectedAgentId);
    if (sprite && agent) {
      const currentTile = sprite._state?.currentTile && isWalkable(sprite._state.currentTile.row, sprite._state.currentTile.col)
        ? sprite._state.currentTile
        : currentTileForAgent(agent);
      const goalTile = goalTileForAgent(agent, currentTile);
      const path = findPath(currentTile, goalTile);
      sprite._state.currentAnchorKey = agent.currentAnchor || "";
      sprite._state.targetAnchorKey = agent.targetAnchor || "";
      sprite._state.currentTile = currentTile;
      sprite._state.goalKey = `${goalTile.row}:${goalTile.col}`;
      sprite._state.path = path.length ? path : [currentTile];
      debugSuffix = ` · path ${sprite._state.path.length} step${sprite._state.path.length === 1 ? "" : "s"} from ${currentTile.col + 1}:${currentTile.row + 1} to ${goalTile.col + 1}:${goalTile.row + 1}`;
    }
  }
  if (result) {
    result.textContent = `${response.status === "accepted" ? "Move set" : "Move rejected"} at ${formatTime(response.acceptedAt)}: ${anchorId}${response.reason ? ` (${response.reason})` : ""}${debugSuffix}`;
  }
  await load();
}

export async function loadApp(state, deps = {}) {
  const {
    connectStream = () => {},
    fetchSettingsData = async () => {},
    getJson = async () => ({}),
    initRenderer = async () => {},
    renderHistory = () => {},
    renderSchedule = () => {},
    renderStash = () => {},
    renderWorld = () => {},
    selectAgent = async () => {},
    syncWorldDetailVisibility = () => {},
  } = deps;

  await initRenderer();
  await fetchSettingsData();
  const worldState = await getJson("/api/agent-world/state");
  renderWorld(worldState);
  if (!state.selectedAgentId) {
    const defaultAgent = worldState?.agents?.find((agent) => agent.id === DEFAULT_SELECTED_AGENT_ID) || worldState?.agents?.[0];
    if (defaultAgent?.id) state.selectedAgentId = defaultAgent.id;
  }
  if (state.selectedAgentId) {
    await selectAgent(state.selectedAgentId);
  } else {
    renderHistory([]);
    renderSchedule(null);
    renderStash([]);
    connectStream();
    syncWorldDetailVisibility();
  }
}

export async function submitCommand(event, deps = {}) {
  const {
    documentRef = document,
    sendCommandText = async () => {},
  } = deps;

  event.preventDefault();
  const input = documentRef.getElementById("command-input");
  const text = input.value.trim();
  if (!text) return;
  await sendCommandText(text);
  input.value = "";
}
