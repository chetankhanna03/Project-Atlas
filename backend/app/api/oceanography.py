from datetime import date, datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.geo import validate_bbox
from app.models import ArgoObservation
from app.schemas import ArgoObservationRead
router = APIRouter(prefix='/api/oceanography', tags=['oceanography'])

@router.get('/argo/gdac')
async def get_gdac_argo(bbox: str, start: date | None = None, end: date | None = None,
                        parameter: Literal['temperature','salinity'] = 'temperature',
                        limit: int = Query(3, ge=1, le=5),
                        pressure_min: float = Query(0, ge=0, le=12000),
                        pressure_max: float = Query(2000, ge=0, le=12000)):
    from app.geo import parse_bbox
    from app.services.argo_gdac import get_profiles
    return await get_profiles(parse_bbox(bbox), start, end, parameter, limit, pressure_min, pressure_max)

@router.get('/argo', response_model=list[ArgoObservationRead])
def get_argo(lat_min: float, lat_max: float, lon_min: float, lon_max: float,
             limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0),
             start: datetime | None = None, end: datetime | None = None, db: Session = Depends(get_db)):
    validate_bbox(lon_min, lat_min, lon_max, lat_max)
    for value in (start, end):
        if value is not None and value.tzinfo is None:
            raise HTTPException(422, 'Time filters require a timezone, e.g. Z.')
    if start:
        start = start.astimezone(timezone.utc).replace(tzinfo=None)
    if end:
        end = end.astimezone(timezone.utc).replace(tzinfo=None)
    if start and end and start > end:
        raise HTTPException(422, 'Use start <= end.')
    query = db.query(ArgoObservation).filter(ArgoObservation.latitude.between(lat_min, lat_max),
                                             ArgoObservation.longitude.between(lon_min, lon_max))
    if start:
        query = query.filter(ArgoObservation.observation_time >= start)
    if end:
        query = query.filter(ArgoObservation.observation_time <= end)
    return query.order_by(ArgoObservation.observation_time.desc(), ArgoObservation.id.desc()).offset(offset).limit(limit).all()
