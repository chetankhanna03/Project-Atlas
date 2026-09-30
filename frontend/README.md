# Project Atlas frontend

React, TypeScript and Vite ocean workspace. Active views use API records and explicit
empty/unavailable states. Confirmed unused prototype observations, fake API/DOI
fallbacks, simulated settings and obsolete navigation were removed.

## Run locally

1. Start the backend with `backend/start-local.ps1` from the repository root.
2. In `frontend/`, run `npm install` and `npm run dev`.
3. Open http://localhost:3000 and select FloatChat.

The Vite `/api` proxy points to http://127.0.0.1:8000. For production, configure
an equivalent same-origin reverse proxy. Put model keys only in `backend/.env`;
the browser does not call model providers directly.

FloatChat supports cited evidence, real retrieved-value charts, follow-up context,
cancellation, selected document retrieval and administrator document imports.
Conversation state is kept in memory across navigation; reload or a new conversation
resets it. The scientific knowledge library is shared, not per-user.

Explore uses explicit Load data. Region, drawn/manual bounds, event dates, selected
datasets and species carry into Ask Atlas. OBIS filters observation dates upstream;
recent periods can legitimately contain no records. Knowledge graph offers bounded
interactive views of loaded observations or latest chat evidence, without requiring
Neo4j. Analytics compares loaded ARGO near-surface samples and GFW daily effort.
See the [canonical demo guide](../README.md).

Model and RAG setup: [backend AI guide](../backend/AI_ENGINE.md).

## Validation

```sh
npm run lint
npm test
npm run build
node check-area-selection.mjs
node check-demo.mjs
```
