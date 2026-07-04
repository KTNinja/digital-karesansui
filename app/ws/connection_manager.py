"""
In-process WebSocket connection registry for a single garden room.

Architecture note — why an in-process registry is sufficient here
-----------------------------------------------------------------
Digital Karesansui is deployed as a **long-running container** (ECS Fargate /
EC2) rather than AWS API Gateway's native WebSocket API.

The trade-off considered was:

  Serverless API Gateway WebSockets
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  + Zero idle cost; auto-scales to millions of connections.
  + No connection-state management in application code.
  - Every ``@connections/{id}`` callback HTTP POST adds ~5-15 ms of cold-path
    latency (API GW → Lambda → Redis Pub/Sub → API GW callback URL).
  - Cumulative latency easily exceeds our **100 ms LWW budget** under any
    non-trivial fan-out (20+ concurrent collaborators in a room).
  - Cold-start jitter on Lambda makes the P99 latency unpredictable, directly
    causing the visual rubber-banding we must prevent.

  Long-running container (chosen approach)
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  + WebSocket frames are dispatched in-memory (microseconds vs. milliseconds).
  + Round-trip latency is dominated by the client's network RTT, keeping us
    well inside the 100 ms budget even at high fan-out.
  + A single ``asyncio.gather`` call fans out to all sockets in the room
    concurrently; no extra HTTP hops.
  - Requires a sticky-session or shared Pub/Sub bus so that connections on
    *different* container instances can still receive each other's events.
    → Solved by ``app.pubsub.listener``, which subscribes to a Redis channel
      per room and forwards every message to this in-process registry.

Last-Write-Wins (LWW) conflict resolution
------------------------------------------
Because we never merge concurrent writes (the last frame touching a sand
coordinate wins), the manager applies no ordering logic itself.  The caller
is responsible for attaching a ``timestamp`` (Unix ms) to every payload so
that clients can apply their own LWW guard on arrival:

    if payload["timestamp"] >= last_seen_ts[element_id]:
        apply(payload)

The 100 ms budget is enforced upstream:
  - Redis Pub/Sub fan-out latency: < 1 ms (same AZ)
  - In-process broadcast (this file): < 0.1 ms
  - Network RTT to client: budget owner
  - Total server-side contribution: well under 10 ms
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Registry of active WebSocket connections, scoped to a room.

    Each room is identified by a ``room_id`` string.  Multiple container
    instances may hold connections for the same room; cross-instance delivery
    is handled by the Redis Pub/Sub listener that calls :meth:`broadcast`.

    Attributes:
        _rooms: Mapping from ``room_id`` to the set of live
            :class:`~fastapi.WebSocket` connections in that room.

    Examples::

        manager = ConnectionManager()
        await manager.connect(websocket, room_id="lobby")
        await manager.broadcast({"event": "rake", "x": 42}, room_id="lobby")
        manager.disconnect(websocket, room_id="lobby")
    """

    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, room_id: str) -> None:
        """Accept a new WebSocket connection and register it in *room_id*.

        Args:
            websocket: The incoming WebSocket connection (not yet accepted).
            room_id: Garden room identifier, e.g. ``"zen-garden-01"``.
        """
        await websocket.accept()
        self._rooms[room_id].add(websocket)
        logger.info("client connected | room=%s | total=%d", room_id, len(self._rooms[room_id]))

    def disconnect(self, websocket: WebSocket, room_id: str) -> None:
        """Remove a WebSocket from *room_id*.

        Safe to call even if *websocket* is not registered (no-op).

        Args:
            websocket: The connection to remove.
            room_id: Room from which to remove it.
        """
        room = self._rooms.get(room_id)
        if room is None:
            return
        room.discard(websocket)
        if not room:
            del self._rooms[room_id]
        logger.info("client disconnected | room=%s", room_id)

    async def broadcast(self, payload: dict[str, Any], room_id: str) -> None:
        """Fan out *payload* as JSON to every connection in *room_id*.

        Delivery is best-effort: a stale or closed socket is silently removed
        rather than aborting the broadcast.  All sends run concurrently via
        :func:`asyncio.gather` so that a single slow client cannot block
        others — critical for meeting the 100 ms LWW latency budget.

        Args:
            payload: Arbitrary JSON-serialisable mapping to broadcast.
            room_id: Target room.
        """
        connections = list(self._rooms.get(room_id, set()))
        if not connections:
            return

        text = json.dumps(payload)

        async def _send(ws: WebSocket) -> None:
            try:
                await ws.send_text(text)
            except Exception:
                self.disconnect(ws, room_id)

        await asyncio.gather(*(_send(ws) for ws in connections))

    def room_size(self, room_id: str) -> int:
        """Return the number of active connections in *room_id*."""
        return len(self._rooms.get(room_id, set()))


# Module-level singleton shared across the ws router and the pubsub listener.
manager = ConnectionManager()
