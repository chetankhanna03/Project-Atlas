"""Offline end-to-end orchestration contract; fixtures are not live-provider proof."""
from fastapi import HTTPException
from app.ai import agents, provider
from app.ai.schemas import Evidence, GeneratedAnswer, Claim, Plan


QUESTION='What oceanographic, biodiversity and fisheries information is available for the Arabian Sea, and what does the scientific literature say about marine heatwaves in this region?'


def test_four_domains_optional_sst_failure_citations_graph(client,monkeypatch):
    async def profiles(*args):
        return {'source':'ARGO fixture','doi':'fixture','profiles':[{'float_id':'TEST','cycle':1,'time':'2020-01-01T00:00:00Z',
            'latitude':15,'longitude':65,'parameter':'temperature','unit':'degree_Celsius','variable':'TEMP',
            'levels':[{'pressure_dbar':5,'value':25}], 'url':'https://example.org/argo', 'retrieved_at':'2020-01-02T00:00:00Z','source_last_updated':None}],
            'limitations':[],'errors':[],'status':'ok'}
    async def sst(*args):raise HTTPException(504,{'source':'SST','code':'timeout'})
    async def obis(*args):
        return {'results':[{'scientific_name':'Fixture species','latitude':15,'longitude':65,'event_date':'2020-01-01','aphia_id':None}],
                'limitations':[],'provenance':{'url':'https://example.org/obis'}}
    async def effort(*args):
        return {'status':'ok','results':[{'date':'2020-01-01','apparent_fishing_hours':10}],
                'total_apparent_fishing_hours':10,'query':{},'provenance':{'url':'https://example.org/gfw'},'limitations':[]}
    async def papers(*args,**kwargs):
        return [Evidence(id='R1',domain='research',kind='literature',title='Fixture document',source='Fixture journal',
            document_id='fixture',page=2,doi='fixture',text='Marine heatwaves are prolonged periods of unusually warm seawater.')], 'fixture', []
    monkeypatch.setattr(agents,'get_profiles',profiles);monkeypatch.setattr(agents,'get_sst',sst)
    monkeypatch.setattr(agents,'get_obis',obis);monkeypatch.setattr(agents.integrations,'fishing_effort',effort)
    monkeypatch.setattr(agents.rag,'search',papers)
    monkeypatch.setattr(provider,'model_enabled',lambda:True)
    async def generate(system,payload,schema):
        if schema is Plan:return Plan(domains=['research']) # Incorrect model must not erase coverage.
        item=next(e for e in payload['evidence'] if e['kind']=='literature')
        return GeneratedAnswer(claims=[Claim(text=item['text'],evidence_ids=[item['id']])])
    monkeypatch.setattr(provider,'generate',generate)
    result=client.post('/api/chat',json={'message':QUESTION}).json()
    assert result['status']=='partial'
    assert {a['domain'] for a in result['agents']}=={'ocean','biodiversity','fisheries','research'}
    assert next(a for a in result['agents'] if a['domain']=='ocean')['status']=='partial'
    assert any('timed out' in note for note in result['limitations'])
    assert result['claims'] and result['mode']=='model'
    assert {'source','evidence','document','species','location','parameter','time'} <= {n['kind'] for n in result['knowledge_graph']['nodes']}
    assert all(c['evidence_ids'][0] in {e['id'] for e in result['citations']} for c in result['claims'])
