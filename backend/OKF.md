# Atlas OKF knowledge path

Google Open Knowledge Format is a portable Markdown/YAML convention, not a model
or a replacement for the retrieve-and-ground architecture. Atlas now defaults to
`KNOWLEDGE_RETRIEVAL=okf`: local BM25 ranking over structured research-passage
concepts, preserving document IDs, DOI/source links, licenses and original pages.
No embedding or cloud call is needed for candidate discovery or bundle creation.
FloatChat then reranks up to 32 candidates using the cached local embedding model,
question/passage similarity, paper-topic similarity and definition intent. It
rejects low scores and redundant passages and sends at most four to synthesis.
Synthesis still uses the configured LLM and may send selected passages to that provider.

The SQL paper library is authoritative. Concepts are generated from current
records, so imports and deletions are immediately reflected. Reference-list and
short fragments are filtered. This is an extracted passage bundle, not a set of
human-reviewed scientific conclusions. No verification or superiority claim is made.

- `GET /api/research/okf`: current engine and concept counts.
- `GET /api/research/okf/bundle`: portable ZIP, with root/paper indexes, linked
  Markdown concept files and OKF 0.2 source/generated metadata.
- `GET /api/research/search?q=...`: searches through the selected knowledge path.
- `KNOWLEDGE_RETRIEVAL=hybrid`: restores the previous vector + lexical path.

Existing vectors are preserved. New OKF imports skip embedding generation.
Local reranking requires the configured FastEmbed-compatible EMBEDDING_MODEL and
its cached weights. A missing model causes explicit abstention, not an unfiltered
keyword fallback. Scores and thresholds are retrieval heuristics, not scientific
confidence. RERANK_MIN_SCORE and RERANK_SCORE_MARGIN can be tuned against labelled
queries; current defaults were checked with the local marine research library.

DEVELOPMENT_MODE=true exposes per-request candidate scores, selected/discarded
passages, final cited sources, answer and validation attempts in the chat JSON.
The Vite development UI shows a collapsed diagnostics panel. Keep this off on
public servers: diagnostics contain the retrieved passages. No diagnostic logs
are persisted. Quantity/citation checks are not a complete entailment proof.
Invalid model claims are repaired once, then rejected; raw literature extracts
are not substituted for an answer.
The original PDFs stay outside the repository. Bundles include paper excerpts;
retain source licenses and do not publish them without the necessary rights.

Reference specification: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md

## Scientific modules

`/api/science/records/edna` and `/api/science/records/otolith` store validated,
source-attributed sample metadata. GET is shared-library read access. POST requires
the existing ADMIN_API_KEY; writes stay disabled if none is configured. Import
an object with `records`, max 100, using the fields shown in the frontend.
The local launcher initializes the new table. Shared databases require normal
schema provisioning before use. DNA validation is IUPAC syntax only; morphology
ratios derive only from submitted measurements. Neither implies species detection.

`POST /api/science/compare` computes Pearson r on supplied unique-date pairs.
At least three pairs are required. Constant variables return no coefficient.
Spatial alignment, sampling effort, confounders and autocorrelation are not
validated or adjusted. This is descriptive exploration, not an inference model.
