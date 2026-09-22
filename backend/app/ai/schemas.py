from datetime import date
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

Domain = Literal['ocean', 'fisheries', 'biodiversity', 'research']


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True, allow_inf_nan=False)


class Scope(StrictModel):
    region: str | None = Field(None, max_length=100)
    latitude: float | None = Field(None, ge=-89.99, le=89.99)
    longitude: float | None = Field(None, ge=-179.99, le=180)
    bbox: tuple[float, float, float, float] | None = None
    species: str | None = Field(None, max_length=160)
    start_date: date | None = None
    end_date: date | None = None
    days: int = Field(7, ge=1, le=31)
    parameter: Literal['sst', 'temperature', 'salinity', 'currents', 'sea_level', 'chlorophyll', 'oxygen'] = 'sst'

    @model_validator(mode='after')
    def valid_scope(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError('Latitude and longitude must be provided together.')
        if self.bbox:
            w, s, e, n = self.bbox
            if not (-180 <= w < e <= 180 and -90 <= s < n <= 90):
                raise ValueError('Expected bbox west,south,east,north; split dateline-crossing boxes.')
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError('start_date must precede end_date.')
        return self


class Turn(StrictModel):
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=6000)


class ChatRequest(StrictModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Turn] = Field(default_factory=list, max_length=8)
    context: Scope | None = None
    document_ids: list[Annotated[str, Field(min_length=1, max_length=80)]] = Field(default_factory=list, max_length=20)
    use_literature_search: bool = False


class Plan(StrictModel):
    domains: list[Domain] = Field(default_factory=list, max_length=4)
    scope: Scope = Field(default_factory=Scope)
    research_query: str = Field('', max_length=1000)
    clarification: str | None = Field(None, max_length=500)
    limitations: list[str] = Field(default_factory=list, max_length=12)
    planner_mode: Literal['model', 'rules'] = 'rules'


class Evidence(StrictModel):
    id: str
    domain: Domain
    title: str
    text: str
    source: str
    url: str | None = None
    retrieved_at: str | None = None
    source_last_updated: str | None = None
    dataset_version: str | None = None
    document_id: str | None = None
    page: int | None = None
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    doi: str | None = None
    kind: Literal['observation', 'literature', 'local_unverified', 'metadata'] = 'observation'
    metadata: dict = Field(default_factory=dict)


class AgentResult(StrictModel):
    domain: Domain
    status: Literal['ok', 'partial', 'no_data', 'unavailable', 'needs_input', 'unsupported']
    evidence: list[Evidence] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    visualizations: list[dict] = Field(default_factory=list)
    elapsed_ms: int = 0


class Claim(StrictModel):
    text: str = Field(min_length=1, max_length=1200)
    evidence_ids: list[str] = Field(min_length=1, max_length=6)


class GeneratedAnswer(StrictModel):
    claims: list[Claim] = Field(min_length=1, max_length=8)


class ChatResponse(StrictModel):
    request_id: str
    status: Literal['ok', 'partial', 'no_data', 'needs_input', 'unavailable']
    answer: str
    mode: Literal['model', 'evidence_only']
    plan: Plan
    claims: list[Claim] = Field(default_factory=list)
    citations: list[Evidence] = Field(default_factory=list)
    agents: list[AgentResult] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    follow_ups: list[str] = Field(default_factory=list)
    visualizations: list[dict] = Field(default_factory=list)
    knowledge_graph: dict = Field(default_factory=dict)
    elapsed_ms: int = 0


class DocumentInput(StrictModel):
    title: str = Field(min_length=1, max_length=300)
    text: str = Field(min_length=50, max_length=120000)
    source_url: HttpUrl
    authors: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(default_factory=list, max_length=30)
    year: int | None = Field(None, ge=1800, le=2100)
    doi: str | None = Field(None, max_length=200)
    license: str = Field(min_length=1, max_length=200)
    use_embeddings: bool = True
