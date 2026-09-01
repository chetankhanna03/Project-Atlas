import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import requests
from datetime import datetime, timedelta, timezone
import json

ARGOVIS_URL = "https://argovis-api.colorado.edu/argo"

# Use timezone-aware UTC now to avoid deprecation warning
end = datetime.now(timezone.utc)
start = end - timedelta(days=7)

# Proper polygon for Arabian Sea
polygon = [[65,10],[75,10],[75,20],[65,20],[65,10]]

params = {
    "startDate": start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "endDate": end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "polygon": json.dumps(polygon)  # no extra spaces
}

resp = requests.get(ARGOVIS_URL, params=params)
print("Status:", resp.status_code)
print("Response preview (first 500 chars):")
print(resp.text[:500])

resp.raise_for_status()
data = resp.json()

if not data:
    print("No data returned.")
    exit()

# If data is a dict with 'data' key, use that
if isinstance(data, dict) and "data" in data:
    data = data["data"]

from app.database import SessionLocal
from app.models import ArgoObservation

db = SessionLocal()
count = 0
for profile in data:
    # In case profile is a JSON string (unlikely but safe)
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

    # Measurements are inside the profile as a list
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
print(f"Successfully ingested {count} observations.")
