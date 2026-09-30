from copy import deepcopy
from app.services.cross_domain import LoadedComparison, analyze


def sample():
    query={'bbox':[50,5,78,25],'start':'2020-01-01','end':'2020-01-04'}
    return {'argo':{'query':query,'profiles':[{'float_id':str(i),'cycle':1,'latitude':15,'longitude':65,
        'time':f'2020-01-0{i}T00:00:00Z','parameter':'temperature','unit':'degree_Celsius',
        'url':'https://example.org/test-fixture','levels':[{'value':20+i,'pressure_dbar':5,'qc':'1','pressure_qc':'1'},
            {'value':2,'pressure_dbar':1000,'qc':'1','pressure_qc':'1'}]} for i in range(1,4)]},
        'gfw':{'query':query,'status':'ok','provenance':{'url':'https://example.org/test-effort','retrieved_at':'2020-02-01T00:00:00Z'},
            'results':[{'date':f'2020-01-0{i}','flag':'TEST','dataset':'fixture','apparent_fishing_hours':i*10} for i in range(1,5)]}}


def test_exact_join_no_zero_fill_and_shallow_sampling():
    result=analyze(LoadedComparison.model_validate(sample()))
    assert result['n']==3
    assert [p['x'] for p in result['pairs']]==[21,22,23]
    assert result['pearson_r']==1
    assert result['kind']=='computed'
    assert result['profiles_used']==3


def test_insufficient_and_mismatched_bounds():
    data=sample();data['argo']['profiles']=data['argo']['profiles'][:2]
    result=analyze(LoadedComparison.model_validate(data))
    assert result['message']=='Insufficient overlapping data for this analysis.'
    assert result['pearson_r'] is None
    data=deepcopy(sample());data['gfw']['query']['bbox']=[0,0,1,1]
    # The fixture's query is shared: assign a distinct query to exercise mismatch.
    data['argo']['query']={'bbox':[50,5,78,25],'start':'2020-01-01','end':'2020-01-04'}
    assert analyze(LoadedComparison.model_validate(data))['n']==0


def test_bad_qc_duplicates_and_partial_effort():
    data=sample();data['argo']['profiles']+=data['argo']['profiles'][:1]
    data['gfw']['results']+=data['gfw']['results'][:1]
    assert analyze(LoadedComparison.model_validate(data))['profiles_used']==3
    data['argo']['profiles'][0]['levels'][0]['qc']='4'
    assert analyze(LoadedComparison.model_validate(data))['n']==2
    data=sample();data['gfw']['status']='partial'
    assert analyze(LoadedComparison.model_validate(data))['pearson_r'] is None


def test_endpoint(client):
    result=client.post('/api/science/ocean-fisheries',json=sample())
    assert result.status_code==200
    assert result.json()['n']==3
