from fastapi import APIRouter, Depends, Query
from app.security import require_admin
from app.utils.cache import get_cache_stats, clear_cache
router = APIRouter(prefix='/api/cache', tags=['cache'])

@router.get('/stats')
def stats():
    return get_cache_stats()

@router.post('/clear', dependencies=[Depends(require_admin)])
def clear(pattern: str = Query('*', max_length=150)):
    return {'status': 'cleared', 'count': clear_cache(pattern)}
