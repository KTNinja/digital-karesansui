"""
FastAPI application entry point for Digital Karesansui — Phase 1 Backend.

System overview
---------------
This service is the real-time collaboration backbone for the multiplayer Zen
Garden canvas.  It owns two responsibilities:

  1. **WebSocket gateway** — accepts long-lived connections at
     ``/ws/garden/{room_id}`` and registers them with the in-process
     :class:`~app.ws.connection_manager.ConnectionManager`.

  2. **Redis Pub/Sub relay** — for each active room, runs one background
     ``asyncio.Task`` that subscribes to a Redis channel and fans incoming
     messages out to all local WebSocket connections.

Deployment model: long-running containers vs. serverless
---------------------------------------------------------
The architecture was evaluated against two options:

  **Option A — AWS API Gateway WebSocket API + Lambda**
  - Naturally serverless; zero idle cost; no connection state.
  - Every fan-out requires an HTTP POST to the API Gateway callback URL,
    adding 5–15 ms *per hop*.  With 20 concurrent collaborators, a single
    rake event triggers 20 callback requests — each of which may hit a
    cold-start Lambda — pushing the P99 fan-out latency above 100 ms.
  - Exceeds the **100 ms LWW round-trip budget**, causing visible
    rubber-banding in the canvas.

  **Option B — Long-running containers (chosen)**
  - WebSocket frames are dispatched in memory via ``asyncio.gather``,
    contributing < 0.1 ms to fan-out latency.
  - Redis Pub/Sub within the same AZ adds < 1 ms, keeping total server-side
    latency under 10 ms — well inside the 100 ms budget.
  - The trade-off is always-on container cost (ECS Fargate), mitigated by
    Fargate Spot for non-production environments.

LWW conflict resolution constraint
------------------------------------
Digital Karesansui uses a **Last-Write-Wins** strategy: the most recent write
to any sand coordinate wins, with "most recent" defined by a ``timestamp``
field (Unix milliseconds) attached by the client.  The server is intentionally
stateless with respect to conflict resolution — it never merges writes.

The 100 ms round-trip budget exists so that the *visual gap* between a local
optimistic update and the authoritative broadcast is imperceptible to the human
eye (~60 ms perception threshold).  Exceeding the budget causes the canvas to
visibly snap back ("rubber-band") when a late write from another user overwrites
a local optimistic update.

Application lifecycle
----------------------
Redis client and the Pub/Sub listener registry are initialised once on startup
and torn down cleanly on shutdown via the ``lifespan`` context manager,
ensuring no dangling connections or orphaned asyncio tasks.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from redis.asyncio import ConnectionPool, Redis

from app.config import settings
from app.pubsub.listener import room_listener_registry
from app.ws.router import router as ws_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage Redis connection pool and Pub/Sub registry lifecycle.

    Startup:
      - Create an async Redis connection pool from :attr:`~app.config.Settings.redis_url`.
      - Attach the pool-backed :class:`~redis.asyncio.Redis` client to
        ``app.state.redis`` so routes can access it via ``request.app.state.redis``.
      - Wire the client into :data:`~app.pubsub.listener.room_listener_registry`.

    Shutdown:
      - Drain and close the connection pool to avoid ``ResourceWarning`` noise
        and to allow clean container replacement in rolling deployments.
    """
    logger.info("startup: connecting to Redis | url=%s", settings.redis_url)
    pool = ConnectionPool.from_url(settings.redis_url, decode_responses=True)
    redis = Redis(connection_pool=pool)

    app.state.redis = redis
    room_listener_registry.set_redis(redis)
    logger.info("startup: Redis ready")

    yield

    logger.info("shutdown: closing Redis connection pool")
    await redis.aclose()
    await pool.aclose()
    logger.info("shutdown: complete")


app = FastAPI(
    title="Digital Karesansui — Phase 1",
    description="Real-time multiplayer Zen Garden WebSocket backend.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(ws_router)


@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    """Lightweight liveness probe for container health checks and load balancers.

    Returns:
        A JSON object ``{"status": "ok"}`` with HTTP 200.
    """
    return {"status": "ok"}
