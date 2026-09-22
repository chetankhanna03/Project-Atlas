import asyncio
import json
from datetime import date
import httpx
import pytest
from app.config import settings
from app.services import integrations as sources, copernicus
from app.ai import agents, planner
from app.ai.schemas import ChatRequest


def transport(monkeypatch,handler):
    original=httpx.AsyncClient
    monkeypatch.setattr(httpx,'AsyncClient',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))


def test_source_status_hides_secrets_and_reports_pending(client,monkeypatch):
    monkeypatch.setattr(settings,'gfw_api_key','private-test-key')
    response=client.get('/api/sources')
    assert 'private-test-key' not in response.text
    by_id={row['id']:row for row in response.json()['sources']}
    assert by_id['gfw']['status']=='configured'
    assert by_id['copernicus']['status']=='needs_credentials'
    assert by_id['wdpa']['status']=='needs_product_selection'


@pytest.mark.parametrize('path',[
    '/api/fisheries/effort?bbox=60,5,65,10',
    '/api/conservation/iucn?species=Thunnus%20albacares',
    '/api/oceanography/copernicus?latitude=15&longitude=65'])
def test_credentials_required_without_network(client,path):
    assert client.get(path).status_code==503


def test_gfw_contract_and_zero_effort(client,monkeypatch):
    monkeypatch.setattr(settings,'gfw_api_key','test-key')
    calls=[]
    def handler(req):
        calls.append(req)
        assert req.headers['authorization']=='Bearer test-key'
        assert req.url.params['spatial-aggregation']=='true'
        assert req.url.params['date-range']=='2025-01-01,2025-01-03'
        assert json.loads(req.content)['geojson']['coordinates'][0]==[[60,5],[65,5],[65,10],[60,10],[60,5]]
        return httpx.Response(200,json={'entries':[{'public-global-fishing-effort:v3':[{'date':'2025-01-01','flag':'IND','hours':0},{'date':'2025-01-02','flag':'IND','hours':3.5}]}]})
    transport(monkeypatch,handler)
    url='/api/fisheries/effort?bbox=60,5,65,10&start=2025-01-01&end=2025-01-02'
    result=client.get(url).json()
    assert result['status']=='ok' and result['total_apparent_fishing_hours']==3.5
    assert len(result['results'])==2
    assert 'test-key' not in json.dumps(result)
    assert client.get(url).json()['provenance']['cached']
    assert len(calls)==1


@pytest.mark.parametrize('upstream,expected',[(401,503),(429,503),(500,503)])
def test_gfw_failure_no_leaked_upstream_body(client,monkeypatch,upstream,expected):
    monkeypatch.setattr(settings,'gfw_api_key','secret-key')
    transport(monkeypatch,lambda request:httpx.Response(upstream,json={'error':'secret-key'}))
    response=client.get('/api/fisheries/effort?bbox=60,5,65,10')
    assert response.status_code==expected
    assert 'secret-key' not in response.text


def test_gfw_invalid_report_is_not_zero_catch(client,monkeypatch):
    monkeypatch.setattr(settings,'gfw_api_key','test')
    transport(monkeypatch,lambda request:httpx.Response(200,json={'entries':[{'hours':-1,'date':'2025-01-01'}]}))
    assert client.get('/api/fisheries/effort?bbox=60,5,65,10&start=2025-01-01&end=2025-01-01').status_code==502
    assert client.get('/api/fisheries/effort?bbox=60,5,65,10&start=2020-01-01&end=2025-01-01').status_code==422


def test_gbif_dates_provenance_and_bounds(client,monkeypatch):
    def handler(req):
        assert req.url.params['eventDate']=='2025-01-01,2025-01-31'
        assert req.url.params['hasGeospatialIssue']=='false'
        return httpx.Response(200,json={'results':[{'key':42,'scientificName':'Thunnus albacares','decimalLatitude':15,
            'decimalLongitude':65,'eventDate':'2025-01-12','datasetKey':'fixture','license':'CC0','basisOfRecord':'HUMAN_OBSERVATION'}]})
    transport(monkeypatch,handler)
    data=client.get('/api/biodiversity/gbif?bbox=60,5,75,25&start=2025-01-01&end=2025-01-31').json()
    assert data['results'][0]['license']=='CC0'
    assert data['results'][0]['url']=='https://www.gbif.org/occurrence/42'


def test_nasa_discovery_is_metadata_in_chat(client,monkeypatch):
    transport(monkeypatch,lambda req:httpx.Response(200,json={'feed':{'entry':[{'id':'C123-PODAAC','title':'Test SST collection','summary':'Synthetic metadata fixture.'}]}}))
    data=client.post('/api/chat',json={'message':'Find NASA datasets about SST'}).json()
    assert data['status']=='ok'
    assert data['plan']['domains']==['research']
    assert data['citations'][0]['kind']=='metadata'
    assert 'Dataset discovery only' in data['answer']


def test_iucn_scopes_and_not_found(client,monkeypatch):
    monkeypatch.setattr(settings,'iucn_api_key','test')
    def handler(req):
        assert req.url.params['genus_name']=='Thunnus'
        assert req.url.params['species_name']=='albacares'
        return httpx.Response(200,json={'assessments':[{'assessment_id':123,'latest':True,'year_published':'2021',
            'red_list_category_code':'LC','scopes':[{'code':'1','description':{'en':'Global'}}]}]})
    transport(monkeypatch,handler)
    data=client.get('/api/conservation/iucn?species=Thunnus%20albacares').json()
    assert data['results'][0]['scopes'][0]['code']=='1'
    assert data['results'][0]['year_published']=='2021'
    assert client.get('/api/conservation/iucn?species=tuna').status_code==422


def test_copernicus_boundaries_and_real_values(client,monkeypatch):
    monkeypatch.setattr(settings,'copernicusmarine_service_username','test-user')
    monkeypatch.setattr(settings,'copernicusmarine_service_password','test-secret')
    async def worker(payload):
        assert payload['variables']==['uo','vo']
        return {'status':'ok','results':[{'time':'2025-01-01T12:00:00Z','latitude':15,'longitude':65,'depth_m':0.5,'uo':0.2,'vo':-0.1}],
                'units':{'uo':'m/s','vo':'m/s'}}
    monkeypatch.setattr(copernicus,'run_worker',worker)
    response=client.get('/api/oceanography/copernicus?latitude=15&longitude=65&parameter=currents&start=2025-01-01&end=2025-01-02')
    assert response.status_code==200
    assert response.json()['results'][0]['vo']==-0.1
    assert 'test-secret' not in response.text
    assert client.get('/api/oceanography/copernicus?latitude=15&longitude=65&start=2025-01-01&end=2025-12-31').status_code==422


def test_copernicus_worker_subsets_before_loading(monkeypatch):
    import numpy as np
    import xarray as xr
    import copernicusmarine
    from app.services.copernicus_worker import retrieve
    fixture=xr.Dataset({'thetao':(('time','latitude','longitude','depth'),np.array([25,26]).reshape(2,1,1,1))},
        coords={'time':np.array(['2025-01-01','2025-01-02'],dtype='datetime64[ns]'),'latitude':[15.0],'longitude':[65.0],'depth':[0.5]})
    fixture.thetao.attrs['units']='degree_Celsius'
    def open_dataset(**kwargs):
        assert kwargs['minimum_longitude']==kwargs['maximum_longitude']==65
        return fixture
    monkeypatch.setattr(copernicusmarine,'open_dataset',open_dataset)
    result=retrieve({'dataset_id':'fixture','variables':['thetao'],'username':'x','password':'y','latitude':15,'longitude':65,
                     'start':'2025-01-02','end':'2025-01-02','depth':0})
    assert len(result['results'])==1 and result['results'][0]['thetao']==26


@pytest.mark.parametrize('question,domain',[
    ('Show fishing effort in Arabian Sea','fisheries'),('Show GBIF occurrences in Arabian Sea','biodiversity'),
    ('IUCN status of Thunnus albacares','biodiversity'),('Find NASA SST datasets','research'),
    ('Show Copernicus currents at latitude 15, longitude 65','ocean')])
def test_source_intent(question,domain):
    assert domain in planner.rule_plan(ChatRequest(message=question)).domains


def test_gfw_chat_uses_effort_and_chart(client,monkeypatch):
    monkeypatch.setattr(settings,'gfw_api_key','test')
    transport(monkeypatch,lambda req:httpx.Response(200,json={'entries':[{'public-global-fishing-effort:v3':[{'date':'2025-01-01','hours':2,'flag':'IND'}]}]}))
    data=client.post('/api/chat',json={'message':'Show fishing effort in Arabian Sea from 2025-01-01 to 2025-01-02'}).json()
    assert data['citations'][0]['source']=='Global Fishing Watch'
    assert data['visualizations'][0]['unit']=='hours'
    assert data['visualizations'][0]['points'][0]['value']==2


def test_iucn_chat_and_no_assessment_not_least_concern(client,monkeypatch):
    monkeypatch.setattr(settings,'iucn_api_key','test')
    transport(monkeypatch,lambda req:httpx.Response(404))
    data=client.post('/api/chat',json={'message':'IUCN status of Thunnus albacares'}).json()
    assert data['status']=='no_data'
    assert data['citations']==[]


def test_copernicus_chat_keeps_model_label_and_chart(client,monkeypatch):
    monkeypatch.setattr(settings,'copernicusmarine_service_username','u')
    monkeypatch.setattr(settings,'copernicusmarine_service_password','p')
    async def worker(payload):
        return {'status':'ok','results':[{'time':'2025-01-01T12:00:00Z','latitude':15,'longitude':65,'depth_m':0.5,'uo':0.2,'vo':-0.1}],
                'units':{'uo':'m/s','vo':'m/s'}}
    monkeypatch.setattr(copernicus,'run_worker',worker)
    data=client.post('/api/chat',json={'message':'Show Copernicus currents at latitude 15, longitude 65 from 2025-01-01 to 2025-01-02'}).json()
    assert data['status']=='ok'
    assert 'model' in data['citations'][0]['source']
    assert len(data['visualizations'])==2


def test_copernicus_cancel_kills_worker(monkeypatch):
    class Process:
        returncode=None
        killed=False
        async def communicate(self,payload):
            raise asyncio.CancelledError()
        def kill(self):
            self.killed=True
        async def wait(self):
            self.returncode=-1
    process=Process()
    async def spawn(*args,**kwargs):
        return process
    monkeypatch.setattr(asyncio,'create_subprocess_exec',spawn)
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(copernicus.run_worker({}))
    assert process.killed


def test_requested_day_window_preserved():
    from app.ai.schemas import Scope
    start,end=agents.requested_dates(Scope(), 'Show fishing over the last 30 days')
    assert (end-start).days==29


def test_noaa_invalid_catalog_is_error(client,monkeypatch):
    transport(monkeypatch,lambda req:httpx.Response(200,json={'table':{'columnNames':['Title'],'rows':[{}]}}))
    assert client.get('/api/discovery/noaa?q=temperature').status_code==502
