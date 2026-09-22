from fastapi import APIRouter, Query
from app.geo import parse_bbox
from app.services.sources import get_obis
router = APIRouter(prefix='/api/biodiversity', tags=['biodiversity'])

@router.get('/obis')
async def occurrences(bbox: str = Query(..., max_length=120, description='west,south,east,north'),
                      limit: int = Query(100, ge=1, le=500), species: str | None = Query(None, min_length=1, max_length=200)):
    return await get_obis(parse_bbox(bbox), limit, species)
