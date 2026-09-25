"""Validated specimen metadata and bounded exploratory statistics."""
import math
import re
import statistics
from datetime import date, datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator
from sqlalchemy import Column, String, JSON, DateTime, select
from sqlalchemy.orm import Session
from app.database import Base, get_db
from app.security import require_admin

router = APIRouter(prefix='/api/science', tags=['molecular / morphology / analytics'])


class ScienceRecord(Base):
    __tablename__ = 'science_records'
    key = Column(String(150), primary_key=True)
    kind = Column(String(20), nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    imported_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class Specimen(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False, str_strip_whitespace=True)
    record_id: str = Field(min_length=1, max_length=100, pattern=r'^[A-Za-z0-9_.-]+$')
    source_url: HttpUrl
    license: str = Field(min_length=1, max_length=200)
    sampled_on: date
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    reported_taxon: str | None = Field(None, max_length=200)
    sequence: str | None = Field(None, max_length=100000)
    marker: str | None = Field(None, max_length=100)
    length_mm: float | None = Field(None, gt=0)
    width_mm: float | None = Field(None, gt=0)
    area_mm2: float | None = Field(None, gt=0)
    perimeter_mm: float | None = Field(None, gt=0)
    image_reference: HttpUrl | None = None

    @model_validator(mode='after')
    def sequence_valid(self):
        if self.sequence is not None:
            self.sequence = ''.join(self.sequence.split()).upper()
            if not self.sequence or not re.fullmatch('[ACGTRYSWKMBDHVN]+', self.sequence):
                raise ValueError('Sequence must be nonempty IUPAC DNA, without FASTA headers.')
        if self.area_mm2 and self.perimeter_mm and 4*math.pi*self.area_mm2/self.perimeter_mm**2 > 1.02:
            raise ValueError('Area and perimeter are inconsistent; check measurement units.')
        return self


class SpecimenBatch(BaseModel):
    records: list[Specimen] = Field(min_length=1, max_length=100)


@router.get('/records/{kind}')
def records(kind: Literal['edna', 'otolith'], db: Session = Depends(get_db)):
    rows = db.scalars(select(ScienceRecord).where(ScienceRecord.kind == kind).order_by(ScienceRecord.imported_at.desc()).limit(1000)).all()
    return {'records': [{'data': row.payload, 'imported_at': row.imported_at.replace(tzinfo=timezone.utc).isoformat()} for row in rows],
            'count': len(rows), 'limit': 1000, 'analysis': 'submitted_annotations_only',
            'limitations': ['No sequence matching or image classification model is configured. Reported taxa are submitter annotations, not inferred matches.']}


@router.post('/records/{kind}', dependencies=[Depends(require_admin)], status_code=201)
def import_records(kind: Literal['edna', 'otolith'], batch: SpecimenBatch, db: Session = Depends(get_db)):
    keys = [kind + ':' + row.record_id for row in batch.records]
    if len(keys) != len(set(keys)) or db.scalar(select(ScienceRecord.key).where(ScienceRecord.key.in_(keys)).limit(1)):
        raise HTTPException(409, 'Record ID already exists or is repeated; nothing imported.')
    payloads = []
    for row in batch.records:
        if kind == 'edna' and not row.sequence:
            raise HTTPException(422, 'eDNA records require an IUPAC sequence.')
        if kind == 'otolith' and not (row.length_mm and row.width_mm):
            raise HTTPException(422, 'Otolith records require measured length_mm and width_mm.')
        payload = row.model_dump(mode='json')
        payload['aspect_ratio'] = row.length_mm/row.width_mm if row.length_mm and row.width_mm else None
        payload['circularity'] = 4*math.pi*row.area_mm2/row.perimeter_mm**2 if row.area_mm2 and row.perimeter_mm else None
        payload['sequence_length'] = len(row.sequence) if row.sequence else None
        payloads.append(payload)
    for key, payload in zip(keys, payloads):
        db.add(ScienceRecord(key=key, kind=kind, payload=payload))
    db.commit()
    return {'imported': len(payloads), 'classification': 'not_performed'}


class Pair(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    date: date
    x: float
    y: float


class Comparison(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    x_label: str = Field(min_length=1, max_length=100)
    y_label: str = Field(min_length=1, max_length=100)
    spatial_scope: str = Field(min_length=1, max_length=500)
    sources: list[HttpUrl] = Field(min_length=1, max_length=10)
    pairs: list[Pair] = Field(min_length=3, max_length=5000)


@router.post('/compare')
def compare(data: Comparison):
    if len({pair.date for pair in data.pairs}) != len(data.pairs):
        raise HTTPException(422, 'Use one aligned pair per date; aggregate duplicates explicitly before comparison.')
    x, y = [p.x for p in data.pairs], [p.y for p in data.pairs]
    r = statistics.correlation(x, y) if len(set(x)) > 1 and len(set(y)) > 1 else None
    return {'n': len(x), 'pearson_r': r, 'status': 'ok' if r is not None else 'constant_variable',
            'x_label': data.x_label, 'y_label': data.y_label, 'spatial_scope': data.spatial_scope,
            'sources': data.sources, 'pairs': sorted([p.model_dump(mode='json') for p in data.pairs], key=lambda p:p['date']),
            'method': 'Pearson correlation on supplied date-aligned pairs; dates are unique.',
            'limitations': ['Exploratory association only; no causal conclusion or population inference.',
                           'Spatial comparability, measurement quality and sampling effort are not verified by this calculation.',
                           'Autocorrelation and confounders are not adjusted; no significance claim is made.']}
