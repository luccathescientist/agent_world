"""Map runtime/session activity into Agent World semantic state."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import mimetypes
import os
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Tuple

from .registry import CoreAgent, get_agent, get_visible_agents
from .world_layout import get_agent_movement_override, load_world_layout


OPENCLAW_DIR = Path(os.getenv("OPENCLAW_HOME", Path.home() / ".openclaw")).expanduser()
OPENCLAW_AGENTS_DIR = OPENCLAW_DIR / "agents"
CRON_JOBS_PATH = OPENCLAW_DIR / "cron" / "jobs.json"
CRON_RUNS_DIR = OPENCLAW_DIR / "cron" / "runs"
HOME_PATH = str(Path.home())
PATH_PATTERN = re.compile(rf"({re.escape(HOME_PATH)}[^\s)\"'`]*)")

AGENT_WORLD_ROOM: Dict[str, Any] = {
    "id": "research-office-grid-a",
    "name": "Lucca Research Office",
    "width": 960,
    "height": 576,
    "anchors": [
        {"id": "library", "label": "Library", "x": 24, "y": 24, "width": 180, "height": 140, "description": "Reading docs and references"},
        {"id": "comms", "label": "Comms", "x": 766, "y": 24, "width": 170, "height": 120, "description": "Messaging and operator interaction"},
        {"id": "terminal", "label": "Terminal", "x": 370, "y": 170, "width": 220, "height": 130, "description": "Coding, tools, and browser work"},
        {"id": "desk", "label": "Desk", "x": 180, "y": 384, "width": 220, "height": 120, "description": "Writing and planning"},
        {"id": "lounge", "label": "Lounge", "x": 700, "y": 372, "width": 220, "height": 140, "description": "Idle and waiting state"},
    ],
}


TOOL_TO_ANCHOR = {
    "read": ("library", "reading"),
    "memory_search": ("library", "reading"),
    "memory_get": ("library", "reading"),
    "pdf": ("library", "reading"),
    "write": ("desk", "writing"),
    "edit": ("terminal", "working"),
    "exec": ("terminal", "working"),
    "process": ("terminal", "working"),
    "browser": ("terminal", "working"),
    "canvas": ("terminal", "working"),
    "sessions_send": ("comms", "messaging"),
    "message": ("comms", "messaging"),
    "tts": ("comms", "messaging"),
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _load_json_file(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text())
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _sessions_path_for(agent: CoreAgent) -> Path:
    return OPENCLAW_AGENTS_DIR / agent.session_agent_id / "sessions" / "sessions.json"


def _load_sessions_index(path: Path) -> Dict[str, Any]:
    return _load_json_file(path)


def _load_cron_jobs() -> Dict[str, Any]:
    return _load_json_file(CRON_JOBS_PATH)


def _get_session_meta(agent: CoreAgent, session_key: str) -> Optional[Dict[str, Any]]:
    data = _load_sessions_index(_sessions_path_for(agent))
    meta = data.get(session_key)
    return meta if isinstance(meta, dict) else None


def _read_recent_transcript(session_file: Path, max_lines: int = 100) -> List[Dict[str, Any]]:
    if not session_file.exists():
        return []
    lines = session_file.read_text().splitlines()
    items: List[Dict[str, Any]] = []
    for line in lines[-max_lines:]:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            items.append(obj)
    return items


def _extract_text_fragments(content: Any) -> List[str]:
    out: List[str] = []
    if isinstance(content, str):
        if content.strip():
            out.append(content.strip())
        return out
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str) and text.strip():
                    out.append(text.strip())
    return out


def _extract_tool_calls(content: Any) -> List[str]:
    names: List[str] = []
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and item.get("type") == "toolCall":
                name = item.get("name")
                if isinstance(name, str):
                    names.append(name)
    return names


def _truncate(text: str, limit: int = 88) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "..."


def _is_noise_text(text: str) -> bool:
    noisy_markers = [
        "DeprecationWarning",
        "Successfully wrote",
        "Command still running",
        "Termination requested",
        "Traceback",
    ]
    return any(marker in text for marker in noisy_markers)


def _session_key_for(agent: CoreAgent) -> str:
    return f"agent:{agent.session_agent_id}:{agent.session_label}"


def _clean_path_text(text: str) -> str:
    return text.rstrip("\\.,:;)]}>`\"'")


def _extract_paths_from_text(text: str) -> List[str]:
    out: List[str] = []
    for match in PATH_PATTERN.findall(text or ""):
        for chunk in str(match).replace("\\n", "\n").splitlines():
            cleaned = _clean_path_text(chunk.strip())
            if not cleaned or len(cleaned) > 4096:
                continue
            if cleaned not in out:
                out.append(cleaned)
    return out


def _file_kind(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
        return "image"
    if suffix in {".mp4", ".mov", ".webm"}:
        return "video"
    if suffix == ".pdf":
        return "pdf"
    if suffix in {".txt", ".md", ".json", ".jsonl", ".log"}:
        return "text"
    return "file"


def _stash_item(path: Path, source: str, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
    try:
        if not path.exists() or not path.is_file():
            return None
        stat = path.stat()
    except OSError:
        return None
    mime_type, _ = mimetypes.guess_type(str(path))
    return {
        "path": str(path),
        "name": path.name,
        "kind": _file_kind(path),
        "mimeType": mime_type,
        "size": stat.st_size,
        "updatedAt": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": source,
        "note": note,
    }


def _model_from_meta(meta: Dict[str, Any]) -> str:
    return (
        meta.get("modelOverride")
        or meta.get("model")
        or meta.get("providerOverride")
        or "unknown"
    )


def _recent_semantic_snapshot(transcript: List[Dict[str, Any]]) -> Dict[str, Any]:
    latest_text: Optional[str] = None
    latest_tool: Optional[str] = None
    latest_role: Optional[str] = None
    last_timestamp: Optional[str] = None
    waiting_reason: Optional[str] = None
    tool_window: List[str] = []
    unresolved_calls = 0

    for item in reversed(transcript):
        message = item.get("message", {})
        role = message.get("role")
        timestamp = item.get("timestamp") or item.get("ts")

        if not last_timestamp and isinstance(timestamp, str):
            last_timestamp = timestamp
        if latest_role is None and isinstance(role, str):
            latest_role = role

        if role == "assistant":
            calls = _extract_tool_calls(message.get("content"))
            if calls:
                tool_window.extend(reversed(calls))
                unresolved_calls += len(calls)
                if latest_tool is None:
                    latest_tool = calls[-1]
            if latest_text is None:
                for frag in _extract_text_fragments(message.get("content")):
                    if frag and frag != "NO_REPLY" and not frag.startswith("HEARTBEAT_OK") and not _is_noise_text(frag):
                        latest_text = frag
                        break
        elif role == "toolResult":
            tool_name = message.get("toolName") or message.get("tool")
            if isinstance(tool_name, str):
                if latest_tool is None:
                    latest_tool = tool_name
                tool_window.append(tool_name)
                unresolved_calls = max(0, unresolved_calls - 1)
        elif role == "user":
            if waiting_reason is None:
                fragments = _extract_text_fragments(message.get("content"))
                if fragments:
                    waiting_reason = fragments[0]

        if latest_text and latest_tool and len(tool_window) >= 6:
            break

    anchor_counts: Dict[Tuple[str, str], int] = {}
    for tool_name in tool_window[:8]:
        mapped = TOOL_TO_ANCHOR.get(tool_name)
        if not mapped:
            continue
        anchor_counts[mapped] = anchor_counts.get(mapped, 0) + 1

    anchor = "lounge"
    visual = "idle"
    action = latest_text or "Standing by"

    if anchor_counts:
        (anchor, visual), _ = max(anchor_counts.items(), key=lambda item: item[1])
        if latest_text is None and latest_tool:
            action = f"Using {latest_tool}"
    elif latest_tool and latest_tool in TOOL_TO_ANCHOR:
        anchor, visual = TOOL_TO_ANCHOR[latest_tool]
        if latest_text is None:
            action = f"Using {latest_tool}"
    elif latest_text:
        lower = latest_text.lower()
        if any(k in lower for k in ["plan", "draft", "write", "scaffold", "outline", "implementation", "summarize"]):
            anchor, visual = "desk", "writing"
        elif any(k in lower for k in ["inspect", "wire", "server", "backend", "code", "session", "app", "build", "patch"]):
            anchor, visual = "terminal", "working"
        elif any(k in lower for k in ["read", "check", "look up", "docs", "memory", "history"]):
            anchor, visual = "library", "reading"

    awaiting_user = latest_role == "user"

    return {
        "lastTool": latest_tool,
        "currentAction": _truncate(action),
        "currentActionFull": action,
        "currentAnchor": anchor,
        "targetAnchor": anchor,
        "visualState": visual,
        "lastTimestamp": last_timestamp,
        "waitingReason": _truncate(waiting_reason, 120) if waiting_reason else None,
        "queueDepth": unresolved_calls,
        "awaitingUser": awaiting_user,
        "latestRole": latest_role,
    }


def _runtime_status_from_meta(meta: Dict[str, Any], snapshot: Dict[str, Any]) -> str:
    updated_ms = meta.get("updatedAt") or 0
    age_ms = max(0, int(datetime.now(timezone.utc).timestamp() * 1000) - int(updated_ms)) if updated_ms else 0
    if meta.get("abortedLastRun"):
        return "blocked"
    if snapshot.get("awaitingUser"):
        return "waiting_user"
    if age_ms < 90_000:
        return "active"
    if age_ms < 15 * 60_000:
        return "idle"
    return "offline" if updated_ms else "idle"


def _normalise_event_type(role: Optional[str], tool_name: Optional[str], text: Optional[str]) -> str:
    if role == "user":
        return "operator_command"
    if role == "toolResult":
        return "tool_finished"
    if role == "assistant" and tool_name:
        return "tool_started"
    if role == "assistant" and text:
        return "state_changed"
    return "state_changed"


def _event_payload(
    event_id: str,
    agent: CoreAgent,
    ts: str,
    role: Optional[str],
    label: str,
    detail: Optional[str],
    *,
    tool_name: Optional[str] = None,
    full_label: Optional[str] = None,
    full_detail: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "id": event_id,
        "agentId": agent.id,
        "ts": ts,
        "type": _normalise_event_type(role, tool_name, label),
        "label": label,
        "detail": detail,
        "fullLabel": full_label or label,
        "fullDetail": full_detail or detail,
    }


def _history_from_transcript(agent: CoreAgent, transcript: List[Dict[str, Any]], limit: int = 24) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    for index, item in enumerate(reversed(transcript)):
        message = item.get("message", {})
        role = message.get("role")
        ts = item.get("timestamp") or item.get("ts") or _utc_now()
        tool_calls = _extract_tool_calls(message.get("content"))
        text_fragments = _extract_text_fragments(message.get("content"))
        tool_name = None
        label = None
        detail = None
        full_label = None
        full_detail = None

        if role == "assistant" and tool_calls:
            meaningful = next(
                (
                    frag
                    for frag in text_fragments
                    if frag and frag != "NO_REPLY" and not frag.startswith("HEARTBEAT_OK") and not _is_noise_text(frag)
                ),
                None,
            )
            if meaningful:
                events.append(
                    _event_payload(
                        f"evt-{agent.id}-{index}-state",
                        agent,
                        ts,
                        "assistant",
                        _truncate(meaningful, 72),
                        "Assistant narration before tool use.",
                        full_label=meaningful,
                        full_detail="Assistant narration before tool use.",
                    )
                )
            tool_name = tool_calls[-1]
            full_label = f"Started {tool_name}"
            full_detail = f"{agent.name} shifted into {tool_name}-driven work."
            label = full_label
            detail = full_detail
        elif role == "toolResult":
            tool_name = message.get("toolName") or "tool"
            full_label = f"Finished {tool_name}"
            full_detail = text_fragments[0] if text_fragments else f"Completed {tool_name}."
            label = full_label
            detail = _truncate(full_detail, 140)
        elif role == "user" and text_fragments:
            full_label = text_fragments[0]
            full_detail = "Recent instruction sent into the session."
            label = _truncate(full_label, 72)
            detail = full_detail
        elif role == "assistant" and text_fragments:
            meaningful = next(
                (
                    frag
                    for frag in text_fragments
                    if frag and frag != "NO_REPLY" and not frag.startswith("HEARTBEAT_OK") and not _is_noise_text(frag)
                ),
                None,
            )
            if meaningful:
                full_label = meaningful
                full_detail = "Latest assistant narration or reply."
                label = _truncate(full_label, 72)
                detail = full_detail

        if not label:
            continue

        events.append(
            _event_payload(
                f"evt-{agent.id}-{index}",
                agent,
                ts,
                role,
                label,
                detail,
                tool_name=tool_name,
                full_label=full_label,
                full_detail=full_detail,
            )
        )

    events.sort(key=lambda event: event.get("ts") or "", reverse=True)
    return events[:limit]


def _schedule_for_agent(agent: CoreAgent) -> List[Dict[str, Any]]:
    jobs_payload = _load_cron_jobs()
    jobs = jobs_payload.get("jobs", [])
    out: List[Dict[str, Any]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        target_agent = job.get("agent") or job.get("session") or job.get("sessionKey")
        if target_agent not in {agent.session_label, agent.id, _session_key_for(agent)}:
            continue
        out.append(
            {
                "jobId": job.get("id"),
                "label": job.get("name") or job.get("description") or "Scheduled task",
                "cron": job.get("cron"),
                "tz": job.get("tz"),
                "nextRunAt": job.get("nextRunAt"),
                "enabled": not bool(job.get("disabled")),
                "source": "openclaw-cron",
            }
        )
    return out


def _recent_cron_runs(agent: CoreAgent, limit: int = 8) -> List[Dict[str, Any]]:
    runs: List[Dict[str, Any]] = []
    sessions = _load_sessions_index(_sessions_path_for(agent))
    for session_key, meta in sessions.items():
        if not isinstance(meta, dict) or not session_key.startswith(f"agent:{agent.session_agent_id}:cron:"):
            continue
        label = meta.get("label") or "Scheduled task"
        updated_at = meta.get("updatedAt")
        runs.append(
            {
                "sessionKey": session_key,
                "label": label,
                "updatedAt": datetime.fromtimestamp(updated_at / 1000, timezone.utc).isoformat().replace("+00:00", "Z")
                if isinstance(updated_at, (int, float))
                else None,
                "model": meta.get("model"),
                "channel": meta.get("lastChannel"),
                "source": "session-index",
            }
        )

    runs.sort(key=lambda run: run.get("updatedAt") or "", reverse=True)
    return runs[:limit]


def _derive_agent_stash(agent: CoreAgent, transcript: List[Dict[str, Any]], limit: int = 24) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    seen: set[str] = set()

    for item in reversed(transcript[-200:]):
        message = item.get("message", {})
        ts = item.get("timestamp") or item.get("ts")
        note = None
        role = message.get("role")
        if role == "toolResult":
            tool_name = message.get("toolName") or message.get("tool")
            note = f"Captured from {tool_name}" if tool_name else "Captured from tool output"

        serialized = json.dumps(item, ensure_ascii=False)
        for raw_path in _extract_paths_from_text(serialized):
            path = Path(raw_path)
            if str(path) in seen:
                continue
            stash = _stash_item(path, "transcript", note)
            if not stash:
                continue
            if ts:
                stash["discoveredAt"] = ts
            items.append(stash)
            seen.add(str(path))

    items.sort(key=lambda item: item.get("updatedAt") or "", reverse=True)
    return items[:limit]


def build_agent_summary(agent: CoreAgent, slot_index: int = 0) -> Dict[str, Any]:
    session_key = _session_key_for(agent)
    meta = _get_session_meta(agent, session_key) or {}
    session_file = Path(meta.get("sessionFile", "")) if meta.get("sessionFile") else None
    transcript = _read_recent_transcript(session_file) if session_file else []
    snapshot = _recent_semantic_snapshot(transcript)
    movement_override = get_agent_movement_override(agent.id)
    if movement_override and movement_override.get("anchorId"):
        snapshot["targetAnchor"] = movement_override["anchorId"]
    runtime_status = _runtime_status_from_meta(meta, snapshot)

    visual_state = snapshot["visualState"]
    if runtime_status == "idle":
        visual_state = "idle"
    elif runtime_status == "blocked":
        visual_state = "blocked"
    elif runtime_status == "waiting_user":
        visual_state = "waiting"
    elif runtime_status == "offline":
        visual_state = "idle"
    elif runtime_status == "active" and snapshot["currentAnchor"] == "lounge":
        visual_state = "waiting"

    return {
        "id": agent.id,
        "name": agent.name,
        "model": _model_from_meta(meta),
        "runtimeStatus": runtime_status,
        "visualState": visual_state,
        "currentAction": snapshot["currentAction"],
        "currentActionFull": snapshot.get("currentActionFull", snapshot["currentAction"]),
        "currentAnchor": snapshot["currentAnchor"],
        "targetAnchor": snapshot["targetAnchor"],
        "slotIndex": slot_index,
        "spriteSeed": agent.sprite_seed,
        "sessionLabel": agent.session_label,
        "taskLabel": snapshot["currentAction"],
        "lastUpdatedAt": snapshot.get("lastTimestamp") or _utc_now(),
        "lastTool": snapshot.get("lastTool"),
        "queueDepth": snapshot.get("queueDepth", 0),
        "waitingReason": snapshot.get("waitingReason"),
    }


def derive_agent_world_state() -> Dict[str, Any]:
    now = _utc_now()
    layout = load_world_layout()
    room_name = layout.get("name") or AGENT_WORLD_ROOM["name"]
    anchors = layout.get("anchors")
    room = {
        **AGENT_WORLD_ROOM,
        "name": room_name,
        "anchors": anchors if isinstance(anchors, dict) else AGENT_WORLD_ROOM["anchors"],
    }
    agents = [build_agent_summary(agent, idx) for idx, agent in enumerate(get_visible_agents())]
    return {
        "version": "0.4.0",
        "room": room,
        "agents": agents,
        "selectedAgentId": agents[0]["id"] if agents else None,
        "serverTime": now,
    }


def derive_agent_world_events() -> Dict[str, List[Dict[str, Any]]]:
    events: List[Dict[str, Any]] = []
    for agent in get_visible_agents():
        session_key = _session_key_for(agent)
        meta = _get_session_meta(agent, session_key) or {}
        session_file = Path(meta.get("sessionFile", "")) if meta.get("sessionFile") else None
        if not session_file:
            continue
        transcript = _read_recent_transcript(session_file, max_lines=200)
        events.extend(_history_from_transcript(agent, transcript, limit=24))

    events.sort(key=lambda event: event.get("ts") or "", reverse=True)
    return {"events": events[:40]}


def derive_agent_detail(agent_id: str) -> Dict[str, Any]:
    agent = get_agent(agent_id)
    if agent is None:
        return {"ok": False, "reason": "unknown_agent", "agentId": agent_id}

    session_key = _session_key_for(agent)
    meta = _get_session_meta(agent, session_key) or {}
    session_file = Path(meta.get("sessionFile", "")) if meta.get("sessionFile") else None
    transcript = _read_recent_transcript(session_file, max_lines=240) if session_file else []

    return {
        "ok": True,
        "agent": build_agent_summary(agent, 0),
        "history": _history_from_transcript(agent, transcript, limit=60),
        "schedule": _schedule_for_agent(agent),
        "recentCronRuns": _recent_cron_runs(agent, limit=8),
        "stash": _derive_agent_stash(agent, transcript, limit=24),
        "session": {
            "sessionKey": session_key,
            "sessionFile": str(session_file) if session_file else None,
            "updatedAt": meta.get("updatedAt"),
            "chatType": meta.get("chatType"),
            "lastChannel": meta.get("lastChannel"),
        },
        "serverTime": _utc_now(),
    }


def derive_agent_history(agent_id: str) -> Dict[str, Any]:
    agent = get_agent(agent_id)
    if agent is None:
        return {"ok": False, "reason": "unknown_agent", "agentId": agent_id, "events": []}

    session_key = _session_key_for(agent)
    meta = _get_session_meta(agent, session_key) or {}
    session_file = Path(meta.get("sessionFile", "")) if meta.get("sessionFile") else None
    transcript = _read_recent_transcript(session_file, max_lines=240) if session_file else []
    return {
        "ok": True,
        "agentId": agent.id,
        "events": _history_from_transcript(agent, transcript, limit=80),
        "serverTime": _utc_now(),
    }


def derive_agent_schedule(agent_id: str) -> Dict[str, Any]:
    agent = get_agent(agent_id)
    if agent is None:
        return {"ok": False, "reason": "unknown_agent", "agentId": agent_id, "schedule": []}

    return {
        "ok": True,
        "agentId": agent.id,
        "schedule": _schedule_for_agent(agent),
        "recentCronRuns": _recent_cron_runs(agent, limit=12),
        "serverTime": _utc_now(),
    }


def derive_agent_stash(agent_id: str) -> Dict[str, Any]:
    agent = get_agent(agent_id)
    if agent is None:
        return {"ok": False, "reason": "unknown_agent", "agentId": agent_id, "stash": []}

    session_key = _session_key_for(agent)
    meta = _get_session_meta(agent, session_key) or {}
    session_file = Path(meta.get("sessionFile", "")) if meta.get("sessionFile") else None
    transcript = _read_recent_transcript(session_file, max_lines=220) if session_file else []
    return {
        "ok": True,
        "agentId": agent.id,
        "stash": _derive_agent_stash(agent, transcript, limit=36),
        "serverTime": _utc_now(),
    }
