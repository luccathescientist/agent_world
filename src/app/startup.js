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
