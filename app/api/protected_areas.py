from fastapi import APIRouter, Query, HTTPException
import json
from pathlib import Path

router = APIRouter(prefix="/api/conservation", tags=["conservation"])

@router.get("/protected")
async def get_protected_areas(
    lat: float = Query(..., description="Center latitude"),
    lon: float = Query(..., description="Center longitude"),
    radius: float = Query(50, description="Radius in km"),
    limit: int = Query(50, description="Max results")
):
    data_file = Path("data/marine_protected_areas.geojson")
    if not data_file.exists():
        return {
            "message": "WDPA data not available. Download from protectedplanet.net",
            "suggestion": "Download a sample GeoJSON or use protectedplanet.net API"
        }
    try:
        with open(data_file, "r") as f:
            data = json.load(f)
        lat_min = lat - (radius / 111)
        lat_max = lat + (radius / 111)
        lon_min = lon - (radius / 111)
        lon_max = lon + (radius / 111)
        results = []
        for feature in data.get("features", []):
            coords = feature.get("geometry", {}).get("coordinates", [])
            if not coords:
                continue
            if feature["geometry"]["type"] == "Polygon":
                coords_flat = coords[0]
            elif feature["geometry"]["type"] == "MultiPolygon":
                coords_flat = coords[0][0] if coords else []
            else:
                continue
            if coords_flat:
                lons = [c[0] for c in coords_flat]
                lats = [c[1] for c in coords_flat]
                avg_lat = sum(lats) / len(lats)
                avg_lon = sum(lons) / len(lons)
                if lat_min <= avg_lat <= lat_max and lon_min <= avg_lon <= lon_max:
                    props = feature.get("properties", {})
                    results.append({
                        "name": props.get("NAME", "Unknown"),
                        "designation": props.get("DESIG", "Unknown"),
                        "area_km2": props.get("GIS_AREA", 0),
                        "marine": props.get("MARINE", "unknown"),
                        "latitude": avg_lat,
                        "longitude": avg_lon,
                        "geometry": feature.get("geometry", {})
                    })
                    if len(results) >= limit:
                        break
        return {
            "query": {"lat": lat, "lon": lon, "radius": radius},
            "count": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))