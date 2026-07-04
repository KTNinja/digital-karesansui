"""
Redis Pub/Sub listener — bridges inter-instance messaging to local WebSockets.

How cross-instance fan-out works
---------------------------------
Digital Karesansui may run as multiple container replicas behind a load
balancer.  Two users in the same garden room might be connected to *different*
replicas.  Without a shared bus, a rake event from User A (on replica-1) would
never reach User B (on replica-2).

Redis Pub/Sub solves this with zero application-level routing logic:

  1. Each container subscribes to every room channel it has active connections
     for (``garden:{room_id}``).
  2. When the WebSocket router publishes a payload to that channel, *all*
     subscribers — on every replica — receive it.
  3. Each subscriber calls
     :meth:`~app.ws.connection_manager.ConnectionManager.broadcast`, which
     delivers the message to all local sockets in that room.

This means the same message is published once and received by all containers;
each container then delivers it only to its own local connections.

Performance and the 100 ms LWW budget
---------------------------------------
Redis Pub/Sub within the same AWS Availability Zone adds < 1 ms of latency.
The in-process broadcast (asyncio gather) adds < 0.1 ms.  The dominant cost is
always the client's network RTT, which we do not control.  Together, the
server-side contribution is < 10 ms, leaving > 90 ms of headroom for the
network — sufficient to meet the 100 ms Last-Write-Wins round-trip constraint
even over moderately lossy mobile connections.

Why a single background task per channel (not one per connection)
------------------------------------------------------------------
A naïve design would subscribe to a Redis channel inside each WebSocket
handler coroutine.  That creates O(connections) Redis subscriptions for the
same channel, wasting connections and serialising fan-out through multiple
asyncio tasks.

Instead, this module maintains *one* ``asyncio.Task`` per active room channel.
The task reads from a single ``redis.asyncio.client.PubSub`` socket and calls
``manager.broadcast`` once per message, which then fans out to all local
sockets concurrently.  When a room loses its last connection the task is
cancelled to release the Redis subscription.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING

from app.config import settings
from app.ws.connection_manager import manager

if TYPE_CHECKING:
    from redis.asyncio import Redis

logger = logging.getLogger(__name__)


async def _run_listener(redis: "Redis", channel: str, room_id: str) -> None:
    """Blocking coroutine that forwards Redis Pub/Sub messages to local sockets.

    Subscribes to *channel*, then loops indefinitely reading messages and
    calling :meth:`~app.ws.connection_manager.ConnectionManager.broadcast`.
    The loop exits when cancelled (i.e. when the room empties) or when the
    Redis connection drops.

    Args:
        redis: Async Redis client (connection pool managed by the application).
        channel: Fully-qualified Pub/Sub channel name, e.g. ``garden:room-01``.
        room_id: Bare room identifier used to target the broadcast.
    """
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)
    logger.info("pubsub subscribed | channel=%s", channel)

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            try:
                payload = json.loads(message["data"])
            except (json.JSONDecodeError, TypeError):
                logger.warning("malformed pubsub message on channel=%s", channel)
                continue

            await manager.broadcast(payload, room_id)
    except asyncio.CancelledError:
        logger.info("pubsub listener cancelled | channel=%s", channel)
    finally:
        # Shield cleanup from a second CancelledError so the Redis connection
        # is always returned to the pool even when the task is cancelled.
        await asyncio.shield(pubsub.unsubscribe(channel))
        await asyncio.shield(pubsub.aclose())


class RoomListenerRegistry:
    """Manages one background listener task per active room channel.

    A new task is spawned on demand when the first connection joins a room,
    and cancelled when the room empties.  This keeps Redis subscription count
    equal to the number of *distinct active rooms* rather than the number of
    *connections*, regardless of replica count.

    Attributes:
        _tasks: Live mapping of ``room_id`` → running ``asyncio.Task``.
        _redis: Shared async Redis client injected at startup.

    Examples::

        registry = RoomListenerRegistry()
        registry.set_redis(app.state.redis)
        registry.ensure_listening("zen-room-01")
        # … later, when the room empties …
        registry.cancel_if_empty("zen-room-01")
    """

    def __init__(self) -> None:
        self._tasks: dict[str, asyncio.Task] = {}
        self._redis: "Redis | None" = None

    def set_redis(self, redis: "Redis") -> None:
        """Inject the shared Redis client.  Called once at application startup."""
        self._redis = redis

    def ensure_listening(self, room_id: str) -> None:
        """Spawn a listener task for *room_id* if one is not already running.

        Args:
            room_id: Garden room identifier.

        Raises:
            RuntimeError: If called before :meth:`set_redis`.
        """
        if room_id in self._tasks and not self._tasks[room_id].done():
            return
        if self._redis is None:
            raise RuntimeError("RoomListenerRegistry.set_redis() must be called before ensure_listening()")

        channel = f"{settings.pubsub_channel_prefix}{room_id}"
        task = asyncio.create_task(
            _run_listener(self._redis, channel, room_id),
            name=f"pubsub:{channel}",
        )
        self._tasks[room_id] = task
        logger.info("listener task created | room=%s", room_id)

    def cancel_if_empty(self, room_id: str) -> None:
        """Cancel the listener task for *room_id* if the room has no connections.

        Safe to call unconditionally on every disconnect; it checks
        :meth:`~app.ws.connection_manager.ConnectionManager.room_size` before
        acting.

        Args:
            room_id: Garden room identifier.
        """
        if manager.room_size(room_id) > 0:
            return
        task = self._tasks.pop(room_id, None)
        if task and not task.done():
            task.cancel()
            logger.info("listener task cancelled (room empty) | room=%s", room_id)


# Module-level singleton; wired up in app.main lifespan.
room_listener_registry = RoomListenerRegistry()
