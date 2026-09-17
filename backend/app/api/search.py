from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ArgoObservation, FisheriesLanding
import httpx

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/")
async def unified_search(
    lat: float = Query(..., description="Center latitude"),
    lon: float = Query(..., description="Center longitude"),
    radius: float = Query(50, description="Radius in km"),
    datasets: str = Query("argo,fisheries,biodiversity,oceanography", description="Comma-separated datasets"),
    year: int = Query(None, description="Filter by year (fisheries)"),
    species: str = Query(None, description="Filter by species name"),
    limit: int = Query(50, description="Max results per dataset"),
    db: Session = Depends(get_db)
):
    results = []
    dataset_list = [d.strip() for d in datasets.split(",")]
    
    if "argo" in dataset_list:
        argo_query = db.query(ArgoObservation).filter(
            ArgoObservation.latitude.between(lat - radius/111, lat + radius/111),
            ArgoObservation.longitude.between(lon - radius/111, lon + radius/111)
        ).limit(limit)
        for r in argo_query.all():
            results.append({
                "dataset": "argo",
                "float_id": r.float_id,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "timestamp": r.observation_time.isoformat() if r.observation_time else None,
                "depth": r.depth,
                "temperature": r.temperature,
                "salinity": r.salinity
            })
    
    if "fisheries" in dataset_list:
        fisher_query = db.query(FisheriesLanding)
        if year:
            fisher_query = fisher_query.filter(FisheriesLanding.year == year)
        if species:
            fisher_query = fisher_query.filter(FisheriesLanding.species.ilike(f"%{species}%"))
        fisher_query = fisher_query.limit(limit)
        for r in fisher_query.all():
            results.append({
                "dataset": "fisheries",
                "region": r.region,
                "category": r.category,
                "species": r.species,
                "year": r.year,
                "landings_tonnes": r.landings,
                "type": r.type.value if r.type else None
            })
    
    if "biodiversity" in dataset_list:
        bbox = f"{lon-radius/111},{lat-radius/111},{lon+radius/111},{lat+radius/111}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://api.obis.org/v3/occurrence",
                    params={"bbox": bbox, "limit": limit}
                )
                obis_data = resp.json()
                for r in obis_data.get("results", []):
                    results.append({
                        "dataset": "obis",
                        "scientific_name": r.get("scientificName"),
                        "latitude": r.get("decimalLatitude"),
                        "longitude": r.get("decimalLongitude"),
                        "event_date": r.get("eventDate"),
                        "depth": r.get("depth"),
                        "taxon_id": r.get("taxonID")
                    })
        except Exception as e:
            results.append({"dataset": "biodiversity", "error": str(e)})
    
    if "oceanography" in dataset_list:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "http://localhost:8000/api/oceanography/erddap/sst",
                    params={"lat": lat, "lon": lon, "days": 7}
                )
                erddap_data = resp.json()
                for d in erddap_data.get("data", [])[:limit]:
                    results.append({
                        "dataset": "erddap",
                        "parameter": "SST",
                        "latitude": d.get("latitude"),
                        "longitude": d.get("longitude"),
                        "time": d.get("time"),
                        "value": d.get("sst_celsius"),
                        "unit": "Celsius"
                    })
        except Exception as e:
            results.append({"dataset": "oceanography", "error": str(e)})
    
    return {
        "query": {"lat": lat, "lon": lon, "radius": radius, "datasets": datasets},
        "total": len(results),
        "results": results
    }