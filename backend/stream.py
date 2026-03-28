"""Live update transport helpers for Agent World."""

from __future__ import annotations

from json import dumps
from time import sleep
from typing import Iterator, Optional

from .state_mapper import (
    derive_agent_detail,
    derive_agent_world_events,
    derive_agent_world_state,
)


def _sse_frame(payload: dict) -> str:
    return f"data: {dumps(payload, sort_keys=True)}\n\n"


def iter_agent_world_stream(agent_id: Optional[str] = None, poll_interval: float = 1.5) -> Iterator[str]:
    """Yield Server-Sent Events for the Agent World UI.

    The payload includes the world snapshot, global event list, and the currently
    selected agent detail when an agent id is provided.
    """

    last_payload = None
    idle_ticks = 0

    while True:
        try:
            world = derive_agent_world_state()
            events = derive_agent_world_events()
            detail = derive_agent_detail(agent_id) if agent_id else None
            payload = {
                "type": "snapshot",
                "world": world,
                "events": events,
                "detail": detail,
            }
        except Exception as exc:
            payload = {
                "type": "snapshot_error",
                "world": None,
                "events": {"events": []},
                "detail": None,
                "error": str(exc)[:400],
            }

        serialised = dumps(payload, sort_keys=True)

        if serialised != last_payload:
            yield _sse_frame(payload)
            last_payload = serialised
            idle_ticks = 0
        else:
            idle_ticks += 1
            if idle_ticks >= 10:
                yield ": keepalive\n\n"
                idle_ticks = 0

        sleep(poll_interval)
