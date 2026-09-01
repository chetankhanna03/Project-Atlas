from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ArgoObservation

router = APIRouter(prefix="/api/oceanography", tags=["oceanography"])

@router.get("/argo")
def get_argo(
    lat_min: float = Query(..., description="Minimum latitude"),
    lat_max: float = Query(..., description="Maximum latitude"),
    lon_min: float = Query(..., description="Minimum longitude"),
    lon_max: float = Query(..., description="Maximum longitude"),
    limit: int = Query(100, description="Max results"),
    db: Session = Depends(get_db)
):
    return db.query(ArgoObservation).filter(
        ArgoObservation.latitude.between(lat_min, lat_max),
        ArgoObservation.longitude.between(lon_min, lon_max)
    ).limit(limit).all()