import asyncio
import io
import json
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import ValidationError
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from starlette.concurrency import run_in_threadpool
from app.config import settings
from app.security import require_admin
from app.database import SessionLocal
from app.ai.models import ResearchDocument, ResearchChunk
from app.ai.schemas import ChatRequest, ChatResponse, DocumentInput
from app.ai import engine, provider, rag, knowledge
from app.ai import okf
from fastapi.responses import Response

router = APIRouter(prefix='/api', tags=['AI / FloatChat'])
_active = 0


@router.get('/ai/status')
def ai_status():
    return {'provider': settings.llm_provider, 'model': settings.llm_model,
            'knowledge_retrieval': settings.knowledge_retrieval, 'okf_version': '0.2',
            'model_configured': provider.model_enabled(), 'embedding_model': settings.embedding_model,
            'embedding_provider': provider.embedding_provider(), 'embeddings_configured': provider.embeddings_enabled(),
            'embedding_dimensions': provider.DIMENSIONS, 'orchestrator': 'langgraph',
            'knowledge_graph_configured': knowledge.configured(),
            'agents': ['ocean', 'fisheries', 'biodiversity', 'research'],
            'literature_search_configured': settings.openalex_enabled and bool(settings.openalex_api_key),
            'note': 'Configured does not mean connectivity has been verified. Without a model, rule planning and lexical evidence retrieval remain available.'}


@router.post('/chat', response_model=ChatResponse)
async def chat(request: ChatRequest):
    global _active
    if _active >= settings.ai_max_concurrent:
        raise HTTPException(429, 'AI engine is busy; retry shortly.', headers={'Retry-After': '5'})
    _active += 1
    try:
        return await asyncio.wait_for(engine.chat(request), timeout=settings.ai_timeout_seconds)
    except asyncio.TimeoutError:
        raise HTTPException(504, 'AI request timed out. Try fewer domains or a narrower question.') from None
    finally:
        _active -= 1


@router.get('/research/documents')
def documents():
    records = rag.list_documents()
    return {'count': len(records), 'documents': records, 'scope': 'shared curated library'}


@router.get('/research/okf')
def knowledge_bundle_status():
    entries = okf.concepts()
    return {'format': 'OKF', 'version': '0.2', 'retrieval': settings.knowledge_retrieval,
            'concepts': len(entries), 'documents': len({e['metadata']['atlas']['document_id'] for e in entries}),
            'embeddings_required': False, 'human_verified': False}


@router.get('/research/okf/bundle')
def export_knowledge_bundle():
    return Response(okf.bundle(), media_type='application/zip',
                    headers={'Content-Disposition': 'attachment; filename="atlas-okf.zip"'})


@router.post('/research/documents', status_code=201, dependencies=[Depends(require_admin)])
async def ingest_document(document: DocumentInput):
    try:
        return await rag.ingest(document)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None


def extract_pdf(raw):
    try:
        reader = PdfReader(io.BytesIO(raw))
        if reader.is_encrypted or len(reader.pages) > 100:
            raise ValueError('PDF must be unencrypted with at most 100 pages.')
        pages, total = [], 0
        for number, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ''
            total += len(text)
            if total > 120000:
                raise ValueError('PDF text exceeds the 120,000 character limit.')
            pages.append((number, text))
        if total < 50:
            raise ValueError('No usable text found. Scanned PDFs need OCR before import.')
        return pages
    except (PdfReadError, KeyError, TypeError):
        raise ValueError('Invalid or unsupported PDF.') from None


@router.post('/research/documents/upload', status_code=201, dependencies=[Depends(require_admin)])
async def upload(file: UploadFile = File(...), title: str = Form(...), source_url: str = Form(...),
                 license: str = Form(...), authors: str = Form('[]'), year: int | None = Form(None),
                 doi: str | None = Form(None), use_embeddings: bool = Form(True)):
    raw = await file.read(4_000_001)
    if len(raw) > 4_000_000:
        raise HTTPException(413, 'Document limit is 4 MB.')
    try:
        if (file.filename or '').lower().endswith('.pdf'):
            pages = await run_in_threadpool(extract_pdf, raw)
        elif (file.filename or '').lower().endswith(('.txt', '.md')):
            pages = [(None, raw.decode('utf-8-sig'))]
        else:
            raise ValueError('Supported formats: PDF, UTF-8 TXT or Markdown.')
        metadata = DocumentInput(title=title, source_url=source_url, license=license, authors=json.loads(authors),
                                  year=year, doi=doi, use_embeddings=use_embeddings,
                                  text='\n'.join(text for _, text in pages))
        return await rag.ingest(metadata, pages)
    except (ValueError, ValidationError, UnicodeDecodeError):
        raise HTTPException(422, 'Document or metadata is invalid. Supply title, http(s) source URL, license and extractable text within the limits.') from None


@router.delete('/research/documents/{document_id}', dependencies=[Depends(require_admin)])
def delete_document(document_id: str):
    with SessionLocal.begin() as db:
        document = db.get(ResearchDocument, document_id)
        if not document:
            raise HTTPException(404, 'Document not found.')
        db.delete(document)
    return {'id': document_id, 'status': 'deleted'}


@router.post('/research/documents/{document_id}/reindex', dependencies=[Depends(require_admin)])
async def reindex(document_id: str):
    try:
        return await rag.reindex(document_id)
    except ValueError:
        raise HTTPException(404, 'Document not found or removed during indexing.') from None
    except provider.ModelUnavailable:
        raise HTTPException(503, 'Embedding provider unavailable; existing index was preserved.') from None


@router.get('/research/search')
async def search(q: str = Query(..., min_length=3, max_length=1000), limit: int = Query(6, ge=1, le=10)):
    evidence, mode, warnings = await rag.search(q, limit=limit)
    return {'results': evidence, 'retrieval_mode': mode, 'limitations': warnings}
