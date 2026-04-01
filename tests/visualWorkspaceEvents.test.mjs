import test from "node:test";
import assert from "node:assert/strict";

import { bindVisualWorkspaceEvents } from "../src/features/editor/shared/visualWorkspaceEvents.js";

function makeElement() {
  const listeners = [];
  return {
    listeners,
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
  };
}

test("bindVisualWorkspaceEvents wires zoom, layer, and atlas interactions", () => {
  const zoomSelect = makeElement();
  const atlasImage = makeElement();
  const atlasBoard = makeElement();
  const layerButton = {
    dataset: { layer: "wall" },
    listeners: [],
    addEventListener(type, fn) {
      this.listeners.push({ type, fn });
    },
  };
  const state = {
    editor: {
      zoom: 1,
      hoveredAtlasCell: null,
    },
  };
  const calls = [];
  bindVisualWorkspaceEvents(state, {
    applyVisualAtlasCell: (cell) => calls.push(["apply", cell]),
    documentRef: {
      getElementById(id) {
        if (id === "editor-zoom-select") return zoomSelect;
        if (id === "atlas-picker-image") return atlasImage;
        if (id === "atlas-picker-board") return atlasBoard;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === "#visual-layer-toggle [data-layer]") return [layerButton];
        return [];
      },
    },
    getAtlasPointerCell: () => ({ x: 2, y: 3 }),
    renderVisualEditor: () => calls.push(["render"]),
    setTilemapStatus: () => {},
    setVisualLayer: (layer) => calls.push(["layer", layer]),
  });

  zoomSelect.listeners[0].fn({ target: { value: "2" } });
  layerButton.listeners[0].fn();
  atlasImage.listeners[0].fn();
  atlasBoard.listeners.find((item) => item.type === "mousemove").fn({});
  atlasBoard.listeners.find((item) => item.type === "mouseleave").fn({});
  atlasBoard.listeners.find((item) => item.type === "click").fn({});

  assert.equal(state.editor.zoom, 2);
  assert.equal(state.editor.hoveredAtlasCell, null);
  assert.deepEqual(calls, [
    ["render"],
    ["layer", "wall"],
    ["render"],
    ["render"],
    ["render"],
    ["apply", { x: 2, y: 3 }],
  ]);
});
