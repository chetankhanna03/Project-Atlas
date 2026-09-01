from fastapi import APIRouter, Query, HTTPException
import httpx
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/oceanography/erddap", tags=["oceanography"])

@router.get("/sst")
async def get_sst(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, description="Number of days to fetch")
):
    url = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.json"
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    params = {
        "latitude": f"({lat})",
        "longitude": f"({lon})",
        "time": f"[{start_date.strftime('%Y-%m-%dT00:00:00Z')}:{end_date.strftime('%Y-%m-%dT00:00:00Z')}]"
    }
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            results = []
            if "data" in data:
                times = data.get("data", {}).get("time", [])
                ssts = data.get("data", {}).get("analysed_sst", [])
                for i, (time_val, sst_val) in enumerate(zip(times, ssts)):
                    if sst_val is not None:
                        results.append({
                            "time": time_val,
                            "sst_celsius": float(sst_val),
                            "latitude": lat,
                            "longitude": lon
                        })
            return {
                "source": "NOAA ERDDAP (MUR SST)",
                "parameter": "Sea Surface Temperature",
                "unit": "Celsius",
                "count": len(results),
                "data": results
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))