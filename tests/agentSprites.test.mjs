import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseDisplayFrames,
  collectFrameSequence,
  directionalIdleFrames,
  directionalWalkFrames,
  getAnimationFrames,
  positionAgentLabel,
  positionBubble,
  shouldMirrorSpriteForFacing,
  spriteFramesForAgent,
  updateActivityCue,
  updateAgentLabel,
  updateBubble,
} from "../src/features/world/agentSprites.js";

test("spriteFramesForAgent prefers seed-specific frames when present", () => {
  const renderer = {
    assets: {
      frames: { idle_0: "fallback" },
      spriteFrames: {
        custom: { idle_0: "custom" },
      },
    },
  };
  assert.equal(spriteFramesForAgent(renderer, { spriteSeed: "custom" }).idle_0, "custom");
  assert.equal(spriteFramesForAgent(renderer, { spriteSeed: "missing" }).idle_0, "fallback");
});

test("getAnimationFrames chooses state-appropriate animation sets", () => {
  const renderer = {
    assets: {
      frames: {},
      spriteFrames: {
        custom: {
          idle_0: "idle0",
          idle_1: "idle1",
          read_0: "read0",
          read_1: "read1",
          rest_0: "rest0",
          work_0: "work0",
          work_1: "work1",
        },
      },
    },
  };
  assert.deepEqual(getAnimationFrames(renderer, { spriteSeed: "custom" }, "reading", { spriteFramesForAgent }), ["read0", "read1"]);
  assert.deepEqual(getAnimationFrames(renderer, { spriteSeed: "custom" }, "working", { spriteFramesForAgent }), ["work0", "work1"]);
  assert.deepEqual(getAnimationFrames(renderer, { spriteSeed: "custom" }, "idle", { spriteFramesForAgent }), ["rest0", "rest0"]);
});

test("collectFrameSequence and directional frame helpers prefer facing-specific sets", () => {
  const frames = {
    idle_down: "idle-down",
    idle_side: "idle-side",
    walk_down_0: "down0",
    walk_down_1: "down1",
    walk_side_0: "side0",
    walk_side_1: "side1",
  };
  const renderer = { assets: { frames, spriteFrames: {} } };
  assert.deepEqual(collectFrameSequence(frames, "walk_side"), ["side0", "side1"]);
  assert.deepEqual(directionalIdleFrames(renderer, {}, "left", { getAnimationFrames, spriteFramesForAgent }), ["idle-side"]);
  assert.deepEqual(directionalWalkFrames(renderer, {}, "right", { collectFrameSequence, spriteFramesForAgent }), ["side0", "side1"]);
});

test("shouldMirrorSpriteForFacing mirrors left-facing side sheets but not explicit left sheets", () => {
  const renderer = {
    assets: {
      frames: {},
      spriteFrames: {
        sideOnly: { idle_side: "a", walk_side_0: "b" },
        leftSheet: { idle_left: "a", walk_left_0: "b" },
      },
    },
  };
  assert.equal(shouldMirrorSpriteForFacing(renderer, { spriteSeed: "sideOnly" }, "left", { spriteFramesForAgent }), true);
  assert.equal(shouldMirrorSpriteForFacing(renderer, { spriteSeed: "leftSheet" }, "left", { spriteFramesForAgent }), false);
});

test("updateBubble rewrites text, styles, and repositions the wrap", () => {
  const calls = [];
  const container = {
    _bubblePalette: { fill: 1, stroke: 2, text: 3 },
    _bubble: {
      text: "",
      width: 100,
      height: 20,
      y: 10,
      style: {},
    },
    _bubbleBg: {
      clear: () => calls.push("clear"),
      beginFill: (...args) => calls.push(["fill", ...args]),
      lineStyle: (...args) => calls.push(["line", ...args]),
      drawRoundedRect: (...args) => calls.push(["rect", ...args]),
      endFill: () => calls.push("end"),
      y: 0,
    },
  };
  updateBubble(container, "Working", {
    displayActionText: (value) => value.toUpperCase(),
    positionBubble: () => calls.push("position"),
  });
  assert.equal(container._bubble.text, "WORKING");
  assert.equal(container._bubble.style.fill, 3);
  assert.equal(container._bubble.y, 0);
  assert.equal(calls.at(-1), "position");
});

test("updateAgentLabel, position helpers, and updateActivityCue update presentation state", () => {
  const labelCalls = [];
  const cueCalls = [];
  const container = {
    x: 15,
    y: 30,
    _kind: "benchmark",
    _label: { width: 40, height: 10, style: {}, x: 0, y: 0 },
    _labelBg: {
      clear: () => labelCalls.push("clear"),
      beginFill: (...args) => labelCalls.push(["fill", ...args]),
      lineStyle: (...args) => labelCalls.push(["line", ...args]),
      drawRoundedRect: (...args) => labelCalls.push(["rect", ...args]),
      endFill: () => labelCalls.push("end"),
    },
    _labelWrap: { x: 0, y: 0 },
    _bubbleWrap: { x: 0, y: 0 },
    _cue: { width: 18, height: 10, text: "", x: 0, y: 0 },
    _cueBg: {
      clear: () => cueCalls.push("clear"),
      beginFill: (...args) => cueCalls.push(["fill", ...args]),
      lineStyle: (...args) => cueCalls.push(["line", ...args]),
      drawRoundedRect: (...args) => cueCalls.push(["rect", ...args]),
      endFill: () => cueCalls.push("end"),
    },
    _cueWrap: { x: 0, y: 0 },
  };
  updateAgentLabel(container, true);
  positionBubble(container);
  positionAgentLabel(container);
  updateActivityCue(container, { id: "lucca" }, true, {
    activityCue: () => "typing",
  });
  assert.equal(container._label.style.fill, 0x111111);
  assert.equal(container._labelWrap.x, 15);
  assert.equal(container._labelWrap.y, 48);
  assert.equal(container._bubbleWrap.x, 15);
  assert.equal(container._bubbleWrap.y, -54);
  assert.equal(container._cue.text, "typing");
  assert.equal(container._cueWrap.x, 48);
  assert.equal(container._cueWrap.y, 8);
  assert.ok(labelCalls.length > 0);
  assert.ok(cueCalls.length > 0);
});

test("chooseDisplayFrames delegates based on movement and visual state", () => {
  const renderer = {
    agents: new Map([["lucca", { _state: { facing: "right" } }]]),
  };
  const agent = { id: "lucca", visualState: "reading" };
  assert.deepEqual(
    chooseDisplayFrames(renderer, agent, true, {
      directionalIdleFrames: () => ["idle"],
      directionalWalkFrames: () => ["walk"],
      getAnimationFrames: () => ["read"],
    }),
    ["walk"],
  );
  assert.deepEqual(
    chooseDisplayFrames(renderer, agent, false, {
      directionalIdleFrames: () => ["idle"],
      directionalWalkFrames: () => ["walk"],
      getAnimationFrames: () => ["read"],
    }),
    ["read"],
  );
});
