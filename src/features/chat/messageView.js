import { PATH_RE } from "../../core/constants.js";

export function setMessageSelection(state, kind, title, body, path = null, locked = true) {
  state.messageSelection = {
    locked,
    kind: kind || "detail",
    title: title || "--",
    body: body || "--",
    path: path || null,
  };
}

export function fileUrl(path) {
  return `/api/agent-world/file?path=${encodeURIComponent(path)}`;
}

export function cleanPath(text) {
  return text.replace(/[\\.,:;)\]>`"']+$/g, "");
}

export function extractPaths(...parts) {
  const out = [];
  for (const part of parts) {
    for (const match of String(part || "").match(PATH_RE) || []) {
      const cleaned = cleanPath(match);
      if (!out.includes(cleaned)) out.push(cleaned);
    }
  }
  return out;
}

export function classifyPath(path) {
  const lower = path.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(lower)) return "image";
  if (/\.(mp4|mov|webm)$/.test(lower)) return "video";
  if (/\.pdf$/.test(lower)) return "pdf";
  if (/\.(txt|md|json|jsonl|log)$/.test(lower)) return "text";
  return "file";
}

export function stripControlTags(text) {
  return String(text || "").replace(/\[\[[^\]]+\]\]/g, "");
}

export function displayActionText(text) {
  const cleaned = stripControlTags(text)
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Idle";
}

export function formatInlineRichText(text, helpers = {}) {
  const { escapeHtml = (value) => value } = helpers;
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function formatRichTextHtml(text, helpers = {}) {
  const {
    escapeHtml = (value) => value,
    formatInlineRichText = (value) => value,
    stripControlTags = (value) => value,
  } = helpers;
  const source = stripControlTags(text).replace(/\r/g, "").trim();
  if (!source) return "--";
  const blocks = [];
  const parts = source.split(/```/);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (index % 2 === 1) {
      blocks.push(`<pre class="rich-code"><code>${escapeHtml(part.replace(/^\n+|\n+$/g, ""))}</code></pre>`);
      continue;
    }
    for (const chunk of part.split(/\n{2,}/)) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      const lines = trimmed.split("\n");
      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        blocks.push(`<ul class="rich-list">${lines.map((line) => `<li>${formatInlineRichText(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`);
      } else {
        blocks.push(`<p>${lines.map((line) => formatInlineRichText(line)).join("<br>")}</p>`);
      }
    }
  }
  return blocks.join("");
}

export function renderRichText(target, text, helpers = {}) {
  const { formatRichTextHtml = (value) => value } = helpers;
  if (!target) return;
  target.innerHTML = formatRichTextHtml(text);
}

export async function showRichMessage(state, kind, title, text, path = null, helpers = {}) {
  const {
    classifyPath = () => "file",
    createElement = (tag) => document.createElement(tag),
    documentRef = document,
    extractPaths = () => [],
    fetchText = async () => "",
    fileUrl = (value) => value,
    renderRichText = () => {},
    setMessageSelection = () => {},
    setText = () => {},
    windowRef = window,
  } = helpers;
  setMessageSelection(kind, title, text, path, kind !== "current");
  setText("message-kind", kind);
  setText("message-title", title);
  const body = documentRef.getElementById("message-body");
  body.innerHTML = "";

  if (path) {
    const kindGuess = classifyPath(path);
    if (kindGuess === "image") {
      const img = createElement("img");
      img.src = fileUrl(path);
      img.className = "media-preview";
      img.addEventListener("click", () => windowRef.open(fileUrl(path), "_blank", "noopener,noreferrer"));
      body.appendChild(img);
    } else if (kindGuess === "video") {
      const video = createElement("video");
      video.src = fileUrl(path);
      video.controls = true;
      video.className = "media-preview";
      body.appendChild(video);
    } else if (kindGuess === "pdf") {
      const link = createElement("a");
      link.href = fileUrl(path);
      link.target = "_blank";
      link.textContent = `Open PDF: ${path}`;
      body.appendChild(link);
    } else if (kindGuess === "text") {
      try {
        const fileText = await fetchText(fileUrl(path));
        renderRichText(body, fileText);
      } catch {
        renderRichText(body, text || path);
      }
    } else {
      const link = createElement("a");
      link.href = fileUrl(path);
      link.target = "_blank";
      link.textContent = `Open file: ${path}`;
      body.appendChild(link);
    }
    if (text) {
      const meta = createElement("pre");
      meta.className = "message-meta";
      meta.textContent = text;
      body.appendChild(meta);
    }
    return;
  }

  const paths = extractPaths(text);
  if (paths.length && classifyPath(paths[0]) === "image") {
    const img = createElement("img");
    img.src = fileUrl(paths[0]);
    img.className = "media-preview";
    body.appendChild(img);
    const meta = createElement("pre");
    meta.className = "message-meta";
    meta.textContent = text;
    body.appendChild(meta);
    return;
  }

  renderRichText(body, text || "--");
}

export function historyRoleClass(type) {
  if (type === "operator_command") return "user";
  if (type === "state_changed") return "assistant";
  return "tool";
}

export function historyRoleMeta(type, helpers = {}) {
  const { historyRoleClass = (value) => value } = helpers;
  const role = historyRoleClass(type);
  if (role === "user") return { label: "You", icon: ">>" };
  if (role === "assistant") return { label: "Lucca", icon: "AI" };
  return { label: "Tool", icon: ".." };
}

export function renderChat(state, history, helpers = {}) {
  const {
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    classifyPath = () => "file",
    createElement = (tag) => document.createElement(tag),
    documentRef = document,
    extractPaths = () => [],
    fileUrl = (value) => value,
    formatRichTextHtml = (value) => value,
    formatTime = (value) => value,
    historyRoleClass = (value) => value,
    historyRoleMeta = () => ({ label: "", icon: "" }),
    maybeSpeakReply = () => {},
    setText = () => {},
    showRichMessage = () => {},
    windowRef = window,
  } = helpers;
  const list = documentRef.getElementById("chat-list");
  const previousScrollTop = list.scrollTop;
  const previousScrollHeight = list.scrollHeight;
  list.innerHTML = "";
  const ordered = [...(history || [])].reverse();
  setText("chat-summary", `${ordered.length} messages`);
  for (const event of ordered) {
    const item = createElement("article");
    const role = historyRoleClass(event.type);
    const meta = historyRoleMeta(event.type);
    item.className = `chat-item ${role}`;
    applyChatRoleTheme(item, role);
    const paths = extractPaths(event.fullLabel || event.label, event.fullDetail || event.detail);
    item.innerHTML = chatBubbleMarkup(role, `${meta.icon} ${meta.label}`, event.type, formatTime(event.ts), formatRichTextHtml(event.fullLabel || event.label));
    if (paths[0] && classifyPath(paths[0]) === "image") {
      const img = createElement("img");
      img.src = fileUrl(paths[0]);
      img.className = "chat-thumb";
      img.addEventListener("click", (pointerEvent) => {
        pointerEvent.stopPropagation();
        windowRef.open(fileUrl(paths[0]), "_blank", "noopener,noreferrer");
      });
      item.querySelector(".chat-bubble-content")?.appendChild(img);
    }
    item.addEventListener("click", () => {
      showRichMessage(event.type, event.fullLabel || event.label, event.fullDetail || event.detail || event.fullLabel || event.label, paths[0] || null);
    });
    list.appendChild(item);
  }
  const maxScrollTop = Math.max(0, list.scrollHeight - list.clientHeight);
  const preservedScrollTop = previousScrollTop + (list.scrollHeight - previousScrollHeight);
  list.scrollTop = Math.max(0, Math.min(preservedScrollTop, maxScrollTop));
  maybeSpeakReply(history);
}

export function appendChatEvent(state, event, helpers = {}) {
  const {
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    classifyPath = () => "file",
    createElement = (tag) => document.createElement(tag),
    documentRef = document,
    extractPaths = () => [],
    fileUrl = (value) => value,
    formatRichTextHtml = (value) => value,
    formatTime = (value) => value,
    historyRoleClass = (value) => value,
    historyRoleMeta = () => ({ label: "", icon: "" }),
    setText = () => {},
    showRichMessage = () => {},
    windowRef = globalThis.window,
    totalCount = null,
  } = helpers;
  const list = documentRef.getElementById("chat-list");
  if (!list || !event) return;
  const item = createElement("article");
  const role = historyRoleClass(event.type);
  const meta = historyRoleMeta(event.type);
  item.className = `chat-item ${role}`;
  applyChatRoleTheme(item, role);
  const paths = extractPaths(event.fullLabel || event.label, event.fullDetail || event.detail);
  item.innerHTML = chatBubbleMarkup(role, `${meta.icon} ${meta.label}`, event.type, formatTime(event.ts), formatRichTextHtml(event.fullLabel || event.label));
  if (paths[0] && classifyPath(paths[0]) === "image") {
    const img = createElement("img");
    img.src = fileUrl(paths[0]);
    img.className = "chat-thumb";
    img.addEventListener("click", (pointerEvent) => {
      pointerEvent.stopPropagation();
      windowRef.open(fileUrl(paths[0]), "_blank", "noopener,noreferrer");
    });
    item.querySelector(".chat-bubble-content")?.appendChild(img);
  }
  item.addEventListener("click", () => {
    showRichMessage(event.type, event.fullLabel || event.label, event.fullDetail || event.detail || event.fullLabel || event.label, paths[0] || null);
  });
  list.prepend(item);
  const nextCount = Number.isFinite(totalCount) ? totalCount : list.children.length;
  setText("chat-summary", `${nextCount} messages`);
}

export function renderHistory(events, helpers = {}) {
  const {
    createElement = (tag) => document.createElement(tag),
    documentRef = document,
    extractPaths = () => [],
    formatTime = (value) => value,
    renderChat = () => {},
    showRichMessage = () => {},
  } = helpers;
  const list = documentRef.getElementById("event-list");
  list.innerHTML = "";
  if (!events?.length) {
    const item = createElement("li");
    item.className = "event-item empty";
    item.textContent = "No recent agent history.";
    list.appendChild(item);
    renderChat([]);
    return;
  }
  renderChat(events);
  for (const event of events) {
    const item = createElement("li");
    item.className = "event-item";
    item.innerHTML = `
      <div class="event-meta">${formatTime(event.ts)} · ${event.type}</div>
      <div>${event.label}</div>
      ${event.detail ? `<div class="event-meta">${event.detail}</div>` : ""}
    `;
    item.addEventListener("click", () => {
      const paths = extractPaths(event.fullLabel || event.label, event.fullDetail || event.detail);
      showRichMessage(event.type, event.fullLabel || event.label, event.fullDetail || event.detail || event.fullLabel || event.label, paths[0] || null);
    });
    list.appendChild(item);
  }
}

export function renderSchedule(detailPayload, helpers = {}) {
  const {
    createElement = (tag) => document.createElement(tag),
    documentRef = document,
    formatDate = (value) => value,
    setText = () => {},
    showRichMessage = () => {},
  } = helpers;
  const list = documentRef.getElementById("schedule-list");
  const schedule = detailPayload?.schedule || [];
  const recentRuns = detailPayload?.recentCronRuns || [];
  list.innerHTML = "";
  const bind = (row, title, body) => row.addEventListener("click", () => showRichMessage("schedule", title, body));
  if (schedule.length) {
    for (const item of schedule) {
      const row = createElement("li");
      row.className = "event-item";
      row.innerHTML = `<div class="event-meta">${item.enabled ? "enabled" : "disabled"}${item.cron ? ` · ${item.cron}` : ""}</div><div>${item.label || "Scheduled task"}</div><div class="event-meta">${item.nextRunAt ? `Next run ${formatDate(item.nextRunAt)}` : "No next run available"}</div>`;
      bind(row, item.label || "Scheduled task", `Cron: ${item.cron || "n/a"}\nTimezone: ${item.tz || "n/a"}\nNext run: ${item.nextRunAt ? formatDate(item.nextRunAt) : "unknown"}`);
      list.appendChild(row);
    }
  } else if (recentRuns.length) {
    for (const run of recentRuns.slice(0, 6)) {
      const row = createElement("li");
      row.className = "event-item";
      row.innerHTML = `<div class="event-meta">recent cron run${run.channel ? ` · ${run.channel}` : ""}</div><div>${run.label || "Scheduled task"}</div><div class="event-meta">${formatDate(run.updatedAt)}</div>`;
      bind(row, run.label || "Scheduled task", `Channel: ${run.channel || "n/a"}\nUpdated: ${formatDate(run.updatedAt)}\nSession: ${run.sessionKey || "n/a"}`);
      list.appendChild(row);
    }
  } else {
    const row = createElement("li");
    row.className = "event-item empty";
    row.textContent = "No schedule data yet.";
    list.appendChild(row);
  }
  setText("schedule-summary", schedule.length ? `${schedule.length} scheduled` : recentRuns.length ? `${recentRuns.length} past runs` : "none");
}

export function showStashItem(item, helpers = {}) {
  const {
    formatDate = (value) => value,
    showRichMessage = () => {},
  } = helpers;
  showRichMessage("stash", item.name, `${item.note || item.source}\nUpdated: ${formatDate(item.updatedAt)}\nPath: ${item.path}`, item.path);
}

export function renderStash(state, stash, helpers = {}) {
  const {
    createElement = (tag) => document.createElement(tag),
    documentRef = document,
    formatDate = (value) => value,
    setText = () => {},
    showStashItem = () => {},
  } = helpers;
  state.stash = stash || [];
  const list = documentRef.getElementById("stash-list");
  list.innerHTML = "";
  setText("stash-summary", `${state.stash.length} files`);
  if (!state.stash.length) {
    const row = createElement("li");
    row.className = "event-item empty";
    row.textContent = "No stash items found.";
    list.appendChild(row);
    return;
  }
  for (const item of state.stash) {
    const row = createElement("li");
    row.className = "event-item";
    row.innerHTML = `<div class="event-meta">${item.kind} · ${formatDate(item.updatedAt)}</div><div>${item.name}</div><div class="event-meta">${item.note || item.source}</div>`;
    row.addEventListener("click", () => showStashItem(item));
    list.appendChild(row);
  }
}
