from datetime import datetime, timezone
from urllib.parse import unquote
import httpx
import pytest
from fastapi import HTTPException
from app.config import settings
from app.services import sources
from app.api import search

AUTH = {'X-API-Key': 'test-private-key'}
OBS = {'float_id': 'test-float', 'latitude': 15, 'longitude': 65,
       'observation_time': '2025-01-01T00:00:00Z', 'temperature': 27.1, 'depth': 10}

def mock_http(monkeypatch, handler):
    original = httpx.AsyncClient
    monkeypatch.setattr(sources.httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))

def test_health_catalog_and_cors(client):
    assert client.get('/health').status_code == 200
    assert client.get('/ready').status_code == 200
    catalog = client.get('/api/datasets').json()
    assert catalog['count'] == len(catalog['datasets'])
    assert {'argo','copernicus','gfw','gbif','iucn','nasa-cmr','openalex'} <= {row['id'] for row in catalog['datasets']}
    response = client.options('/api/argo/observations', headers={'Origin': 'http://localhost:3000', 'Access-Control-Request-Method': 'POST'})
    assert response.headers['access-control-allow-origin'] == 'http://localhost:3000'
    assert client.get('/openapi.json').status_code == 200

def test_crud_and_authorization(client, monkeypatch):
    assert client.post('/api/argo/observations', json=OBS).status_code == 401
    response = client.post('/api/argo/observations', json=OBS, headers=AUTH)
    assert response.status_code == 201
    obs_id = response.json()['id']
    assert response.json()['observation_time'].endswith('Z')
    assert len(client.get('/api/argo/observations?limit=1').json()) == 1
    assert client.put(f'/api/argo/observations/{obs_id}', json={'temperature': None}, headers=AUTH).json()['temperature'] is None
    assert client.delete(f'/api/argo/observations/{obs_id}', headers=AUTH).status_code == 200
    assert client.delete(f'/api/argo/observations/{obs_id}', headers=AUTH).status_code == 404
    monkeypatch.setattr(settings, 'admin_api_key', None)
    assert client.post('/api/argo/observations', json=OBS, headers=AUTH).status_code == 503

@pytest.mark.parametrize('patch', [{'latitude': 91}, {'longitude': -181}, {'depth': -1}, {'float_id': ' '}, {'observation_time': '2025-01-01'}, {'id': 9}])
def test_create_validation(client, patch):
    assert client.post('/api/argo/observations', json={**OBS, **patch}, headers=AUTH).status_code == 422

@pytest.mark.parametrize('patch', [{'latitude': None}, {'observation_time': None}, {'id': 90}, {'temperature': 'NaN'}, {'latitude': -91}])
def test_update_validation(client, patch):
    assert client.put('/api/argo/observations/1', json=patch, headers=AUTH).status_code == 422

def test_atomic_csv_import(client):
    header = 'float_id,latitude,longitude,observation_time,temperature\n'
    valid = 'test,15,65,2025-01-01T00:00:00Z,27\n'
    invalid = 'bad,999,65,2025-01-01T00:00:00Z,27\n'
    response = client.post('/api/argo/observations/bulk', files={'file': ('obs.csv', header + valid + invalid)}, headers=AUTH)
    assert response.status_code == 422
    assert client.get('/api/argo/observations').json() == []
    response = client.post('/api/argo/observations/bulk', files={'file': ('obs.csv', header + valid)}, headers=AUTH)
    assert response.status_code == 201
    assert response.json()['created'] == 1

@pytest.mark.parametrize('path', ['/api/argo/observations?limit=0', '/api/fisheries/landings?limit=1001',
                                  '/api/fisheries/landings?type=unknown', '/api/biodiversity/obis?bbox=bad',
                                  '/api/biodiversity/obis?bbox=70,15,60,20', '/api/oceanography/erddap/sst?lat=91&lon=65',
                                  '/api/search/?lat=15&lon=65&datasets=unknown', '/api/search/?lat=15&lon=179.99&radius=500'])
def test_query_validation(client, path):
    assert client.get(path).status_code == 422

def test_sst_query_parser_units_and_cache(client, monkeypatch):
    calls = []
    def handler(request):
        calls.append(request)
        assert 'analysed_sst[last-1:1:last][(15.0)][(65.0)]' in unquote(str(request.url))
        return httpx.Response(200, json={'table': {'columnNames': ['time', 'latitude', 'longitude', 'analysed_sst'],
                'columnUnits': ['UTC', 'degrees_north', 'degrees_east', 'K'],
                'rows': [['2025-01-01T09:00:00Z', 15, 65, 300.15], ['2025-01-02T09:00:00Z', 15, 65, None]]}})
    mock_http(monkeypatch, handler)
    path = '/api/oceanography/erddap/sst?lat=15&lon=65&days=2'
    data = client.get(path).json()
    assert data['count'] == 1
    assert data['data'][0]['sst_celsius'] == pytest.approx(27)
    assert data['provenance']['dataset_version'] == '04.1'
    cached = client.get(path).json()
    assert cached['provenance']['cached'] is True
    assert cached['provenance']['retrieved_at'] == data['provenance']['retrieved_at']
    assert len(calls) == 1

def test_obis_filter_and_empty_results(client, monkeypatch):
    def handler(request):
        assert request.url.params['size'] == '2'
        assert request.url.params['geometry'].startswith('POLYGON')
        assert 'bbox' not in request.url.params
        return httpx.Response(200, json={'results': []})
    mock_http(monkeypatch, handler)
    response = client.get('/api/biodiversity/obis?bbox=64,14,66,16&limit=2')
    assert response.status_code == 200
    assert response.json()['status'] == 'no_data'

def test_worms_exact_lookup(client, monkeypatch):
    def handler(request):
        assert request.url.path.endswith('/AphiaRecordsByName/Thunnus albacares')
        assert request.url.params['like'] == 'false'
        return httpx.Response(200, json=[{'scientificname': 'Thunnus albacares', 'AphiaID': 127027, 'valid_AphiaID': 127027}])
    mock_http(monkeypatch, handler)
    response = client.get('/api/taxonomy/resolve?name=Thunnus%20albacares')
    assert response.status_code == 200
    assert response.json()['results'][0]['aphia_id'] == 127027

@pytest.mark.parametrize('status,expected', [(429, 503), (500, 503), (403, 503), (404, 502)])
def test_upstream_http_errors(client, monkeypatch, status, expected):
    mock_http(monkeypatch, lambda request: httpx.Response(status, text='private upstream diagnostic'))
    response = client.get('/api/biodiversity/obis?bbox=64,14,66,16')
    assert response.status_code == expected
    assert 'private' not in response.text

def test_timeout_and_invalid_payload(client, monkeypatch):
    def handler(request):
        raise httpx.ReadTimeout('private diagnostic', request=request)
    mock_http(monkeypatch, handler)
    assert client.get('/api/biodiversity/obis?bbox=64,14,66,16').status_code == 504

def test_invalid_payload_is_not_no_data(client, monkeypatch):
    mock_http(monkeypatch, lambda request: httpx.Response(200, json={'error': 'bad'}))
    assert client.get('/api/biodiversity/obis?bbox=64,14,66,16').status_code == 502

def test_search_partial_failure(client, monkeypatch):
    assert client.post('/api/argo/observations', json=OBS, headers=AUTH).status_code == 201
    async def failure(*args):
        raise HTTPException(504, {'source': 'OBIS', 'code': 'timeout'})
    monkeypatch.setattr(search, 'get_obis', failure)
    response = client.get('/api/search/?lat=15&lon=65&datasets=argo,biodiversity')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'partial'
    assert data['total'] == 1
    assert data['errors']

def test_search_does_not_call_itself_over_http(client, monkeypatch):
    async def sst(*args):
        return {'data': [{'latitude': 15, 'longitude': 65, 'sst_celsius': 27}], 'provenance': {'source': 'test-fixture'}}
    monkeypatch.setattr(search, 'get_sst', sst)
    data = client.get('/api/search/?lat=15&lon=65&datasets=oceanography').json()
    assert data['total'] == 1
    assert data['status'] == 'ok'

def test_missing_protected_data(client, monkeypatch, tmp_path):
    from app.api import protected_areas
    monkeypatch.setattr(protected_areas, 'DATA_FILE', tmp_path / 'missing.geojson')
    response = client.get('/api/conservation/protected?lat=15&lon=65')
    assert response.json()['status'] == 'unavailable'

def test_cache_clear_requires_key(client):
    assert client.post('/api/cache/clear').status_code == 401
    assert client.post('/api/cache/clear', headers=AUTH).status_code == 200


def test_utc_filter_and_radius_geometry(client):
    for patch in ({}, {'float_id': 'outside', 'latitude': 16}):
        assert client.post('/api/argo/observations', json={**OBS, **patch}, headers=AUTH).status_code == 201
    data = client.get('/api/search/?lat=15&lon=65&radius=50&datasets=argo').json()
    assert data['total'] == 1
    params = {'lat_min': 14, 'lat_max': 17, 'lon_min': 64, 'lon_max': 66,
              'start': '2025-01-01T05:30:00+05:30', 'end': '2025-01-01T05:30:00+05:30'}
    assert len(client.get('/api/oceanography/argo', params=params).json()) == 2
    params['start'] = '2025-01-01'
    assert client.get('/api/oceanography/argo', params=params).status_code == 422


def test_all_sources_fail(client, monkeypatch):
    async def failure(*args):
        raise HTTPException(503, 'Unavailable')
    monkeypatch.setattr(search, 'get_obis', failure)
    monkeypatch.setattr(search, 'get_sst', failure)
    data = client.get('/api/search/?lat=15&lon=65&datasets=biodiversity,oceanography').json()
    assert data['status'] == 'unavailable'
    assert len(data['errors']) == 2
    assert data['results'] == []


def test_worms_no_content(client, monkeypatch):
    mock_http(monkeypatch, lambda request: httpx.Response(204))
    data = client.get('/api/taxonomy/resolve?name=Unknown').json()
    assert data['status'] == 'no_data'


def test_invalid_payload_is_not_cached(client, monkeypatch):
    calls = []
    def handler(request):
        calls.append(request)
        return httpx.Response(200, json={'error': 'bad'} if len(calls) == 1 else {'results': []})
    mock_http(monkeypatch, handler)
    path = '/api/biodiversity/obis?bbox=64,14,66,16'
    assert client.get(path).status_code == 502
    assert client.get(path).json()['status'] == 'no_data'
    assert len(calls) == 2


def test_rate_limit(monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.middleware import RateLimitMiddleware
    isolated = FastAPI()
    isolated.add_middleware(RateLimitMiddleware)
    @isolated.get('/api/test')
    def endpoint():
        return {'ok': True}
    monkeypatch.setattr(settings, 'rate_limit_per_minute', 2)
    with TestClient(isolated) as client:
        assert client.get('/api/test').status_code == 200
        assert client.get('/api/test').status_code == 200
        response = client.get('/api/test')
        assert response.status_code == 429
        assert int(response.headers['Retry-After']) > 0


def test_cli_imports_are_atomic_and_skip_duplicates(client, monkeypatch, tmp_path):
    from ingestion import argo, fisheries
    from pydantic import ValidationError
    monkeypatch.setattr(argo, 'SessionLocal', search.SessionLocal)
    monkeypatch.setattr(fisheries, 'SessionLocal', search.SessionLocal)
    path = tmp_path / 'observations.csv'
    path.write_text('float_id,latitude,longitude,observation_time\ntest,15,65,2025-01-01T00:00:00Z\n')
    assert argo.ingest_argo(path) == 1
    assert argo.ingest_argo(path) == 0
    path.write_text('region,year,landings,type\nIndia,2025,0,state\n')
    assert fisheries.ingest(path) == 1
    assert fisheries.ingest(path) == 0
    assert client.get('/api/fisheries/landings').json()[0]['landings'] == 0
    path.write_text('region,year,landings,type\nIndia,2024,12,state\nIndia,2023,-10,state\n')
    with pytest.raises(ValidationError):
        fisheries.ingest(path)
    assert len(client.get('/api/fisheries/landings').json()) == 1


def test_database_failure_does_not_leak_credentials(client, monkeypatch):
    import app.main as main
    from sqlalchemy.exc import OperationalError
    def fail():
        raise OperationalError('SELECT secret', {}, Exception('password=private'))
    monkeypatch.setattr(main.engine, 'connect', fail)
    response = client.get('/ready')
    assert response.status_code == 503
    assert 'private' not in response.text
    assert 'secret' not in response.text


def test_protected_polygon_intersection_not_centroid(client, monkeypatch, tmp_path):
    import json
    from app.api import protected_areas
    path = tmp_path / 'areas.geojson'
    # A large polygon encloses the query even though its centroid is far away.
    feature = {'type': 'Feature', 'properties': {'NAME': 'test fixture'},
               'geometry': {'type': 'Polygon', 'coordinates': [[[64,14],[80,14],[80,30],[64,30],[64,14]]]}}
    path.write_text(json.dumps({'type': 'FeatureCollection', 'features': [feature]}))
    monkeypatch.setattr(protected_areas, 'DATA_FILE', path)
    data = client.get('/api/conservation/protected?lat=15&lon=65&radius=10').json()
    assert data['count'] == 1
