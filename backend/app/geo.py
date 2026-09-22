import math
from fastapi import HTTPException

EARTH_KM = 6371.0088

def validate_bbox(west, south, east, north):
    values = (west, south, east, north)
    if not all(math.isfinite(v) for v in values):
        raise HTTPException(422, 'Coordinates must be finite.')
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        raise HTTPException(422, 'Expected west < east and south < north within geographic bounds; split dateline-crossing boxes.')
    return values

def parse_bbox(value):
    try:
        parts = [float(v) for v in value.split(',')]
        if len(parts) != 4:
            raise ValueError()
    except ValueError:
        raise HTTPException(422, 'bbox must be west,south,east,north.')
    return validate_bbox(*parts)

def radius_bbox(lat, lon, radius):
    angle = radius / EARTH_KM
    delta_lat = math.degrees(angle)
    south, north = max(-90, lat - delta_lat), min(90, lat + delta_lat)
    if south <= -90 or north >= 90:
        raise HTTPException(422, 'Radius searches crossing a pole are not supported; use a bounding box.')
    delta_lon = math.degrees(math.asin(min(1, math.sin(angle) / math.cos(math.radians(lat)))))
    return validate_bbox(lon - delta_lon, south, lon + delta_lon, north)

def distance_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2-p1)/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(math.radians(lon2-lon1)/2)**2
    return 2 * EARTH_KM * math.asin(min(1, math.sqrt(a)))

def polygon_wkt(bounds):
    w, s, e, n = bounds
    return f'POLYGON (({w} {s}, {e} {s}, {e} {n}, {w} {n}, {w} {s}))'
