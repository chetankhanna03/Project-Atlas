from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import FisheriesLanding

router = APIRouter(prefix="/api/fisheries", tags=["fisheries"])

@router.get("/landings")
def get_landings(
    year: int | None = None,
    region: str | None = None,
    species: str | None = None,
    category: str | None = None,
    type: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(FisheriesLanding)
    if year:
        query = query.filter(FisheriesLanding.year == year)
    if region:
        query = query.filter(FisheriesLanding.region.ilike(f"%{region}%"))
    if species:
        query = query.filter(FisheriesLanding.species.ilike(f"%{species}%"))
    if category:
        query = query.filter(FisheriesLanding.category.ilike(f"%{category}%"))
    if type:
        query = query.filter(FisheriesLanding.type == type)
    return query.all()