import asyncio
from app.ai import engine, support, provider
from app.ai.schemas import Claim, Evidence


def evidence(text, kind='observation'):
    return Evidence(id='E1', domain='ocean', source='Test fixture', title='Fixture', text=text, kind=kind)


def test_audit_mismatched_claim_regression():
    e=evidence('Temperature measurements were collected at several locations.')
    c=Claim(text='Marine fish are abundant everywhere.', evidence_ids=['E1'])
    assert support.local_check(c,[e])[0]=='UNSUPPORTED'
    assert not engine.grounded([c],[e])


def test_negated_claim_never_passes_exact_sentence_check():
    e=evidence('The study did not find that fish populations increased.')
    c=Claim(text='Fish populations increased.',evidence_ids=['E1'])
    assert not engine.grounded([c],[e])


def test_unrelated_extra_citation_is_not_approved_locally():
    first=evidence('Seawater temperature was measured.')
    other=Evidence(id='E2',domain='research',source='Fixture',title='Unrelated',text='DNA sequencing was performed.',kind='literature')
    claim=Claim(text=first.text,evidence_ids=['E1','E2'])
    assert not engine.grounded([claim],[first,other])


def test_kind_confusion_rejected():
    for text,kind in [('Atlas retrieved live observations today.','literature'),
                      ('The paper reports marine warming.','observation'),
                      ('Atlas calculated a Pearson correlation.','observation')]:
        e=evidence(text,kind)
        assert support.local_check(Claim(text=text,evidence_ids=['E1']),[e])[0]=='UNSUPPORTED'


def test_paraphrase_requires_independent_review_and_real_excerpt(monkeypatch):
    e=evidence('Unusually warm seawater persisted for five days.','literature')
    c=Claim(text='The seawater remained unusually warm for 5 days.',evidence_ids=['E1'])
    monkeypatch.setattr(provider,'model_enabled',lambda:True)
    async def approved(*args):
        return support.Reviews(reviews=[support.Review(index=0,status='SUPPORTED',reason='Same duration and subject.',excerpts={'E1':e.text})])
    monkeypatch.setattr(provider,'generate',approved)
    assert asyncio.run(support.verify([c],[e],engine.basic_grounded))[0]['status']=='SUPPORTED'
    async def invented(*args):
        return support.Reviews(reviews=[support.Review(index=0,status='SUPPORTED',reason='Claimed support',excerpts={'E1':'An invented supporting quote.'})])
    monkeypatch.setattr(provider,'generate',invented)
    assert asyncio.run(support.verify([c],[e],engine.basic_grounded))[0]['status']=='UNCERTAIN'


def test_reviewer_outage_fails_closed(monkeypatch):
    monkeypatch.setattr(provider,'model_enabled',lambda:True)
    async def offline(*args):
        raise provider.ModelUnavailable('offline')
    monkeypatch.setattr(provider,'generate',offline)
    c=Claim(text='Warm seawater remained for five days.',evidence_ids=['E1'])
    e=evidence('Unusually warm seawater persisted for five days.')
    assert asyncio.run(support.verify([c],[e],engine.basic_grounded))[0]['status']=='UNCERTAIN'
