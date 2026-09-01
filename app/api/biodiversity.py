from fastapi import APIRouter, Query
import httpx

router = APIRouter(prefix="/api/biodiversity", tags=["biodiversity"])

@router.get("/obis")
async def obis_occurrences(
    bbox: str = Query(..., description="minLon,minLat,maxLon,maxLat"),
    limit: int = Query(100, description="Max results")
):
    url = "https://api.obis.org/v3/occurrence"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, params={"bbox": bbox, "limit": limit})
        resp.raise_for_status()
        data = resp.json()
    
    results = [{
        "scientific_name": r.get("scientificName"),
        "latitude": r.get("decimalLatitude"),
        "longitude": r.get("decimalLongitude"),
        "event_date": r.get("eventDate"),
        "depth": r.get("depth"),
        "dataset": "OBIS"
    } for r in data.get("results", [])]
    return {"count": len(results), "results": results}