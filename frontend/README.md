# Project Atlas frontend

React, TypeScript and Vite ocean dashboard. FloatChat connects to the real Atlas
backend; the other dashboard views still contain prototype data.

## Run locally

1. Start the backend with `backend/start-local.ps1` from the repository root.
2. In `frontend/`, run `npm install` and `npm run dev`.
3. Open http://localhost:3000 and select FloatChat.

The Vite `/api` proxy points to http://127.0.0.1:8000. For production, configure
an equivalent same-origin reverse proxy. Put model keys only in `backend/.env`;
the browser does not call model providers directly.

FloatChat supports cited evidence, real retrieved-value charts, follow-up context,
cancellation, selected document retrieval and administrator document imports.
Conversation state is kept in memory and resets when leaving the view or starting
a new conversation. The scientific knowledge library is shared, not per-user.

Model and RAG setup: [backend AI guide](../backend/AI_ENGINE.md).

## Validation

```sh
npm run lint
npm test
npm run build
```
