# Atlas implementation report

The active project was extended in place. Existing integrations and `.env` secrets
were preserved. SQLite `backend/atlas-local.db` is the canonical demo database.

## Implemented

- Independent ocean-provider outcomes preserve ARGO through optional SST failures;
  source error codes distinguish timeout/authentication/unavailable/unsupported/no data.
- Deterministic mixed-domain coverage; explicit combined requests avoid an unnecessary
  model-planner call. Model stages have bounded deadlines and conservative fallbacks.
- OBIS upstream event-date filters, pagination and full dashboard-to-chat context.
- Consistent launcher/direct-Uvicorn startup, complete table initialization and
  schema checks; `/ready` exposes counts and database mode without secrets.
- Interactive request-local graph with typed nodes, source details, actual OBIS
  records, WoRMS lookup, zoom/pan/fit and bounded expansion. Optional Neo4j is labelled honestly.
- One ARGO/GFW descriptive analysis with QC/shallow-pressure filtering, exact daily
  overlap, bounding-box checks, units, sample size, provenance and explicit abstention.
- Per-claim SUPPORTED/UNSUPPORTED/UNCERTAIN checks. Exact source sentences are
  checked locally; paraphrases need separate model review and verifiable excerpts.
  Uncertain or unsupported claims are withheld. Observations/literature/computed results are distinguished.
- Explicit-only map loading and readable source status; removed 11 unused prototype
  data/UI files after checking references. No fake scientific values remain in active paths.

## Changed files

Backend: `app/ai/{agents,planner,schemas,engine,knowledge,support}.py`,
`app/services/{sources,cross_domain}.py`, `app/api/{biodiversity,science}.py`,
`app/{config,database,main}.py`, `start-local.ps1`, `scripts/check_demo.py`,
`.env.example`, README and regression tests.

Frontend: `App.tsx`, `types.ts`, `services/atlas.ts`,
`components/Views/{OceanWorkspace,FloatChatView,ChatEvidence,DomainViews,KnowledgeGraph}.tsx`,
graph/OBIS tests, browser scripts and README/workspace documentation.
Root: README, this report and artifact ignore rule.

Removed inactive files: `data/oceanData.ts`; old DatasetDetailModal, AboutView,
DashboardView, InteractiveMapView, AnalyticsView, LandingView, SettingsModal,
SupportModal, TopNav and SideNav. They had no active imports; Git retains history.

## Verification

- Backend: **160 tests passed**, including provider isolation, eight domain
  combinations, date/context propagation, schema mismatch, claim support,
  analysis and a fixture-based four-agent end-to-end test.
- Frontend: **14 tests passed**; TypeScript and production build passed.
- Browser: mouse/touch rectangle selection, explicit loading, paging beyond 100
  OBIS records, domain navigation/mobile layout, live records, graph taxon selection
  and WoRMS resolution passed. Pagination/drawing fixtures are separate from live checks.
- Live: ARGO, OBIS, GFW and WoRMS returned real results. Recent OBIS dates returned
  no records; an explicitly historical query returned records. One GFW timeout was
  followed by a successful bounded retry. MUR SST timed out and remained visibly unavailable.
- Live analysis: nine usable loaded ARGO profiles across three overlapping UTC dates
  (2026-09-18–20) with GFW effort. Pearson r approximately 0.798 was computed from
  that tiny sample; it is **not** a substantive ecological, trend or causal conclusion.
- Local RAG: 32 candidates reranked to four passages from two heatwave papers,
  retaining titles, DOI and page. No eDNA/RAG-method paper selected for the definition.
- Live public-only combined chat: all four agents ran; SST failed independently;
  cited observation summaries and 66 graph nodes were returned. Support validation
  passed on the final summaries. This used a conservative fallback because model
  synthesis/review was unavailable; it does not establish reliable free-model synthesis.
- Full private-paper-to-OpenRouter test: **pending explicit authorization** after
  an earlier automatic approval rejection. The default live check excludes those passages.

## Remaining limits

Full definition-of-done is not claimed while the final paper-based model test is
unverified. The free model can be slow/unavailable. MUR remains unreliable;
Copernicus credentials are absent. The local ARGO index predates the checks and
its warning is preserved. Local observation/landings/specimen tables are empty;
live provider results are served on demand. The research library retains 11 entries
and 674 passages. No PostgreSQL migration, BGC-Argo implementation, eDNA classifier
or otolith classifier was attempted. Neo4j is optional, not required by the graph.

Startup commands, optional credentials and the timed demo walkthrough are in
[README.md](README.md). Generated local evidence is in `artifacts/demo-live.json`
and `artifacts/knowledge-graph.png` (ignored by Git).
