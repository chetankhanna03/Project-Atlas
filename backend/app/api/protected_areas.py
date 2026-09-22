import json
from fastapi import APIRouter, HTTPException, Query
from shapely.geometry import box, shape
from shapely.errors import ShapelyError
from app.config import ROOT
from app.geo import radius_bbox
router = APIRouter(prefix='/api/conservation', tags=['conservation'])
DATA_FILE = ROOT / 'data' / 'marine_protected_areas.geojson'

@router.get('/protected')
def protected(lat: float = Query(..., ge=-89.99, le=89.99), lon: float = Query(..., ge=-179.99, le=180),
              radius: float = Query(50, gt=0, le=500), limit: int = Query(50, ge=1, le=500)):
    bounds = radius_bbox(lat, lon, radius)
    if not DATA_FILE.exists():
        return {'status': 'unavailable', 'count': 0, 'results': [], 'message': 'No licensed protected-area GeoJSON configured.'}
    if DATA_FILE.stat().st_size > 20_000_000:
        raise HTTPException(503, 'Local protected-area file exceeds the supported 20 MB limit.')
    try:
        data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
        if data.get('type') != 'FeatureCollection':
            raise ValueError()
        results = []
        for feature in data['features']:
            geometry = shape(feature['geometry'])
            if geometry.is_valid and geometry.intersects(box(*bounds)):
                results.append(feature)
                if len(results) >= limit:
                    break
        return {'status': 'ok' if results else 'no_data', 'count': len(results), 'results': results,
                'limitations': ['Bounding-box intersection, not exact radial distance. Source attribution is retained in feature properties.']}
    except (OSError, ValueError, KeyError, TypeError, AttributeError, ShapelyError):
        raise HTTPException(503, 'Local protected-area file is invalid or unreadable.')
