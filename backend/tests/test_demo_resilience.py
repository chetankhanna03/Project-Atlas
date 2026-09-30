import asyncio
import pytest
from fastapi import HTTPException
from app.ai import agents
from app.ai.schemas import AgentResult, ChatRequest, Evidence, Plan, Scope
from app.ai import planner, provider


def test_explicit_historical_obis_scope_keeps_other_domain_dates(monkeypatch):
    async def obis(bounds,limit,species,after,start,end):
        assert start is None and end is None
        return {'results':[],'limitations':[]}
    monkeypatch.setattr(agents,'get_obis',obis)
    scope=Scope(bbox=(50,5,78,25),start_date='2026-09-01',end_date='2026-09-20',obis_period='all_time')
    result=asyncio.run(agents.biodiversity(Plan(scope=scope),ChatRequest(message='Show biodiversity')))
    assert scope.start_date.isoformat()=='2026-09-01'
    assert any('historical' in note for note in result.limitations)


def test_explicit_biodiversity_dates_override_previous_inventory_choice():
    plan=planner.rule_plan(ChatRequest(message='Show OBIS occurrences during 2020', context=Scope(obis_period='all_time')))
    assert plan.scope.obis_period=='selected'
    assert plan.scope.start_date.isoformat()=='2020-01-01'


def test_relative_dates_survive_ocean_provider_dispatch(monkeypatch):
    from datetime import datetime, timezone, timedelta
    async def retrieve(plan, request):
        assert request.message == 'ARGO'
        assert plan.scope.end_date == datetime.now(timezone.utc).date()
        assert plan.scope.start_date == plan.scope.end_date - timedelta(days=6)
        return AgentResult(domain='ocean',status='no_data')
    monkeypatch.setattr(agents,'ocean_source',retrieve)
    asyncio.run(agents.ocean(Plan(scope=Scope(bbox=(50,5,78,25),parameter='temperature')),
        ChatRequest(message='Show ARGO temperature in the last 7 days')))


def test_obis_upstream_dates(client, monkeypatch):
    from app.services import sources
    async def request(source, url, params):
        assert params['startdate'] == '2020-01-01'
        assert params['enddate'] == '2020-12-31'
        return {'results': [], 'total': 0}, {'source': 'OBIS'}
    monkeypatch.setattr(sources, 'request_json', request)
    result = client.get('/api/biodiversity/obis?bbox=50,5,78,25&start=2020-01-01&end=2020-12-31')
    assert result.status_code == 200
    assert result.json()['query']['date_filter'] == 'upstream'
    assert client.get('/api/biodiversity/obis?bbox=50,5,78,25&start=2021-01-01&end=2020-01-01').status_code == 422


def test_model_preserves_dashboard_scope(monkeypatch):
    scope = Scope(region='Arabian Sea', bbox=(60,10,65,15), start_date='2020-01-01',
                  end_date='2020-01-31', selected_datasets=['argo','obis'], species='Thunnus albacares')
    monkeypatch.setattr(provider, 'model_enabled', lambda: True)
    async def generate(*args):
        return Plan(domains=['research'])
    monkeypatch.setattr(provider, 'generate', generate)
    result = asyncio.run(planner.make_plan(ChatRequest(message='Show oceanographic and biodiversity information in the Arabian Sea', context=scope)))
    assert result.scope == scope


@pytest.mark.parametrize('question,domains', [
    ('Show oceanographic information', {'ocean'}),
    ('Show biodiversity occurrences', {'biodiversity'}),
    ('Show fishing effort', {'fisheries'}),
    ('Find literature about marine heatwaves', {'research'}),
    ('Show oceanographic and biodiversity information', {'ocean','biodiversity'}),
    ('Show oceanographic and fisheries information', {'ocean','fisheries'}),
    ('Show oceanographic, biodiversity and fisheries information', {'ocean','biodiversity','fisheries'}),
    ('What oceanographic, biodiversity and fisheries information is available for the Arabian Sea, and what does the scientific literature say about marine heatwaves in this region?', {'ocean','biodiversity','fisheries','research'}),
])
def test_domain_coverage(monkeypatch, question, domains):
    request = ChatRequest(message=question)
    monkeypatch.setattr(provider, 'model_enabled', lambda: False)
    assert set(asyncio.run(planner.make_plan(request)).domains) == domains
    monkeypatch.setattr(provider, 'model_enabled', lambda: True)
    async def wrong_model(*args):
        return Plan(domains=['research'])
    monkeypatch.setattr(provider, 'generate', wrong_model)
    assert set(asyncio.run(planner.make_plan(request)).domains) == domains


@pytest.mark.parametrize('argo,sst,expected', [
    ('ok', 'timeout', 'partial'), ('unavailable', 'ok', 'partial'),
    ('unavailable', 'timeout', 'unavailable'), ('no_data', 'no_data', 'no_data'),
    ('ok', 'auth', 'partial'),
])
def test_source_isolation(monkeypatch, argo, sst, expected):
    async def retrieve(plan, request):
        state = argo if request.message == 'ARGO' else sst
        if state in ('timeout', 'auth', 'unavailable'):
            raise HTTPException(504 if state == 'timeout' else 503,
                {'code': state, 'upstream_status': 401 if state == 'auth' else 503})
        return AgentResult(domain='ocean', status=state, evidence=[Evidence(id=request.message,
            domain='ocean', title='Fixture', source=request.message, text='Fixture observation.')] if state == 'ok' else [])
    monkeypatch.setattr(agents, 'ocean_source', retrieve)
    result = asyncio.run(agents.ocean(Plan(scope=Scope(region='Arabian Sea', bbox=(50,5,78,25))),
        ChatRequest(message='Show oceanographic information')))
    assert result.status == expected
    assert len(result.source_statuses) == 2
    assert len(result.evidence) == [argo, sst].count('ok')
    if sst == 'auth':
        assert result.source_statuses[1]['code'] == 'authentication_failure'
    if sst == 'timeout':
        assert result.source_statuses[1]['code'] == 'timeout'
