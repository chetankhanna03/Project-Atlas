"""Single-process request budget; use a shared gateway limiter for multiple workers."""
import time
from collections import OrderedDict, deque
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.clients = OrderedDict()

    async def dispatch(self, request, call_next):
        if request.url.path.startswith('/api/'):
            key = request.client.host if request.client else 'unknown'
            now = time.monotonic()
            entries = self.clients.setdefault(key, deque())
            self.clients.move_to_end(key)
            while entries and entries[0] <= now - 60:
                entries.popleft()
            if len(entries) >= settings.rate_limit_per_minute:
                return JSONResponse(status_code=429, content={'detail': 'Request limit exceeded.'},
                                    headers={'Retry-After': str(max(1, int(60 - (now - entries[0])) + 1))})
            entries.append(now)
            while len(self.clients) > 1024:
                self.clients.popitem(last=False)
        return await call_next(request)
