import csv
import io
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ArgoObservation
from app.schemas import ArgoObservationCreate, ArgoObservationUpdate, ArgoObservationRead
from app.security import require_admin

router = APIRouter(prefix='/api/argo/observations', tags=['argo'])
admin = [Depends(require_admin)]

@router.get('', response_model=list[ArgoObservationRead])
def observations(limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    return db.query(ArgoObservation).order_by(ArgoObservation.id.desc()).offset(offset).limit(limit).all()

@router.post('', status_code=201, response_model=ArgoObservationRead, dependencies=admin)
def create(data: ArgoObservationCreate, db: Session = Depends(get_db)):
    obs = ArgoObservation(**data.model_dump())
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs

@router.post('/bulk', status_code=201, dependencies=admin)
def bulk(file: UploadFile = File(...), db: Session = Depends(get_db)):
    raw = file.file.read(1_000_001)
    if len(raw) > 1_000_000:
        raise HTTPException(413, 'CSV must be at most 1 MB.')
    try:
        reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
        required = {'float_id', 'latitude', 'longitude', 'observation_time'}
        if not required.issubset(reader.fieldnames or []):
            raise HTTPException(422, 'CSV is missing required observation columns.')
        rows = []
        for index, row in enumerate(reader, start=2):
            if index > 1001:
                raise HTTPException(413, 'CSV must contain at most 1000 observations.')
            values = {k: (None if v == '' else v) for k, v in row.items()}
            try:
                rows.append(ArgoObservationCreate.model_validate(values))
            except ValidationError:
                raise HTTPException(422, f'Invalid observation at CSV line {index}; no rows were imported.')
    except (UnicodeDecodeError, csv.Error):
        raise HTTPException(422, 'Invalid UTF-8 CSV.')
    db.add_all([ArgoObservation(**row.model_dump()) for row in rows])
    db.commit()
    return {'created': len(rows)}

def find(db, obs_id):
    obs = db.get(ArgoObservation, obs_id)
    if obs is None:
        raise HTTPException(404, 'Observation not found.')
    return obs

@router.put('/{obs_id}', response_model=ArgoObservationRead, dependencies=admin)
def update(obs_id: int, data: ArgoObservationUpdate, db: Session = Depends(get_db)):
    obs = find(db, obs_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obs, key, value)
    db.commit()
    db.refresh(obs)
    return obs

@router.delete('/{obs_id}', dependencies=admin)
def delete(obs_id: int, db: Session = Depends(get_db)):
    db.delete(find(db, obs_id))
    db.commit()
    return {'status': 'deleted', 'id': obs_id}
