import asyncio
from sqlalchemy import func
from fastapi import APIRouter, HTTPException, Query
from starlette.concurrency import run_in_threadpool
from sqlalchemy.exc import SQLAlchemyError
from app.database import SessionLocal
from app.models import ArgoObservation, FisheriesLanding
from app.geo import radius_bbox, distance_km
from app.services.sources import get_obis, get_sst
from app.schemas import ArgoObservationRead

router = APIRouter(prefix='/api/search', tags=['search'])

def local_search(bounds, lat, lon, radius, selected, year, species, region, limit):
    results, warnings = [], []
    with SessionLocal() as db:
        if 'argo' in selected:
            w, s, e, n = bounds
            query = db.query(ArgoObservation).filter(ArgoObservation.latitude.between(s, n), ArgoObservation.longitude.between(w, e))
            # Bound DB work. Report the candidate cap rather than claiming exhaustive radius coverage.
            candidates = query.order_by(ArgoObservation.observation_time.desc(), ArgoObservation.id.desc()).limit(1000).all()
            if len(candidates) == 1000:
                warnings.append('ARGO radius search scanned only the latest 1000 bounding-box candidates.')
            for row in candidates:
                if distance_km(lat, lon, row.latitude, row.longitude) <= radius:
                    results.append({'dataset': 'argo', **ArgoObservationRead.model_validate(row).model_dump(mode='json')})
                    if len(results) >= limit:
                        break
        if 'fisheries' in selected:
            if not region:
                warnings.append('Fisheries skipped: specify region; regional landings cannot be filtered by point/radius.')
            else:
                query = db.query(FisheriesLanding).filter(func.lower(FisheriesLanding.region) == region.lower())
                if year is not None:
                    query = query.filter(FisheriesLanding.year == year)
                if species:
                    query = query.filter(FisheriesLanding.species.icontains(species, autoescape=True))
                for row in query.order_by(FisheriesLanding.year.desc(), FisheriesLanding.id).limit(limit).all():
                    results.append({'dataset': 'fisheries', 'region': row.region, 'species': row.species,
                                    'year': row.year, 'landings_tonnes': row.landings, 'type': row.type.value})
                warnings.append('Fisheries are regional imported landings, not live vessel activity; provenance must be verified before scientific use.')
    return results, warnings

@router.get('/')
async def unified_search(lat: float = Query(..., ge=-89.99, le=89.99), lon: float = Query(..., ge=-179.99, le=180),
                          radius: float = Query(50, gt=0, le=500),
                          datasets: str = Query('argo,biodiversity,oceanography', max_length=200),
                          year: int | None = Query(None, ge=1900, le=2100), species: str | None = Query(None, max_length=200),
                          region: str | None = Query(None, max_length=200), limit: int = Query(50, ge=1, le=500)):
    selected = set(d.strip() for d in datasets.split(','))
    if not selected or selected - {'argo', 'fisheries', 'biodiversity', 'oceanography'}:
        raise HTTPException(422, 'Unknown dataset; choose argo,fisheries,biodiversity,oceanography.')
    bounds = radius_bbox(lat, lon, radius)
    results, warnings, errors, sources = [], [], [], []
    if selected & {'argo', 'fisheries'}:
        try:
            local, notes = await run_in_threadpool(local_search, bounds, lat, lon, radius, selected, year, species, region, limit)
            results.extend(local)
            warnings.extend(notes)
        except SQLAlchemyError:
            errors.append({'source': 'local_database', 'code': 'database_unavailable'})
    names, tasks = [], []
    if 'biodiversity' in selected:
        names.append('biodiversity')
        tasks.append(get_obis(bounds, limit, species))
    if 'oceanography' in selected:
        names.append('oceanography')
        tasks.append(get_sst(lat, lon, min(7, limit)))
    for name, outcome in zip(names, await asyncio.gather(*tasks, return_exceptions=True)):
        if isinstance(outcome, HTTPException):
            errors.append({'source': name, 'detail': outcome.detail})
        elif isinstance(outcome, Exception):
            # Unexpected programming errors should not be disguised as missing scientific data.
            raise outcome
        else:
            sources.append(outcome['provenance'])
            warnings.extend(outcome.get('limitations', []))
            if name == 'biodiversity':
                for row in outcome['results']:
                    rlat, rlon = row['latitude'], row['longitude']
                    if isinstance(rlat, (float, int)) and isinstance(rlon, (float, int)) and distance_km(lat, lon, rlat, rlon) <= radius:
                        results.append({'dataset': 'obis', **row})
                warnings.append('OBIS radius results are filtered from a bounded bounding-box sample; not exhaustive.')
            else:
                results.extend({'dataset': 'erddap', **row} for row in outcome['data'])
    return {'status': ('partial' if results else 'unavailable') if errors else ('ok' if results else 'no_data'),
            'query': {'lat': lat, 'lon': lon, 'radius_km': radius, 'datasets': sorted(selected), 'region': region},
            'total': len(results), 'results': results, 'sources': sources, 'errors': errors, 'limitations': warnings}
