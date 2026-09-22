from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

class ArgoObservationCreate(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False, str_strip_whitespace=True)
    float_id: str = Field(min_length=1, max_length=50)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    observation_time: datetime
    depth: float | None = Field(None, ge=0)
    temperature: float | None = None
    salinity: float | None = Field(None, ge=0)

    @field_validator('observation_time')
    @classmethod
    def utc_time(cls, value):
        if value.tzinfo is None:
            raise ValueError('Include a timezone, e.g. 2025-01-01T00:00:00Z.')
        return value.astimezone(timezone.utc).replace(tzinfo=None)

class ArgoObservationUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False, str_strip_whitespace=True)
    float_id: str | None = Field(None, min_length=1, max_length=50)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    observation_time: datetime | None = None
    depth: float | None = Field(None, ge=0)
    temperature: float | None = None
    salinity: float | None = Field(None, ge=0)

    @model_validator(mode='after')
    def validate_update(self):
        for key in ('float_id', 'latitude', 'longitude', 'observation_time'):
            if key in self.model_fields_set and getattr(self, key) is None:
                raise ValueError(f'{key} cannot be null')
        if self.observation_time is not None:
            self.observation_time = ArgoObservationCreate.utc_time(self.observation_time)
        return self

class ArgoObservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    float_id: str
    latitude: float
    longitude: float
    observation_time: datetime
    depth: float | None
    temperature: float | None
    salinity: float | None

    @field_validator('observation_time')
    @classmethod
    def mark_utc(cls, value):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
