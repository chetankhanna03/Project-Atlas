# Marine source integrations

Atlas uses fixed provider endpoints and bounded requests. `/api/sources` and the
frontend Sources page expose implemented capabilities and configuration requirements.
They do **not** claim live availability based on whether a key exists.

## Credentials

Fill the empty placeholders in **backend/.env**, then restart the backend:

```dotenv
GFW_API_KEY=your-token-without-the-Bearer-prefix
IUCN_API_KEY=your-token-without-the-Bearer-prefix
COPERNICUSMARINE_SERVICE_USERNAME=your-username
COPERNICUSMARINE_SERVICE_PASSWORD=your-password
OPENALEX_ENABLED=true
OPENALEX_API_KEY=your-key
```

Only configure providers you intend to use. Missing credentials return an explicit
configuration error; they do not cause fake or substituted data. Secrets are never
returned by source status or passed to the frontend. Existing `.env` values are
preserved. OBIS, WoRMS, GBIF, ARGO, public NASA metadata and NOAA catalog search
require no key for these implemented requests.

## Implemented capabilities

| Source | Atlas endpoint | Coverage |
| --- | --- | --- |
| ARGO / Coriolis HTTPS | `/api/oceanography/argo/gdac` | QC-filtered core temperature/salinity profiles; [index setup](ARGO_GDAC.md) |
| Copernicus Marine Toolbox | `/api/oceanography/copernicus` | Nearest model point, daily temperature/salinity/currents/sea level, maximum 31 days |
| Global Fishing Watch v3 | `/api/fisheries/effort` | Bounding-box AIS apparent fishing hours, daily by flag, maximum 366 days |
| OBIS | `/api/biodiversity/obis` | Marine occurrence sample |
| WoRMS | `/api/taxonomy/resolve` | Exact marine scientific-name and accepted-name lookup |
| GBIF v1 | `/api/biodiversity/gbif` | Bounded occurrence search with coordinates, optional species and dates |
| NASA Earthdata CMR | `/api/discovery/nasa` | Collection discovery, optional geographic bounds; metadata only |
| NOAA NCEI ERDDAP | `/api/discovery/noaa` | Dataset catalog discovery; metadata only |
| NOAA CoastWatch / NASA MUR | `/api/oceanography/erddap/sst` | Existing numerical SST point-series adapter |
| IUCN Red List v4 | `/api/conservation/iucn` | Binomial-name assessment summaries with year, scope and category when supplied |
| OpenAlex | `/api/research/openalex` | Up to five available scientific abstracts, excluding retracted works |
| Permitted scientific papers | `/api/research/documents/upload` | Existing admin-authenticated PDF/text RAG importer |

Examples (URL-encode spaces when needed):

```text
/api/fisheries/effort?bbox=60,5,65,10&start=2025-01-01&end=2025-01-07
/api/oceanography/copernicus?latitude=15&longitude=65&parameter=currents&start=2025-01-01&end=2025-01-07
/api/biodiversity/gbif?bbox=60,5,75,25&species=Thunnus%20albacares&limit=10
/api/conservation/iucn?species=Thunnus%20albacares
/api/discovery/nasa?q=sea%20surface%20temperature&limit=5
/api/discovery/noaa?q=temperature&limit=5
/api/research/openalex?q=ocean%20warming%20fish%20distribution
```

The existing unified radius-search endpoint retains its original sources; use
these dedicated endpoints or FloatChat for the new integrations.

## Agent routing

- Explicit Copernicus requests and currents/sea-level questions use the Toolbox.
  Supported named seas use labelled representative points; no regional average is
  implied. Temperature/salinity otherwise use ARGO. Explicit SST keeps MUR SST.
- Fishing-effort questions use GFW. Landings/catch questions retain local imports;
  landings are not silently substituted for effort. Individual tracks and
  species-targeted effort are not supported.
- Marine occurrences default to OBIS; explicit GBIF questions use GBIF. IUCN or
  conservation-status questions use IUCN. Taxonomy questions retain WoRMS.
- NASA/Earthdata or NOAA catalog questions return dataset metadata, labelled as
  discovery. No assertion is made that the satellite observations were downloaded.
- OpenAlex is used when the FloatChat literature checkbox is selected or explicitly
  named in the question. Full-text RAG uses permitted documents imported separately.

Example questions:

```text
Show fishing effort in the Arabian Sea during 2025
Show Copernicus currents at latitude 15, longitude 65 from 2025-01-01 to 2025-01-07
Show GBIF occurrences of Thunnus albacares in the Arabian Sea
What is the IUCN status of Thunnus albacares?
Find NASA datasets about sea surface temperature
Find OpenAlex research about ocean warming and fisheries
```

## Scientific and operational limits

- GFW hours describe inferred AIS activity, not catch, biomass or a complete fleet
  census. The default period is seven days ending five days ago. Atlas serializes
  reports per process; multiple workers sharing a token need a shared queue. The
  provider can time out/rate-limit; Atlas reports the error and does not poll forever.
- Copernicus queries run in an isolated subprocess, limited to two concurrent
  processes and 45 seconds each. Its model analysis/forecast data are not in-situ
  observations or satellite foundation SST. Actual nearest coordinates/depth are
  returned. Out-of-range historical questions do not switch products automatically.
- GBIF and OBIS can contain overlapping records. They must not be added together
  as independent occurrence counts. A GBIF geographic query is not marine-only.
- IUCN summaries include historical and regional assessments; retain year, scope
  and latest flags. No returned assessment does not mean Least Concern. The
  connector does not fetch full assessment narratives or apply requested ocean
  bounding boxes as assessment scopes. Respect provider access/reuse terms.
- NASA CMR and NOAA catalog results are discovery records. Each numerical dataset
  requires a separate variable/dimension/access contract. Earthdata granule
  downloads, global mirroring and generic arbitrary-URL retrieval are not enabled.
- INCOIS, eDNA repositories, FishBase and Protected Planet/WDPA remain explicitly
  unconnected pending a specific product/service and access contract. Existing local
  protected-area GeoJSON support remains available.

## Validation

```powershell
.venv/Scripts/python -m pytest -q
.venv/Scripts/python scripts/smoke_integrations.py
```

GBIF, NASA CMR, NOAA NCEI, OBIS and WoRMS were verified with small live public
requests. ARGO was previously verified against a real GDAC profile. GFW, IUCN,
Copernicus and OpenAlex require configured credentials for live validation; their
request/response behavior is covered with synthetic fixtures. Tests never read
real external-source keys to make authenticated requests.

Official contracts:
- [GFW reports](https://api-doc.globalfishingwatch.org/our-apis/documentation/docs/v3/4wings/report)
- [Copernicus Python API](https://toolbox-docs.marine.copernicus.eu/en/stable/python-interface.html)
- [GBIF occurrences](https://techdocs.gbif.org/en/openapi/v1/occurrence)
- [NASA CMR](https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html)
- [IUCN v4 schema](https://api.iucnredlist.org/api-docs/v4/openapi.yaml)
- [NOAA NCEI ERDDAP](https://www.ncei.noaa.gov/erddap/)
