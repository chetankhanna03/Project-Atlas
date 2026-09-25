"""Local semantic selection. Scores are relevance heuristics, not confidence."""
import re
from collections import Counter
from functools import lru_cache
import numpy as np
from starlette.concurrency import run_in_threadpool
from app.ai.local_embeddings import embed_local
from app.config import settings


@lru_cache(maxsize=512)
def passage_vector(model, text):
    return embed_local([text])[0]


def semantic_scores(query, candidates):
    vector = np.asarray(embed_local([query], query=True)[0])
    def similarity(text):
        other = np.asarray(passage_vector(settings.embedding_model, text))
        return float(np.dot(vector, other) / max(np.linalg.norm(vector)*np.linalg.norm(other), 1e-12))
    return [(similarity(item.title + '\n' + item.text), similarity(item.title)) for item in candidates]


def words(text):
    return set(re.findall(r'[a-z]{3,}', text.lower()))


def select(query, candidates, scores, limit=4):
    definition = bool(re.match(r'\s*(what (?:is|are)|define|explain the (?:term|concept))\b', query, re.I))
    ranked, diagnostics = [], []
    for item, (semantic, topic) in zip(candidates, scores):
        defines = bool(re.search(r'\b(?:defined as|refers? to|is (?:an?|the)|are (?:periods|events|episodes|a|the)|definition|characteri[sz]ed by)\b', item.text, re.I))
        score = .85*semantic + .15*topic + (.045 if definition and defines else 0)
        row = {'candidate_id': item.id, 'title': item.title, 'doi': item.doi, 'page': item.page,
               'passage': item.text, 'metadata': dict(item.metadata), 'semantic_score': round(semantic,4),
               'topic_score': round(topic,4), 'relevance_score': round(score,4), 'definitional': defines,
               'selected': False, 'reason': ''}
        diagnostics.append(row)
        ranked.append((score, semantic, item, row))
    ranked.sort(key=lambda entry: -entry[0])
    best = ranked[0][0] if ranked else 0
    selected, counts = [], Counter()
    for score, semantic, item, row in ranked:
        if semantic < settings.rerank_min_score or score < best - settings.rerank_score_margin:
            row['reason'] = 'Low semantic/question relevance'
            continue
        key = item.doi or item.document_id or item.url or item.title
        tokens = words(item.text)
        duplicate = any(len(tokens & words(old.text)) / max(1,len(tokens | words(old.text))) > .65 for old in selected)
        if duplicate:
            row['reason'] = 'Redundant passage'
        elif counts[key] >= 2:
            row['reason'] = 'Source coverage already sufficient'
        elif len(selected) >= limit:
            row['reason'] = 'Outside synthesis evidence budget'
        else:
            row.update(selected=True, reason='Selected for semantic relevance' + (' and definition' if definition and row['definitional'] else ''))
            item.metadata.update(relevance_score=row['relevance_score'], semantic_score=row['semantic_score'], reranker='local_dense_topic_intent')
            selected.append(item)
            counts[key] += 1
    return selected, diagnostics


async def rerank(query, candidates):
    if not candidates:
        return [], [], []
    try:
        scores = await run_in_threadpool(semantic_scores, query, candidates)
    except Exception:
        # Do not silently revert to generic keyword matches when semantic selection fails.
        return [], [{'candidate_id': c.id, 'title': c.title, 'doi': c.doi, 'page': c.page,
                     'passage': c.text, 'relevance_score': None, 'selected': False,
                     'reason': 'Local semantic model unavailable'} for c in candidates], ['Semantic relevance model unavailable; no unfiltered passages were sent to synthesis.']
    selected, diagnostics = select(query, candidates, scores)
    return selected, diagnostics, []
