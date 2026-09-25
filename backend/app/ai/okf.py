"""Local OKF v0.2 producer/consumer. No embedding or model calls.

The curated SQL library remains authoritative. Bundles are generated snapshots,
so deleted documents cannot remain searchable in a stale filesystem index.
"""
import io
import json
import math
import re
import zipfile
from collections import Counter, defaultdict
from datetime import timezone
from sqlalchemy import select
from sqlalchemy.orm import joinedload, defer
from starlette.concurrency import run_in_threadpool
from app.ai import rag
from app.ai.models import ResearchChunk
from app.ai.schemas import Evidence
from app.config import settings


def concepts(document_ids=None):
    with rag.SessionLocal() as db:
        query = select(ResearchChunk).options(joinedload(ResearchChunk.document), defer(ResearchChunk.embedding))
        if document_ids:
            query = query.where(ResearchChunk.document_id.in_(document_ids))
        rows = db.scalars(query.order_by(ResearchChunk.document_id, ResearchChunk.ordinal).limit(settings.rag_max_chunks)).all()
        result = []
        for chunk in rows:
            doc = chunk.document
            body = rag.clean_passage(chunk.text)
            if not rag.substantive_passage(body):
                continue
            stamp = doc.created_at.replace(tzinfo=timezone.utc).isoformat()
            path = f'papers/{doc.id}/passage-{chunk.ordinal}.md'
            metadata = {'type': 'Research Passage', 'title': doc.title,
                        'description': body[:200], 'resource': doc.source_url,
                        'tags': ['marine-science', 'literature'],
                        'sources': [{'id': 'paper', 'resource': doc.source_url, 'title': doc.title}],
                        'generated': {'by': 'process:atlas-okf-export', 'at': stamp},
                        'atlas': {'document_id': doc.id, 'chunk_id': chunk.id, 'page': chunk.page,
                                  'doi': doc.doi, 'authors': doc.authors, 'year': doc.year,
                                  'license': doc.license, 'indexed_at': stamp}}
            result.append({'path': path, 'metadata': metadata, 'body': body})
        return result


def markdown(concept):
    # JSON values are valid YAML values; quoting prevents metadata injection.
    front = '\n'.join(f'{key}: {json.dumps(value, ensure_ascii=False)}' for key, value in concept['metadata'].items())
    return f'---\n{front}\n---\n# Source passage\n\n{concept["body"]}\n\n[^paper]: {concept["metadata"]["resource"]}\n\n[Paper index](index.md)\n'


def bundle():
    entries = concepts()
    stream = io.BytesIO()
    by_document = defaultdict(list)
    with zipfile.ZipFile(stream, 'w', zipfile.ZIP_DEFLATED) as archive:
        for item in entries:
            archive.writestr(item['path'], markdown(item))
            by_document[item['metadata']['atlas']['document_id']].append(item)
        root = ['# Atlas scientific knowledge', '', 'OKF v0.2. Extracted passages; no human verification asserted.', '']
        for doc_id, items in by_document.items():
            title = items[0]['metadata']['title'].replace('[', '(').replace(']', ')')
            root.append(f'- [{title}](papers/{doc_id}/index.md)')
            links = [f'# {title}', '', *[f'- [Passage {i["metadata"]["atlas"]["chunk_id"].split(":")[-1]} / page {i["metadata"]["atlas"]["page"]}]({i["path"].split("/")[-1]})' for i in items]]
            archive.writestr(f'papers/{doc_id}/index.md', '\n'.join(links))
        archive.writestr('index.md', '\n'.join(root))
    return stream.getvalue()


def retrieve(query, document_ids=None, limit=6):
    entries = concepts(document_ids)
    terms = set(rag.tokens(query))
    if not entries:
        return [], 'empty', []
    corpus = [Counter(rag.tokens(item['body'])) for item in entries]
    frequency = Counter(term for counts in corpus for term in counts)
    average = sum(sum(counts.values()) for counts in corpus) / len(corpus)
    scored = []
    for item, counts in zip(entries, corpus):
        length = sum(counts.values())
        score = sum(math.log(1 + (len(corpus)-frequency[t]+.5)/(frequency[t]+.5)) *
                    (counts[t]*2.2)/(counts[t]+1.2*(.25+.75*length/max(average,1)))
                    for t in terms if counts[t])
        if score:
            scored.append((score, item))
    scored.sort(key=lambda pair: (-pair[0], pair[1]['path']))
    evidence, per_paper = [], Counter()
    for _, item in scored:
        meta = item['metadata']; origin = meta['atlas']
        key = origin['doi'] or origin['document_id']
        if per_paper[key] >= (8 if limit > 6 else 2):
            continue
        per_paper[key] += 1
        evidence.append(Evidence(id='OKF-' + origin['chunk_id'], domain='research',
            title=meta['title'], text=item['body'], source='Atlas OKF knowledge bundle',
            url=meta['resource'], document_id=origin['document_id'], page=origin['page'],
            authors=origin['authors'], year=origin['year'], doi=origin['doi'], kind='literature',
            retrieved_at=origin['indexed_at'], metadata={'okf_concept': item['path'][:-3],
            'okf_version': '0.2', 'trust': 'unverified', 'retrieval': 'okf_bm25', 'license': origin['license']}))
        if len(evidence) >= limit:
            break
    return evidence, 'okf', ['OKF candidate discovery uses keyword ranking; FloatChat applies local semantic selection before synthesis.']


async def search(query, document_ids=None, limit=6):
    return await run_in_threadpool(retrieve, query, document_ids, limit)
