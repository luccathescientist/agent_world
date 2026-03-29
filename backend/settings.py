"""Global settings and diagnostics for the standalone Agent World install."""

from __future__ import annotations

import copy
import json
import os
from pathlib import Path
import shutil
from typing import Any, Dict
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).resolve().parents[1]
SETTINGS_PATH = ROOT_DIR / "agent_world.json"

DEFAULT_SETTINGS: Dict[str, Any] = {
    "openclaw": {
        "home": "~/.openclaw",
        "workspace": "",
        "mediaDir": "",
        "allowedFileRoots": [],
    },
    "server": {
        "host": "0.0.0.0",
        "port": 8890,
    },
}


def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    merged = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def _read_json(path: Path) -> Dict[str, Any]:
    try:
        if not path.exists():
            return {}
        data = json.loads(path.read_text())
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def load_settings() -> Dict[str, Any]:
    return _deep_merge(DEFAULT_SETTINGS, _read_json(SETTINGS_PATH))


def save_settings(payload: Dict[str, Any]) -> Dict[str, Any]:
    merged = _deep_merge(DEFAULT_SETTINGS, payload if isinstance(payload, dict) else {})
    SETTINGS_PATH.write_text(json.dumps(merged, indent=2) + "\n")
    return merged


def _path_from_setting(raw_value: Any, fallback: str) -> Path:
    value = str(raw_value or fallback).strip() or fallback
    return Path(value).expanduser()


def get_openclaw_home() -> Path:
    cfg = load_settings()
    return _path_from_setting(
        cfg.get("openclaw", {}).get("home"),
        os.getenv("OPENCLAW_HOME", str(Path.home() / ".openclaw")),
    )


def get_openclaw_media_dir() -> Path:
    cfg = load_settings()
    raw_media = str(cfg.get("openclaw", {}).get("mediaDir") or "").strip()
    if raw_media:
        return Path(raw_media).expanduser()
    return _path_from_setting(
        "",
        os.getenv("OPENCLAW_MEDIA_DIR", str(get_openclaw_home() / "media")),
    )


def get_openclaw_workspace() -> Path | None:
    cfg = load_settings()
    configured = str(cfg.get("openclaw", {}).get("workspace") or "").strip()
    candidates = []
    if configured:
        candidates.append(Path(configured).expanduser())
    env_value = os.getenv("OPENCLAW_WORKSPACE", "").strip()
    if env_value:
        candidates.append(Path(env_value).expanduser())
    candidates.extend(
        [
            ROOT_DIR / "vendor" / "openclaw",
            ROOT_DIR.parent / "openclaw",
            Path.home() / "workspace" / "openclaw",
        ]
    )
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    return Path(configured).expanduser().resolve() if configured else None


def get_allowed_file_roots() -> list[Path]:
    cfg = load_settings()
    roots = [ROOT_DIR.resolve()]
    openclaw_home = get_openclaw_home()
    openclaw_media_dir = get_openclaw_media_dir()
    if openclaw_home.exists():
        roots.append(openclaw_home.resolve())
    if openclaw_media_dir.exists():
        roots.append(openclaw_media_dir.resolve())
    for raw in cfg.get("openclaw", {}).get("allowedFileRoots", []):
        try:
            path = Path(str(raw)).expanduser()
        except Exception:
            continue
        if path.exists():
            roots.append(path.resolve())
    return roots


def _json_text(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False)


def _display_agent_world_id(agent_id: str) -> str:
    if agent_id == "main":
        return "lucca-main"
    return agent_id


def _display_agent_name(entry: Dict[str, Any], agent_id: str) -> str:
    name = str(entry.get("name") or "").strip()
    if name:
        return name
    if agent_id == "main":
        return "Lucca"
    return agent_id


def _primary_model(entry: Dict[str, Any], defaults: Dict[str, Any]) -> str:
    model_block = entry.get("model")
    if isinstance(model_block, dict):
        primary = str(model_block.get("primary") or "").strip()
        if primary:
            return primary
    defaults_model = defaults.get("model")
    if isinstance(defaults_model, dict):
        primary = str(defaults_model.get("primary") or "").strip()
        if primary:
            return primary
    return "unknown"


def _sandbox_root(entry: Dict[str, Any], defaults: Dict[str, Any]) -> str:
    sandbox = entry.get("sandbox")
    if isinstance(sandbox, dict):
        root = str(sandbox.get("workspaceRoot") or "").strip()
        if root:
            return root
    defaults_sandbox = defaults.get("sandbox")
    if isinstance(defaults_sandbox, dict):
        root = str(defaults_sandbox.get("workspaceRoot") or "").strip()
        if root:
            return root
    return ""


def _workspace_root(entry: Dict[str, Any], defaults: Dict[str, Any]) -> str:
    workspace = str(entry.get("workspace") or "").strip()
    if workspace:
        return workspace
    workspace = str(defaults.get("workspace") or "").strip()
    return workspace


def _dedupe_strings(values: list[str]) -> list[str]:
    out: list[str] = []
    for value in values:
        cleaned = str(value or "").strip()
        if cleaned and cleaned not in out:
            out.append(cleaned)
    return out


def _format_timestamp(value: Any) -> str:
    try:
        raw = float(value)
    except Exception:
        return str(value or "--")
    if raw > 10_000_000_000:
        raw = raw / 1000.0
    return datetime.fromtimestamp(raw, timezone.utc).isoformat().replace("+00:00", "Z")


def diagnostics_payload() -> Dict[str, Any]:
    cfg = load_settings()
    openclaw_home = get_openclaw_home()
    openclaw_media_dir = get_openclaw_media_dir()
    openclaw_workspace = get_openclaw_workspace()
    config_path = openclaw_home / "openclaw.json"
    main_sessions_index = openclaw_home / "agents" / "main" / "sessions" / "sessions.json"
    tsx_loader = (
        openclaw_workspace / "node_modules" / "tsx" / "dist" / "loader.mjs"
        if openclaw_workspace
        else None
    )
    openclaw_config = _read_json(config_path)
    config_agents = openclaw_config.get("agents", {}).get("list", []) if isinstance(openclaw_config, dict) else []
    main_agent = None
    if isinstance(config_agents, list):
        for entry in config_agents:
            if isinstance(entry, dict) and str(entry.get("id") or "").strip() == "main":
                main_agent = entry
                break
    sessions_index = _read_json(main_sessions_index)
    session_count = len(sessions_index) if isinstance(sessions_index, dict) else 0
    cli_path = shutil.which("openclaw")
    agents_defaults = openclaw_config.get("agents", {}).get("defaults", {}) if isinstance(openclaw_config, dict) else {}
    renderable_agents = []
    if isinstance(config_agents, list):
        for entry in config_agents:
            if not isinstance(entry, dict):
                continue
            agent_id = str(entry.get("id") or "").strip()
            if not agent_id:
                continue
            if agent_id != "main" and not agent_id.startswith("bench-"):
                continue
            workspace_root = _workspace_root(entry, agents_defaults if isinstance(agents_defaults, dict) else {})
            sandbox_root = _sandbox_root(entry, agents_defaults if isinstance(agents_defaults, dict) else {})
            accessible_dirs = _dedupe_strings([workspace_root, sandbox_root, str(openclaw_media_dir)])
            renderable_agents.append(
                {
                    "title": _display_agent_name(entry, agent_id),
                    "fields": [
                        {"label": "Agent World ID", "value": _display_agent_world_id(agent_id)},
                        {"label": "OpenClaw ID", "value": agent_id},
                        {"label": "Name", "value": _display_agent_name(entry, agent_id)},
                        {"label": "Primary Model", "value": _primary_model(entry, agents_defaults if isinstance(agents_defaults, dict) else {})},
                        {"label": "Workspace", "value": workspace_root or "--"},
                        {"label": "Sandbox Root", "value": sandbox_root or "--"},
                        {"label": "Accessible Directories", "value": ", ".join(accessible_dirs) if accessible_dirs else "--"},
                    ],
                }
            )
    recent_sessions = []
    if isinstance(sessions_index, dict):
        ordered_sessions = sorted(
            sessions_index.items(),
            key=lambda item: float(item[1].get("updatedAt") or 0) if isinstance(item[1], dict) else 0,
            reverse=True,
        )[:5]
        for session_key, meta in ordered_sessions:
            if not isinstance(meta, dict):
                continue
            recent_sessions.append(
                {
                    "title": session_key,
                    "fields": [
                        {"label": "Updated", "value": _format_timestamp(meta.get("updatedAt"))},
                        {"label": "Session File", "value": str(meta.get("sessionFile") or "--")},
                        {"label": "Chat Type", "value": str(meta.get("chatType") or "--")},
                        {"label": "Provider", "value": str(meta.get("origin", {}).get("provider") or "--")},
                        {"label": "Last To", "value": str(meta.get("lastTo") or "--")},
                    ],
                }
            )

    checks = [
        {
            "id": "agent-discovery",
            "label": "Agent discovery",
            "ok": bool(config_path.exists() and isinstance(config_agents, list) and main_agent and renderable_agents),
            "path": str(config_path),
            "appliesTo": "Used to discover the visible named agents that Agent World should render.",
            "detail": (
                f"Found {len(renderable_agents)} renderable named agents from agents.list."
                if config_path.exists() and isinstance(config_agents, list) and main_agent and renderable_agents
                else "Agent World needs openclaw.json with a renderable main agent entry."
            ),
            "records": renderable_agents,
            "sources": [
                {
                    "label": "agents.defaults",
                    "language": "json",
                    "text": _json_text(agents_defaults if isinstance(agents_defaults, dict) else {}),
                },
                {
                    "label": "agents.list",
                    "language": "json",
                    "text": _json_text(config_agents if isinstance(config_agents, list) else []),
                },
            ],
        },
        {
            "id": "session-history",
            "label": "Session history and activity",
            "ok": bool(main_sessions_index.exists() and isinstance(sessions_index, dict) and session_count > 0),
            "path": str(main_sessions_index),
            "appliesTo": "Drives the world state, chat log, schedule, stash, and recent activity.",
            "detail": (
                f"Parsed {session_count} indexed sessions for the main agent."
                if main_sessions_index.exists() and isinstance(sessions_index, dict) and session_count > 0
                else "Agent World needs a parseable main/sessions/sessions.json with at least one indexed session."
            ),
            "records": recent_sessions,
            "sources": [
                {
                    "label": "recent session index entries",
                    "language": "json",
                    "text": _json_text(
                        dict(
                            sorted(
                                sessions_index.items(),
                                key=lambda item: float(item[1].get("updatedAt") or 0) if isinstance(item[1], dict) else 0,
                                reverse=True,
                            )[:5]
                        ) if isinstance(sessions_index, dict) else {}
                    ),
                }
            ],
        },
        {
            "id": "command-routing",
            "label": "Command routing",
            "ok": bool(cli_path),
            "path": cli_path,
            "appliesTo": "Lets the Send Command box deliver instructions back into the selected agent.",
            "detail": (
                f"Found the openclaw CLI at {cli_path}."
                if cli_path
                else "Agent World needs the openclaw CLI on PATH to send commands into agents."
            ),
            "records": [
                {
                    "title": "Resolved command target",
                    "fields": [
                        {"label": "CLI Path", "value": cli_path or "--"},
                        {"label": "Command Template", "value": "openclaw agent --agent <label> --message <text> --timeout 600"},
                    ],
                }
            ],
        },
        {
            "id": "voice-bridge",
            "label": "Voice bridge readiness",
            "ok": bool(openclaw_workspace and tsx_loader and tsx_loader.exists()),
            "path": str(tsx_loader) if tsx_loader else str(openclaw_workspace) if openclaw_workspace else None,
            "appliesTo": "Enables OpenClaw-backed transcription and text-to-speech in Agent World's voice controls.",
            "detail": (
                "Workspace and tsx loader are present for the OpenClaw voice bridge."
                if openclaw_workspace and tsx_loader and tsx_loader.exists()
                else "Voice needs a valid OpenClaw workspace plus node_modules/tsx/dist/loader.mjs."
            ),
            "records": [
                {
                    "title": "Voice bridge paths",
                    "fields": [
                        {"label": "Workspace", "value": str(openclaw_workspace) if openclaw_workspace else "--"},
                        {"label": "TSX Loader", "value": str(tsx_loader) if tsx_loader else "--"},
                    ],
                }
            ],
        },
    ]
    required_ids = {"agent-discovery", "session-history", "command-routing"}
    ready_required = [check for check in checks if check["id"] in required_ids and check["ok"]]
    if len(ready_required) == len(required_ids):
        runtime_state = {
            "state": "online",
            "label": "OpenClaw online",
            "detail": "Agent discovery, session history, and command routing are all ready.",
        }
    elif ready_required:
        runtime_state = {
            "state": "partial",
            "label": "OpenClaw partial",
            "detail": "Some required OpenClaw integrations are ready, but Agent World is missing others.",
        }
    else:
        runtime_state = {
            "state": "offline",
            "label": "OpenClaw offline",
            "detail": "Agent World does not yet have the OpenClaw state it needs to operate normally.",
        }
    return {
        "ok": runtime_state["state"] == "online",
        "settingsPath": str(SETTINGS_PATH),
        "settings": cfg,
        "checks": checks,
        "runtime": runtime_state,
        "resolvedPaths": {
            "settingsPath": str(SETTINGS_PATH),
            "openclawHome": str(openclaw_home),
            "openclawConfig": str(config_path),
            "mainSessionsIndex": str(main_sessions_index),
            "openclawMediaDir": str(openclaw_media_dir),
            "openclawWorkspace": str(openclaw_workspace) if openclaw_workspace else None,
            "tsxLoader": str(tsx_loader) if tsx_loader else None,
        },
    }
