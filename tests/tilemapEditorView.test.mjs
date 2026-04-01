import test from "node:test";
import assert from "node:assert/strict";

import {
  renderTilemapSummary,
  syncTilemapDraftInputs,
} from "../src/features/editor/tilemap/editorView.js";

test("syncTilemapDraftInputs mirrors draft text into tilemap textareas", () => {
  const inputs = {
    "floor-map-input": { value: "" },
    "wall-map-input": { value: "" },
    "furniture-map-input": { value: "" },
    "prop-map-input": { value: "" },
  };
  const state = {
    editor: {
      draftFloorText: "a b",
      draftWallText: ". .",
      draftFurnitureText: "c d",
      draftPropText: "e f",
    },
  };
  syncTilemapDraftInputs(state, {
    documentRef: {
      getElementById(id) {
        return inputs[id] || null;
      },
    },
  });
  assert.equal(inputs["floor-map-input"].value, "a b");
  assert.equal(inputs["wall-map-input"].value, ". .");
  assert.equal(inputs["furniture-map-input"].value, "c d");
  assert.equal(inputs["prop-map-input"].value, "e f");
});

test("renderTilemapSummary writes tilemap size and walkability text", () => {
  const texts = new Map();
  renderTilemapSummary({
    tilemap: {
      manifest: { a: true, b: true, c: true },
      walkableTiles: 10,
      solidTiles: 4,
      doorTiles: 1,
    },
  }, {
    getWorldCols: () => 12,
    getWorldRows: () => 9,
    setText: (id, value) => texts.set(id, value),
  });
  assert.equal(texts.get("tilemap-summary"), "12x9 grid · 3 codes");
  assert.equal(texts.get("tilemap-walkability"), "10 walkable · 4 solid · 1 doors");
});
