import asyncio
import json
import re
import time
from datetime import datetime, timedelta, timezone
from statistics import mean
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from starlette.concurrency import run_in_threadpool
from fastapi import HTTPException
from app.ai.schemas import AgentResult, Evidence, Plan, ChatRequest
from app.ai.planner import REGIONS
from app.ai import rag, literature, provider, knowledge
from app.database import SessionLocal
from app.models import ArgoObservation, FisheriesLanding
from app.services.sources import get_sst, get_obis, get_taxonomy
from app.services.argo_gdac import get_profiles
from app.services import integrations, copernicus
from app.geo import radius_bbox
from app.config import settings


def provenance_values(provenance):
    return {key: provenance.get(key) for key in ('url', 'retrieved_at', 'source_last_updated', 'dataset_version')}


def requested_dates(scope, message):
    if scope.start_date or scope.end_date:
        return scope.start_date, scope.end_date
    days=re.search(r'\b(?:last|past)\s+(\d+)\s+days?\b',message,re.I)
    if days or re.search(r'\btoday\b',message,re.I):
        end=datetime.now(timezone.utc).date()
        return end-timedelta(days=int(days[1])-1 if days else 0),end
    return None,None


def local_ocean(scope):
    with SessionLocal() as db:
        query = select(ArgoObservation)
        if scope.bbox:
            w,s,e,n = scope.bbox
            query = query.where(ArgoObservation.latitude.between(s,n), ArgoObservation.longitude.between(w,e))
        elif scope.latitude is not None:
            w,s,e,n = radius_bbox(scope.latitude, scope.longitude, 25)
            query = query.where(ArgoObservation.latitude.between(s,n), ArgoObservation.longitude.between(w,e))
        else:
            return []
        if scope.start_date:
            query = query.where(func.date(ArgoObservation.observation_time) >= scope.start_date)
        if scope.end_date:
            query = query.where(func.date(ArgoObservation.observation_time) <= scope.end_date)
        field = ArgoObservation.salinity if scope.parameter == 'salinity' else ArgoObservation.temperature
        rows = db.scalars(query.where(field.is_not(None)).order_by(ArgoObservation.observation_time.desc()).limit(100)).all()
        return [{'float_id': row.float_id, 'latitude': row.latitude, 'longitude': row.longitude,
                 'time': row.observation_time.isoformat() + 'Z', 'depth_m': row.depth,
                 'value': getattr(row, 'salinity' if scope.parameter == 'salinity' else 'temperature')}
                for row in rows]


async def ocean(plan: Plan, request: ChatRequest):
    scope = plan.scope
    start,end=requested_dates(scope,request.message)
    limitations = []
    if 'copernicus' in request.message.lower() or scope.parameter in ('currents','sea_level'):
        lat,lon=scope.latitude,scope.longitude
        if lat is None:
            region=REGIONS.get((scope.region or '').lower())
            if not region:
                return AgentResult(domain='ocean',status='needs_input',limitations=['Provide coordinates or a supported region for a Copernicus point query.'])
            lat,lon=region[2]
            limitations.append(f'Representative point {lat}, {lon} for {scope.region}; not a regional mean.')
        parameter='temperature' if scope.parameter=='sst' else scope.parameter
        if parameter not in copernicus.DATASETS:
            return AgentResult(domain='ocean',status='unsupported',limitations=['This Copernicus integration supports temperature, salinity, currents and sea level.'])
        data=await copernicus.point(lat,lon,parameter,start,end)
        evidence=[]
        charts=[]
        if data['results']:
            evidence=[Evidence(id='O-CMEMS',domain='ocean',title='Copernicus model point series',source=data['provenance']['source'],
                text=json.dumps({'parameter':parameter,'units':data['units'],'records':data['results'][:10]}),
                **provenance_values(data['provenance']),metadata={'dataset':data['query']['dataset_id'],'records':data['results']})]
            for variable,unit in data['units'].items():
                charts.append({'type':'timeseries','title':f'Copernicus model {variable}','unit':unit,'evidence_id':'O-CMEMS',
                    'points':[{'time':row['time'],'value':row[variable]} for row in data['results'] if row[variable] is not None]})
        return AgentResult(domain='ocean',status=data['status'],evidence=evidence,visualizations=charts,limitations=limitations+data['limitations'])
    if scope.parameter not in ('sst', 'temperature', 'salinity'):
        return AgentResult(domain='ocean', status='unsupported', limitations=[f'No verified {scope.parameter} connector is implemented.'])
    if scope.latitude is None and not scope.bbox:
        return AgentResult(domain='ocean', status='needs_input', limitations=['Provide coordinates or a supported region for ocean observations.'])
    if scope.parameter in ('temperature', 'salinity') or re.search(r'\bargo\b', request.message, re.I):
        bounds = scope.bbox or radius_bbox(scope.latitude, scope.longitude, 25)
        data = await get_profiles(bounds, start, end,
                                  'salinity' if scope.parameter == 'salinity' else 'temperature')
        evidence = []
        for i, profile in enumerate(data['profiles']):
            # Preserve pressure context for every value in the model-visible sample.
            sample = {key: value for key, value in profile.items() if key != 'levels'}
            sample['levels'] = profile['levels'][:10]
            evidence.append(Evidence(id=f'O-ARGO-{i}', domain='ocean', title=f"Argo float {profile['float_id']} cycle {profile['cycle']}",
                source=data['source'], text=json.dumps(sample),
                url=profile['url'], retrieved_at=profile['retrieved_at'], source_last_updated=profile['source_last_updated'],
                metadata={**profile, 'doi': data['doi']}))
        warnings = data['limitations'] + [error['detail'] for error in data['errors']]
        return AgentResult(domain='ocean', status='ok' if evidence else data['status'], evidence=evidence, limitations=warnings)
    if scope.start_date or scope.end_date:
        rows = await run_in_threadpool(local_ocean, scope)
        limitations.append('Local imported ARGO observations have unverified per-row provenance and varying depths. These are not regional SST averages.')
        if not rows:
            return AgentResult(domain='ocean', status='no_data', limitations=limitations + ['No matching local observations. Historical queries are not replaced by current SST.'])
        text = json.dumps({'parameter': scope.parameter, 'observations': rows[:10]}, ensure_ascii=False)
        evidence = Evidence(id='O-LOCAL', domain='ocean', title='Imported ARGO observation sample', text=text,
                            source='Local ARGO database', kind='local_unverified', metadata={'record_count': len(rows)})
        return AgentResult(domain='ocean', status='ok', evidence=[evidence], limitations=limitations)
    lat, lon = scope.latitude, scope.longitude
    if lat is None:
        region = REGIONS.get((scope.region or '').lower())
        if not region:
            return AgentResult(domain='ocean', status='needs_input', limitations=['Provide a latitude and longitude for SST; arbitrary bounding boxes are not reduced to a point automatically.'])
        lat, lon = region[2]
        limitations.append(f'Representative point at {lat} latitude, {lon} longitude for {scope.region}; not a regional mean.')
    data = await get_sst(lat, lon, scope.days)
    rows = data['data']
    limitations.extend(data['limitations'])
    if not rows:
        return AgentResult(domain='ocean', status='no_data', limitations=limitations + ['No SST values at the requested grid cell.'])
    values = [row['sst_celsius'] for row in rows]
    summary = {'parameter': 'sea_surface_foundation_temperature', 'unit': 'degree_C', 'count': len(rows),
               'latitude': rows[0]['latitude'], 'longitude': rows[0]['longitude'],
               'start': rows[0]['time'], 'end': rows[-1]['time'], 'latest': rows[-1]['sst_celsius'],
               'mean': round(mean(values), 3), 'minimum': min(values), 'maximum': max(values)}
    text = (f"At the sampled grid cell ({summary['latitude']}, {summary['longitude']}), the latest SST is "
            f"{summary['latest']} degree_C at {summary['end']}. Mean of {len(rows)} retrieved daily values: "
            f"{summary['mean']} degree_C. Range: {summary['minimum']} to {summary['maximum']} degree_C. "
            f"Period: {summary['start']} to {summary['end']}.")
    evidence = Evidence(id='O-SST', domain='ocean', title='MUR SST point observations', text=text,
                        source=data['source'], **provenance_values(data['provenance']), metadata=summary)
    chart = {'type': 'timeseries', 'title': 'Retrieved SST at sampled grid cell', 'unit': 'degree_C',
             'evidence_id': 'O-SST', 'points': [{'time': row['time'], 'value': row['sst_celsius']} for row in rows]}
    return AgentResult(domain='ocean', status='ok', evidence=[evidence], limitations=limitations, visualizations=[chart])


def local_fisheries(scope):
    with SessionLocal() as db:
        query = select(FisheriesLanding).where(func.lower(FisheriesLanding.region) == scope.region.lower())
        if scope.species:
            query = query.where(FisheriesLanding.species.icontains(scope.species, autoescape=True))
        if scope.start_date:
            query = query.where(FisheriesLanding.year >= scope.start_date.year)
        if scope.end_date:
            query = query.where(FisheriesLanding.year <= scope.end_date.year)
        rows = db.scalars(query.order_by(FisheriesLanding.year.desc(), FisheriesLanding.id).limit(50)).all()
        return [{'region': row.region, 'species': row.species, 'category': row.category,
                 'year': row.year, 'landings_tonnes': row.landings, 'type': row.type.value} for row in rows]


async def fisheries(plan, request):
    if not re.search(r'\b(landings|catch)\b',request.message,re.I):
        scope=plan.scope
        if re.search(r'\b(tracks?|identity|vessel names?)\b',request.message,re.I):
            return AgentResult(domain='fisheries',status='unsupported',limitations=['This GFW connector provides aggregate fishing effort, not vessel identity or individual tracks.'])
        bounds=scope.bbox or (radius_bbox(scope.latitude,scope.longitude,25) if scope.latitude is not None else None)
        if not bounds:
            return AgentResult(domain='fisheries',status='needs_input',limitations=['Provide a bounding box, coordinates or supported sea region for GFW fishing effort.'])
        if scope.species:
            return AgentResult(domain='fisheries',status='unsupported',limitations=['GFW apparent fishing effort cannot be filtered by target species; request unfiltered effort or imported species landings.'])
        start,end=requested_dates(scope,request.message)
        data=await integrations.fishing_effort(bounds,start,end)
        evidence=[]
        daily={}
        for row in data['results']:
            daily[row['date']]=daily.get(row['date'],0)+row['apparent_fishing_hours']
        if data['results']:
            evidence=[Evidence(id='F-GFW',domain='fisheries',title='GFW apparent fishing effort',source='Global Fishing Watch',
                text=json.dumps({'apparent_fishing_hours':data['total_apparent_fishing_hours'],'query':data['query'],
                                 'daily_hours':daily,'meaning':'AIS-derived apparent effort, not catch or abundance'}),
                **provenance_values(data['provenance']),metadata={'unit':'hours','query':data['query'],'records':data['results'][:50]})]
        return AgentResult(domain='fisheries',status=data['status'],evidence=evidence,limitations=data['limitations'],
            visualizations=[{'type':'timeseries','title':'AIS apparent fishing effort','unit':'hours','evidence_id':'F-GFW',
                             'points':[{'time':day,'value':daily[day]} for day in sorted(daily)]}] if daily else [])
    if not plan.scope.region:
        return AgentResult(domain='fisheries', status='needs_input', limitations=['Specify an imported landings region, such as India or a state. Coordinates cannot identify regional catch records.'])
    rows = await run_in_threadpool(local_fisheries, plan.scope)
    limitations = ['Only imported regional landings are available; no live fishing-effort or vessel feed is connected.',
                   'Landings do not measure fish abundance. Imported rows require source validation; no causal inference is made.']
    if not rows:
        return AgentResult(domain='fisheries', status='no_data', limitations=limitations + ['No matching landings records in the local database.'])
    return AgentResult(domain='fisheries', status='ok', limitations=limitations,
                       evidence=[Evidence(id='F-LOCAL', domain='fisheries', title='Imported fisheries landings',
                                          text=json.dumps(rows[:10], ensure_ascii=False), source='Local fisheries database',
                                          kind='local_unverified', metadata={'record_count': len(rows), 'unit': 'tonnes'})])


async def biodiversity(plan, request):
    scope = plan.scope
    evidence, limitations = [], []
    if re.search(r'\b(iucn|red list|endangered|threatened|conservation status)\b',request.message,re.I):
        if not scope.species:
            return AgentResult(domain='biodiversity',status='needs_input',limitations=['Provide a binomial scientific species name for IUCN assessment lookup.'])
        if scope.start_date or scope.end_date or scope.bbox:
            limitations.append('IUCN lookup is by species. Requested geographic/date filters are not applied; assessment scope and publication year are shown.')
        data=await integrations.iucn_assessments(scope.species)
        for i,row in enumerate(data['results'][:5]):
            evidence.append(Evidence(id=f'B-IUCN-{i}',domain='biodiversity',title=f"IUCN assessment {row['assessment_id']}",
                text=json.dumps({'species':scope.species,**row}),source='IUCN Red List',
                **provenance_values(data['provenance']),metadata=row))
        return AgentResult(domain='biodiversity',status=data['status'],evidence=evidence,limitations=limitations+data['limitations'])
    taxonomy_only = bool(re.search(r'\b(taxonomy|taxonomic|accepted name|scientific name|worms)\b', request.message.lower()))
    if taxonomy_only:
        if not scope.species:
            return AgentResult(domain='biodiversity', status='needs_input', limitations=['Provide a scientific species name for WoRMS lookup.'])
        data = await get_taxonomy(scope.species)
        if data['results']:
            evidence.append(Evidence(id='B-TAXON', domain='biodiversity', title='WoRMS taxonomy matches',
                                      text=json.dumps(data['results'], ensure_ascii=False), source='WoRMS',
                                      **provenance_values(data['provenance'])))
        return AgentResult(domain='biodiversity', status='ok' if evidence else 'no_data', evidence=evidence)
    if (scope.start_date or scope.end_date) and 'gbif' not in request.message.lower():
        return AgentResult(domain='biodiversity', status='unsupported', limitations=['Date-filtered OBIS retrieval is not implemented; undated occurrences will not be substituted for the requested period.'])
    if 'edna' in request.message.lower():
        return AgentResult(domain='biodiversity', status='unsupported', limitations=['No verified eDNA dataset is configured; generic OBIS occurrences are not molecular biodiversity measurements.'])
    bounds = scope.bbox
    if bounds is None and scope.latitude is not None:
        bounds = radius_bbox(scope.latitude, scope.longitude, 25)
        limitations.append('Occurrence search covers a 25 km bounding box around the supplied point.')
    if bounds is None:
        return AgentResult(domain='biodiversity', status='needs_input', limitations=['Provide a bounding box or supported region for occurrence retrieval.'])
    species = scope.species
    is_gbif='gbif' in request.message.lower()
    if species and not is_gbif:
        taxonomy = await get_taxonomy(species)
        accepted = {match.get('accepted_name') or match.get('scientific_name') for match in taxonomy['results']}
        accepted.discard(None)
        if len(accepted) != 1:
            return AgentResult(domain='biodiversity', status='needs_input', limitations=['The supplied species name did not resolve uniquely in WoRMS. Provide an exact marine scientific name.'])
        species = next(iter(accepted))
        evidence.append(Evidence(id='B-NAME', domain='biodiversity', title='WoRMS species-name resolution',
                                  text=f'Resolved requested name {scope.species} to accepted name {species}.',
                                  source='WoRMS', **provenance_values(taxonomy['provenance'])))
    data = await integrations.gbif_occurrences(bounds,species,scope.start_date,scope.end_date) if is_gbif else await get_obis(bounds, 50, species)
    rows = data['results']
    names = sorted({row['scientific_name'] for row in rows if row['scientific_name']})
    if rows:
        text = f"Retrieved a sample of {len(rows)} occurrence records with {len(names)} distinct reported taxon names: " + ', '.join(names[:30]) + '. This is a sample, not species richness or abundance.'
        evidence.append(Evidence(id='B-OCC', domain='biodiversity', title=('GBIF' if is_gbif else 'OBIS')+' occurrence sample', text=text,
                                  source='GBIF' if is_gbif else 'OBIS', **provenance_values(data['provenance']),
                                  metadata={'bbox': list(bounds), 'record_count': len(rows), 'records': rows[:15]}))
    points = [{'latitude': row['latitude'], 'longitude': row['longitude'], 'label': row['scientific_name']} for row in rows]
    return AgentResult(domain='biodiversity', status='ok' if rows else 'no_data', evidence=evidence,
                       limitations=limitations + data['limitations'], visualizations=[{'type': 'locations', 'title': 'Retrieved occurrence locations', 'evidence_id': 'B-OCC', 'points': points}] if rows else [])


async def research(plan, request):
    if re.search(r'\b(nasa|earthdata|noaa catalog|noaa datasets)\b',request.message,re.I):
        nasa=bool(re.search(r'\b(nasa|earthdata)\b',request.message,re.I))
        query=re.sub(r'\b(find|search|show|nasa|earthdata|noaa|catalog|datasets?|collections?|about|for)\b','',request.message,flags=re.I)
        query=' '.join(query.split()) or 'ocean'
        data=await integrations.nasa_collections(query,plan.scope.bbox) if nasa else await integrations.noaa_catalog(query)
        evidence=[Evidence(id=f'R-CATALOG-{i}',domain='research',title=row.get('title') or row.get('Title') or 'Dataset metadata',
            source=data['provenance']['source'],kind='metadata',text=json.dumps(row),
            **provenance_values(data['provenance'])) for i,row in enumerate(data['results'][:5])]
        return AgentResult(domain='research',status=data['status'],evidence=evidence,limitations=data['limitations'])
    try:
        evidence, mode, warnings = await rag.search(plan.research_query or request.message, request.document_ids, limit=32)
    except SQLAlchemyError:
        evidence, warnings = [], ['Curated document database unavailable; initialize the research tables before importing papers.']
    if not request.document_ids:
        related, graph_warning = await knowledge.related_documents(plan.scope)
        if graph_warning:
            warnings.append(graph_warning)
        if related:
            graph_evidence, _, graph_notes = await rag.search(plan.research_query or request.message, related, limit=2)
            present = {item.id for item in evidence}
            evidence.extend(item for item in graph_evidence if item.id not in present)
            warnings.extend(graph_notes)
    if request.use_literature_search or 'openalex' in request.message.lower():
        try:
            evidence.extend(await literature.search_openalex(plan.research_query or request.message))
            warnings.append('OpenAlex results cover abstracts only, not full papers or independently validated conclusions.')
        except provider.ModelUnavailable as exc:
            warnings.append(str(exc))
    if not evidence:
        warnings.append('No relevant passages found. Import permitted scientific documents into the knowledge library or configure literature search.')
    from app.ai.rerank import rerank
    from app.ai.planner import effective_question
    evidence, diagnostics, notes = await rerank(effective_question(request), evidence)
    return AgentResult(domain='research', status='ok' if evidence else 'no_data', evidence=evidence,
                       retrieval_diagnostics=diagnostics if settings.development_mode else [], limitations=warnings + notes)


AGENTS = {'ocean': ocean, 'fisheries': fisheries, 'biodiversity': biodiversity, 'research': research}


async def run_agent(domain, plan, request):
    started = time.monotonic()
    try:
        result = await asyncio.wait_for(AGENTS[domain](plan, request), timeout=settings.http_timeout_seconds + settings.llm_timeout_seconds + 5)
    except HTTPException as exc:
        detail=exc.detail if isinstance(exc.detail,str) else f'{domain.capitalize()} source is unavailable.'
        result=AgentResult(domain=domain,status='needs_input' if exc.status_code==422 else 'unavailable',limitations=[detail])
    except (SQLAlchemyError, asyncio.TimeoutError, provider.ModelUnavailable):
        result = AgentResult(domain=domain, status='unavailable', limitations=[f'{domain.capitalize()} retrieval is unavailable or timed out. No missing results have been invented.'])
    result.elapsed_ms = round((time.monotonic() - started) * 1000)
    return result
