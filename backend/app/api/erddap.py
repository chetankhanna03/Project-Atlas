from fastapi import APIRouter, Query
from app.services.sources import get_sst
router = APIRouter(prefix='/api/oceanography/erddap', tags=['oceanography'])

@router.get('/sst')
async def sst(lat: float = Query(..., ge=-89.99, le=89.99), lon: float = Query(..., ge=-179.99, le=180),
              days: int = Query(7, ge=1, le=31)):
    return await get_sst(lat, lon, days)
