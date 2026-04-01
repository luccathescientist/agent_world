import test from "node:test";
import assert from "node:assert/strict";

import { renderRoomMappingEditorPanel } from "../src/features/editor/roomMapping/editorView.js";

test("renderRoomMappingEditorPanel updates controls, summary, and list interactions", () => {
  const listenersByRegionRow = [];
  const deleteButton = {
    dataset: { regionId: "library" },
    addEventListener(type, fn) {
      this.handler = { type, fn };
    },
  };
  const regionList = {
    innerHTML: "",
    querySelectorAll(selector) {
      if (selector === ".room-region-item[data-region-id]") {
        return [{
          dataset: { regionId: "library" },
          addEventListener(type, fn) {
            listenersByRegionRow.push({ type, fn });
          },
        }];
      }
      if (selector === ".room-region-delete") return [deleteButton];
      return [];
    },
  };
  const regionKindInput = { value: "" };
  const regionIdInput = { value: "" };
  const regionLabelInput = { value: "" };
  const regionSummary = { textContent: "" };
  const stashSummary = { textContent: "" };
  const state = {
    editor: {
      hoveredRegionId: "",
      regionKind: "room",
      regionLabel: "Library",
    },
    renderer: {
      assets: {
        layout: {
          stash: { col: 4, row: 5 },
        },
      },
    },
    roomRegions: [{
      id: "library",
      kind: "room",
      label: "Library",
      cells: [{ row: 1, col: 2 }],
      labelCell: { row: 3, col: 4 },
    }],
    tilemap: {
      layout: { stash: { col: 7, row: 8 } },
    },
  };
  const calls = [];
  renderRoomMappingEditorPanel(state, {
    deleteRoomRegion: (regionId) => calls.push(`delete:${regionId}`),
    documentRef: {
      activeElement: null,
      getElementById(id) {
        if (id === "region-kind-input") return regionKindInput;
        if (id === "region-id-input") return regionIdInput;
        if (id === "region-label-input") return regionLabelInput;
        if (id === "room-region-summary") return regionSummary;
        if (id === "room-region-list") return regionList;
        if (id === "stash-cell-summary") return stashSummary;
        return null;
      },
    },
    drawRoom: () => calls.push("draw"),
    normalizeStashPoint: (value) => value,
    populateRegionIdSelect: () => calls.push("populate"),
  });

  assert.equal(regionKindInput.value, "room");
  assert.equal(regionLabelInput.value, "Library");
  assert.equal(regionSummary.textContent, "1 regions");
  assert.equal(stashSummary.textContent, "Stash 8:9");
  assert.match(regionList.innerHTML, /library/i);
  assert.deepEqual(calls, ["populate"]);

  listenersByRegionRow.find((item) => item.type === "mouseenter").fn();
  assert.equal(state.editor.hoveredRegionId, "library");
  listenersByRegionRow.find((item) => item.type === "mouseleave").fn();
  assert.equal(state.editor.hoveredRegionId, "");

  deleteButton.handler.fn({ stopPropagation() {} });
  assert.deepEqual(calls, ["populate", "draw", "draw", "delete:library"]);
});
