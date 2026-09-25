import asyncio
from app.ai import engine, planner, provider, rag
from app.ai.schemas import ChatRequest, Evidence, Claim, GeneratedAnswer, Plan, AgentResult


def test_general_explanation_needs_no_observation_scope():
    plan = asyncio.run(planner.make_plan(ChatRequest(message='How does fish population change with temp ?')))
    assert plan.domains == ['research']
    assert plan.clarification is None
    assert 'temperature' in plan.research_query


def test_general_followup_preserves_original_question():
    request = ChatRequest(message='in general', history=[
        {'role': 'user', 'content': 'How does fish population change with temp?'},
        {'role': 'assistant', 'content': 'Which species and region?'}])
    plan = asyncio.run(planner.make_plan(request))
    assert 'fish population' in plan.research_query
    assert plan.domains == ['research']
    assert plan.clarification is None


def test_specific_observations_are_not_general_explanations():
    assert not planner.general_explanation('Show temperature at latitude 15 longitude 65')
    assert not planner.general_explanation('Predict fish population in 2030')


def test_bibliography_and_short_fragments_are_not_research_findings():
    assert not rag.substantive_passage('Smith (2020). Warming fish. https://doi.org/a Jones (2021). Fish abundance. https://doi.org/b')
    assert not rag.substantive_passage('spatial distributions.')
    assert rag.substantive_passage('Fish distributions vary with temperature and local habitat conditions. These observations do not establish a universal population trend.')


def test_extractive_fallback_skips_fragments():
    evidence = Evidence(id='E1', domain='research', title='Test fixture', source='test', kind='literature',
        text='spatial distributions. Fish distributions vary with temperature and local habitat conditions rather than exhibiting a universal response.')
    claims = engine.extractive_claims([evidence], 'fish temperature')
    assert 'Fish distributions vary' in claims[0].text
    assert 'spatial distributions.' not in claims[0].text


def test_invalid_draft_is_repaired_without_weakening_checks(client, monkeypatch):
    monkeypatch.setattr(provider, 'model_enabled', lambda: True)
    calls = []
    async def generate(system, payload, schema):
        calls.append(payload)
        return GeneratedAnswer(claims=[Claim(text='Fish distributions vary with temperature.' + (' [E1]' if len(calls) == 1 else ''), evidence_ids=['E1'])])
    monkeypatch.setattr(provider, 'generate', generate)
    evidence = Evidence(id='R1', domain='research', title='Test fixture', source='test', kind='literature', text='Fish distributions vary with temperature.')
    result = asyncio.run(engine.synthesize(ChatRequest(message='How does temperature affect fish?'),
        Plan(domains=['research']), [AgentResult(domain='research', status='ok', evidence=[evidence])]))
    assert result.mode == 'model'
    assert len(calls) == 2
    assert result.answer.count('[E1]') == 1
