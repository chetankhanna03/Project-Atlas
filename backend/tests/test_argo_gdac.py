import asyncio
import gzip
import os
from datetime import date, datetime, timezone
import netCDF4
import numpy as np
import pytest
from fastapi import HTTPException
from app.services import argo_gdac as gdac
from app.services.sync_argo_index import build_index


def profile_bytes(tmp_path, mode='D'):
    path = tmp_path / 'fixture.nc'
    with netCDF4.Dataset(path, 'w', format='NETCDF3_CLASSIC') as ds:
        for name, size in [('N_PROF',1),('N_LEVELS',4),('STRING8',8)]:
            ds.createDimension(name,size)
        for name, value in [('LATITUDE',15),('LONGITUDE',65),('JULD',0),('CYCLE_NUMBER',1)]:
            v = ds.createVariable(name,'f8',('N_PROF',)); v[:] = [value]
        ds['JULD'].units = 'days since 2025-01-01 00:00:00'
        for name, value in [('POSITION_QC','1'),('JULD_QC','1'),('DATA_MODE',mode)]:
            ds.createVariable(name,'S1',('N_PROF',))[:] = np.array([value],dtype='S1')
        ds.createVariable('PLATFORM_NUMBER','S1',('N_PROF','STRING8'))[:] = np.array(list('1234567 '),dtype='S1')
        for name, values, unit in [('PRES',[0,10,20,30],'decibar'),('TEMP',[99,99,99,99],'degree_Celsius'),
            ('PRES_ADJUSTED',[0,10,20,30],'decibar'),('TEMP_ADJUSTED',[27,28,29,1e20],'degree_Celsius')]:
            v=ds.createVariable(name,'f8',('N_PROF','N_LEVELS'),fill_value=1e20)
            v[:] = [values]; v.units=unit
            ds.createVariable(name+'_QC','S1',('N_PROF','N_LEVELS'))[:] = np.array([list('1411' if name=='TEMP_ADJUSTED' else '1111')],dtype='S1')
    return path.read_bytes()


def test_adjusted_qc_pressure_and_missing_values(tmp_path):
    rows = gdac.parse_profile(profile_bytes(tmp_path), (64,14,66,16),date(2025,1,1),date(2025,1,2),'temperature',0,2000)
    assert [v['value'] for v in rows[0]['levels']] == [27,29]
    assert rows[0]['levels'][1]['pressure_dbar'] == 20
    assert rows[0]['variable'] == 'TEMP_ADJUSTED'
    assert 'depth_m' not in rows[0]['levels'][0]


def test_raw_mode_and_file_scope_recheck(tmp_path):
    raw=profile_bytes(tmp_path,'R')
    rows=gdac.parse_profile(raw,(64,14,66,16),date(2025,1,1),date(2025,1,2),'temperature',5,15)
    assert rows[0]['levels'] == [{'pressure_dbar':10,'value':99,'qc':'1','pressure_qc':'1','adjusted_error':None}]
    assert gdac.parse_profile(raw,(0,0,1,1),date(2025,1,1),date(2025,1,2),'temperature',0,100) == []
    assert gdac.parse_profile(raw,(64,14,66,16),date(2024,1,1),date(2024,1,2),'temperature',0,100) == []


def test_missing_adjusted_never_uses_raw_and_bad_position_rejected(tmp_path):
    profile_bytes(tmp_path)
    with netCDF4.Dataset(tmp_path/'fixture.nc','r+') as ds:
        ds['TEMP_ADJUSTED'][:] = np.ma.masked_all((1,4))
    args=((64,14,66,16),date(2025,1,1),date(2025,1,2),'temperature',0,100)
    assert gdac.parse_profile((tmp_path/'fixture.nc').read_bytes(),*args) == []
    profile_bytes(tmp_path,'R')
    with netCDF4.Dataset(tmp_path/'fixture.nc','r+') as ds:
        ds['POSITION_QC'][:] = np.array(['4'],dtype='S1')
    assert gdac.parse_profile((tmp_path/'fixture.nc').read_bytes(),*args) == []


def index_fixture(tmp_path, monkeypatch):
    archive=tmp_path/'index.gz'; dest=tmp_path/'index.db'
    with gzip.open(archive,'wt') as out:
        out.write('# test fixture\nfile,date,latitude,longitude,date_update\n')
        out.write('aoml/1234567/profiles/D1234567_001.nc,20250101000000,15,65,20250102000000\n')
        out.write('aoml/1234567/profiles/R1234567_002.nc,20250102000000,15,65,20250102000000\n')
        out.write('../secret,20250101000000,15,65,20250102000000\n')
    assert build_index(archive,dest,{'retrieved_at':datetime.now(timezone.utc).isoformat()}) == 2
    monkeypatch.setattr(gdac,'INDEX_PATH',dest)


def test_index_bounds_dates_limit_and_safe_paths(tmp_path,monkeypatch):
    index_fixture(tmp_path,monkeypatch)
    rows,truncated,_=gdac.select_profiles((64,14,66,16),date(2025,1,1),date(2025,1,2),1)
    assert truncated and rows[0]['file'].endswith('_002.nc')
    assert gdac.select_profiles((0,0,1,1),date(2025,1,1),date(2025,1,2),1)[0] == []
    # Reading/building must close SQLite handles so refresh works on Windows.
    os.replace(gdac.INDEX_PATH,tmp_path/'replacement.db')
    with pytest.raises(HTTPException):
        asyncio.run(gdac.fetch_profile('../secret'))


def test_gdac_api_and_partial_failure(client,tmp_path,monkeypatch):
    index_fixture(tmp_path,monkeypatch)
    raw=profile_bytes(tmp_path)
    async def fetch(path):
        if '_002' in path:
            raise HTTPException(503,'test unavailable')
        return raw,{'url':gdac.BASE+'dac/'+path,'retrieved_at':datetime.now(timezone.utc).isoformat()}
    monkeypatch.setattr(gdac,'fetch_profile',fetch)
    response=client.get('/api/oceanography/argo/gdac',params={'bbox':'64,14,66,16','start':'2025-01-01','end':'2025-01-02'})
    assert response.status_code == 200
    assert response.json()['status'] == 'partial'
    assert len(response.json()['profiles']) == 1
    assert response.json()['errors'][0]['detail'] == 'test unavailable'
    assert client.get('/api/oceanography/argo/gdac?bbox=66,14,64,16').status_code == 422
    assert client.get('/api/oceanography/argo/gdac?bbox=64,14,66,16&pressure_min=30&pressure_max=10').status_code == 422


def test_missing_index_explicit(client):
    response=client.get('/api/oceanography/argo/gdac?bbox=64,14,66,16')
    assert response.status_code == 503
    assert 'index missing' in response.json()['detail']


def test_chat_routes_temperature_to_gdac(client,monkeypatch):
    from app.ai import agents
    captured=[]
    async def profiles(bounds,start,end,parameter):
        captured.append((bounds,str(start),str(end),parameter))
        return {'profiles':[],'errors':[],'limitations':[],'status':'no_data'}
    monkeypatch.setattr(agents,'get_profiles',profiles)
    response=client.post('/api/chat',json={'message':'Show temperature in Arabian Sea during 2025'})
    assert response.status_code == 200
    assert response.json()['status'] == 'no_data'
    assert captured[0][1:] == ('2025-01-01','2025-12-31','temperature')
