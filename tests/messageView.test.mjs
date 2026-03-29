import test from "node:test";
import assert from "node:assert/strict";

import {
  appendChatEvent,
  classifyPath,
  cleanPath,
  displayActionText,
  extractPaths,
  fileUrl,
  formatInlineRichText,
  formatRichTextHtml,
  historyRoleClass,
  historyRoleMeta,
  setMessageSelection,
  stripControlTags,
} from "../src/features/chat/messageView.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

test("setMessageSelection updates state with defaults", () => {
  const state = { messageSelection: null };
  setMessageSelection(state, "", "", "", null, false);
  assert.deepEqual(state.messageSelection, {
    locked: false,
    kind: "detail",
    title: "--",
    body: "--",
    path: null,
  });
});

test("fileUrl encodes absolute paths", () => {
  assert.equal(
    fileUrl("/home/user/My File.png"),
    "/api/agent-world/file?path=%2Fhome%2Fuser%2FMy%20File.png",
  );
});

test("cleanPath and extractPaths normalize matched file paths", () => {
  const text = 'See /home/test/output.png, then read /home/test/notes.md.';
  assert.equal(cleanPath("/home/test/output.png,"), "/home/test/output.png");
  assert.deepEqual(extractPaths(text), ["/home/test/output.png", "/home/test/notes.md"]);
});

test("classifyPath recognizes supported media and text types", () => {
  assert.equal(classifyPath("image.PNG"), "image");
  assert.equal(classifyPath("movie.webm"), "video");
  assert.equal(classifyPath("doc.pdf"), "pdf");
  assert.equal(classifyPath("notes.jsonl"), "text");
  assert.equal(classifyPath("archive.bin"), "file");
});

test("stripControlTags and displayActionText remove control tags and normalize whitespace", () => {
  assert.equal(stripControlTags("Work [[meta:hide]] now"), "Work  now");
  assert.equal(displayActionText("  [[tag]]  Working   hard "), "Working hard");
  assert.equal(displayActionText("[[tag]]"), "Idle");
});

test("formatInlineRichText escapes HTML and renders inline markdown", () => {
  const html = formatInlineRichText("Use `code` and **bold** and *em* <tag>", { escapeHtml });
  assert.match(html, /<code>code<\/code>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>em<\/em>/);
  assert.match(html, /&lt;tag&gt;/);
});

test("formatRichTextHtml renders paragraphs, lists, and code blocks", () => {
  const source = "alpha\n\n- one\n- two\n\n```js\nconst x = 1;\n```";
  const html = formatRichTextHtml(source, {
    escapeHtml,
    formatInlineRichText: (value) => formatInlineRichText(value, { escapeHtml }),
    stripControlTags,
  });
  assert.match(html, /<p>alpha<\/p>/);
  assert.match(html, /<ul class="rich-list">/);
  assert.match(html, /<pre class="rich-code"><code>js\nconst x = 1;<\/code><\/pre>/);
});

test("historyRole helpers classify operator, assistant, and tool events", () => {
  assert.equal(historyRoleClass("operator_command"), "user");
  assert.equal(historyRoleClass("state_changed"), "assistant");
  assert.equal(historyRoleClass("tool_started"), "tool");
  assert.deepEqual(historyRoleMeta("operator_command", { historyRoleClass }), { label: "You", icon: ">>" });
  assert.deepEqual(historyRoleMeta("state_changed", { historyRoleClass }), { label: "Lucca", icon: "AI" });
});

test("appendChatEvent prepends a rendered chat item", () => {
  const chatList = {
    children: [],
    prepend(node) {
      this.children.unshift(node);
    },
  };
  const texts = new Map();
  const node = {
    className: "",
    innerHTML: "",
    handlers: {},
    querySelector() {
      return { appendChild() {} };
    },
    addEventListener(type, handler) {
      this.handlers[type] = handler;
    },
  };
  appendChatEvent({}, {
    type: "operator_command",
    label: "hello",
    fullLabel: "hello",
    detail: "Queued from UI",
    fullDetail: "Queued from UI",
    ts: "2026-03-29T12:00:00Z",
  }, {
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "<div class=\"chat-bubble-content\">hello</div>",
    classifyPath,
    createElement: () => node,
    documentRef: {
      getElementById(id) {
        if (id === "chat-list") return chatList;
        return null;
      },
    },
    extractPaths,
    fileUrl,
    formatRichTextHtml: (value) => value,
    formatTime: () => "12:00",
    historyRoleClass,
    historyRoleMeta: (type) => historyRoleMeta(type, { historyRoleClass }),
    setText: (id, value) => texts.set(id, value),
    showRichMessage: () => {},
  });

  assert.equal(chatList.children.length, 1);
  assert.match(chatList.children[0].innerHTML, /chat-bubble-content/);
  assert.equal(texts.get("chat-summary"), "1 messages");
});
