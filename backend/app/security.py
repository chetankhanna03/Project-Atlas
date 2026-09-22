import secrets
from fastapi import Header, HTTPException
from app.config import settings

def require_admin(x_api_key: str | None = Header(None)):
    if not settings.admin_api_key:
        raise HTTPException(503, 'Administrative writes are disabled; configure ADMIN_API_KEY.')
    if not x_api_key or not secrets.compare_digest(x_api_key, settings.admin_api_key):
        raise HTTPException(401, 'Invalid API key.')
