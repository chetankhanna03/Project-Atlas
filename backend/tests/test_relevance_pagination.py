import asyncio
from app.ai import rerank, engine, provider
from app.ai.schemas import Evidence, Claim, GeneratedAnswer, ChatRequest, Plan, AgentResult
from app.config import settings
from app.services import sources
from test_argo_gdac import index_fixture
from app.services import argo_gdac
from datetime import date
from app.ai import planner


def test_definition_queries_route_to_research_without_model(client):
    for query in ['What are marine heatwaves?', 'What is environmental DNA metabarcoding?', 'Define coastal upwelling']:
        plan = asyncio.run(planner.make_plan(ChatRequest(message=query)))
        assert plan.domains == ['research'] and not plan.clarification


def passage(id, text, title='Ocean temperature', doi=None):
    return Evidence(id=id,domain='research',kind='literature',title=title,text=text,source='test',doi=doi,page=2)


def test_semantic_selection_excludes_generic_overlap_and_duplicates():
    items = [passage('a','An ocean heat event is a prolonged period of anomalously warm water.',doi='one'),
             passage('b','An ocean heat event is a prolonged period of anomalously warm water.',doi='one'),
             passage('c','Marine DNA sampling uses sequencing and marine observation records.',title='DNA methods'),
             passage('d','Unusually warm seawater can affect ecological communities.',doi='two')]
    chosen, diagnostics = rerank.select('What are ocean heat events?',items,[(.9,.9),(.9,.9),(.53,.5),(.86,.8)])
    assert [i.id for i in chosen] == ['a','d']
    assert diagnostics[1]['reason'] == 'Redundant passage'
    assert not diagnostics[2]['selected']
    assert chosen[0].doi == 'one' and chosen[0].page == 2


def test_definition_preference_and_abstention_are_general():
    items=[passage('a','Coastal upwelling influences several monitoring stations.'),
           passage('b','Coastal upwelling is a process involving the upward movement of deeper water.')]
    chosen,_=rerank.select('What is coastal upwelling?',items,[(.8,.8),(.8,.8)])
    assert chosen[0].id == 'b'
    assert rerank.select('What is dark matter?',items,[(.35,.3),(.32,.3)])[0] == []


def test_semantic_failure_never_sends_unfiltered_passages(monkeypatch):
    def unavailable(*args): raise RuntimeError('offline')
    monkeypatch.setattr(rerank,'semantic_scores',unavailable)
    selected,diagnostics,notes=asyncio.run(rerank.rerank('scientific question',[passage('a','Some unrelated words.')]))
    assert not selected and notes and diagnostics[0]['relevance_score'] is None


def test_inline_markers_and_equivalent_quantities_validate():
    evidence=[passage('E1','Events persist for at least five days.')]
    claims=engine.normalize_claims([Claim(text='Events persist for at least 5 days. [E1]',evidence_ids=['E1'])])
    assert engine.grounded(claims,evidence)
    assert not engine.grounded([Claim(text='Events last 99 days.',evidence_ids=['E1'])],evidence)


def test_synthesis_returns_answer_and_development_diagnostics(client,monkeypatch):
    monkeypatch.setattr(settings,'development_mode',True)
    monkeypatch.setattr(provider,'model_enabled',lambda:True)
    calls=[]
    async def generate(system,payload,schema):
        calls.append(payload)
        return GeneratedAnswer(claims=[Claim(text='Events persist for at least five days. [E1]',evidence_ids=['E1'])])
    monkeypatch.setattr(provider,'generate',generate)
    result=asyncio.run(engine.synthesize(ChatRequest(message='What are heat events?'),Plan(domains=['research']),
        [AgentResult(domain='research',status='ok',evidence=[passage('a','Events persist for at least five days.')])]))
    assert result.answer == 'Events persist for at least five days. [E1]'
    assert result.diagnostics['citation_validation']['passed']
    assert len(result.diagnostics['final_sources_used']) == 1
    monkeypatch.setattr(settings,'development_mode',False)
    other=asyncio.run(engine.synthesize(ChatRequest(message='Unknown'),Plan(),[]))
    assert other.diagnostics is None


def test_obis_pagination_retains_total_and_forwards_cursor(client,monkeypatch):
    calls=[]
    async def fetch(name,url,params):
        calls.append(params)
        return {'total':201,'results':[{'id':'second' if params.get('after') else 'first','decimalLatitude':15,'decimalLongitude':65}]},{'source':'test'}
    monkeypatch.setattr(sources,'request_json',fetch)
    first=client.get('/api/biodiversity/obis?bbox=60,10,70,20&limit=1').json()
    second=client.get('/api/biodiversity/obis?bbox=60,10,70,20&limit=1&after='+first['next_cursor']).json()
    assert first['total_matching'] == second['total_matching'] == 201
    assert calls[1]['after'] == 'first' and second['results'][0]['record_id'] == 'second'


def test_argo_pages_have_real_matching_file_counts(tmp_path,monkeypatch):
    index_fixture(tmp_path,monkeypatch)
    args=((64,14,66,16),date(2025,1,1),date(2025,1,2),1)
    first,more,metadata=argo_gdac.select_profiles(*args)
    second,more2,metadata2=argo_gdac.select_profiles(*args,offset=1)
    assert more and not more2 and first[0]['file'] != second[0]['file']
    assert metadata['matching_files'] == metadata2['matching_files'] == 2
