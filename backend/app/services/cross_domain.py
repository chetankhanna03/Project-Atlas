"""Descriptive comparison of loaded samples; no interpolation or causal model."""
from datetime import date, datetime, timezone
from statistics import mean, correlation
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator
from app.geo import validate_bbox


class Record(BaseModel):
    model_config = ConfigDict(extra='ignore', allow_inf_nan=False)


class Level(Record):
    pressure_dbar: float
    value: float
    qc: str
    pressure_qc: str


class Profile(Record):
    float_id: str
    cycle: int
    latitude: float
    longitude: float
    time: datetime
    parameter: str
    unit: str
    url: HttpUrl
    levels: list[Level] = Field(max_length=100)


class Effort(Record):
    date: date
    flag: str | None = None
    dataset: str
    apparent_fishing_hours: float = Field(ge=0)


class Query(Record):
    bbox: tuple[float,float,float,float]
    start: date
    end: date

    @model_validator(mode='after')
    def validate(self):
        validate_bbox(*self.bbox)
        if self.start > self.end:
            raise ValueError('Start must precede end.')
        return self


class Provenance(Record):
    url: HttpUrl
    retrieved_at: datetime


class ArgoSample(Record):
    query: Query
    profiles: list[Profile] = Field(max_length=500)
    limitations: list[str] = Field(default_factory=list, max_length=100)


class GfwSample(Record):
    query: Query
    results: list[Effort] = Field(max_length=20000)
    provenance: Provenance
    status: str
    limitations: list[str] = Field(default_factory=list, max_length=100)


class LoadedComparison(Record):
    argo: ArgoSample
    gfw: GfwSample


def analyze(data: LoadedComparison):
    a, g = data.argo, data.gfw
    common = a.query.bbox == g.query.bbox and a.query.start == g.query.start and a.query.end == g.query.end
    w,s,e,n = a.query.bbox
    temperatures, efforts, seen, effort_seen = {}, {}, set(), set()
    sources = {str(g.provenance.url)}
    used_profiles = 0
    if common:
        for profile in a.profiles:
            day = profile.time.astimezone(timezone.utc).date() if profile.time.tzinfo else profile.time.date()
            key = (profile.float_id, profile.cycle, profile.time, profile.latitude, profile.longitude)
            if key in seen or not (s <= profile.latitude <= n and w <= profile.longitude <= e and a.query.start <= day <= a.query.end):
                continue
            seen.add(key)
            if profile.parameter != 'temperature' or profile.unit.lower() not in ('degree_celsius','degree_c','degrees_celsius','degrees_c','celsius'):
                continue
            levels = [level for level in profile.levels if 0 <= level.pressure_dbar <= 10 and level.qc == '1' and level.pressure_qc == '1']
            if not levels:
                continue
            temperatures.setdefault(day, []).append(min(levels, key=lambda level: level.pressure_dbar).value)
            sources.add(str(profile.url)); used_profiles += 1
        for row in g.results:
            key = (row.date,row.flag,row.dataset)
            if key in effort_seen:
                continue
            effort_seen.add(key)
            if g.query.start <= row.date <= g.query.end:
                efforts[row.date] = efforts.get(row.date, 0) + row.apparent_fishing_hours
    pairs = [{'date': str(day), 'x': mean(temperatures[day]), 'y': efforts[day], 'profile_count': len(temperatures[day])}
             for day in sorted(temperatures.keys() & efforts.keys())]
    sufficient = len(pairs) >= 3 and g.status == 'ok'
    x,y = [p['x'] for p in pairs], [p['y'] for p in pairs]
    r = correlation(x,y) if sufficient and len(set(x)) > 1 and len(set(y)) > 1 else None
    return {'status': 'ok' if sufficient else 'insufficient_overlap', 'kind': 'computed',
        'message': 'Descriptive comparison of loaded samples.' if sufficient else 'Insufficient overlapping data for this analysis.',
        'n': len(pairs), 'pearson_r': r, 'profiles_used': used_profiles,
        'x_label': 'Loaded ARGO near-surface profile sample (degrees Celsius)', 'y_label': 'Regional AIS apparent fishing effort (hours)',
        'pairs': pairs, 'sources': sorted(sources), 'bounds': a.query.bbox,
        'date_range': [str(a.query.start), str(a.query.end)],
        'overlap_range': [pairs[0]['date'],pairs[-1]['date']] if pairs else None,
        'summary': {'temperature_mean':mean(x), 'effort_mean_hours':mean(y)} if sufficient else None,
        'spatial_scope': 'Profiles must lie within the same bounding box used for the GFW aggregate; this is not spatial collocation with vessels.',
        'method': 'Shallowest available QC=1 temperature within 0–10 dbar per profile; equal-weight mean of loaded profiles by UTC day. Sum GFW hours across flags. Inner join on exact UTC date. Pearson r is descriptive, not causal.',
        'data_basis': {'observed': ['Loaded ARGO profile samples', 'GFW AIS-derived apparent fishing effort'],
                       'literature': [], 'computed': ['UTC date overlap', 'Daily profile sample means', 'Descriptive statistics; correlation only with at least 3 complete overlapping dates']},
        'limitations': list(dict.fromkeys([
            'Only loaded samples are analyzed; source envelopes are supplied by the client, not independently re-fetched by this calculation.',
            'ARGO samples have unequal spatial coverage and varying shallow pressures; this is not SST or a regional temperature mean.',
            'Missing days are excluded, never zero-filled. Display-level subsampling may omit usable shallow observations.',
            'Fishing effort is not catch. No abundance, significance, trend or causal inference; confounding and autocorrelation are unadjusted.',
            *([] if common else ['Source bounds or requested dates differ; no join performed.']),
            *([] if g.status == 'ok' else ['GFW sample is incomplete or unavailable; correlation withheld.']),
            *a.limitations, *g.limitations]))}
