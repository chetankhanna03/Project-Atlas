"""Isolated, time-bounded Copernicus point queries using the official toolbox."""
import asyncio
import json
import math
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from fastapi import HTTPException
from app.config import settings
from app.services.integrations import window
from app.utils.cache import get_cache_key, get_cached, put_cached

DATASETS = {
    'temperature': ('cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m', ['thetao']),
    'salinity': ('cmems_mod_glo_phy-so_anfc_0.083deg_P1D-m', ['so']),
    'currents': ('cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m', ['uo','vo']),
    'sea_level': ('cmems_mod_glo_phy_anfc_0.083deg_P1D-m', ['zos']),
}
PRODUCT_URL='https://data.marine.copernicus.eu/product/GLOBAL_ANALYSISFORECAST_PHY_001_024/description'
_active = 0


def configured():
    return bool(settings.copernicusmarine_service_username and settings.copernicusmarine_service_password)


async def run_worker(payload):
    process = await asyncio.create_subprocess_exec(sys.executable,'-m','app.services.copernicus_worker',
        cwd=Path(__file__).resolve().parents[2], stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
    try:
        stdout,_=await asyncio.wait_for(process.communicate(json.dumps(payload).encode()),timeout=45)
        if process.returncode or len(stdout)>1_000_000:
            raise HTTPException(503,'Copernicus retrieval failed; verify credentials, dataset coverage and network access.')
        result=json.loads(stdout)
        if 'error' in result:
            raise HTTPException(503,result['error'])
        return result
    except asyncio.TimeoutError:
        raise HTTPException(504,'Copernicus query timed out; try a shorter date range.') from None
    except (ValueError,TypeError):
        raise HTTPException(502,'Invalid Copernicus worker response.') from None
    finally:
        if process.returncode is None:
            process.kill()
            await process.wait()


async def point(latitude,longitude,parameter='temperature',start=None,end=None,depth=0):
    global _active
    if not configured():
        raise HTTPException(503,'Configure COPERNICUSMARINE_SERVICE_USERNAME and COPERNICUSMARINE_SERVICE_PASSWORD in backend/.env.')
    if parameter not in DATASETS or not all(math.isfinite(v) for v in (latitude,longitude,depth)) or not (-90<=latitude<=90 and -180<=longitude<=180 and 0<=depth<=6000):
        raise HTTPException(422,'Invalid Copernicus parameter, coordinates or depth.')
    start,end=window(start,end,31)
    dataset,variables=DATASETS[parameter]
    query={'latitude':latitude,'longitude':longitude,'parameter':parameter,'start':str(start),'end':str(end),'depth':depth,
           'dataset_id':dataset,'variables':variables}
    key=get_cache_key('copernicus',query)
    cached=get_cached(key)
    if cached:
        cached['provenance']['cached']=True
        return cached
    if _active>=2:
        raise HTTPException(429,'Copernicus query budget reached; retry shortly.')
    _active+=1
    try:
        try:
            result=await run_worker({**query,'username':settings.copernicusmarine_service_username,
                                   'password':settings.copernicusmarine_service_password})
        except OSError:
            raise HTTPException(503,'Copernicus worker could not start on this server.') from None
    finally:
        _active-=1
    result.update({'query':query,'provenance':{'source':'Copernicus Marine model analysis/forecast',
        'url':PRODUCT_URL,'dataset':dataset,'retrieved_at':datetime.now(timezone.utc).isoformat(),'cached':False},
        'limitations':['Nearest model grid cell and depth; actual coordinates/depth are returned. Not in-situ observations or a regional mean.',
            'Maximum 31 days from the configured analysis/forecast product; no automatic historical reanalysis substitution.',
            'Missing dates default to seven days ending five days ago. Model temperature is not satellite foundation SST.']})
    put_cached(key,result,settings.cache_ttl_seconds)
    return result
