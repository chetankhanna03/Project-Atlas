from datetime import datetime
import enum

from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, JSON

from app.database import Base


# ----- Existing Model: ARGO -----
class ArgoObservation(Base):
    __tablename__ = "argo_observations"

    id = Column(Integer, primary_key=True, index=True)
    float_id = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    observation_time = Column(DateTime, nullable=False)
    depth = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    salinity = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ----- Existing Model: Fisheries -----
class LandingType(str, enum.Enum):
    SPECIES = "species"
    STATE = "state"

class FisheriesLanding(Base):
    __tablename__ = "fisheries_landings"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False)          # 'India' or state name
    category = Column(String, nullable=True)         # e.g., 'ELASMOBRANCHS'
    species = Column(String, nullable=True)          # e.g., 'Sharks'
    year = Column(Integer, nullable=False)
    landings = Column(Float, nullable=False)         # tonnes
    type = Column(Enum(LandingType), nullable=False) # 'species' or 'state'


# ----- NEW: Taxonomy Cache (WoRMS) -----
class TaxonomyCache(Base):
    __tablename__ = "taxonomy_cache"

    id = Column(Integer, primary_key=True, index=True)
    scientific_name = Column(String, unique=True, nullable=False, index=True)
    aphia_id = Column(Integer, nullable=True)        # WoRMS unique identifier
    rank = Column(String, nullable=True)             # e.g., 'species', 'genus'
    parent_aphia_id = Column(Integer, nullable=True)
    kingdom = Column(String, nullable=True)
    phylum = Column(String, nullable=True)
    class_name = Column(String, nullable=True)
    order_name = Column(String, nullable=True)
    family = Column(String, nullable=True)
    genus = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ----- NEW: Oceanographic aggregated data -----
class OceanData(Base):
    __tablename__ = "ocean_data"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    time = Column(DateTime, nullable=False)
    parameter = Column(String(50), nullable=False)   # e.g., 'SST', 'salinity', 'chlorophyll'
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=True)
    source = Column(String(100), nullable=True)      # e.g., 'Copernicus', 'ERDDAP'
    created_at = Column(DateTime, default=datetime.utcnow)


# ----- NEW: Biodiversity occurrences (optional cache) -----
class BiodiversityOccurrence(Base):
    __tablename__ = "biodiversity_occurrences"

    id = Column(Integer, primary_key=True, index=True)
    scientific_name = Column(String, nullable=False, index=True)
    aphia_id = Column(Integer, nullable=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    event_date = Column(DateTime, nullable=True)
    dataset = Column(String(50), nullable=True)      # 'OBIS' or 'GBIF'
    record_id = Column(String(100), nullable=True)   # external ID
    created_at = Column(DateTime, default=datetime.utcnow)


# ----- NEW: Fishing effort (Global Fishing Watch) -----
class FishingEffort(Base):
    __tablename__ = "fishing_effort"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    time = Column(DateTime, nullable=False)
    vessel_type = Column(String(50), nullable=True)
    fishing_hours = Column(Float, nullable=True)
    gear_type = Column(String(50), nullable=True)
    source = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ----- NEW: Marine Protected Areas (WDPA) -----
class ProtectedArea(Base):
    __tablename__ = "protected_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=True)
    geometry = Column(Text, nullable=True)           # GeoJSON string or WKT
    area_km2 = Column(Float, nullable=True)
    marine = Column(String(10), nullable=True)       # 'true' / 'false'
    source = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)