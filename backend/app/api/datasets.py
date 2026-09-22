from fastapi import APIRouter
router = APIRouter(prefix='/api/datasets', tags=['catalog'])

CATALOG = [
    {'id': 'jplMURSST41', 'name': 'MUR SST v4.1', 'domain': 'oceanography', 'source': 'NASA JPL via NOAA ERDDAP',
     'access': 'on-demand', 'variables': ['sea_surface_foundation_temperature'], 'spatial_coverage': 'Global ocean',
     'temporal_coverage': '2002-present', 'update_frequency': 'daily', 'format': 'ERDDAP JSON',
     'endpoint': '/api/oceanography/erddap/sst', 'source_url': 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.html',
     'license': 'JPL PO.DAAC data policy; see source metadata', 'limitations': 'Single grid cell; at most 31 latest available days.'},
    {'id': 'obis', 'name': 'OBIS marine occurrences', 'domain': 'biodiversity', 'source': 'OBIS',
     'access': 'on-demand', 'variables': ['species occurrence', 'location', 'event date'], 'spatial_coverage': 'Global',
     'endpoint': '/api/biodiversity/obis', 'source_url': 'https://api.obis.org/',
     'license': 'Varies by contributing dataset; retain record attribution', 'limitations': 'At most 500 occurrence records per request.'},
    {'id': 'worms', 'name': 'WoRMS marine taxonomy', 'domain': 'taxonomy', 'source': 'WoRMS',
     'access': 'on-demand', 'variables': ['accepted scientific name', 'AphiaID', 'classification'],
     'endpoint': '/api/taxonomy/resolve', 'source_url': 'https://www.marinespecies.org/rest/',
     'limitations': 'Exact scientific-name lookup; all matches returned.'},
    {'id': 'argo', 'name': 'Argo GDAC core profiles', 'domain': 'oceanography',
     'source': 'Coriolis GDAC', 'access': 'on-demand', 'endpoint': '/api/oceanography/argo/gdac',
     'source_url': 'https://data-argo.ifremer.fr/', 'doi': 'https://doi.org/10.17882/42182',
     'variables': ['temperature', 'salinity', 'pressure'],
     'limitations': 'Requires local metadata index refresh; at most 5 files and 100 sampled levels per profile. QC=1 only. Local imports remain at /api/oceanography/argo.'},
    {'id': 'fisheries', 'name': 'Locally imported fisheries landings', 'domain': 'fisheries',
     'source': 'User-supplied records', 'access': 'local-import', 'endpoint': '/api/fisheries/landings',
     'limitations': 'Empty until imported; not live GFW vessel activity. Verify provenance of imported rows.'},
    {'id': 'research-library', 'name': 'Curated scientific document library', 'domain': 'research',
     'source': 'Administrator-curated documents', 'access': 'local-import', 'endpoint': '/api/research/search',
     'limitations': 'Empty until imported. Semantic embeddings require a configured model; lexical retrieval remains available.'},
]

CATALOG.extend([
    {'id':'gfw','name':'Global Fishing Watch apparent fishing effort','domain':'fisheries','source':'Global Fishing Watch',
     'access':'credentialed','endpoint':'/api/fisheries/effort','source_url':'https://gateway.api.globalfishingwatch.org/',
     'limitations':'AIS-derived apparent fishing hours, not catch or vessel tracks; bounding box and bounded dates.'},
    {'id':'copernicus','name':'Copernicus Marine model physics','domain':'oceanography','source':'Copernicus Marine',
     'access':'credentialed','endpoint':'/api/oceanography/copernicus','source_url':'https://data.marine.copernicus.eu/',
     'limitations':'Nearest model point: temperature, salinity, currents, sea level; at most 31 days. Not in-situ observations.'},
    {'id':'gbif','name':'GBIF occurrence sample','domain':'biodiversity','source':'GBIF','access':'on-demand',
     'endpoint':'/api/biodiversity/gbif','source_url':'https://api.gbif.org/v1/',
     'limitations':'Includes non-marine taxa; records can overlap OBIS. At most 100 records.'},
    {'id':'iucn','name':'IUCN Red List assessment summaries','domain':'conservation','source':'IUCN Red List','access':'credentialed',
     'endpoint':'/api/conservation/iucn','source_url':'https://api.iucnredlist.org/',
     'limitations':'Species-level summaries; retain assessment year and geographic scope. API access subject to IUCN terms.'},
    {'id':'nasa-cmr','name':'NASA Earthdata collection discovery','domain':'discovery','source':'NASA CMR','access':'metadata',
     'endpoint':'/api/discovery/nasa','source_url':'https://cmr.earthdata.nasa.gov/search/',
     'limitations':'Collection metadata, not downloaded satellite measurements.'},
    {'id':'noaa-catalog','name':'NOAA NCEI ERDDAP discovery','domain':'discovery','source':'NOAA NCEI','access':'metadata',
     'endpoint':'/api/discovery/noaa','source_url':'https://www.ncei.noaa.gov/erddap/',
     'limitations':'Catalog search only. MUR SST measurements use the separate CoastWatch connector.'},
    {'id':'openalex','name':'OpenAlex scientific abstracts','domain':'research','source':'OpenAlex','access':'credentialed',
     'endpoint':'/api/research/openalex','source_url':'https://api.openalex.org/',
     'limitations':'Up to five available abstracts; full text must be separately imported from permitted sources.'},
])

@router.get('')
def datasets():
    return {'count': len(CATALOG), 'datasets': CATALOG,
            'limitations': ['Connector registration does not indicate current source availability. See /api/ai/status for model and optional service configuration.']}
