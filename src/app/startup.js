/*
 * Final startup assembly for the frontend.
 * This module connects resize handling, DOM event registration, and initial
 * app boot so the entrypoint can stay focused on composition.
 */
import { initDomEvents as initDomEventsDefault, startApp as startAppDefault } from "../bootstrap/domEvents.js";

export function initAppStartup(state, deps = {}) {
  const {
    windowRef = globalThis.window,
    resizeRendererViewport = () => {},
    initDomEvents = initDomEventsDefault,
    startApp = startAppDefault,
    documentRef = globalThis.document,
    initVoiceControls = () => {},
    load = async () => {},
    setActiveTab = () => {},
    setTilemapStatus = () => {},
    ...eventDeps
  } = deps;

  windowRef.addEventListener("resize", () => {
    resizeRendererViewport();
  });

  initDomEvents(state, {
    documentRef,
    initVoiceControls,
    load,
    setActiveTab,
    setTilemapStatus,
    ...eventDeps,
  });

  startApp({
    documentRef,
    initVoiceControls,
    load,
    setActiveTab,
    setTilemapStatus,
  });
}
