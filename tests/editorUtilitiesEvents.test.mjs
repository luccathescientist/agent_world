import test from "node:test";
import assert from "node:assert/strict";

import { bindEditorUtilitiesEvents } from "../src/features/editor/shared/editorUtilitiesEvents.js";

function makeButton() {
  const listeners = [];
  return {
    listeners,
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
  };
}

test("bindEditorUtilitiesEvents wires import/download/reset utilities", () => {
  const applyBtn = makeButton();
  const downloadBtn = makeButton();
  const resetBtn = makeButton();
  const textarea = { value: "{\"agent-world-floor-map\":\"a\"}" };
  const anchorEvents = [];
  const bodyEvents = [];
  const state = { renderer: { assets: { layout: {} } } };
  const calls = [];
  bindEditorUtilitiesEvents(state, {
    applyImportedAgentWorldStorageState: (payload) => calls.push(["applyImported", payload]),
    applyStructuredGameState: (snapshot, message) => calls.push(["applyStructured", snapshot, message]),
    documentRef: {
      body: {
        appendChild(node) {
          bodyEvents.push(["append", node]);
        },
      },
      createElement(tag) {
        if (tag !== "a") return null;
        return {
          remove() {
            anchorEvents.push("remove");
          },
          set download(value) {
            anchorEvents.push(["download", value]);
          },
          set href(value) {
            anchorEvents.push(["href", value]);
          },
          click() {
            anchorEvents.push("click");
          },
        };
      },
      getElementById(id) {
        if (id === "apply-game-state-json") return applyBtn;
        if (id === "download-game-state-json") return downloadBtn;
        if (id === "reset-tilemap") return resetBtn;
        if (id === "tilemap-state-json") return textarea;
        return null;
      },
    },
    parseImportedAgentWorldStorageState: () => ({ "agent-world-floor-map": "a" }),
    resetEditorState: () => calls.push(["reset"]),
    setTilemapStatus: (message, isError) => calls.push(["status", message, isError]),
    structuredSnapshotFromGameState: () => ({ floorText: "a", wallText: "", furnitureText: "", propText: "" }),
    syncGameStateTextarea: () => calls.push(["sync"]),
    writeGameStateToLocalStorage: (payload) => calls.push(["write", payload]),
    URLRef: {
      createObjectURL: () => "blob://mock",
      revokeObjectURL: (url) => calls.push(["revoke", url]),
    },
    BlobCtor: class MockBlob {
      constructor(parts, opts) {
        calls.push(["blob", parts, opts]);
      }
    },
  });

  applyBtn.listeners[0].fn();
  downloadBtn.listeners[0].fn();
  resetBtn.listeners[0].fn();

  assert.deepEqual(calls[0][0], "applyImported");
  assert.deepEqual(calls[1][0], "write");
  assert.deepEqual(calls[2][0], "applyStructured");
  assert.deepEqual(calls[3], ["status", "Imported 1 keys into local storage.", undefined]);
  assert.deepEqual(calls[4], ["sync"]);
  assert.deepEqual(calls[5][0], "blob");
  assert.deepEqual(calls[6], ["revoke", "blob://mock"]);
  assert.deepEqual(calls[7], ["status", "Downloaded current game state JSON.", undefined]);
  assert.deepEqual(calls[8], ["reset"]);
  assert.equal(anchorEvents.some((entry) => entry === "click"), true);
  assert.equal(bodyEvents.length, 1);
});
