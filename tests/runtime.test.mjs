import test from "node:test";
import assert from "node:assert/strict";

import {
  applyStructuredGameState,
  loadApp,
  moveSelectedAgentToAnchor,
  saveGameState,
  submitCommand,
} from "../src/app/runtime.js";

test("applyStructuredGameState updates state, redraws, and syncs editor values", () => {
  const calls = [];
  const state = {
    renderer: {
      assets: {
        layout: { cols: 8, rows: 6 },
        tileManifest: { a: { kind: "floor" } },
      },
    },
    editor: {},
    world: { agents: [] },
  };
  applyStructuredGameState(state, {
    floorText: "a",
    wallText: ".",
    furnitureText: ".",
    propText: ".",
    raw: { saved: true },
    stash: { row: 1, col: 2 },
    roomRegions: [{ id: "library" }],
    chatBubbleThemes: { assistant: { ok: true } },
  }, "Loaded state.", {
    applyChatBubbleFrameStyles: () => calls.push("themes"),
    buildCurrentGameStatePayload: () => ({ fallback: true }),
    buildTilemapState: () => ({
      floorText: "a",
      wallText: ".",
      furnitureText: ".",
      propText: ".",
      layout: { cols: 12, rows: 9, roomRegions: [{ id: "library" }] },
    }),
    defaultLayoutConfig: () => ({ cols: 4, rows: 4 }),
    drawRoom: (renderer) => calls.push(["draw", renderer]),
    normalizePersistenceSnapshot: (snapshot) => snapshot,
    renderWorld: (world) => calls.push(["world", world]),
    resizeRendererViewport: () => calls.push("resize"),
    setTilemapStatus: (text) => calls.push(["status", text]),
    syncEditorInputs: () => calls.push("sync"),
  });
  assert.equal(state.tilemap.layout.cols, 12);
  assert.equal(state.editor.baseCols, 12);
  assert.equal(state.editor.baseRows, 9);
  assert.deepEqual(state.roomRegions, [{ id: "library" }]);
  assert.deepEqual(state.gameStateRaw, { saved: true });
  assert.deepEqual(calls, [
    "themes",
    "resize",
    ["draw", state.renderer],
    ["world", state.world],
    "sync",
    ["status", "Loaded state."],
  ]);
});

test("saveGameState writes local payload, persists, and reapplies the saved snapshot", async () => {
  const calls = [];
  const state = {
    renderer: {
      assets: {
        layout: { cols: 8, rows: 6 },
      },
    },
  };
  await saveGameState(state, {
    applyStructuredGameState: (snapshot, message) => calls.push(["apply", snapshot, message]),
    buildCurrentGameStatePayload: () => ({ local: true }),
    postJson: async (url, payload) => {
      calls.push(["post", url, payload]);
      return { remote: true };
    },
    structuredSnapshotFromGameState: (response, layout) => ({ raw: { persisted: true }, response, layout }),
    writeGameStateToLocalStorage: (payload) => calls.push(["write", payload]),
  });
  assert.deepEqual(calls, [
    ["write", { local: true }],
    ["post", "/api/agent-world/game-state", { local: true }],
    ["write", { persisted: true }],
    ["apply", { raw: { persisted: true }, response: { remote: true }, layout: { cols: 8, rows: 6 } }, "Saved game state to game_state.json."],
  ]);
});

test("moveSelectedAgentToAnchor updates world, inspector, sprite path, and status text", async () => {
  const worldCalls = [];
  const detailCalls = [];
  const loadCalls = [];
  const result = { textContent: "" };
  const state = {
    selectedAgentId: "lucca",
    world: {
      agents: [{ id: "lucca", currentAnchor: "desk", targetAnchor: "desk" }],
    },
    detail: {
      agent: { id: "lucca", currentAnchor: "desk", targetAnchor: "desk" },
    },
    renderer: {
      agents: new Map([["lucca", { _state: { currentTile: { row: 1, col: 1 } } }]]),
    },
  };
  await moveSelectedAgentToAnchor(state, {
    currentTileForAgent: () => ({ row: 2, col: 2 }),
    documentRef: {
      getElementById(id) {
        if (id === "command-result") return result;
        if (id === "move-anchor-select") return { value: "library" };
        return null;
      },
    },
    findPath: () => [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
    formatTime: () => "12:00",
    goalTileForAgent: () => ({ row: 2, col: 2 }),
    isWalkable: () => true,
    load: async () => loadCalls.push("load"),
    postJson: async () => ({ status: "accepted", acceptedAt: "2025-01-01T00:00:00Z" }),
    renderInspector: (detail) => detailCalls.push(detail),
    renderWorld: (world) => worldCalls.push(world),
  });
  assert.equal(state.world.agents[0].targetAnchor, "library");
  assert.equal(state.detail.agent.targetAnchor, "library");
  assert.equal(state.renderer.agents.get("lucca")._state.goalKey, "2:2");
  assert.equal(state.renderer.agents.get("lucca")._state.path.length, 3);
  assert.match(result.textContent, /Move set at 12:00: library/);
  assert.equal(worldCalls.length, 1);
  assert.equal(detailCalls.length, 1);
  assert.deepEqual(loadCalls, ["load"]);
});

test("loadApp initializes, fetches world state, and selects the default agent", async () => {
  const calls = [];
  const state = {
    selectedAgentId: null,
  };
  await loadApp(state, {
    connectStream: () => calls.push("stream"),
    fetchSettingsData: async () => calls.push("settings"),
    getJson: async (url) => {
      calls.push(["get", url]);
      return {
        agents: [{ id: "lucca-main" }, { id: "other" }],
      };
    },
    initRenderer: async () => calls.push("renderer"),
    renderHistory: (value) => calls.push(["history", value]),
    renderSchedule: (value) => calls.push(["schedule", value]),
    renderStash: (value) => calls.push(["stash", value]),
    renderWorld: (value) => calls.push(["world", value]),
    selectAgent: async (agentId) => calls.push(["select", agentId]),
    syncWorldDetailVisibility: () => calls.push("visibility"),
  });
  assert.equal(state.selectedAgentId, "lucca-main");
  assert.deepEqual(calls, [
    "renderer",
    "settings",
    ["get", "/api/agent-world/state"],
    ["world", { agents: [{ id: "lucca-main" }, { id: "other" }] }],
    ["select", "lucca-main"],
  ]);
});

test("submitCommand prevents default, sends trimmed text, and clears the input", async () => {
  const sent = [];
  const event = {
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
  const input = { value: "  hello world  " };
  await submitCommand(event, {
    documentRef: {
      getElementById(id) {
        if (id === "command-input") return input;
        return null;
      },
    },
    sendCommandText: async (text) => sent.push(text),
  });
  assert.equal(event.prevented, true);
  assert.deepEqual(sent, ["hello world"]);
  assert.equal(input.value, "");
});
