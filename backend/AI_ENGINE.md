# Atlas AI engine

## What runs

`FloatChat -> POST /api/chat -> LangGraph planner -> selected domain agents -> evidence -> cited answer`

The graph runs only selected agents in parallel, joins their results, then
composes one answer. No model can run arbitrary Python, SQL, Cypher or HTTP tools.
The application owns the connector allowlist, validation, budgets and timeouts.
Chat history is supplied per request and is not persisted or shared across users.

| Component | Implemented behavior |
| --- | --- |
| Planner | Schema-constrained model planning; limited rule planner if unavailable; bounded geographic/date context and follow-ups |
| Ocean agent | ERDDAP SST; Coriolis GDAC temperature/salinity profiles with QC and pressure context; local historical fallback for the legacy SST path; actual SST chart values |
| Fisheries agent | GFW AIS apparent fishing effort; separate region/date/species-filtered imported landings with unverified provenance |
| Biodiversity agent | OBIS/GBIF occurrence samples, WoRMS taxonomy and IUCN assessment summaries; unsupported eDNA filters are reported |
| Research agent | Curated scientific passages, hybrid retrieval, OpenAlex abstracts, graph-linked documents and explicitly labelled NASA/NOAA dataset discovery |
| Answer composer | Model-generated cited claims or clearly labelled evidence-only extracts; known-citation and numeric-support checks; failures fall back to evidence |
| Knowledge graph | Sources, documents, evidence, explicit species/location mentions, measured parameters and periods; request-local graph plus optional Neo4j persistence |

## Model configuration

Marine source credentials and routing are documented in [SOURCES.md](SOURCES.md).

Add these values to **backend/.env** (preserve existing database configuration):

```dotenv
LLM_PROVIDER=openrouter
LLM_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_API_KEY=your-private-key
LLM_TIMEOUT_SECONDS=90
AI_TIMEOUT_SECONDS=200
EMBEDDING_PROVIDER=auto
EMBEDDING_MODEL=gemini-embedding-001
```

The selected chat model uses OpenRouter's `/api/v1/chat/completions` endpoint.
The free Nemotron endpoint does not enforce `response_format`; Atlas supplies
the schema in its instruction and validates returned JSON with Pydantic. Invalid,
truncated, refused or rate-limited responses fall back to rule planning and/or
evidence-only answers. No automatic paid-model fallback or repeated retries are
configured. Tool calls returned by the provider are not executed. A normal
question can use two chat calls (planner and synthesis). No live model calls have
been made without your key. The free provider logs usage; use permitted public
data and research text rather than confidential documents.

Chat and embeddings are independent. `EMBEDDING_PROVIDER=auto` follows Gemini or
Ollama when used for chat, and disables embeddings for OpenRouter. Document import
and lexical retrieval still work. For semantic retrieval with Nemotron chat, set
`EMBEDDING_PROVIDER=gemini` plus `GEMINI_API_KEY` and a compatible embedding model,
or `EMBEDDING_PROVIDER=ollama` plus an installed 768-dimensional embedding model.
Existing vectors keep their provider/model identity; changing only the chat model
does not require reindexing when the embedding provider/model remains the same.

Gemini chat remains available with `LLM_PROVIDER=gemini`,
`LLM_MODEL=gemini-2.5-flash` and `GEMINI_API_KEY`.

Model names are configurable. Choose a model available to your account; provider
availability and lifecycle can change. No key is required to use rule planning,
live public data retrieval, document keyword search, or evidence-only answers.
`GET /api/ai/status` reports configuration, not a guarantee of provider connectivity.
Keys never go into frontend environment variables or chat messages.

For locally installed Ollama models:

```dotenv
LLM_PROVIDER=ollama
LLM_MODEL=your-installed-chat-model
EMBEDDING_MODEL=embeddinggemma
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

Ollama models must be installed separately. The embedding model must return
768 dimensions. All vectors are validated and normalized; model/dimension
identities are stored with each chunk. Switching providers or embedding models
requires reindexing existing documents. No synthetic/hash embeddings are used.

Restart the backend after changing configuration. The local launcher continues
to use SQLite at `backend/atlas-local.db` and initializes the new research tables.

## Knowledge library / RAG

### Local embeddings for supplied PDFs

This workspace now uses `EMBEDDING_PROVIDER=local` and
`EMBEDDING_MODEL=BAAI/bge-base-en-v1.5` (768 dimensions, CPU). Model weights are
downloaded once to `backend/.embedding-cache`; paper text is embedded locally.
No new API key is needed. Chat synthesis still sends selected passages to the
configured chat provider when you ask a question.

Import a folder of PDFs into the **local launcher database** with:

```powershell
.venv/Scripts/python scripts/index_papers.py "C:\path\to\papers"
```

The importer keeps original page numbers and DOI citations, splitting long papers
into labelled parts. It writes `paper-index-report.json` with the imported IDs.
Tables/figures are not interpreted visually; PDF text extraction has that limit.
The shared library is readable by all users of this local application.

Set `ADMIN_API_KEY` on the backend to permit document management. The FloatChat
library panel accepts PDF/TXT/Markdown with a title, source URL and license.
Its access-key field is in-memory only, not saved to localStorage. Imports form
a **shared curated library**, not a private per-user upload area.

Pipeline:

1. Extract text (PDF page numbers preserved; scanned PDFs need external OCR).
2. Split into 220-word chunks with 40-word overlap.
3. Optionally embed with the configured provider; batches contain at most 32 chunks.
4. Persist document metadata and chunks in the application database.
5. Search with cosine similarity and lexical term matching, combined by reciprocal-rank fusion.
6. Return diverse passages (maximum two per document) with titles, authors, year,
   DOI, source URL, license, page and chunk IDs.

Limits: 4 MB per uploaded file, 100 PDF pages, 120,000 extracted characters,
200 chunks per document, and 5,000 chunks in the default library. Imports are
atomic; duplicate content from the same URL is not inserted twice. Reindexing
replaces embeddings only after all batches succeed. Deleted documents are
excluded from retrieval even if old graph references remain.

With PostgreSQL, chunks use native `vector(768)` and pgvector cosine queries.
`python -m app.init_db` explicitly enables the `vector` extension and creates
missing tables; the database account needs permission to enable that extension.
With SQLite, vectors are stored as JSON and cosine-ranked in Python. Lexical
ranking scans the bounded corpus in either case; this is an MVP-sized library,
not an unbounded scientific search engine. There is no automatic bulk harvesting.

Embedding is opt-in in the UI. When enabled with a cloud provider, document
text is sent to that provider. Chat synthesis also sends selected source passages
and the question to the configured model. Use documents you are permitted to
process and share. Source URLs are attribution only; the importer does not fetch
arbitrary URLs.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/ai/status` | Provider and feature configuration |
| `POST /api/chat` | Planned retrieval and cited answer |
| `GET /api/research/documents` | Shared library metadata |
| `POST /api/research/documents` | Admin-authenticated JSON text import |
| `POST /api/research/documents/upload` | Admin-authenticated multipart PDF/TXT/Markdown import |
| `POST /api/research/documents/{id}/reindex` | Admin-authenticated embedding rebuild |
| `DELETE /api/research/documents/{id}` | Admin-authenticated deletion with chunks |
| `GET /api/research/search?q=...` | Inspect retrieved passages without generating an answer |

Example chat body:

```json
{
  "message": "Which species have been observed in the Arabian Sea?",
  "history": [],
  "context": null,
  "document_ids": [],
  "use_literature_search": false
}
```

The response contains `answer`, `mode`, `status`, `plan`, `agents`, `claims`,
`citations`, `limitations`, `visualizations`, and `knowledge_graph`. Reuse
`plan.scope` as the next request's `context` for follow-ups. Supply selected
document IDs to restrict library retrieval; an unknown ID never widens the search.

## Optional literature discovery

```dotenv
OPENALEX_ENABLED=true
OPENALEX_API_KEY=your-private-key
```

Enable **Search OpenAlex abstracts** in FloatChat. Searches request at most five
works and reconstruct available abstracts. Missing abstracts and retracted
works are skipped. Results are not automatically imported, and are labelled
abstract-only; the system never claims to have read a full paper from metadata.

## Optional Neo4j

```dotenv
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-private-password
NEO4J_DATABASE=neo4j
```

Initialize its unique-ID constraint explicitly:

```powershell
.venv/Scripts/python -m app.ai.init_graph
```

Configured Neo4j stores evidence relationships after retrieval. Later questions
can use explicit region/species mentions to find related document IDs and retrieve
their passages. Parameterized queries are fixed in code. A Neo4j outage does not
block the answer: each response includes its own evidence graph regardless.
The graph is an index of provenance and mentions, not a causal ecological model.
Remove/expire historical graph data according to your deployment's retention policy.

## Scientific and operational limits

- Citation/number validation is **not semantic entailment verification**. An LLM
  can still misinterpret a source; scientific answers require review.
- Point SST samples are not regional means, climate trends, or marine-heatwave
  classifications. Short-series summaries are arithmetic over retrieved values.
- Sources are not yet statistically joined across location/time. Cross-domain
  answers provide separately attributed evidence, not correlation or causation.
- No calibrated forecasting, biomass prediction, universal eDNA feed or complete
  species-inventory claim is implemented.
- Temperature/salinity and explicit ARGO requests use date-matched GDAC profiles;
  see [Argo setup](ARGO_GDAC.md). Historical SST still uses the legacy local path;
  current SST is never silently substituted for the requested historical period.
- The rule planner recognizes a limited vocabulary, three coarse sea regions,
  selected Indian administrative regions, and explicit `latitude X, longitude Y`.
  The model improves language understanding but cannot invent coordinates.
- Chat budget: four concurrent requests per process; the selected local configuration uses a 200-second total deadline,
  no recursive autonomous tool loops. Existing API rate limits still apply.
- Provider schemas and pgvector query generation are tested offline; actual
  OpenRouter/Gemini/Ollama, PostgreSQL/pgvector and Neo4j services require configured credentials
  and separate live validation. No paid model calls were made during development.

## Tests and reference contracts

```powershell
# Backend
.venv/Scripts/python -m pytest -q
# From frontend/
npm run lint
npm test
npm run build
```

Tests cover agent selection, multi-source partial failures, no-data/clarification,
historical scope, document CRUD, text imports, retrieval isolation, embeddings,
reindexing, invalid citations/numbers, provider contracts, graph failure, deadlines,
UI context, cancellation, errors and safe source links. Test documents are
explicit fixtures, not scientific evidence, and are not seeded into your library.

Implementation references:
- [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [Gemini structured content](https://ai.google.dev/api/generate-content) and [embeddings](https://ai.google.dev/api/embeddings)
- [Ollama chat](https://docs.ollama.com/api/chat) and [embeddings](https://docs.ollama.com/api/embed)
- [pgvector SQLAlchemy integration](https://github.com/pgvector/pgvector-python)
- [Neo4j async driver](https://neo4j.com/docs/python-manual/current/concurrency/)
- [OpenAlex authentication](https://help.openalex.org/api/authentication/)
