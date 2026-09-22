# Argo GDAC integration

Atlas uses **Coriolis HTTPS** at https://data-argo.ifremer.fr/.
No account, FTP client or AWS setup is required. US GODAE and S3 are not
automatic fallback sources in this implementation.

## Setup and index refresh

From `backend/`:

```powershell
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m app.services.sync_argo_index
```

The second command downloads the compressed global **metadata index**, approximately
59 MB at implementation time, and atomically creates `backend/argo-index.db`.
It does not mirror the profile archive or modify the application's database.
Allow additional disk space for the indexed metadata and temporary refresh files.
Run the refresh daily, or before querying recently updated data. No scheduler is
installed. Failed refreshes preserve the previous index; queries flag indexes
older than two days. Missing indexes return a setup error rather than empty data.

## API

```text
GET /api/oceanography/argo/gdac?bbox=50,5,78,26&parameter=temperature&limit=3
```

- Bounding box order: west,south,east,north. Dateline-crossing boxes must be split.
- `start` and `end`: optional inclusive YYYY-MM-DD dates. End defaults to today;
  start defaults to 30 days before end.
- `parameter`: temperature or salinity.
- `limit`: 1-5 newest matching profile files (default 3).
- `pressure_min` / `pressure_max`: decibars, default 0-2000.

Responses preserve WMO float number, cycle, observation time, coordinates, data
mode, parameter units, pressure, QC, available adjusted uncertainty, source file
URL, retrieval time and index timestamps. At most 100 evenly sampled qualifying
levels per profile are returned. The server downloads at most 8 MB per file and
uses the existing short-lived result cache. Profile data are not persisted into
legacy local-import tables, which lack the required provenance fields.

Core profiles only: QC=1 for position, time, pressure and selected measurements.
R mode uses raw variables; A/D modes use adjusted variables and adjusted QC flags.
Missing adjusted data are never replaced with raw values. Raw R-mode observations
have only real-time QC and are not interchangeable with delayed-mode research data.
Pressure remains in dbar; it is not relabelled as depth in metres.

Selection is a bounded sample of newest indexed files. Files that fail QC may
produce no observations; Atlas does not expand the requested scope to fill gaps.
Responses distinguish no_data, partial, unavailable and ok. Argo vertical
temperature profiles are not satellite SST, a regional average or a climate trend.

## FloatChat

Examples:

- `Show ARGO temperature in the Arabian Sea during 2025`
- `Show salinity in the Bay of Bengal`

The Ocean Agent uses GDAC for temperature/salinity or explicitly requested ARGO
profiles. Citations link directly to the official NetCDF files and preserve
pressure/value context. Explicit SST questions retain the separate SST path;
historical satellite SST retrieval remains unavailable. The existing
`/api/oceanography/argo` local-import endpoint is unchanged.

## Verification and data acknowledgement

```powershell
.venv/Scripts/python -m pytest -q
.venv/Scripts/python scripts/smoke_argo_gdac.py
```

The smoke script retrieves one matching Arabian Sea profile. Unit tests use
synthetic NetCDF fixtures and isolated indexes, never the downloaded index.

Use the official Argo acknowledgement when publishing results and cite
[Argo GDAC DOI](https://doi.org/10.17882/42182).
Contracts: [GDAC access](https://www.argodatamgt.org/DataAccess.html),
[profile variables and QC](https://argo.ucsd.edu/data/how-to-use-argo-files/).
