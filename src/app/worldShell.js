/*
 * Thin world/chat/detail shell adapters.
 * These wrappers expose app-oriented entrypoints for the extracted world and
 * message-view modules while preserving dependency injection.
 */
export function renderWorld(state, worldState, deps = {}) {
  const {
    bubblePaletteForAgent = () => ({}),
    createAgentSprite = () => null,
    createBenchmarkSprite = () => null,
    formatDate = (value) => String(value || ""),
    isBenchmarkAgent = () => false,
    populateAgentSelect = () => {},
    renderWorldHelper = () => {},
    setText = () => {},
    shouldShowAgentSprite = () => true,
    syncSelectedAgentDetailFromWorld = () => {},
    updateActivityCue = () => {},
    updateAgentLabel = () => {},
    updateBubble = () => {},
  } = deps;
  return renderWorldHelper(state, worldState, {
    bubblePaletteForAgent,
    createAgentSprite,
    createBenchmarkSprite,
    formatDate,
    isBenchmarkAgent,
    populateAgentSelect,
    setText,
    shouldShowAgentSprite,
    syncSelectedAgentDetailFromWorld,
    updateActivityCue,
    updateAgentLabel,
    updateBubble,
  });
}

export function syncSelectedAgentDetailFromWorld(state, worldState, deps = {}) {
  const {
    renderInspector = () => {},
    syncSelectedAgentDetailFromWorldHelper = () => {},
  } = deps;
  return syncSelectedAgentDetailFromWorldHelper(state, worldState, {
    renderInspector,
  });
}

export function renderInspector(state, detailPayload, deps = {}) {
  const {
    displayedLocationLabel = () => "",
    documentRef = document,
    formatDate = (value) => String(value || ""),
    renderInspectorHelper = () => {},
    setText = () => {},
    showRichMessage = async () => {},
    statusClass = () => "",
  } = deps;
  return renderInspectorHelper(state, detailPayload, {
    displayedLocationLabel,
    documentRef,
    formatDate,
    setText,
    showRichMessage,
    statusClass,
  });
}

export async function showRichMessage(state, kind, title, text, path = null, deps = {}) {
  const {
    classifyPath = () => "file",
    createElement = () => null,
    documentRef = document,
    extractPaths = () => [],
    fetchText = async () => "",
    fileUrl = (value) => value,
    renderRichText = () => {},
    setMessageSelection = () => {},
    setText = () => {},
    showRichMessageHelper = async () => {},
    windowRef = window,
  } = deps;
  return showRichMessageHelper(state, kind, title, text, path, {
    classifyPath,
    createElement,
    documentRef,
    extractPaths,
    fetchText,
    fileUrl,
    renderRichText,
    setMessageSelection,
    setText,
    windowRef,
  });
}

export function renderChat(state, history, deps = {}) {
  const {
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    classifyPath = () => "file",
    createElement = () => null,
    documentRef = document,
    extractPaths = () => [],
    fileUrl = (value) => value,
    formatRichTextHtml = (value) => value,
    formatTime = (value) => String(value || ""),
    historyRoleClass = () => "assistant",
    historyRoleMeta = () => ({ label: "", icon: "" }),
    maybeSpeakReply = () => {},
    renderChatHelper = () => {},
    setText = () => {},
    showRichMessage = async () => {},
    windowRef = window,
  } = deps;
  return renderChatHelper(state, history, {
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
    setText,
    showRichMessage,
    windowRef,
  });
}

export function renderHistory(events, deps = {}) {
  const {
    createElement = () => null,
    documentRef = document,
    extractPaths = () => [],
    formatTime = (value) => String(value || ""),
    renderChat = () => {},
    renderHistoryHelper = () => {},
    showRichMessage = async () => {},
  } = deps;
  return renderHistoryHelper(events, {
    createElement,
    documentRef,
    extractPaths,
    formatTime,
    renderChat,
    showRichMessage,
  });
}

export function renderSchedule(detailPayload, deps = {}) {
  const {
    createElement = () => null,
    documentRef = document,
    formatDate = (value) => String(value || ""),
    renderScheduleHelper = () => {},
    setText = () => {},
    showRichMessage = async () => {},
  } = deps;
  return renderScheduleHelper(detailPayload, {
    createElement,
    documentRef,
    formatDate,
    setText,
    showRichMessage,
  });
}

export function showStashItem(item, deps = {}) {
  const {
    formatDate = (value) => String(value || ""),
    showRichMessage = async () => {},
    showStashItemHelper = () => {},
  } = deps;
  return showStashItemHelper(item, {
    formatDate,
    showRichMessage,
  });
}

export function renderStash(state, stash, deps = {}) {
  const {
    createElement = () => null,
    documentRef = document,
    formatDate = (value) => String(value || ""),
    renderStashHelper = () => {},
    setText = () => {},
    showStashItem = () => {},
  } = deps;
  return renderStashHelper(state, stash, {
    createElement,
    documentRef,
    formatDate,
    setText,
    showStashItem,
  });
}

export function handleStreamSnapshot(payload, deps = {}) {
  const {
    handleStreamSnapshotHelper = () => {},
    renderHistory = () => {},
    renderInspector = () => {},
    renderSchedule = () => {},
    renderStash = () => {},
    renderWorld = () => {},
  } = deps;
  return handleStreamSnapshotHelper(payload, {
    renderHistory,
    renderInspector,
    renderSchedule,
    renderStash,
    renderWorld,
  });
}

export function connectStream(state, deps = {}) {
  const {
    EventSourceCtor,
    URLSearchParamsCtor,
    connectStreamHelper = () => {},
    consoleRef = console,
    handleStreamSnapshot = () => {},
    setText = () => {},
  } = deps;
  return connectStreamHelper(state, {
    EventSourceCtor,
    URLSearchParamsCtor,
    consoleRef,
    handleStreamSnapshot,
    setText,
  });
}

export function closeWorldDetails(state, deps = {}) {
  const {
    closeWorldDetailsHelper = () => {},
    connectStream = () => {},
    documentRef = document,
    renderHistory = () => {},
    renderSchedule = () => {},
    renderStash = () => {},
    renderWorld = () => {},
    setText = () => {},
    syncWorldDetailVisibility = () => {},
  } = deps;
  return closeWorldDetailsHelper(state, {
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
