# Project Atlas demo

Start from this directory in two PowerShell terminals:

```powershell
.\backend\start-local.ps1
```

```powershell
cd frontend
npm run dev
```

Open http://localhost:3000. API readiness: http://127.0.0.1:8000/ready.

The explicit default `DATABASE_MODE=demo` uses `backend/atlas-local.db`, including
the existing research library. The launcher and direct Uvicorn use identical
settings and initialize/validate all registered tables before accepting requests.
Readiness reports database type, schema and counts without connection secrets.
Existing incompatible columns cause a schema error; no silent database fallback.

Equivalent direct command from `backend`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

PostgreSQL is opt-in: set `DATABASE_MODE=configured` and your `DATABASE_URL`.
This uses that database explicitly, including vector extension initialization;
it does not migrate or copy the demo library. Back up existing data before schema
migrations. Existing `.env` credentials are never overwritten by the launcher.

## Five-minute Codeathon walkthrough

1. **0:00–1:00 — Explore.** Select Arabian Sea, draw a rectangle, verify the four
   coordinates, select ARGO, OBIS and Fishing effort, then click **Load data**.
   Drawing itself sends no request. Use the preset again for reproducible full-region results.
2. **1:00–2:00 — Inspect coverage.** Open Source and coverage and observation
   records. Show observation timestamps versus retrieval timestamps. Click **Load
   more ARGO profiles** until at least three observation dates are represented.
   Recent OBIS queries can honestly return zero; never call those zeros abundance.
3. **2:00–2:45 — Analytics.** Generate the ARGO/GFW comparison. Explain the
   0–10 dbar sample rule, exact UTC-day join, sample size, spatial mismatch and
   descriptive-only correlation. With insufficient overlap, show the explicit refusal.
4. **2:45–3:45 — Biodiversity and graph.** For historical inventory, explicitly
   change dates to 1970-01-01 through 2020-12-31 and select OBIS only; load again.
   Open an observation in Biodiversity. Open Knowledge graph, click a reported
   taxon, then Resolve with WoRMS. These historical records are a separate query,
   not contemporary matches to the earlier ocean/fishing sample.
5. **3:45–5:00 — Ask Atlas.** Start a new conversation/clear historical area
   context, then submit the question below. Inspect all four agent statuses,
   citations, limitations and the latest-chat graph. Optional SST failure must
   retain ARGO evidence. The free model may exceed the allotted demo time;
   preload the answer when rehearsing and show its actual timestamps.

> What oceanographic, biodiversity and fisheries information is available for
> the Arabian Sea, and what does the scientific literature say about marine
> heatwaves in this region?

For dashboard-scoped chat, use **Ask Atlas about this area**; it preserves region,
bounds, dates, source selections and taxon. A recent-date biodiversity result may
be empty. Remove that constraint explicitly before asking for historical inventory.

## Repeatable checks

From `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
$env:HF_HUB_OFFLINE='1' # use already-installed local embedding weights
.\.venv\Scripts\python.exe -u scripts/check_demo.py
```

The default live script checks public providers, analysis, local RAG and a
public-data-only mixed-domain chat. It intentionally excludes private library
passages from external model calls. With explicit authorization to send selected
paper passages to your configured LLM, add `--include-library-llm`. The JSON report
is saved in `artifacts/demo-live.json`; do not mistake the default run for a full
paper-based model test. Offline mode needs the embedding weights already installed.
Enable `DEVELOPMENT_MODE=true` on the backend for support-validation diagnostics;
the live script treats missing validation diagnostics as unverified rather than passing.

From `frontend`, with both servers running:

```powershell
npm test
npm run lint
npm run build
node check-area-selection.mjs
node check-pagination.mjs
node check-domains.mjs
node check-demo.mjs
```

Drawing/pagination checks use fixtures; `check-demo.mjs` uses live providers,
opens an actual historical record, resolves a graph taxon and checks mobile layout.
No browser test sends private paper content to an external model automatically.

## Known limits and optional credentials

- CoastWatch/MUR SST timed out during live checks. Its adapter remains; failed SST
  does not erase ARGO. NASA/NOAA catalog discovery is not a replacement measurement feed.
- Free OpenRouter inference is variable. Unsupported/uncertain claims are withheld;
  readable, cited provider summaries may be shown when synthesis is unavailable.
  A model reviewer is fallible, not a proof of scientific correctness.
- ARGO discovery uses a local index; its age is disclosed. Refresh using the
  documented command in [ARGO_GDAC.md](backend/ARGO_GDAC.md) before a later demo.
- Analysis uses loaded samples supplied by the client, not a fresh independent
  source verification. No interpolation, abundance inference or causal claims.
- Copernicus needs its username/password; IUCN and optional OpenAlex need keys.
  Library/specimen writes require an admin key. Neo4j remains optional.
- BGC-Argo, sequence identification and otolith image classification remain
  intentionally unimplemented. No credentials or scientific observations are fabricated.

Detailed implementation and validation: [DEMO_REPORT.md](DEMO_REPORT.md).
