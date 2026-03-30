/*
 * Composed world/chat/detail runtime.
 * This module owns agent selection, live stream wiring, inspector/chat/stash
 * rendering, and the app-facing runtime for world detail views.
 */
import { setText as setTextDefault } from "../core/dom.js";
import { formatDate as formatDateDefault, formatTime as formatTimeDefault } from "../core/format.js";
import { getJson as getJsonDefault } from "../core/http.js";
import {
  classifyPath as classifyPathDefault,
  extractPaths as extractPathsDefault,
  fileUrl as fileUrlDefault,
  historyRoleClass as historyRoleClassDefault,
  historyRoleMeta as historyRoleMetaHelperDefault,
  renderChat as renderChatHelperDefault,
  renderHistory as renderHistoryHelperDefault,
  renderRichText as renderRichTextDefault,
  renderSchedule as renderScheduleHelperDefault,
  renderStash as renderStashHelperDefault,
  setMessageSelection as setMessageSelectionDefault,
  showRichMessage as showRichMessageHelperDefault,
  showStashItem as showStashItemHelperDefault,
} from "../features/chat/messageView.js";
import {
  closeWorldDetails as closeWorldDetailsHelperDefault,
  connectStream as connectStreamHelperDefault,
  handleStreamSnapshot as handleStreamSnapshotHelperDefault,
  renderInspector as renderInspectorHelperDefault,
  selectAgent as selectAgentHelperDefault,
  syncSelectedAgentDetailFromWorld as syncSelectedAgentDetailFromWorldHelperDefault,
} from "../features/world/agentDetails.js";
import { renderWorld as renderWorldHelperDefault } from "../render/worldRenderer.js";
import {
  closeWorldDetails as closeWorldDetailsShellDefault,
  connectStream as connectStreamShellDefault,
  handleStreamSnapshot as handleStreamSnapshotShellDefault,
  renderChat as renderChatShellDefault,
  renderHistory as renderHistoryShellDefault,
  renderInspector as renderInspectorShellDefault,
  renderSchedule as renderScheduleShellDefault,
  renderStash as renderStashShellDefault,
  renderWorld as renderWorldShellDefault,
  showRichMessage as showRichMessageShellDefault,
  showStashItem as showStashItemShellDefault,
  syncSelectedAgentDetailFromWorld as syncSelectedAgentDetailFromWorldShellDefault,
} from "./worldShell.js";

export function createWorldUiRuntime(state, deps = {}) {
  const {
    documentRef = globalThis.document,
    windowRef = globalThis.window,
    fetchRef = globalThis.fetch,
    EventSourceCtor = globalThis.EventSource,
    URLSearchParamsCtor = globalThis.URLSearchParams,
    consoleRef = globalThis.console,
    formatDate = formatDateDefault,
    formatTime = formatTimeDefault,
    getJson = getJsonDefault,
    setText = setTextDefault,
    classifyPath = classifyPathDefault,
    extractPaths = extractPathsDefault,
    fileUrl = fileUrlDefault,
    historyRoleClass = historyRoleClassDefault,
    renderRichText = renderRichTextDefault,
    setMessageSelection = setMessageSelectionDefault,
    bubblePaletteForAgent = () => ({}),
    createAgentSprite = () => null,
    createBenchmarkSprite = () => null,
    isBenchmarkAgent = () => false,
    maybeSpeakReply = () => {},
    displayedLocationLabel = (value) => value,
    populateAgentSelect = () => {},
    shouldShowAgentSprite = () => true,
    statusClass = () => "",
    updateActivityCue = () => {},
    updateAgentLabel = () => {},
    updateBubble = () => {},
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    formatRichTextHtml = (value) => value,
    syncWorldDetailVisibility = () => {},
    renderWorldHelper = renderWorldHelperDefault,
    syncSelectedAgentDetailFromWorldHelper = syncSelectedAgentDetailFromWorldHelperDefault,
    renderInspectorHelper = renderInspectorHelperDefault,
    showRichMessageHelper = showRichMessageHelperDefault,
    renderChatHelper = renderChatHelperDefault,
    renderHistoryHelper = renderHistoryHelperDefault,
    renderScheduleHelper = renderScheduleHelperDefault,
    showStashItemHelper = showStashItemHelperDefault,
    renderStashHelper = renderStashHelperDefault,
    handleStreamSnapshotHelper = handleStreamSnapshotHelperDefault,
    connectStreamHelper = connectStreamHelperDefault,
    selectAgentHelper = selectAgentHelperDefault,
    closeWorldDetailsHelper = closeWorldDetailsHelperDefault,
    renderWorldShell = renderWorldShellDefault,
    syncSelectedAgentDetailFromWorldShell = syncSelectedAgentDetailFromWorldShellDefault,
    renderInspectorShell = renderInspectorShellDefault,
    showRichMessageShell = showRichMessageShellDefault,
    renderChatShell = renderChatShellDefault,
    renderHistoryShell = renderHistoryShellDefault,
    renderScheduleShell = renderScheduleShellDefault,
    showStashItemShell = showStashItemShellDefault,
    renderStashShell = renderStashShellDefault,
    handleStreamSnapshotShell = handleStreamSnapshotShellDefault,
    connectStreamShell = connectStreamShellDefault,
    closeWorldDetailsShell = closeWorldDetailsShellDefault,
  } = deps;

  const createElement = (tag) => documentRef.createElement(tag);
  const fetchText = async (url) => {
    const response = await fetchRef(url);
    return response.text();
  };
  const historyRoleMeta = (type) => historyRoleMetaHelperDefault(type, { historyRoleClass });

  function renderWorld(worldState) {
    return renderWorldShell(state, worldState, {
      bubblePaletteForAgent,
      createAgentSprite,
      createBenchmarkSprite,
      formatDate,
      isBenchmarkAgent,
      populateAgentSelect,
      renderWorldHelper,
      setText,
      shouldShowAgentSprite,
      syncSelectedAgentDetailFromWorld,
      updateActivityCue,
      updateAgentLabel,
      updateBubble,
    });
  }

  function syncSelectedAgentDetailFromWorld(worldState) {
    return syncSelectedAgentDetailFromWorldShell(state, worldState, {
      renderInspector,
      syncSelectedAgentDetailFromWorldHelper,
    });
  }

  function renderInspector(detailPayload) {
    return renderInspectorShell(state, detailPayload, {
      displayedLocationLabel,
      documentRef,
      formatDate,
      renderInspectorHelper,
      setText,
      showRichMessage,
      statusClass,
    });
  }

  async function showRichMessage(kind, title, text, path = null) {
    return showRichMessageShell(state, kind, title, text, path, {
      classifyPath,
      createElement,
      documentRef,
      extractPaths,
      fetchText,
      fileUrl,
      renderRichText,
      setMessageSelection,
      setText,
      showRichMessageHelper,
      windowRef,
    });
  }

  function renderChat(history) {
    return renderChatShell(state, history, {
      applyChatRoleTheme,
      chatBubbleMarkup,
      classifyPath,
      createElement,
      documentRef,
      extractPaths,
      fileUrl,
      formatRichTextHtml,
      formatTime,
      historyRoleClass,
      historyRoleMeta,
      maybeSpeakReply,
      renderChatHelper,
      setText,
      showRichMessage,
      windowRef,
    });
  }

  function renderHistory(events) {
    return renderHistoryShell(events, {
      createElement,
      documentRef,
      extractPaths,
      formatTime,
      renderChat,
      renderHistoryHelper,
      showRichMessage,
    });
  }

  function renderSchedule(detailPayload) {
    return renderScheduleShell(detailPayload, {
      createElement,
      documentRef,
      formatDate,
      renderScheduleHelper,
      setText,
      showRichMessage,
    });
  }

  function showStashItem(item) {
    return showStashItemShell(item, {
      formatDate,
      showRichMessage,
      showStashItemHelper,
    });
  }

  function renderStash(stash) {
    return renderStashShell(state, stash, {
      createElement,
      documentRef,
      formatDate,
      renderStashHelper,
      setText,
      showStashItem,
    });
  }

  function handleStreamSnapshot(payload) {
    return handleStreamSnapshotShell(payload, {
      handleStreamSnapshotHelper,
      renderHistory,
      renderInspector,
      renderSchedule,
      renderStash,
      renderWorld,
    });
  }

  function connectStream() {
    return connectStreamShell(state, {
      EventSourceCtor,
      URLSearchParamsCtor,
      connectStreamHelper,
      consoleRef,
      handleStreamSnapshot,
      setText,
    });
  }

  async function selectAgent(agentId) {
    return selectAgentHelper(state, agentId, {
      connectStream,
      getJson,
      renderHistory,
      renderInspector,
      renderSchedule,
      renderStash,
      renderWorld,
      setMessageSelection,
      syncWorldDetailVisibility,
    });
  }

  function closeWorldDetails() {
    return closeWorldDetailsShell(state, {
      closeWorldDetailsHelper,
      connectStream,
      documentRef,
      renderHistory,
      renderSchedule,
      renderStash,
      renderWorld,
      setText,
      syncWorldDetailVisibility,
    });
  }

  return {
    closeWorldDetails,
    connectStream,
    handleStreamSnapshot,
    renderChat,
    renderHistory,
    renderInspector,
    renderSchedule,
    renderStash,
    renderWorld,
    selectAgent,
    showRichMessage,
    showStashItem,
    syncSelectedAgentDetailFromWorld,
  };
}
