# Project Atlas backend

FastAPI data API restored from the repository's `backend` branch and repaired.
Requires Python 3.11+. FloatChat now connects to this API through the frontend's `/api` proxy.
See [AI engine setup](AI_ENGINE.md) for agents, model configuration and scientific RAG.
See [Argo GDAC setup](ARGO_GDAC.md) for live Coriolis HTTPS profiles and metadata refresh.
See [source integration setup](SOURCES.md) for GFW, Copernicus, GBIF, IUCN, NASA, NOAA and OpenAlex.

## Local startup (PowerShell)

From the repository root:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.txt
./backend/start-local.ps1
```

Open http://127.0.0.1:8000/docs for interactive API documentation.
The launcher explicitly uses `backend/atlas-local.db`, initializes tables, and
binds only to localhost. It does not write to the PostgreSQL database referenced
by an existing `.env`. The local database initially contains no observations or landings.

For PostgreSQL or a different database, run these commands from `backend/`:

```powershell
# Set DATABASE_URL in your environment or backend/.env first.
.venv/Scripts/python -m app.init_db
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

`init_db` creates missing tables; it is not a schema migration system. Startup
and imports do not create tables or contact database/cache services. `/health`
checks the process; `/ready` checks required database tables. Database errors
return 503 without credentials or SQL details. Back up existing databases and
use migrations before making future schema changes.

## Configuration

See `.env.example`. Existing `.env` values are preserved; process environment
variables override them. Relative SQLite paths resolve against the working directory.

- `DATABASE_URL`: SQLAlchemy SQLite or PostgreSQL/psycopg2 connection URL.
- `CORS_ORIGINS`: JSON array; defaults to the frontend on localhost port 3000.
- `ADMIN_API_KEY`: required for all observation writes and cache clearing.
  Send `X-API-Key`. Writes return 503 when no key is configured and 401 for an
  incorrect key. Keep this key on trusted services, not in public frontend code.
- `HTTP_TIMEOUT_SECONDS`: 20 by default, maximum 60.
- `CACHE_TTL_SECONDS`: 300 by default; 0 disables caching.
- `RATE_LIMIT_PER_MINUTE`: 120 requests per client IP to `/api/*` by default.

The cache and rate limiter are bounded and process-local. Redis is not currently
used, even if an old `REDIS_URL` exists. Multi-worker/public deployment needs a
shared rate limiter, user authentication, HTTPS, and appropriate proxy configuration.

## Available routes

| Route | Behavior |
| --- | --- |
| `GET /api/datasets` | Catalog of implemented connectors and local stores; registration is not a live health claim |
| `GET /api/oceanography/erddap/sst?lat=15&lon=65&days=2` | One nearest MUR SST grid cell, 1–31 latest available daily records |
| `GET /api/biodiversity/obis?bbox=64,14,66,16&limit=2` | OBIS occurrences, using a WKT spatial filter; at most 500 records |
| `GET /api/taxonomy/resolve?name=Thunnus%20albacares` | Exact marine scientific-name lookup; returns all WoRMS matches and accepted-name IDs |
| `GET /api/argo/observations` | Local observations with bounded `limit` and `offset` |
| `GET /api/oceanography/argo` | Local observations by `lat_min`, `lat_max`, `lon_min`, `lon_max`, optional UTC-aware `start`/`end` |
| `POST /api/argo/observations` | Validated observation creation, authenticated |
| `PUT, DELETE /api/argo/observations/{id}` | Validated partial update or delete; missing IDs return 404 |
| `POST /api/argo/observations/bulk` | Multipart `file` CSV, maximum 1 MB/1000 rows; invalid rows reject the whole import |
| `GET /api/fisheries/landings` | Imported regional landings, filtered by year/region/species/category/type; paginated |
| `GET /api/search/?lat=15&lon=65&datasets=argo,biodiversity,oceanography` | Bounded retrieval across selected sources; external requests run concurrently |
| `GET /api/conservation/protected?lat=15&lon=65` | Optional local GeoJSON polygon intersection; reports unavailable when missing |
| `GET /api/cache/stats`, `POST /api/cache/clear` | Process-cache statistics and authenticated clearing |

Unified search returns `ok`, `no_data`, `partial`, or `unavailable`, plus separate
`results`, `sources`, `errors`, and `limitations`. A failed source never becomes
fabricated scientific data. Fisheries search requires `region`; national/state
landings cannot be interpreted as vessel activity near a coordinate. Radius
search uses haversine filtering over a bounded candidate sample; it is not an
exhaustive spatial inventory. Dateline/pole-crossing radius searches are rejected.

External responses include source URL, original retrieval time, cache flag,
dataset version where known, and last-modified where supplied. Unknown source
metadata remains null. Timeouts return 504; malformed responses return 502;
upstream rate limits, authentication failures and unavailable services return 503.
No-data responses are distinct from source errors. Responses are capped at 5 MB.

## Importing local data

Only import records with verified source attribution and permission. Local
legacy tables do not yet store per-row provenance, so they must not be presented
as independently verified scientific evidence. No workbook is automatically imported.

From `backend/`, using the same `DATABASE_URL` as the server:

```powershell
$env:DATABASE_URL = 'sqlite:///./atlas-local.db'
.venv/Scripts/python -m ingestion.argo path/to/observations.csv
.venv/Scripts/python -m ingestion.fisheries path/to/landings.csv
```

ARGO columns: `float_id,latitude,longitude,observation_time,depth,temperature,salinity`.
Time must include a timezone, for example `2025-01-01T00:00:00Z`. Optional
measurements may be blank. Depth is metres; do not relabel pressure in dbar as depth.

Fisheries columns: `region,category,species,year,landings,type`.
Landings are tonnes, including valid zero values; type is `species` or `state`.
CLI imports validate the complete file before writing and skip exact duplicate
rows. API POST operations are not idempotent. Historical script entrypoints now
delegate to the explicit CSV importer; they no longer query an unverified
Argovis measurement schema or remove geographic limits on empty responses.

Optional conservation data belongs at `backend/data/marine_protected_areas.geojson`
(FeatureCollection, maximum 20 MB). Preserve source/license information in feature
properties. Filtering uses bounding-box intersection, not precise circular distance.

## Verification

```powershell
cd backend
.venv/Scripts/python -m pytest -q
# Optional small read-only live requests; needs outbound network access:
.venv/Scripts/python scripts/smoke_sources.py
```

Automated tests use a fresh SQLite database and mocked external responses. They
never contact the configured PostgreSQL database. The live script makes only
three bounded requests and exits nonzero if a source fails.

Provider contracts used:
- [NOAA ERDDAP query documentation](https://coastwatch.pfeg.noaa.gov/erddap/griddap/documentation.html)
- [MUR SST variables and units](https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.html)
- [OBIS API](https://api.obis.org/) and [spatial filtering](https://manual.obis.org/FAQ.html)
- [WoRMS REST API](https://www.marinespecies.org/rest/)

## Remaining project work

The AI engine, domain agents, `/api/chat`, configurable LLMs, document RAG,
optional Neo4j evidence graph and FloatChat integration are implemented; see
[AI engine setup](AI_ENGINE.md) for configuration and validation limits.
Individual vessel tracks, PostGIS, historical remote satellite SST selection, calibrated
predictions and statistically matched cross-domain analysis remain future work.
No placeholder scientific answers or live-feed claims have been added.
Existing `.env` and bytecode files have been removed from Git
tracking while preserving local copies. This does not erase historical commits;
rotate any credentials that were previously committed before sharing/deploying.
