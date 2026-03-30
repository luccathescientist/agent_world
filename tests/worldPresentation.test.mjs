import test from "node:test";
import assert from "node:assert/strict";

import {
  activityCue,
  bubblePaletteForAgent,
  displayedLocationLabel,
  hashString,
  isInactiveAgent,
  isMainAgent,
  parseTimestampMs,
  shouldShowAgentSprite,
  statusClass,
} from "../src/features/world/presentation.js";

test("status and timestamp helpers classify runtime state safely", () => {
  assert.equal(statusClass("blocked"), "blocked");
  assert.equal(statusClass("waiting_user"), "waiting");
  assert.equal(statusClass("offline"), "offline");
  assert.equal(statusClass("active"), "active");
  assert.equal(parseTimestampMs("bad-date"), 0);
  assert.equal(isMainAgent({ id: "lucca-main" }), true);
});

test("bubble palette and inactivity helpers derive deterministic visibility", () => {
  const hash = hashString("agent:test");
  assert.equal(Number.isInteger(hash), true);
  assert.deepEqual(
    bubblePaletteForAgent({ id: "lucca-main" }, { hashString }),
    { fill: 0x111111, stroke: 0xf6e8bf, text: 0xf6ebc7 },
  );
  const inactive = isInactiveAgent(
    { id: "other", lastUpdatedAt: "2025-01-01T00:00:00Z", runtimeStatus: "idle" },
    Date.parse("2025-01-02T00:00:00Z"),
    { isMainAgent, parseTimestampMs },
  );
  assert.equal(inactive, true);
  assert.equal(shouldShowAgentSprite({ id: "other" }, { isInactiveAgent: () => true }), false);
});

test("presentation helpers derive cues and displayed labels from injected state selectors", () => {
  assert.equal(activityCue({ visualState: "messaging" }, null, false, { isIdleLikeAgent: () => false }), "✉️");
  assert.equal(activityCue({ visualState: "idle" }, null, false, { isIdleLikeAgent: () => true }), "😴");
  assert.equal(
    displayedLocationLabel(
      { currentAnchor: "backend", targetAnchor: "backend" },
      {
        roomIdForAgent: () => "rendered",
        roomLabelForAnchor: (value) => value === "rendered" ? "Library" : "Office",
      },
    ),
    "Library (rendered)",
  );
});
