import test from "node:test";
import assert from "node:assert/strict";

import {
  populateAgentSelect,
  populateRegionIdSelect,
  setActiveTab,
  setTilemapStatus,
  syncWorldDetailVisibility,
} from "../src/app/shell.js";

function makeToggleElement(dataset = {}) {
  const classes = new Set();
  return {
    dataset,
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
}

test("setTilemapStatus updates status text and error tone", () => {
  const element = { textContent: "", style: { color: "" } };
  setTilemapStatus("Applied", true, {
    documentRef: {
      getElementById(id) {
        return id === "tilemap-status" ? element : null;
      },
    },
  });
  assert.equal(element.textContent, "Applied");
  assert.equal(element.style.color, "var(--warning)");
});

test("syncWorldDetailVisibility toggles body class for world detail state", () => {
  const toggles = [];
  syncWorldDetailVisibility({
    activeTab: "world",
    selectedAgentId: "lucca",
  }, {
    documentRef: {
      body: {
        classList: {
          toggle(name, enabled) {
            toggles.push([name, enabled]);
          },
        },
      },
    },
  });
  assert.deepEqual(toggles, [["world-detail-open", true]]);
});

test("populateAgentSelect renders options and preserves selection", () => {
  const select = { innerHTML: "" };
  populateAgentSelect({
    selectedAgentId: "lucca",
  }, [
    { id: "lucca", name: "Lucca" },
    { id: "mina" },
  ], {
    documentRef: {
      getElementById(id) {
        return id === "agent-select" ? select : null;
      },
    },
  });
  assert.match(select.innerHTML, /Select agent/);
  assert.match(select.innerHTML, /value="lucca" selected/);
  assert.match(select.innerHTML, />Mina<\/option>|>mina<\/option>/i);
});

test("populateRegionIdSelect merges defaults and room regions without duplicates", () => {
  const select = { innerHTML: "", value: "" };
  populateRegionIdSelect({
    roomRegions: [{ id: "library" }, { id: "custom" }],
    editor: { regionId: "custom" },
  }, select, {
    defaultAnchorTiles: {
      library: {},
      desk: {},
    },
  });
  assert.match(select.innerHTML, /library/);
  assert.match(select.innerHTML, /desk/);
  assert.match(select.innerHTML, /custom/);
  assert.equal(select.value, "custom");
});

test("setActiveTab refreshes world-facing tabs and settings tab separately", () => {
  const worldButton = makeToggleElement({ tab: "world" });
  const settingsButton = makeToggleElement({ tab: "settings" });
  const worldPanel = makeToggleElement({ panel: "world" });
  const settingsPanel = makeToggleElement({ panel: "settings" });
  const calls = [];
  const state = {
    activeTab: "world",
    renderer: { ok: true },
    world: { agents: [] },
  };
  const documentRef = {
    querySelectorAll(selector) {
      if (selector === ".tab-btn") return [worldButton, settingsButton];
      if (selector === ".tab-panel") return [worldPanel, settingsPanel];
      return [];
    },
  };

  setActiveTab(state, "editor", {
    documentRef,
    drawRoom: () => calls.push("draw"),
    mountRendererView: () => calls.push("mount"),
    renderEditorSubviews: () => calls.push("subviews"),
    renderSettingsSummary: () => calls.push("settings"),
    renderVisualEditor: () => calls.push("visual"),
    renderWorld: () => calls.push("world"),
    resizeRendererViewport: () => calls.push("resize"),
    syncWorldDetailVisibility: () => calls.push("visibility"),
  });
  assert.equal(state.activeTab, "editor");
  assert.equal(worldButton.classList.contains("active"), false);
  assert.equal(worldPanel.classList.contains("active"), false);
  assert.deepEqual(calls, ["mount", "resize", "visibility", "draw", "world", "subviews", "visual"]);

  calls.length = 0;
  setActiveTab(state, "settings", {
    documentRef,
    drawRoom: () => calls.push("draw"),
    mountRendererView: () => calls.push("mount"),
    renderEditorSubviews: () => calls.push("subviews"),
    renderSettingsSummary: () => calls.push("settings"),
    renderVisualEditor: () => calls.push("visual"),
    renderWorld: () => calls.push("world"),
    resizeRendererViewport: () => calls.push("resize"),
    syncWorldDetailVisibility: () => calls.push("visibility"),
  });
  assert.equal(state.activeTab, "settings");
  assert.equal(settingsButton.classList.contains("active"), true);
  assert.equal(settingsPanel.classList.contains("active"), true);
  assert.deepEqual(calls, ["visibility", "settings"]);
});
