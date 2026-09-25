import asyncio
import json
import httpx
import pytest
from app.ai import provider
from app.ai.schemas import Plan
from app.config import settings


def configure(monkeypatch):
    monkeypatch.setattr(settings,'llm_provider','openrouter')
    monkeypatch.setattr(settings,'llm_model','nvidia/nemotron-3-ultra-550b-a55b:free')
    monkeypatch.setattr(settings,'openrouter_api_key','test-private-key')
    monkeypatch.setattr(settings,'embedding_provider','auto')


def test_openrouter_request_and_schema(monkeypatch):
    configure(monkeypatch)
    async def post(url,body,headers):
        assert url=='https://openrouter.ai/api/v1/chat/completions'
        assert headers['Authorization']=='Bearer test-private-key'
        assert body['model'].endswith(':free')
        assert 'response_format' not in body and 'tools' not in body
        assert 'properties' in body['messages'][0]['content']
        assert 'test-private-key' not in json.dumps(body)
        return {'choices':[{'finish_reason':'stop','message':{'content':'{"domains":["ocean"]}','reasoning':'not part of answer'}}]}
    monkeypatch.setattr(provider,'post_json',post)
    assert asyncio.run(provider.generate('plan',{'question':'SST'},Plan)).domains==['ocean']


@pytest.mark.parametrize('finish,content', [('length','{}'),('stop','not JSON'),('stop','{"domains":["invented"]}'),('tool_calls','{}'),('stop',None)])
def test_bad_or_truncated_answers_fail_closed(monkeypatch,finish,content):
    configure(monkeypatch)
    async def post(*args):
        return {'choices':[{'finish_reason':finish,'message':{'content':content}}]}
    monkeypatch.setattr(provider,'post_json',post)
    with pytest.raises(provider.ModelUnavailable):
        asyncio.run(provider.generate('plan',{},Plan))


def test_embeddings_are_independent(monkeypatch):
    configure(monkeypatch)
    assert provider.model_enabled()
    assert not provider.embeddings_enabled()
    with pytest.raises(provider.ModelUnavailable):
        asyncio.run(provider.embed(['paper']))
    monkeypatch.setattr(settings,'embedding_provider','gemini')
    monkeypatch.setattr(settings,'gemini_api_key','test-embedding-key')
    assert provider.embeddings_enabled()
    assert provider.embedding_key().startswith('gemini:')
    monkeypatch.setattr(settings,'openrouter_api_key',None)
    assert not provider.model_enabled() and provider.embeddings_enabled()


def test_rate_limit_sanitized_without_retries(monkeypatch):
    configure(monkeypatch)
    calls=[]
    def handler(request):
        calls.append(request)
        return httpx.Response(429,json={'error':'test-private-key'})
    original=httpx.AsyncClient
    monkeypatch.setattr(httpx,'AsyncClient',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))
    with pytest.raises(provider.ModelUnavailable) as caught:
        asyncio.run(provider.generate('plan',{},Plan))
    assert 'test-private-key' not in str(caught.value)
    assert len(calls)==1


def test_missing_key_status_and_retrieval(client,monkeypatch):
    monkeypatch.setattr(settings,'llm_provider','openrouter')
    data=client.get('/api/ai/status').json()
    assert data['model_configured'] is False
    assert data['embeddings_configured'] is False
    assert 'openrouter_api_key' not in data
    assert client.post('/api/chat',json={'message':'Hello'}).json()['mode']=='evidence_only'
