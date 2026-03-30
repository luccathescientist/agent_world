import test from "node:test";
import assert from "node:assert/strict";

import {
  applyImportedAgentWorldStorageState,
  buildCurrentGameStatePayload,
  currentLayoutConfigPayload,
  defaultLayoutConfig,
  parseImportedAgentWorldStorageState,
  peekParsedValue,
  structuredSnapshotFromGameState,
} from "../src/features/tilemap/tilemapState.js";

test("defaultLayoutConfig fills missing layout fields with defaults", () => {
  const layout = defaultLayoutConfig({ cols: 10, name: "Test Lab" });
  assert.equal(layout.name, "Test Lab");
  assert.equal(layout.cols, 10);
  assert.equal(layout.rows, 18);
  assert.equal(layout.tileSize, 32);
});

test("peekParsedValue returns fallback for invalid JSON", () => {
  assert.deepEqual(peekParsedValue("", { ok: true }), { ok: true });
  assert.deepEqual(peekParsedValue("{bad", { ok: true }), { ok: true });
  assert.deepEqual(peekParsedValue('{"ok":true}', { ok: false }), { ok: true });
});

test("parseImportedAgentWorldStorageState accepts plain and quoted JSON", () => {
  assert.deepEqual(parseImportedAgentWorldStorageState('{"a":"1"}'), { a: "1" });
  assert.deepEqual(parseImportedAgentWorldStorageState('"{\\"a\\":\\"1\\"}"'), { a: "1" });
  assert.throws(() => parseImportedAgentWorldStorageState(""), /Paste the exported JSON first/);
});

test("structuredSnapshotFromGameState normalizes layout and nested state via helpers", () => {
  const snapshot = structuredSnapshotFromGameState(
    {
      "agent-world-floor-map": "a b",
      "agent-world-room-regions": JSON.stringify([{ id: "library" }]),
      "agent-world-stash-point": JSON.stringify({ col: 3, row: 4 }),
      "agent-world-chat-bubble-frame": JSON.stringify({ assistant: true }),
      "agent-world-layout-config": JSON.stringify({ cols: 12, rows: 9 }),
    },
    { name: "Fallback" },
    {
      normalizeRoomRegions: (value) => [{ wrapped: value.length }],
      normalizeStashPoint: (value) => ({ ...value, normalized: true }),
      normalizeChatBubbleThemes: (value) => ({ wrapped: value }),
    },
  );
  assert.equal(snapshot.floorText, "a b");
  assert.deepEqual(snapshot.roomRegions, [{ wrapped: 1 }]);
  assert.deepEqual(snapshot.stash, { col: 3, row: 4, normalized: true });
  assert.deepEqual(snapshot.chatBubbleThemes, { wrapped: { assistant: true } });
  assert.equal(snapshot.layout.cols, 12);
  assert.equal(snapshot.layout.rows, 9);
});

test("currentLayoutConfigPayload builds a layout from state and helper dimensions", () => {
  const state = {
    tilemap: { layout: { anchors: { desk: { row: 1, col: 2 } }, name: "A" } },
    renderer: { assets: { layout: { cols: 99, rows: 99 } } },
    world: { room: { name: "Live Room" } },
  };
  const payload = currentLayoutConfigPayload(state, {
    getWorldCols: () => 30,
    getWorldRows: () => 18,
  });
  assert.equal(payload.name, "Live Room");
  assert.equal(payload.cols, 30);
  assert.equal(payload.rows, 18);
  assert.deepEqual(payload.anchors, { desk: { row: 1, col: 2 } });
});

test("buildCurrentGameStatePayload serializes current draft state", () => {
  const state = {
    editor: {
      draftFloorText: "a b",
      draftWallText: ". .",
      draftFurnitureText: ". .",
      draftPropText: ". .",
    },
    tilemap: { layout: { stash: { col: 7, row: 8 } } },
    renderer: { assets: { layout: { stash: { col: 1, row: 1 } } } },
    roomRegions: [{ id: "desk" }],
    chatBubbleThemes: { assistant: { textColor: "#fff" } },
    gameStateRaw: {},
    world: { room: { name: "Live Room" } },
  };
  const payload = buildCurrentGameStatePayload(state, {
    currentLayoutConfigPayload: () => ({ cols: 30, rows: 18 }),
    normalizeStashPoint: (value) => value,
    peekStoredMap: () => "",
  });
  assert.equal(payload["agent-world-floor-map"], "a b");
  assert.equal(payload["agent-world-wall-map"], ". .");
  assert.equal(payload["agent-world-room-regions"], JSON.stringify([{ id: "desk" }], null, 2));
  assert.equal(payload["agent-world-chat-bubble-frame"], JSON.stringify({ assistant: { textColor: "#fff" } }, null, 2));
  assert.equal(payload["agent-world-layout-config"], JSON.stringify({ cols: 30, rows: 18 }, null, 2));
});

test("applyImportedAgentWorldStorageState writes only allowed keys", () => {
  const originalLocalStorage = globalThis.localStorage;
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };

  try {
    applyImportedAgentWorldStorageState({
      "agent-world-floor-map": "a b",
      "agent-world-wall-map": ". .",
      ignored: "nope",
    });
    assert.equal(store.get("agent-world-floor-map"), "a b");
    assert.equal(store.get("agent-world-wall-map"), ". .");
    assert.equal(store.has("ignored"), false);
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});
