from datetime import date
from typing import Literal
from fastapi import APIRouter, Query
from app.geo import parse_bbox
from app.services import integrations as services, copernicus
from app.ai.literature import search_openalex
from app.ai.provider import ModelUnavailable
from fastapi import HTTPException

router=APIRouter(prefix='/api',tags=['source integrations'])


@router.get('/fisheries/effort')
async def fishing_effort(bbox:str=Query(...,max_length=120),start:date|None=None,end:date|None=None):
    return await services.fishing_effort(parse_bbox(bbox),start,end)


@router.get('/biodiversity/gbif')
async def gbif(bbox:str=Query(...,max_length=120),species:str|None=Query(None,max_length=200),
               start:date|None=None,end:date|None=None,limit:int=Query(50,ge=1,le=100)):
    return await services.gbif_occurrences(parse_bbox(bbox),species,start,end,limit)


@router.get('/conservation/iucn')
async def iucn(species:str=Query(...,min_length=3,max_length=160)):
    return await services.iucn_assessments(species)


@router.get('/discovery/nasa')
async def nasa(q:str=Query(...,min_length=2,max_length=200),bbox:str|None=None,limit:int=Query(5,ge=1,le=20)):
    return await services.nasa_collections(q,parse_bbox(bbox) if bbox else None,limit)


@router.get('/discovery/noaa')
async def noaa(q:str=Query(...,min_length=2,max_length=200),limit:int=Query(10,ge=1,le=20)):
    return await services.noaa_catalog(q,limit)


@router.get('/research/openalex')
async def openalex(q:str=Query(...,min_length=2,max_length=500)):
    try:
        results=await search_openalex(q)
        return {'status':'ok' if results else 'no_data','results':results,'coverage':'abstracts_only'}
    except ModelUnavailable as exc:
        raise HTTPException(503,str(exc)) from None


@router.get('/oceanography/copernicus')
async def copernicus_point(latitude:float=Query(...,ge=-90,le=90),longitude:float=Query(...,ge=-180,le=180),
    parameter:Literal['temperature','salinity','currents','sea_level']='temperature',
    start:date|None=None,end:date|None=None,depth:float=Query(0,ge=0,le=6000)):
    return await copernicus.point(latitude,longitude,parameter,start,end,depth)
