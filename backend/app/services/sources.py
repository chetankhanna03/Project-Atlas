"""Small, bounded external requests with provenance and explicit source failures."""
import math
import json
from datetime import datetime, timezone
from urllib.parse import quote
import httpx
from fastapi import HTTPException
from app.config import settings
from app.geo import polygon_wkt
from app.utils.cache import get_cache_key, get_cached, put_cached, clear_cache

ERDDAP = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.json'
OBIS = 'https://api.obis.org/v3/occurrence'
WORMS = 'https://www.marinespecies.org/rest/AphiaRecordsByName'

def invalid(source):
    # Do not keep invalid upstream payloads alive through repeated cached failures.
    clear_cache(f'atlas:{source}:*')
    return HTTPException(502, {'source': source, 'code': 'invalid_response', 'message': 'Source returned an unexpected response.'})

def reject_nonfinite(value):
    raise ValueError('Non-finite JSON number')

async def request_json(source, url, params=None, refresh=False):
    key = get_cache_key(source, {'url': url, 'params': params})
    cached = None if refresh else get_cached(key)
    if cached is not None:
        payload, provenance = cached
        return payload, {**provenance, 'cached': True}
    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout_seconds, follow_redirects=True) as client:
            async with client.stream('GET', url, params=params) as response:
                response.raise_for_status()
                raw = bytearray()
                async for chunk in response.aiter_bytes():
                    raw.extend(chunk)
                    if len(raw) > 5_000_000:
                        raise invalid(source)
                payload = [] if response.status_code == 204 else json.loads(raw, parse_constant=reject_nonfinite)
    except httpx.TimeoutException:
        raise HTTPException(504, {'source': source, 'code': 'timeout', 'message': 'Source request timed out.'})
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        code = 'rate_limited' if status == 429 else 'source_unavailable'
        raise HTTPException(503 if status in (401, 403, 429) or status >= 500 else 502,
                            {'source': source, 'code': code, 'upstream_status': status})
    except httpx.RequestError:
        raise HTTPException(503, {'source': source, 'code': 'connection_failed'})
    except (ValueError, UnicodeDecodeError):
        raise invalid(source)
    provenance = {'source': source, 'url': str(response.url), 'retrieved_at': datetime.now(timezone.utc).isoformat(),
                  'source_last_updated': response.headers.get('last-modified'), 'dataset_version': None, 'cached': False}
    # Response shape is validated by each adapter before it is served. Short-lived cache is bounded.
    put_cached(key, (payload, provenance), settings.cache_ttl_seconds)
    return payload, provenance

async def get_sst(lat, lon, days=7):
    # last is ERDDAP's latest available index, not today's date (products can lag).
    times = '[last]' if days == 1 else f'[last-{days-1}:1:last]'
    query = f'analysed_sst{times}[({lat})][({lon})]'
    url = ERDDAP + '?' + quote(query, safe='(),:')
    data, provenance = await request_json('NOAA ERDDAP / NASA JPL MUR SST', url)
    try:
        table = data['table']
        columns, rows, units = table['columnNames'], table['rows'], table['columnUnits']
        if not isinstance(rows, list) or not isinstance(columns, list):
            raise ValueError()
        positions = {name: columns.index(name) for name in ('time', 'latitude', 'longitude', 'analysed_sst')}
        unit = units[positions['analysed_sst']]
        if unit not in ('degree_C', 'degrees_C', 'Celsius', 'K', 'kelvin'):
            raise ValueError()
        results = []
        for row in rows[:days]:
            value = row[positions['analysed_sst']]
            if value is None:
                continue
            value = float(value)
            if not math.isfinite(value):
                continue
            if unit in ('K', 'kelvin'):
                value -= 273.15
            rlat, rlon = float(row[positions['latitude']]), float(row[positions['longitude']])
            timestamp = row[positions['time']]
            if not (-90 <= rlat <= 90 and -180 <= rlon <= 180) or not isinstance(timestamp, str):
                raise ValueError()
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            results.append({'time': row[positions['time']], 'latitude': row[positions['latitude']],
                            'longitude': row[positions['longitude']], 'sst_celsius': value})
    except (KeyError, IndexError, TypeError, ValueError):
        raise invalid('NOAA ERDDAP / NASA JPL MUR SST')
    return {'status': 'ok' if results else 'no_data', 'source': provenance['source'],
            'parameter': 'sea_surface_foundation_temperature', 'unit': 'degree_C', 'count': len(results), 'data': results,
            'provenance': {**provenance, 'dataset': 'jplMURSST41', 'dataset_version': '04.1'},
            'query': {'latitude': lat, 'longitude': lon, 'latest_available_days': days},
            'limitations': ['Nearest grid cell; latest available observations may lag today. Recent values may be revised.']}

async def get_obis(bounds, limit=100, species=None):
    params = {'geometry': polygon_wkt(bounds), 'size': limit}
    if species:
        params['scientificname'] = species
    data, provenance = await request_json('OBIS', OBIS, params)
    if not isinstance(data, dict) or not isinstance(data.get('results'), list):
        raise invalid('OBIS')
    results = []
    for record in data['results'][:limit]:
        if not isinstance(record, dict):
            raise invalid('OBIS')
        try:
            latitude = float(record['decimalLatitude'])
            longitude = float(record['decimalLongitude'])
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                raise ValueError()
        except (KeyError, TypeError, ValueError):
            raise invalid('OBIS')
        results.append({'record_id': record.get('id'), 'scientific_name': record.get('scientificName'),
                        'latitude': latitude, 'longitude': longitude,
                        'event_date': record.get('eventDate'), 'depth': record.get('depth'),
                        'aphia_id': record.get('aphiaID'), 'dataset_id': record.get('dataset_id'),
                        'dataset': 'OBIS', 'license': record.get('license')})
    return {'status': 'ok' if results else 'no_data', 'count': len(results), 'results': results,
            'provenance': provenance, 'limit': limit,
            'limitations': ['Bounded occurrence sample, not an abundance estimate or complete species inventory.']}

async def get_taxonomy(name, refresh=False):
    data, provenance = await request_json('WoRMS', WORMS + '/' + quote(name, safe=''),
                                          {'like': 'false', 'marine_only': 'true'}, refresh)
    if not isinstance(data, list) or any(not isinstance(r, dict) for r in data):
        raise invalid('WoRMS')
    matches = [{'scientific_name': r.get('scientificname'), 'aphia_id': r.get('AphiaID'),
                'accepted_name': r.get('valid_name'), 'accepted_aphia_id': r.get('valid_AphiaID'),
                'status': r.get('status'), 'rank': r.get('rank'), 'kingdom': r.get('kingdom'),
                'phylum': r.get('phylum'), 'class_name': r.get('class'), 'order_name': r.get('order'),
                'family': r.get('family'), 'genus': r.get('genus'), 'authority': r.get('authority')}
               for r in data]
    return {'status': 'ok' if matches else 'no_data', 'count': len(matches), 'results': matches, 'provenance': provenance}
