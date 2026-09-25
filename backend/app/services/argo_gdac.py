"""On-demand core Argo profiles from Coriolis HTTPS; no bulk profile mirror."""
import asyncio
import math
import re
import sqlite3
import threading
from contextlib import closing
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import httpx
import netCDF4
import numpy as np
from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool
from app.config import settings
from app.geo import validate_bbox
from app.utils.cache import get_cached, put_cached, get_cache_key

BASE = 'https://data-argo.ifremer.fr/'
INDEX_URL = BASE + 'ar_index_global_prof.txt.gz'
INDEX_PATH = Path(__file__).resolve().parents[2] / 'argo-index.db'
NETCDF_LOCK = threading.Lock()  # netCDF C library is not thread-safe.
PROFILE_PATH = re.compile(r'[a-z0-9_]+/([0-9]{5,8})/profiles/[RD]\1_[0-9]+[AD]?\.nc\Z')


def select_profiles(bounds, start, end, limit, offset=0):
    validate_bbox(*bounds)
    if not INDEX_PATH.exists():
        raise HTTPException(503, 'ARGO index missing. Run python -m app.services.sync_argo_index from backend/.')
    w, s, e, n = bounds
    try:
        with closing(sqlite3.connect(INDEX_PATH.resolve().as_uri() + '?mode=ro', uri=True)) as db:
            db.row_factory = sqlite3.Row
            metadata = dict(db.execute('SELECT key,value FROM metadata').fetchall())
            rows = db.execute('''SELECT * FROM profiles WHERE latitude BETWEEN ? AND ?
                AND longitude BETWEEN ? AND ? AND date BETWEEN ? AND ?
                ORDER BY date DESC, file LIMIT ? OFFSET ?''',
                (s, n, w, e, start.strftime('%Y%m%d')+'000000', end.strftime('%Y%m%d')+'235959', limit+1, offset)).fetchall()
            metadata['matching_files'] = db.execute('''SELECT COUNT(*) FROM profiles WHERE latitude BETWEEN ? AND ?
                AND longitude BETWEEN ? AND ? AND date BETWEEN ? AND ?''',
                (s,n,w,e,start.strftime('%Y%m%d')+'000000',end.strftime('%Y%m%d')+'235959')).fetchone()[0]
        return [dict(row) for row in rows[:limit]], len(rows) > limit, metadata
    except sqlite3.Error:
        raise HTTPException(503, 'ARGO index unavailable; rebuild it with python -m app.services.sync_argo_index.')


def chars(value):
    array = np.ma.filled(value, b' ')
    return np.asarray(array).tobytes().decode('ascii').strip(' \x00')


def number(value):
    if np.ma.is_masked(value):
        return None
    value = float(value)
    return value if math.isfinite(value) else None


def parse_profile(raw, bounds, start, end, parameter, pressure_min, pressure_max, max_levels=100):
    """QC=1 only; use adjusted variables for A/D, never fill them with raw data."""
    result = []
    w, s, e, n = bounds
    with NETCDF_LOCK, netCDF4.Dataset('argo', memory=raw) as ds:
        ds.set_auto_chartostring(False)
        if len(ds.dimensions['N_PROF']) > 20 or len(ds.dimensions['N_LEVELS']) > 10000:
            raise ValueError('Oversized profile dimensions')
        for i in range(len(ds.dimensions['N_PROF'])):
            lat, lon = number(ds['LATITUDE'][i]), number(ds['LONGITUDE'][i])
            juld = number(ds['JULD'][i])
            if lat is None or lon is None or juld is None or not (s <= lat <= n and w <= lon <= e):
                continue
            if chars(ds['POSITION_QC'][i]) != '1' or chars(ds['JULD_QC'][i]) != '1':
                continue
            when = netCDF4.num2date(juld, ds['JULD'].units, calendar=getattr(ds['JULD'], 'calendar', 'standard'))
            day = date(when.year, when.month, when.day)
            if not start <= day <= end:
                continue
            mode = chars(ds['DATA_MODE'][i])
            if mode not in ('R', 'A', 'D'):
                continue
            suffix = '_ADJUSTED' if mode in ('A','D') else ''
            pkey, vkey = 'PRES'+suffix, ('PSAL' if parameter == 'salinity' else 'TEMP')+suffix
            if any(key not in ds.variables for key in (pkey, vkey, pkey+'_QC', vkey+'_QC')):
                continue
            if str(ds[pkey].units).lower() not in ('decibar', 'decibars', 'dbar'):
                raise ValueError('Unexpected pressure units')
            pressures, values = ds[pkey][i], ds[vkey][i]
            pq, vq = ds[pkey+'_QC'][i], ds[vkey+'_QC'][i]
            valid = []
            for j in range(len(pressures)):
                p, v = number(pressures[j]), number(values[j])
                if p is None or v is None or not pressure_min <= p <= pressure_max:
                    continue
                if chars(pq[j]) != '1' or chars(vq[j]) != '1':
                    continue
                error = number(ds[vkey+'_ERROR'][i,j]) if vkey+'_ERROR' in ds.variables else None
                valid.append({'pressure_dbar': p, 'value': v, 'qc': '1', 'pressure_qc': '1', 'adjusted_error': error})
            if not valid:
                continue
            # Evenly spaced display sample; no averaging across depths or floats.
            indices = np.linspace(0, len(valid)-1, min(max_levels, len(valid)), dtype=int)
            result.append({'float_id': chars(ds['PLATFORM_NUMBER'][i]), 'cycle': int(ds['CYCLE_NUMBER'][i]),
                           'latitude': lat, 'longitude': lon, 'time': when.strftime('%Y-%m-%dT%H:%M:%SZ'),
                           'data_mode': mode, 'parameter': parameter, 'unit': str(ds[vkey].units),
                           'variable': vkey, 'matching_levels': len(valid),
                           'levels': [valid[j] for j in indices]})
    return result


async def fetch_profile(path):
    if not PROFILE_PATH.fullmatch(path):
        raise HTTPException(502, 'Invalid ARGO index profile path.')
    url = BASE + 'dac/' + path
    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
            async with client.stream('GET', url) as response:
                response.raise_for_status()
                raw = bytearray()
                async for chunk in response.aiter_bytes():
                    raw.extend(chunk)
                    if len(raw) > 8_000_000:
                        raise HTTPException(502, 'ARGO profile exceeds download limit.')
                return bytes(raw), {'url': url, 'retrieved_at': datetime.now(timezone.utc).isoformat(),
                                    'source_last_updated': response.headers.get('last-modified')}
    except httpx.TimeoutException:
        raise HTTPException(504, 'Coriolis ARGO request timed out.')
    except httpx.HTTPError:
        raise HTTPException(503, 'Coriolis ARGO profile unavailable.')


async def get_profiles(bounds, start=None, end=None, parameter='temperature', limit=3,
                       pressure_min=0.0, pressure_max=2000.0, offset=0):
    validate_bbox(*bounds)
    if parameter not in ('temperature','salinity') or not 1 <= limit <= 5:
        raise HTTPException(422, 'Choose temperature or salinity and 1-5 profiles.')
    if not 0 <= pressure_min <= pressure_max <= 12000:
        raise HTTPException(422, 'Use 0 <= pressure_min <= pressure_max <= 12000 dbar.')
    end = end or datetime.now(timezone.utc).date()
    start = start or end - timedelta(days=30)
    if start > end:
        raise HTTPException(422, 'Use start <= end.')
    selected, truncated, metadata = await run_in_threadpool(select_profiles, bounds, start, end, limit, offset)
    key = get_cache_key('argo-gdac', {'bbox': bounds, 'start': str(start), 'end': str(end),
        'parameter': parameter, 'limit': limit, 'offset': offset, 'pressure': [pressure_min,pressure_max], 'index': metadata})
    cached = get_cached(key)
    if cached:
        cached['cached'] = True
        return cached
    profiles, errors = [], []
    async def retrieve(row):
        raw, provenance = await fetch_profile(row['file'])
        try:
            parsed = await run_in_threadpool(parse_profile, raw, bounds, start, end, parameter, pressure_min, pressure_max)
        except (ValueError, KeyError, IndexError, OSError, RuntimeError, OverflowError):
            raise HTTPException(502, 'Invalid ARGO NetCDF profile.')
        return [{**item, **provenance, 'index_date_update': row['date_update']} for item in parsed]
    outcomes = await asyncio.gather(*(retrieve(row) for row in selected), return_exceptions=True)
    for row, outcome in zip(selected, outcomes):
        if isinstance(outcome, HTTPException):
            errors.append({'file': row['file'], 'detail': outcome.detail})
        elif isinstance(outcome, Exception):
            raise outcome
        else:
            profiles.extend(outcome)
    limitations = ['Core Argo vertical profiles, not satellite SST or regional means.',
        'Only QC=1 position, time, pressure and measurement values are retained. A/D modes use adjusted values; R uses raw values.',
        'Pressure is in dbar, not depth in metres. At most 100 sampled levels per profile.',
        'Matching indexed files are paginated newest first. Matching file totals precede quality filtering. Missing dates default to a 30-day window ending at the supplied end date or today.']
    if truncated:
        limitations.append(f'More matching files are available. Load the next page ({limit} files per request).')
    if datetime.now(timezone.utc) - datetime.fromisoformat(metadata['retrieved_at']) > timedelta(days=2):
        limitations.append('Local ARGO index is over two days old; refresh it to discover newer or revised profiles.')
    result = {'source': 'Argo GDAC / Coriolis', 'status': ('partial' if profiles else 'unavailable') if errors else ('ok' if profiles else 'no_data'),
              'profiles': profiles, 'errors': errors, 'limitations': limitations, 'cached': False,
              'query': {'bbox': bounds, 'start': str(start), 'end': str(end), 'parameter': parameter,
                        'pressure_min_dbar': pressure_min, 'pressure_max_dbar': pressure_max},
              'index': metadata, 'doi': 'https://doi.org/10.17882/42182',
              'matching_files': metadata['matching_files'], 'files_scanned': len(selected),
              'next_offset': offset + len(selected) if truncated else None}
    if not errors:
        put_cached(key, result, settings.cache_ttl_seconds)
    return result
