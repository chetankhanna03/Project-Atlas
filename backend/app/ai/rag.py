"""Persistent document chunks, genuine embeddings and explicit lexical fallback."""
import hashlib
import math
import re
from collections import Counter
from datetime import timezone
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, defer
from starlette.concurrency import run_in_threadpool
from app.database import SessionLocal
from app.config import settings
from app.ai.models import ResearchDocument, ResearchChunk
from app.ai.schemas import DocumentInput, Evidence
from app.ai import provider

STOP = set('the a an of on in to and or for with is are was were what which how does do show me find about that this it from by as at can'.split())


def tokens(text):
    return [token for token in re.findall(r'[a-z]{3,}', text.lower()) if token not in STOP]


def chunk_pages(pages):
    result = []
    for page, text in pages:
        words = re.findall(r'\S+', text)
        for start in range(0, len(words), 180):
            part = ' '.join(words[start:start+220])
            if part:
                result.append((page, part))
            if start + 220 >= len(words):
                break
    if not result or len(result) > 200:
        raise ValueError('Document must contain extractable text and at most 200 chunks.')
    return result


def document_identity(metadata, chunks):
    canonical = '\n'.join(text for _, text in chunks)
    digest = hashlib.sha256(canonical.encode()).hexdigest()
    document_id = hashlib.sha256((str(metadata.source_url) + '\n' + digest).encode()).hexdigest()
    return document_id, digest


def existing_document(document_id):
    with SessionLocal() as db:
        existing = db.get(ResearchDocument, document_id)
        if existing:
            embedded = all(chunk.embedding_model == provider.embedding_key() for chunk in existing.chunks)
            return {'id': document_id, 'title': existing.title, 'chunks': len(existing.chunks), 'status': 'already_indexed',
                    'retrieval_mode': 'vector_and_lexical' if embedded else 'lexical'}
    return None


def save_document(metadata, chunks, vectors):
    document_id, digest = document_identity(metadata, chunks)
    with SessionLocal.begin() as db:
        existing = db.get(ResearchDocument, document_id)
        if existing:
            embedded = all(chunk.embedding_model == provider.embedding_key() for chunk in existing.chunks)
            return {'id': document_id, 'title': existing.title, 'chunks': len(existing.chunks), 'status': 'already_indexed',
                    'retrieval_mode': 'vector_and_lexical' if embedded else 'lexical'}
        count = db.scalar(select(func.count()).select_from(ResearchChunk))
        if count + len(chunks) > settings.rag_max_chunks:
            raise ValueError('Knowledge library chunk limit reached. Delete unused documents before importing more.')
        document = ResearchDocument(id=document_id, title=metadata.title, source_url=str(metadata.source_url),
                                    authors=metadata.authors, year=metadata.year, doi=metadata.doi,
                                    license=metadata.license, content_hash=digest)
        db.add(document)
        db.flush()
        for index, (page, text) in enumerate(chunks):
            db.add(ResearchChunk(id=f'{document_id}:{index}', document_id=document_id, ordinal=index, page=page, text=text,
                                 embedding=vectors[index] if vectors else None,
                                 embedding_model=provider.embedding_key() if vectors else None))
    return {'id': document_id, 'title': metadata.title, 'chunks': len(chunks), 'status': 'indexed',
            'retrieval_mode': 'vector_and_lexical' if vectors else 'lexical'}


async def ingest(metadata: DocumentInput, pages=None):
    chunks = chunk_pages(pages or [(None, metadata.text)])
    existing = await run_in_threadpool(existing_document, document_identity(metadata, chunks)[0])
    if existing:
        return {**existing, 'limitations': ['Existing document preserved. Use reindex to rebuild its embeddings.']}
    vectors, warnings = [], []
    if metadata.use_embeddings and provider.model_enabled():
        try:
            for start in range(0, len(chunks), 32):
                vectors.extend(await provider.embed([text for _, text in chunks[start:start+32]]))
        except provider.ModelUnavailable:
            vectors = []
            warnings.append('Embedding provider unavailable; document indexed for lexical retrieval only. Reindex when available.')
    else:
        warnings.append('Document indexed for lexical retrieval; embeddings were not requested or no model is configured.')
    result = await run_in_threadpool(save_document, metadata, chunks, vectors)
    return {**result, 'limitations': warnings}


def retrieve(query, document_ids, vector, limit=6):
    query_terms = set(tokens(query))
    with SessionLocal() as db:
        statement = select(ResearchChunk).options(joinedload(ResearchChunk.document))
        if db.bind.dialect.name == 'postgresql':
            statement = statement.options(defer(ResearchChunk.embedding))
        if document_ids:
            statement = statement.where(ResearchChunk.document_id.in_(document_ids))
        # Library is bounded at import; fetching embeddings is only needed for SQLite.
        chunks = db.scalars(statement.order_by(ResearchChunk.id).limit(settings.rag_max_chunks)).all()
        if not chunks:
            return [], 'empty'
        frequency = Counter(term for chunk in chunks for term in set(tokens(chunk.text)))
        lexical = []
        for chunk in chunks:
            terms = Counter(tokens(chunk.text))
            score = sum(math.log(1 + len(chunks)/(1+frequency[t])) * min(terms[t], 3) for t in query_terms if terms[t])
            if score:
                lexical.append((score, chunk))
        lexical.sort(key=lambda item: (-item[0], item[1].id))
        semantic = []
        if vector is not None:
            if db.bind.dialect.name == 'postgresql':
                distance = ResearchChunk.embedding.cosine_distance(vector)
                ranked = statement.where(ResearchChunk.embedding_model == provider.embedding_key(),
                                         ResearchChunk.embedding.is_not(None), distance < 0.65).order_by(distance).limit(20)
                semantic = [(1, chunk) for chunk in db.scalars(ranked).all()]
            else:
                for chunk in chunks:
                    if chunk.embedding_model == provider.embedding_key() and chunk.embedding is not None:
                        score = sum(a*b for a,b in zip(vector, chunk.embedding))
                        if score >= 0.35:
                            semantic.append((score, chunk))
                semantic.sort(key=lambda item: (-item[0], item[1].id))
        scores, candidates = {}, {}
        for ranking in (lexical[:20], semantic[:20]):
            for rank, (_, chunk) in enumerate(ranking):
                scores[chunk.id] = scores.get(chunk.id, 0) + 1/(60+rank+1)
                candidates[chunk.id] = chunk
        evidence = []
        per_document = Counter()
        for chunk_id in sorted(scores, key=lambda key: (-scores[key], key)):
            chunk = candidates[chunk_id]
            if per_document[chunk.document_id] >= 2:
                continue
            per_document[chunk.document_id] += 1
            doc = chunk.document
            evidence.append(Evidence(id='R-' + chunk_id, domain='research', title=doc.title, text=chunk.text,
                                      source='Curated knowledge library', url=doc.source_url, kind='literature',
                                      document_id=doc.id, page=chunk.page, authors=doc.authors, year=doc.year, doi=doc.doi,
                                      retrieved_at=doc.created_at.replace(tzinfo=timezone.utc).isoformat(),
                                      metadata={'license': doc.license, 'chunk': chunk.ordinal, 'retrieval': 'hybrid' if semantic else 'lexical'}))
            if len(evidence) >= limit:
                break
        return evidence, 'hybrid' if semantic else 'lexical'


async def search(query, document_ids=None, limit=6):
    vector, warnings = None, []
    def has_chunks():
        with SessionLocal() as db:
            statement = select(ResearchChunk.id)
            if document_ids:
                statement = statement.where(ResearchChunk.document_id.in_(document_ids))
            return db.scalar(statement.limit(1)) is not None
    if not await run_in_threadpool(has_chunks):
        return [], 'empty', []
    if provider.model_enabled():
        try:
            vector = (await provider.embed([query], query=True))[0]
        except provider.ModelUnavailable:
            warnings.append('Semantic retrieval unavailable; used lexical matching.')
    evidence, mode = await run_in_threadpool(retrieve, query, document_ids or [], vector, limit)
    if mode == 'lexical':
        warnings.append('Lexical retrieval used; relevance is not a scientific confidence score.')
    return evidence, mode, warnings


def list_documents():
    with SessionLocal() as db:
        docs = db.scalars(select(ResearchDocument).order_by(ResearchDocument.created_at.desc()).limit(500)).all()
        return [{'id': doc.id, 'title': doc.title, 'source_url': doc.source_url, 'year': doc.year,
                 'authors': doc.authors, 'license': doc.license, 'chunks': len(doc.chunks),
                 'embedded_chunks': sum(chunk.embedding_model == provider.embedding_key() for chunk in doc.chunks)} for doc in docs]


async def reindex(document_id):
    def load():
        with SessionLocal() as db:
            return [(chunk.id, chunk.text) for chunk in db.scalars(select(ResearchChunk).where(ResearchChunk.document_id == document_id).order_by(ResearchChunk.ordinal)).all()]
    chunks = await run_in_threadpool(load)
    if not chunks:
        raise ValueError('Document not found.')
    vectors = []
    for start in range(0, len(chunks), 32):
        vectors.extend(await provider.embed([text for _,text in chunks[start:start+32]]))
    def save():
        with SessionLocal.begin() as db:
            for (chunk_id, _), vector in zip(chunks, vectors):
                chunk = db.get(ResearchChunk, chunk_id)
                if chunk is None:
                    raise ValueError('Document was removed during reindexing.')
                chunk.embedding, chunk.embedding_model = vector, provider.embedding_key()
    await run_in_threadpool(save)
    return {'id': document_id, 'embedded_chunks': len(chunks)}
