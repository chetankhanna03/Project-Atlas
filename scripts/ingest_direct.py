import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

import requests

sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import ArgoObservation


ARGOVIS_URL = "https://argovis-api.colorado.edu/argo"

end = datetime.now(timezone.utc)
start = end - timedelta(days=7)

params = {
    "startDate": start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "endDate": end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "polygon": "[[65,10],[75,10],[75,20],[65,20],[65,10]]"
}

try:
    response = requests.get(
        ARGOVIS_URL,
        params=params,
        timeout=60
    )

    print("STATUS:", response.status_code)

    response.raise_for_status()

    data = response.json()

except requests.RequestException as error:
    print("Argovis request failed:")
    print(error)
    sys.exit(1)

except ValueError as error:
    print("Invalid JSON response:")
    print(error)
    sys.exit(1)


if not data:
    print("No ARGO profiles found.")
    sys.exit(0)

if isinstance(data, dict):
    if "data" in data:
        data = data["data"]
    else:
        data = [data]

if not isinstance(data, list):
    print("Unexpected Argovis response format.")
    sys.exit(1)


print(f"Profiles received: {len(data)}")


db = SessionLocal()
count = 0

try:
    for profile in data:

        if not isinstance(profile, dict):
            continue

        profile_id = str(profile.get("_id", ""))

        if not profile_id:
            continue

        float_id = profile_id.split("_")[0]

        geolocation = profile.get("geolocation")

        if not isinstance(geolocation, dict):
            continue

        coordinates = geolocation.get("coordinates", [])

        if not isinstance(coordinates, list):
            continue

        if len(coordinates) < 2:
            continue

        longitude = coordinates[0]
        latitude = coordinates[1]

        timestamp = profile.get("timestamp")

        if not timestamp:
            continue

        observation_time = datetime.fromisoformat(
            timestamp.replace("Z", "+00:00")
        )

        observation = ArgoObservation(
            float_id=float_id,
            latitude=float(latitude),
            longitude=float(longitude),
            observation_time=observation_time,
            depth=None,
            temperature=None,
            salinity=None
        )

        db.add(observation)
        count += 1

        if count % 100 == 0:
            db.commit()
            print(f"Inserted: {count}")

    db.commit()

    print()
    print("ARGO ingestion completed.")
    print(f"Profiles inserted: {count}")

except Exception as error:
    db.rollback()
    print("Database insertion failed:")
    print(error)
    sys.exit(1)

finally:
    db.close()