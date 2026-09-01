import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import requests
from datetime import datetime, timedelta
import json

ARGOVIS_URL = "https://argovis-api.colorado.edu/argo"

end = datetime.utcnow()
start = end - timedelta(days=7)


polygon = [
    [65, 10],
    [75, 10],
    [75, 20],
    [65, 20],
    [65, 10]  # Close the polygon
]

params = {
    "startDate": start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "endDate": end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "polygon": json.dumps(polygon),  # Convert to JSON string
    "measurements": "true"
}

resp = requests.get(ARGOVIS_URL, params=params)
print("Status:", resp.status_code)
print("Response preview:", resp.text[:500])

resp.raise_for_status()
data = resp.json()

if not data:
    print("No data returned.")
    exit()

# Handle if data is a dict with a 'data' key
if isinstance(data, dict) and "data" in data:
    data = data["data"]

from app.database import SessionLocal
from app.models import ArgoObservation

db = SessionLocal()
count = 0
for profile in data:
    if isinstance(profile, str):
        try:
            profile = json.loads(profile)
        except:
            continue
    float_id = profile.get("_id", "").split("_")[0]
    coords = profile.get("geolocation", {}).get("coordinates", [])
    lon = coords[0] if coords else None
    lat = coords[1] if coords else None
    time = profile.get("timestamp")
    for meas in profile.get("measurements", []):
        obs = ArgoObservation(
            float_id=float_id,
            latitude=lat,
            longitude=lon,
            observation_time=time,
            depth=meas.get("pressure"),
            temperature=meas.get("temperature"),
            salinity=meas.get("salinity")
        )
        db.add(obs)
        count += 1
        if count % 100 == 0:
            db.commit()
db.commit()
print(f"Ingested {count} observations")