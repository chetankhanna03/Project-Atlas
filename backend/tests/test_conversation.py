import asyncio
import pytest
from app.ai.schemas import ChatRequest, Scope, Turn
from app.ai.conversation import is_conversation, converse, Reply
from app.ai import provider


@pytest.mark.parametrize('message,expected', [
    ('Hi', True), ('Tell me about oceans', True), ('Explain biodiversity', True), ('How do fisheries work?', True), ('Are they dying?', True), ('What is a marine heatwave?', True),
    ('Find papers about marine heatwaves', False), ('Show SST at latitude 15 longitude 65', False),
    ('Give sources for that', False),
])
def test_auto_routing(message, expected):
    assert is_conversation(ChatRequest(message=message)) is expected


def test_research_selection_wins():
    assert not is_conversation(ChatRequest(message='Explain this', document_ids=['paper']))
    assert not is_conversation(ChatRequest(message='Are they dying?', answer_mode='research'))
    assert is_conversation(ChatRequest(message='Explain this', answer_mode='conversation', document_ids=['paper']))


def test_history_scope_and_no_false_citations(monkeypatch):
    async def generate(system, payload):
        assert payload['history'][0]['content'] == 'Tell me about fish sightings'
        assert payload['selected_scope']['region'] == 'Arabian Sea'
        assert 'mortality' in system
        return 'Sightings alone cannot establish mortality. [E1]'
    monkeypatch.setattr(provider, 'chat_text', generate)
    request = ChatRequest(message='Are they dying?', context=Scope(region='Arabian Sea'),
                          history=[Turn(role='user',content='Tell me about fish sightings')])
    response = asyncio.run(converse(request))
    assert response.mode == 'conversation'
    assert response.plan.scope.region == 'Arabian Sea'
    assert not response.citations and '[E1]' not in response.answer


def test_outage_and_greeting(monkeypatch):
    async def unavailable(*args):
        raise provider.ModelUnavailable()
    monkeypatch.setattr(provider, 'chat_text', unavailable)
    assert asyncio.run(converse(ChatRequest(message='Hello'))).status == 'ok'
    response = asyncio.run(converse(ChatRequest(message='Are they dying?')))
    assert response.status == 'unavailable'
    assert 'cannot reach' in response.answer
