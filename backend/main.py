from __future__ import annotations
import asyncio
import os
import time
from collections import defaultdict, deque
from typing import DefaultDict, Deque
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from api.chat_routes import router as chat_router
from core.config import (
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_PER_IP,
    RATE_LIMIT_GLOBAL,
    FRONTEND_URL,
)


class SlidingWindowRateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Basic implementation of in-memory limiter.

    Per-IP limit protects against one user spamming the API.
    Global limit protects from total combined traffic spikes.

    Note: this is per-process memory and limits will NOT be shared across instances.
    """

    def __init__(
        self,
        app: FastAPI,
        *,
        per_ip_limit: int,
        global_limit: int,
        window_seconds: int,
        exempt_paths: set[str] | None = None,
    ) -> None:
        super().__init__(app)
        self.per_ip_limit = per_ip_limit
        self.global_limit = global_limit
        self.window_seconds = window_seconds
        self.exempt_paths = exempt_paths or set()
        self.per_ip_hits: DefaultDict[str, Deque[float]] = defaultdict(deque)
        self.global_hits: Deque[float] = deque()
        self.lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or request.url.path in self.exempt_paths:
            return await call_next(request)

        now = time.monotonic()
        client_key = self._get_client_key(request)

        async with self.lock:
            self._prune(self.global_hits, now)

            if self.global_limit > 0 and len(self.global_hits) >= self.global_limit:
                retry_after = self._retry_after(self.global_hits, now)
                return self._too_many_requests(
                    detail="Global rate limit exceeded. Please try again shortly.",
                    retry_after=retry_after,
                )

            if self.per_ip_limit > 0:
                ip_hits = self.per_ip_hits[client_key]
                self._prune(ip_hits, now)

                if len(ip_hits) >= self.per_ip_limit:
                    retry_after = self._retry_after(ip_hits, now)
                    return self._too_many_requests(
                        detail="Per-user rate limit exceeded. Please try again shortly.",
                        retry_after=retry_after,
                    )

                ip_hits.append(now)

            self.global_hits.append(now)

        return await call_next(request)

    def _prune(self, hits: Deque[float], now: float) -> None:
        cutoff = now - self.window_seconds
        while hits and hits[0] <= cutoff:
            hits.popleft()

    def _retry_after(self, hits: Deque[float], now: float) -> int:
        if not hits:
            return 1
        oldest = hits[0]
        return max(1, int(self.window_seconds - (now - oldest)))

    def _too_many_requests(self, *, detail: str, retry_after: int) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={"detail": detail},
            headers={"Retry-After": str(retry_after)},
        )

    def _get_client_key(self, request: Request) -> str:
        # If you are behind a trusted reverse proxy, this gives a better client key.
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        if request.client and request.client.host:
            return request.client.host

        return "unknown-client"


app = FastAPI(title="Component Sense API")

app.add_middleware(
    SlidingWindowRateLimiterMiddleware,
    per_ip_limit=RATE_LIMIT_PER_IP,
    global_limit=RATE_LIMIT_GLOBAL,
    window_seconds=RATE_LIMIT_WINDOW_SECONDS,
    exempt_paths={"/api/health", "/docs", "/redoc", "/openapi.json"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],
)

app.include_router(chat_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "awake and ready"}
