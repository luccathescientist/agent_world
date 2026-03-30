import test from "node:test";
import assert from "node:assert/strict";

import {
  previewSpriteFrame,
  previewSpriteFrameName,
  renderAgentEditorPanel,
  shouldMirrorPreviewSprite,
} from "../src/features/editor/agentEditor.js";

test("previewSpriteFrameName prefers activity-specific frames before idle", () => {
  const frames = {
    idle_0: { x: 0, y: 0, w: 32, h: 32 },
    read_0: { x: 32, y: 0, w: 32, h: 32 },
    work_0: { x: 64, y: 0, w: 32, h: 32 },
    shocked_0: { x: 96, y: 0, w: 32, h: 32 },
  };
  assert.equal(previewSpriteFrameName({ visualState: "reading" }, frames), "read_0");
  assert.equal(previewSpriteFrameName({ visualState: "working" }, frames), "work_0");
  assert.equal(previewSpriteFrameName({ visualState: "blocked" }, frames), "shocked_0");
  assert.equal(previewSpriteFrameName({ visualState: "idle" }, frames), "idle_0");
});

test("shouldMirrorPreviewSprite mirrors side-only idle sets", () => {
  assert.equal(shouldMirrorPreviewSprite({}, { idle_side: {} }), true);
  assert.equal(shouldMirrorPreviewSprite({}, { idle_side: {}, idle_left: {} }), false);
});

test("previewSpriteFrame resolves atlas path and calculated scale", () => {
  const state = {
    renderer: {
      assets: {
        spriteAtlasMeta: {
          "lucca-default": {
            frames: {
              idle_side: { x: 10, y: 12, w: 24, h: 32 },
            },
            meta: {
              size: { w: 256, h: 128 },
            },
          },
        },
        spriteAtlasPaths: {
          "lucca-default": "/sprites/lucca.png",
        },
      },
    },
  };
  const frame = previewSpriteFrame(state, { visualState: "idle" }, {
    previewSpriteFrameName: () => "idle_side",
    shouldMirrorPreviewSprite,
  });
  assert.equal(frame.atlasPath, "/sprites/lucca.png");
  assert.equal(frame.sheetWidth, 256);
  assert.equal(frame.sheetHeight, 128);
  assert.equal(frame.scale, 2.1);
  assert.equal(frame.scaleX, -2.1);
});

test("renderAgentEditorPanel populates summary fields and preview markup", () => {
  const texts = new Map();
  const previewList = { innerHTML: "" };
  const state = {
    selectedAgentId: "lucca",
    world: {
      agents: [
        {
          id: "lucca",
          name: "Lucca",
          model: "gpt-5",
          runtimeStatus: "active",
          targetAnchor: "desk",
          currentAction: "Reading",
          visualState: "reading",
        },
      ],
    },
  };
  renderAgentEditorPanel(state, {
    documentRef: {
      getElementById(id) {
        if (id === "agent-sprite-preview-list") return previewList;
        return null;
      },
    },
    escapeHtml: (value) => String(value),
    previewSpriteFrame: () => ({
      atlasPath: "/sprites/lucca.png",
      h: 32,
      scale: 2.1,
      scaleX: 2.1,
      sheetHeight: 128,
      sheetWidth: 256,
      w: 24,
      x: 10,
      y: 12,
    }),
    setText: (id, value) => texts.set(id, value),
    shouldShowAgentSprite: () => true,
  });
  assert.equal(texts.get("agent-editor-name"), "Lucca");
  assert.equal(texts.get("agent-editor-status"), "active");
  assert.match(previewList.innerHTML, /agent-sprite-preview-sheet/);
  assert.match(previewList.innerHTML, /Lucca/);
});
