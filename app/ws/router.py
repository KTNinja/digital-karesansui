"""
WebSocket router — mounts the /ws/garden/{room_id} endpoint.

Lifecycle per connection
------------------------
1. ``connect`` — accept and register with :class:`~app.ws.connection_manager.ConnectionManager`.
2. Receive loop — forward every incoming JSON message to the room's Redis
   Pub/Sub channel so that sibling container instances are notified.
   Exception: ``ping`` frames are answered directly on the originating socket
   and never published to Redis.
3. Disconnect (normal or abnormal) — broadcast ``user_left`` to the room, then
   deregister from the manager.

Why we publish to Redis on receipt
-----------------------------------
A client message must reach *all* connections in the room, including those
held by other container replicas.  Publishing to Redis ensures that every
instance's Pub/Sub listener (``app.pubsub.listener``) picks up the event and
calls :meth:`~app.ws.connection_manager.ConnectionManager.broadcast` locally.
The ``exclude`` parameter on ``broadcast`` prevents the originating client from
receiving its own action echoed back, which would cause a redundant canvas
re-render on top of the already-applied optimistic update.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.config import settings
from app.pubsub.listener import room_listener_registry
from app.ws.connection_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/garden/{room_id}")
async def garden_websocket(websocket: WebSocket, room_id: str) -> None:
    """Handle the full lifecycle of a single garden WebSocket connection.

    Message protocol
    ~~~~~~~~~~~~~~~~
    Clients send JSON objects with a ``type`` field.  The following types
    receive special server-side handling:

    ``ping``
        Answered immediately with ``{"type": "pong", "data": {"clientTimestamp": <ts>}}``.
        Never published to Redis — pings are per-connection, not per-room.

    ``join``
        Client announces its identity: ``{"type": "join", "data": {"id": str,
        "initials": str, "color": str}}``.  The server stores the identity for
        this socket and broadcasts a ``cursor_moved`` event to the room so that
        peers' AvatarCluster populates immediately.

    All other types (``rock_placed``, ``stroke_added``, ``rock_removed``,
    ``stroke_removed``, ``garden_cleared``, ``cursor_moved``) are forwarded to
    the room's Redis Pub/Sub channel and fanned out to every other connection
    in the room (sender excluded).

    Args:
        websocket: FastAPI-managed WebSocket connection.
        room_id: Opaque room identifier.

    Raises:
        WebSocketDisconnect: Raised by Starlette when the client closes the
            connection; caught here to ensure clean deregistration.
    """
    await manager.connect(websocket, room_id)
    room_listener_registry.ensure_listening(room_id)

    redis: Redis = websocket.app.state.redis
    channel = f"{settings.pubsub_channel_prefix}{room_id}"

    # Identity stored on join so we can emit user_left on disconnect.
    user_id: str | None = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                parsed = json.loads(raw)
                if not isinstance(parsed, dict):
                    raise ValueError("payload must be a JSON object")
            except (json.JSONDecodeError, ValueError) as exc:
                logger.warning("invalid frame dropped | room=%s | reason=%s", room_id, exc)
                continue

            msg_type = parsed.get("type")

            # ── ping: answer directly, never publish to Redis ──────────────
            if msg_type == "ping":
                client_ts = parsed.get("clientTimestamp")
                await websocket.send_text(
                    json.dumps({"type": "pong", "data": {"clientTimestamp": client_ts}})
                )
                continue

            # ── join: store identity, broadcast presence to room ───────────
            if msg_type == "join":
                data = parsed.get("data", {})
                user_id = data.get("id")
                # Rebroadcast as cursor_moved with sentinel position so
                # peers' AvatarCluster populates without a canvas position.
                presence = json.dumps({
                    "type": "cursor_moved",
                    "data": {
                        "id": user_id,
                        "initials": data.get("initials", "??"),
                        "color": data.get("color", "#888"),
                        "cursorX": -1,
                        "cursorY": -1,
                    },
                })
                await redis.publish(channel, presence)
                continue

            # ── all other types: publish to Redis, exclude sender ──────────
            await redis.publish(channel, raw)

    except WebSocketDisconnect:
        if user_id:
            leave = json.dumps({"type": "user_left", "data": {"id": user_id}})
            await redis.publish(channel, leave)
        manager.disconnect(websocket, room_id)
        room_listener_registry.cancel_if_empty(room_id)
        logger.info("clean disconnect | room=%s | remaining=%d", room_id, manager.room_size(room_id))
    except Exception as exc:
        if user_id:
            try:
                leave = json.dumps({"type": "user_left", "data": {"id": user_id}})
                await redis.publish(channel, leave)
            except Exception:
                pass
        manager.disconnect(websocket, room_id)
        room_listener_registry.cancel_if_empty(room_id)
        logger.exception("unexpected ws error | room=%s | error=%s", room_id, exc)
