from fastapi import APIRouter, HTTPException, Query
from app.services.sources import get_taxonomy
router = APIRouter(prefix='/api/taxonomy', tags=['taxonomy'])

@router.get('/resolve')
async def resolve(name: str = Query(..., min_length=1, max_length=200, description='Exact scientific name'),
                  force_refresh: bool = False):
    if not name.strip():
        raise HTTPException(422, 'Scientific name must not be blank.')
    return await get_taxonomy(name.strip(), force_refresh)
