import io
import json
import zipfile
from app.config import settings
from app.ai import provider

AUTH={'X-API-Key':'test-private-key'}


def test_okf_no_embeddings_and_deleted_documents_disappear(client, monkeypatch):
    monkeypatch.setattr(settings, 'knowledge_retrieval', 'okf')
    monkeypatch.setattr(settings, 'admin_api_key', 'test-private-key')
    async def forbidden(*args, **kwargs):
        raise AssertionError('OKF must not request embeddings')
    monkeypatch.setattr(provider, 'embed', forbidden)
    body={'title':'Synthetic test fixture', 'text':'Marine fish distributions vary with temperature and local habitat conditions. A range shift does not establish a change in total abundance.',
          'source_url':'https://example.org/paper', 'license':'test fixture'}
    response=client.post('/api/research/documents', json=body, headers=AUTH)
    assert response.status_code==201
    identifier=response.json()['id']
    result=client.get('/api/research/search?q=fish%20temperature').json()
    assert result['retrieval_mode']=='okf'
    assert result['results'][0]['url']==body['source_url']
    assert result['results'][0]['metadata']['trust']=='unverified'
    bundle=client.get('/api/research/okf/bundle')
    with zipfile.ZipFile(io.BytesIO(bundle.content)) as archive:
        assert 'index.md' in archive.namelist()
        document=archive.read(f'papers/{identifier}/passage-0.md').decode()
        assert 'type: "Research Passage"' in document and 'sources:' in document
        assert 'verified:' not in document
    assert client.delete('/api/research/documents/'+identifier, headers=AUTH).status_code==200
    assert client.get('/api/research/search?q=fish%20temperature').json()['results']==[]


def test_specimen_import_validates_and_persists_without_fake_classification(client, monkeypatch):
    monkeypatch.setattr(settings, 'admin_api_key', 'test-private-key')
    row={'record_id':'sample-1','source_url':'https://example.org/specimen','license':'test',
         'sampled_on':'2025-01-01','latitude':15,'longitude':65,'sequence':'acgtNN'}
    assert client.post('/api/science/records/edna',json={'records':[row]}).status_code==401
    assert client.post('/api/science/records/edna',json={'records':[{**row,'sequence':'INVALID'}]},headers=AUTH).status_code==422
    assert client.get('/api/science/records/edna').json()['count']==0
    response=client.post('/api/science/records/edna',json={'records':[row]},headers=AUTH)
    assert response.status_code==201 and response.json()['classification']=='not_performed'
    assert client.get('/api/science/records/edna').json()['records'][0]['data']['sequence_length']==6
    assert client.post('/api/science/records/edna',json={'records':[row]},headers=AUTH).status_code==409
    morph={k:v for k,v in row.items() if k!='sequence'}
    morph.update(length_mm=4,width_mm=2,area_mm2=5,perimeter_mm=10)
    assert client.post('/api/science/records/otolith',json={'records':[morph]},headers=AUTH).status_code==201
    assert client.get('/api/science/records/otolith').json()['records'][0]['data']['aspect_ratio']==2


def test_comparison_checks_alignment_constant_variables_and_nonfinite_values(client):
    payload={'x_label':'SST C','y_label':'Effort hours','spatial_scope':'test fixture only',
             'sources':['https://example.org/test'], 'pairs':[{'date':f'2025-01-0{i}','x':i,'y':i*2} for i in (1,2,3)]}
    response=client.post('/api/science/compare',json=payload)
    assert response.status_code==200 and response.json()['pearson_r']==1
    payload['pairs'][1]['date']='2025-01-01'
    assert client.post('/api/science/compare',json=payload).status_code==422
    payload['pairs'][1]['date']='2025-01-02'
    for pair in payload['pairs']: pair['x']=1
    assert client.post('/api/science/compare',json=payload).json()['pearson_r'] is None
    payload['pairs'][0]['x']='NaN'
    assert client.post('/api/science/compare',json=payload).status_code==422
