"""
Application configuration loaded from environment variables.

All runtime tunables live here so that environment-specific values (local Docker
compose vs. AWS Lambda + ElastiCache) never bleed into business logic.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised settings resolved from the process environment.

    Pydantic-settings reads from (in priority order):
      1. Explicitly passed kwargs
      2. Environment variables
      3. .env file (if present)
      4. Field defaults

    Attributes:
        redis_url: Full Redis connection URL, e.g. ``redis://localhost:6379/0``
            or ``rediss://user:pass@cluster.cache.amazonaws.com:6380/0`` for
            TLS-secured ElastiCache.
        pubsub_channel_prefix: Namespace prefix for Redis Pub/Sub channels.
            Channels are named ``{prefix}{room_id}``.
        ws_ping_interval: WebSocket keep-alive ping interval in seconds.
            AWS API Gateway idles WebSocket connections after 10 minutes of
            inactivity; a 30-second ping keeps the connection alive cheaply.
        ws_ping_timeout: Seconds before a connection is considered dead after
            a ping is not acknowledged.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    redis_url: str = "redis://localhost:6379/0"
    pubsub_channel_prefix: str = "garden:"
    ws_ping_interval: int = 30
    ws_ping_timeout: int = 10


settings = Settings()
