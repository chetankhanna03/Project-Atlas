from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import models
from app.database import engine, Base, SessionLocal
from app.schemas import ArgoObservationCreate

# Import all API routers
from app.api import fisheries, biodiversity, oceanography, erddap, taxonomy, protected_areas, search, cache

app = FastAPI(
    title="Project Atlas API",
    description="Unified Ocean Intelligence Platform",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Include all routers
app.include_router(fisheries.router)
app.include_router(biodiversity.router)
app.include_router(oceanography.router)
app.include_router(erddap.router)
app.include_router(taxonomy.router)
app.include_router(protected_areas.router)
app.include_router(search.router)
app.include_router(cache.router)

# ----- Existing Endpoints -----
@app.get("/")
def root():
    return {"project": "Project Atlas", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/db-test")
def database_test():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            value = result.scalar()
        return {"database": "Neon PostgreSQL", "status": "connected", "test_result": value}
    except Exception as e:
        return {"database": "Neon PostgreSQL", "status": "connection_failed", "error": str(e)}

@app.post("/api/argo/observations")
def create_argo_observation(observation: ArgoObservationCreate, db: Session = Depends(get_db)):
    new_obs = models.ArgoObservation(
        float_id=observation.float_id,
        latitude=observation.latitude,
        longitude=observation.longitude,
        observation_time=observation.observation_time,
        depth=observation.depth,
        temperature=observation.temperature,
        salinity=observation.salinity
    )
    db.add(new_obs)
    db.commit()
    db.refresh(new_obs)
    return {"message": "ARGO observation created", "id": new_obs.id}

@app.get("/api/argo/observations")
def get_argo_observations(db: Session = Depends(get_db)):
    observations = db.query(models.ArgoObservation).order_by(models.ArgoObservation.id.desc()).all()
    return [{
        "id": o.id, "float_id": o.float_id, "latitude": o.latitude,
        "longitude": o.longitude, "observation_time": o.observation_time,
        "depth": o.depth, "temperature": o.temperature, "salinity": o.salinity
    } for o in observations]

@app.delete("/api/argo/observations/{obs_id}")
def delete_observation(obs_id: int, db: Session = Depends(get_db)):
    obs = db.query(models.ArgoObservation).filter(models.ArgoObservation.id == obs_id).first()
    if not obs:
        return {"error": "Observation not found"}
    db.delete(obs)
    db.commit()
    return {"status": "deleted", "id": obs_id}

@app.put("/api/argo/observations/{obs_id}")
def update_observation(obs_id: int, data: dict, db: Session = Depends(get_db)):
    obs = db.query(models.ArgoObservation).filter(models.ArgoObservation.id == obs_id).first()
    if not obs:
        return {"error": "Observation not found"}
    for key, value in data.items():
        if hasattr(obs, key):
            setattr(obs, key, value)
    db.commit()
    db.refresh(obs)
    return obs

@app.post("/api/argo/observations/bulk")
async def bulk_upload_observations(file: bytes, db: Session = Depends(get_db)):
    import csv
    from io import StringIO
    
    csv_str = file.decode("utf-8")
    reader = csv.DictReader(StringIO(csv_str))
    created = []
    errors = []
    
    for row in reader:
        try:
            obs = models.ArgoObservation(
                float_id=row["float_id"],
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                observation_time=row["observation_time"],
                depth=float(row["depth"]) if row.get("depth") else None,
                temperature=float(row["temperature"]) if row.get("temperature") else None,
                salinity=float(row["salinity"]) if row.get("salinity") else None
            )
            db.add(obs)
            created.append(obs)
        except Exception as e:
            errors.append({"row": row, "error": str(e)})
    
    db.commit()
    return {"created": len(created), "errors": errors}