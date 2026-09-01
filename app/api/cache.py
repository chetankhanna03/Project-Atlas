from fastapi import APIRouter
from app.utils.cache import get_cache_stats, clear_cache

router = APIRouter(prefix="/api/cache", tags=["cache"])

@router.get("/stats")
async def cache_stats():
    """Get cache statistics"""
    return get_cache_stats()

@router.post("/clear")
async def cache_clear(pattern: str = "*"):
    """Clear cache"""
    clear_cache(pattern)
    return {"status": "cleared", "pattern": pattern}