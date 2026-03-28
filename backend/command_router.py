"""Direct operator command routing for Agent World."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import subprocess
from typing import Any, Dict

from .registry import get_agent


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def route_operator_command(agent_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send an operator command directly into the target OpenClaw session.

    v1 uses `openclaw agent --agent main` as the live session messaging path for
    the main Lucca environment and returns immediately after launch.
    """

    agent = get_agent(agent_id)
    accepted_at = _utc_now()
    text = payload.get("text", "")

    if agent is None:
        return {
            "ok": False,
            "acceptedAt": accepted_at,
            "agentId": agent_id,
            "echoedCommand": text,
            "status": "rejected",
            "reason": "unknown_agent",
        }

    cli_agent = "main" if agent.session_label == "main" else agent.session_label
    cmd = [
        "openclaw",
        "agent",
        "--agent",
        cli_agent,
        "--message",
        text,
        "--timeout",
        "600",
    ]

    try:
        subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        return {
            "ok": True,
            "acceptedAt": accepted_at,
            "agentId": agent_id,
            "echoedCommand": text,
            "status": "accepted",
            "delivery": "direct_session",
        }
    except Exception as exc:
        return {
            "ok": False,
            "acceptedAt": accepted_at,
            "agentId": agent_id,
            "echoedCommand": text,
            "status": "rejected",
            "reason": str(exc)[:1000],
        }
