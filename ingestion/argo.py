import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import requests
import json
from datetime import datetime, timedelta, timezone
from app.database import SessionLocal
from app.models import ArgoObservation

def ingest_argo():
    db = SessionLocal()
    
    url = "https://argovis-api.colorado.edu/argo"
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=7)
    
    polygon = [[65,10],[75,10],[75,20],[65,20],[65,10]]
    
    params = {
        "startDate": start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "endDate": end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "polygon": json.dumps(polygon)
    }
    
    print(f"📡 Fetching ARGO data from {start} to {end}...")
    resp = requests.get(url, params=params)
    
    if resp.status_code != 200:
        print(f" API Error: {resp.status_code}")
        print(resp.text[:500])
        return
    
    data = resp.json()
    
    if not data:
        print(" No data returned. Trying without polygon...")
        params.pop("polygon")
        resp = requests.get(url, params=params)
        data = resp.json()
        if not data:
            print(" Still no data. Exiting.")
            return
    
    print(f" Found {len(data)} profiles.")
    
    count = 0
    for profile in data:
        try:
            float_id = profile.get("_id", "").split("_")[0]
            coords = profile.get("geolocation", {}).get("coordinates", [])
            lon = coords[0] if coords and len(coords) > 0 else None
            lat = coords[1] if coords and len(coords) > 1 else None
            time_str = profile.get("timestamp")
            
            if time_str:
                observation_time = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            else:
                observation_time = datetime.now(timezone.utc)
            
            # Store metadata (measurements not available via simple API)
            obs = ArgoObservation(
                float_id=float_id,
                latitude=float(lat) if lat else 0,
                longitude=float(lon) if lon else 0,
                observation_time=observation_time,
                depth=None,
                temperature=None,
                salinity=None
            )
            db.add(obs)
            count += 1
            
            if count % 50 == 0:
                db.commit()
                print(f" Processed {count} profiles...")
                
        except Exception as e:
            print(f" Error processing profile: {e}")
            continue
    
    db.commit()
    print(f"Ingested {count} ARGO profiles.")
    db.close()

if __name__ == "__main__":
    ingest_argo()