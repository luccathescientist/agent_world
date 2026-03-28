from __future__ import annotations

import argparse
import asyncio
import os
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.state_mapper import (
    derive_agent_detail,
    derive_agent_history,
    derive_agent_schedule,
    derive_agent_stash,
    derive_agent_world_events,
    derive_agent_world_state,
)
from backend.command_router import route_operator_command
from backend.stream import iter_agent_world_stream
from backend.voice_gateway import (
    synthesize_speech_bytes,
    transcribe_audio_bytes,
    voice_config_payload,
)
from backend.world_layout import load_world_game_state, save_world_game_state, set_agent_movement_override


DEFAULT_PORT = 8890
ROOT_DIR = Path(__file__).resolve().parent
OPENCLAW_HOME = Path(os.getenv("OPENCLAW_HOME", Path.home() / ".openclaw")).expanduser()
OPENCLAW_MEDIA_DIR = Path(os.getenv("OPENCLAW_MEDIA_DIR", OPENCLAW_HOME / "media")).expanduser()

app = FastAPI(title="Agent World")


class AgentWorldCommand(BaseModel):
    text: str


class AgentWorldMovePayload(BaseModel):
    anchorId: str
    source: str | None = "ui"


class AgentWorldVoiceSpeechPayload(BaseModel):
    text: str
    voice: str | None = None
    model: str | None = None
    format: str | None = "mp3"


def _allowed_file_roots() -> list[Path]:
    roots = [ROOT_DIR]
    if OPENCLAW_HOME.exists():
        roots.append(OPENCLAW_HOME.resolve())
    if OPENCLAW_MEDIA_DIR.exists():
        roots.append(OPENCLAW_MEDIA_DIR.resolve())
    extra_roots = os.getenv("AGENT_WORLD_ALLOWED_FILE_ROOTS", "").split(os.pathsep)
    for raw in extra_roots:
        raw = raw.strip()
        if not raw:
            continue
        path = Path(raw).expanduser()
        if path.exists():
            roots.append(path.resolve())
    return roots


def _is_allowed_path(target: Path) -> bool:
    resolved = target.resolve()
    for root in _allowed_file_roots():
        try:
            resolved.relative_to(root)
            return True
        except ValueError:
            continue
    return False


app.mount("/agent-world-static", StaticFiles(directory=str(ROOT_DIR)), name="agent-world-static")


@app.get("/")
async def root() -> FileResponse:
    return FileResponse(ROOT_DIR / "index.html", headers={"Cache-Control": "no-cache"})


@app.get("/agent-world")
async def agent_world() -> RedirectResponse:
    return RedirectResponse(url="/", status_code=307)


@app.get("/api/agent-world/state")
async def agent_world_state():
    return await asyncio.to_thread(derive_agent_world_state)


@app.get("/api/agent-world/events")
async def agent_world_events():
    return await asyncio.to_thread(derive_agent_world_events)


@app.get("/api/agent-world/game-state")
async def agent_world_game_state():
    return await asyncio.to_thread(load_world_game_state)


@app.post("/api/agent-world/game-state")
async def agent_world_save_game_state(payload: dict):
    return await asyncio.to_thread(save_world_game_state, payload)


@app.get("/api/agent-world/stream")
async def agent_world_stream(agent_id: str | None = None):
    return StreamingResponse(
        iter_agent_world_stream(agent_id=agent_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/agent-world/agents/{agent_id}")
async def agent_world_agent_detail(agent_id: str):
    return await asyncio.to_thread(derive_agent_detail, agent_id)


@app.get("/api/agent-world/agents/{agent_id}/history")
async def agent_world_agent_history(agent_id: str):
    return await asyncio.to_thread(derive_agent_history, agent_id)


@app.get("/api/agent-world/agents/{agent_id}/schedule")
async def agent_world_agent_schedule(agent_id: str):
    return await asyncio.to_thread(derive_agent_schedule, agent_id)


@app.get("/api/agent-world/agents/{agent_id}/stash")
async def agent_world_agent_stash(agent_id: str):
    return await asyncio.to_thread(derive_agent_stash, agent_id)


@app.get("/api/agent-world/voice/config")
async def agent_world_voice_config():
    return await asyncio.to_thread(voice_config_payload)


@app.get("/api/agent-world/file")
async def agent_world_file(path: str):
    target = Path(path).expanduser()
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    if not _is_allowed_path(target):
        raise HTTPException(status_code=403, detail="Forbidden")
    return FileResponse(target)


@app.post("/api/agent-world/agents/{agent_id}/command")
async def agent_world_command(agent_id: str, payload: AgentWorldCommand):
    return await asyncio.to_thread(route_operator_command, agent_id, payload.model_dump())


@app.post("/api/agent-world/agents/{agent_id}/voice/transcribe")
async def agent_world_voice_transcribe(
    agent_id: str,
    file: UploadFile = File(...),
    model: str = Form("gpt-4o-mini-transcribe"),
    language: str | None = Form(None),
    prompt: str | None = Form(None),
):
    audio_bytes = await file.read()
    result = await asyncio.to_thread(
        transcribe_audio_bytes,
        audio_bytes,
        file.filename or "voice.webm",
        content_type=file.content_type or "application/octet-stream",
        model=model,
        language=language,
        prompt=prompt,
    )
    result["agentId"] = agent_id
    if not result.get("ok"):
        raise HTTPException(status_code=503, detail=result)
    return result


@app.post("/api/agent-world/agents/{agent_id}/voice/speak")
async def agent_world_voice_speak(agent_id: str, payload: AgentWorldVoiceSpeechPayload):
    result = await asyncio.to_thread(
        synthesize_speech_bytes,
        payload.text,
        model=payload.model or "gpt-4o-mini-tts",
        voice=payload.voice or "nova",
        response_format=payload.format or "mp3",
    )
    if not result.get("ok"):
        raise HTTPException(status_code=503, detail=result)
    return Response(
        content=result["audio"],
        media_type=result.get("mimeType") or "audio/mpeg",
        headers={
            "X-Agent-Id": agent_id,
            "X-Voice-Provider": "openclaw",
            "Cache-Control": "no-store",
        },
    )


@app.post("/api/agent-world/agents/{agent_id}/move")
async def agent_world_move(agent_id: str, payload: AgentWorldMovePayload):
    return await asyncio.to_thread(
        set_agent_movement_override,
        agent_id,
        payload.anchorId,
        payload.source or "ui",
    )


def main() -> None:
    import uvicorn

    parser = argparse.ArgumentParser(description="Run the Agent World server.")
    parser.add_argument("--host", default="0.0.0.0", help="Host interface to bind.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to bind. Defaults to {DEFAULT_PORT}.")
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
