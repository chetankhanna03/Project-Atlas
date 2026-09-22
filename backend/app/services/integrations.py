"""Bounded adapters for additional public and credentialed marine sources."""
import asyncio
import hashlib
import json
import math
import re
from datetime import date, datetime, timedelta, timezone
import httpx
from fastapi import HTTPException
from app.config import settings
from app.geo import polygon_wkt, validate_bbox
from app.services.sources import invalid, reject_nonfinite, request_json
from app.utils.cache import get_cached, get_cache_key, put_cached

GFW = 'https://gateway.api.globalfishingwatch.org/v3/4wings/report'
GBIF = 'https://api.gbif.org/v1/occurrence/search'
CMR = 'https://cmr.earthdata.nasa.gov/search/'
IUCN = 'https://api.iucnredlist.org/api/v4/taxa/scientific_name'
_gfw_busy = False


def window(start, end, max_days=None):
    end = end or datetime.now(timezone.utc).date() - timedelta(days=5)
    start = start or end - timedelta(days=6)
    if start > end or (max_days and (end-start).days >= max_days):
        raise HTTPException(422, f'Invalid date range; use start <= end' + (f' and at most {max_days} days.' if max_days else '.'))
    return start, end


async def authenticated_json(source, url, key, params, body=None, missing_is_empty=False):
    if not key:
        raise HTTPException(503, f'{source} credentials are not configured on the backend.')
    cache_key = get_cache_key(source, {'params': params, 'body': body, 'account': hashlib.sha256(key.encode()).hexdigest()})
    cached = get_cached(cache_key)
    if cached:
        data, provenance = cached
        return data, {**provenance, 'cached': True}
    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
            async with client.stream('POST' if body is not None else 'GET', url, params=params,
                                     json=body, headers={'Authorization': 'Bearer ' + key}) as response:
                if response.status_code == 404 and missing_is_empty:
                    data = {'assessments': []}
                else:
                    response.raise_for_status()
                    raw = bytearray()
                    async for chunk in response.aiter_bytes():
                        raw.extend(chunk)
                        if len(raw) > 5_000_000:
                            raise invalid(source)
                    data = json.loads(raw, parse_constant=reject_nonfinite)
    except httpx.TimeoutException:
        raise HTTPException(504, f'{source} timed out.') from None
    except httpx.HTTPStatusError as exc:
        raise HTTPException(503, {'source': source, 'code': 'source_unavailable', 'upstream_status': exc.response.status_code}) from None
    except httpx.HTTPError:
        raise HTTPException(503, f'{source} connection failed.') from None
    except (ValueError, UnicodeDecodeError):
        raise invalid(source)
    provenance = {'source': source, 'url': str(response.url), 'retrieved_at': datetime.now(timezone.utc).isoformat(),
                  'source_last_updated': response.headers.get('last-modified'), 'cached': False}
    put_cached(cache_key, (data,provenance), settings.cache_ttl_seconds)
    return data, provenance


async def fishing_effort(bounds, start=None, end=None):
    global _gfw_busy
    w,s,e,n = validate_bbox(*bounds)
    start,end = window(start,end,366)
    if _gfw_busy:
        raise HTTPException(429, 'A GFW report is already running; retry shortly.')
    params = {'datasets[0]': 'public-global-fishing-effort:latest', 'date-range': f'{start},{end + timedelta(days=1)}',
              'format': 'JSON', 'spatial-aggregation': 'true', 'spatial-resolution': 'LOW',
              'temporal-resolution': 'DAILY', 'group-by': 'FLAG'}
    body = {'geojson': {'type': 'Polygon', 'coordinates': [[[w,s],[e,s],[e,n],[w,n],[w,s]]]}}
    _gfw_busy = True
    try:
        data,provenance = await authenticated_json('Global Fishing Watch',GFW,settings.gfw_api_key,params,body)
    finally:
        _gfw_busy = False
    try:
        entries=data['entries']
        if not isinstance(entries,list):
            raise ValueError()
        rows=[]
        for entry in entries:
            if not isinstance(entry,dict):
                raise ValueError()
            if 'hours' in entry:
                groups=[('public-global-fishing-effort:latest', [entry])]
            else:
                groups=list(entry.items())
            for dataset, records in groups:
                if not dataset.startswith('public-global-fishing-effort:') or not isinstance(records,list):
                    raise ValueError()
                for row in records:
                    hours=float(row['hours'])
                    if not math.isfinite(hours) or hours < 0:
                        raise ValueError()
                    day=date.fromisoformat(row['date'][:10])
                    if not start <= day <= end:
                        continue
                    rows.append({'date': str(day), 'flag': row.get('flag'), 'apparent_fishing_hours': hours, 'dataset': dataset})
                    if len(rows)>20000:
                        raise ValueError()
        partial = data.get('nextOffset') not in (None,0)
    except (KeyError,TypeError,ValueError):
        raise invalid('Global Fishing Watch')
    return {'status': 'partial' if partial else ('ok' if rows else 'no_data'), 'results': rows,
            'total_apparent_fishing_hours': sum(row['apparent_fishing_hours'] for row in rows), 'provenance': provenance,
            'query': {'bbox':bounds,'start':str(start),'end':str(end)},
            'limitations': ['AIS-derived apparent fishing effort; not catch, landings, fish abundance or complete vessel coverage.',
                'Daily hours summed over the requested bounding box by flag. End date is inclusive in Atlas; requests use next-day boundary.',
                'Default period is seven days ending five days ago to allow publication lag.'] +
                (['Upstream report is paginated; totals cover only returned rows.'] if partial else [])}


async def gbif_occurrences(bounds, species=None, start=None, end=None, limit=50):
    validate_bbox(*bounds)
    if start and end and start>end:
        raise HTTPException(422,'Use start <= end.')
    params={'geometry':polygon_wkt(bounds),'hasCoordinate':'true','hasGeospatialIssue':'false','occurrenceStatus':'PRESENT','limit':limit}
    if species:
        params['scientificName']=species
    if start or end:
        params['eventDate']=f'{start or "*"},{end or "*"}'
    data,provenance=await request_json('GBIF',GBIF,params)
    try:
        if not isinstance(data['results'],list):
            raise ValueError()
        rows=[]
        w,s,e,n=bounds
        for row in data['results'][:limit]:
            lat,lon=float(row['decimalLatitude']),float(row['decimalLongitude'])
            if not (s<=lat<=n and w<=lon<=e):
                continue
            rows.append({'record_id':row['key'],'scientific_name':row.get('scientificName'), 'latitude':lat,'longitude':lon,
                'event_date':row.get('eventDate'),'dataset_id':row.get('datasetKey'),'license':row.get('license'),
                'basis_of_record':row.get('basisOfRecord'),'issues':row.get('issues',[]), 'url':f"https://www.gbif.org/occurrence/{row['key']}"})
    except (KeyError,TypeError,ValueError):
        raise invalid('GBIF')
    return {'status':'ok' if rows else 'no_data','results':rows,'count':len(rows),'provenance':provenance,
        'limitations':['GBIF includes marine and terrestrial records; a geographic sample is not a marine-only inventory.',
            'Records can overlap OBIS. Do not sum counts across sources as unique species or observations.']}


async def nasa_collections(query, bounds=None, limit=5):
    params={'keyword':query,'page_size':limit}
    if bounds:
        params['bounding_box']=','.join(map(str,validate_bbox(*bounds)))
    data,provenance=await request_json('NASA Earthdata CMR',CMR+'collections.json',params)
    try:
        entries=data['feed']['entry']
        if not isinstance(entries,list):
            raise ValueError()
        rows=[{'id':row['id'],'title':row['title'],'summary':row.get('summary','')[:2000],
               'time_start':row.get('time_start'),'time_end':row.get('time_end'),
               'url':CMR+'concepts/'+row['id']+'.html'} for row in entries[:limit]]
    except (KeyError,TypeError,ValueError):
        raise invalid('NASA Earthdata CMR')
    return {'status':'ok' if rows else 'no_data','results':rows,'provenance':provenance,
        'limitations':['Collection metadata only; no satellite measurements or granule files have been downloaded. Data access varies by product and may require Earthdata Login.']}


async def iucn_assessments(species):
    if not re.fullmatch(r'[A-Z][a-z]+ [a-z-]+',species):
        raise HTTPException(422,'Provide a binomial scientific name, e.g. Thunnus albacares.')
    genus,epithet=species.split()
    data,provenance=await authenticated_json('IUCN Red List',IUCN,settings.iucn_api_key,
        {'genus_name':genus,'species_name':epithet},missing_is_empty=True)
    try:
        assessments=data['assessments']
        if not isinstance(assessments,list):
            raise ValueError()
        rows=[]
        for row in assessments[:50]:
            if not isinstance(row,dict) or not isinstance(row.get('assessment_id'),int):
                raise ValueError()
            rows.append({key:row.get(key) for key in ('assessment_id','sis_taxon_id','year_published','latest',
                'red_list_category_code','scopes','url','assessment_date')})
    except (KeyError,TypeError,ValueError):
        raise invalid('IUCN Red List')
    return {'status':'ok' if rows else 'no_data','species':species,'results':rows,'provenance':provenance,
        'limitations':['Assessment summaries retain scope, publication year and latest flag where supplied. Regional and global assessments are not interchangeable.',
            'No matching assessment does not mean Least Concern. At most 50 summaries; use source links for full assessments.']}


async def noaa_catalog(query,limit=10):
    url='https://www.ncei.noaa.gov/erddap/search/index.json'
    data,provenance=await request_json('NOAA NCEI ERDDAP',url,{'searchFor':query,'page':1,'itemsPerPage':limit})
    try:
        table=data['table']; columns=table['columnNames']; rows=table['rows']
        if not isinstance(columns,list) or not isinstance(rows,list) or any(not isinstance(row,list) or len(row)!=len(columns) for row in rows):
            raise ValueError()
        results=[dict(zip(columns,row)) for row in rows[:limit]]
    except (KeyError,TypeError,ValueError):
        raise invalid('NOAA NCEI ERDDAP')
    return {'status':'ok' if results else 'no_data','results':results,'provenance':provenance,
        'limitations':['Dataset discovery only. Numerical retrieval requires each dataset variable and dimension contract. Existing MUR SST adapter uses NOAA CoastWatch.']}
