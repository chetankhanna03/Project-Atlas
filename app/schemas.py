from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ArgoObservationCreate(BaseModel):
    float_id: str = Field(..., min_length=1, max_length=50)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    observation_time: datetime
    depth: float | None = Field(default=None, ge=0)
    temperature: float | None = None
    salinity: float | None = Field(default=None, ge=0)

class ArgoObservationUpdate(BaseModel):
    float_id: Optional[str] = Field(None, min_length=1, max_length=50)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    observation_time: Optional[datetime] = None
    depth: Optional[float] = Field(None, ge=0)
    temperature: Optional[float] = None
    salinity: Optional[float] = Field(None, ge=0)