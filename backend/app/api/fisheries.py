from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import FisheriesLanding, LandingType
router = APIRouter(prefix='/api/fisheries', tags=['fisheries'])

@router.get('/landings')
def get_landings(year: int | None = Query(None, ge=1900, le=2100),
                  region: str | None = Query(None, max_length=200), species: str | None = Query(None, max_length=200),
                  category: str | None = Query(None, max_length=200), type: LandingType | None = None,
                  limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    query = db.query(FisheriesLanding)
    if year is not None:
        query = query.filter(FisheriesLanding.year == year)
    for field, value in ((FisheriesLanding.region, region), (FisheriesLanding.species, species), (FisheriesLanding.category, category)):
        if value:
            query = query.filter(field.icontains(value, autoescape=True))
    if type is not None:
        query = query.filter(FisheriesLanding.type == type)
    return query.order_by(FisheriesLanding.year.desc(), FisheriesLanding.id).offset(offset).limit(limit).all()
