import test from "node:test";
import assert from "node:assert/strict";

import { initAppStartup } from "../src/app/startup.js";

test("initAppStartup wires resize, DOM events, and app start", () => {
  const calls = [];
  let resizeHandler = null;
  const state = { ok: true };

  initAppStartup(state, {
    windowRef: {
      addEventListener(type, handler) {
        calls.push(["window", type]);
        resizeHandler = handler;
      },
    },
    resizeRendererViewport: () => calls.push(["resize"]),
    initDomEvents: (...args) => calls.push(["dom", ...args]),
    startApp: (...args) => calls.push(["start", ...args]),
    documentRef: { body: {} },
    initVoiceControls: () => {},
    load: async () => {},
    setActiveTab: () => {},
    setTilemapStatus: () => {},
    customDep: 123,
  });

  assert.deepEqual(calls[0], ["window", "resize"]);
  assert.equal(calls[1][0], "dom");
  assert.equal(calls[1][1], state);
  assert.equal(calls[1][2].customDep, 123);
  assert.equal(calls[2][0], "start");
  assert.equal(typeof resizeHandler, "function");

  resizeHandler();
  assert.deepEqual(calls[3], ["resize"]);
});
