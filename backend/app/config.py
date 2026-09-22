from pathlib import Path
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[1]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / '.env', extra='ignore')
    database_url: str = f"sqlite:///{(ROOT / 'atlas.db').as_posix()}"
    cors_origins: list[str] = ['http://localhost:3000', 'http://127.0.0.1:3000']
    admin_api_key: str | None = None
    http_timeout_seconds: float = Field(20, gt=0, le=60)
    cache_ttl_seconds: int = Field(300, ge=0)
    rate_limit_per_minute: int = Field(120, ge=1, le=10000)
    llm_provider: Literal['gemini', 'ollama', 'disabled'] = 'gemini'
    llm_model: str = 'gemini-2.5-flash'
    gemini_api_key: str | None = None
    ollama_base_url: str = 'http://127.0.0.1:11434'
    embedding_model: str = 'gemini-embedding-001'
    llm_timeout_seconds: float = Field(35, ge=1, le=120)
    ai_timeout_seconds: float = Field(100, ge=1, le=240)
    ai_max_concurrent: int = Field(4, ge=1, le=16)
    rag_max_chunks: int = Field(5000, ge=1, le=50000)
    openalex_api_key: str | None = None
    openalex_enabled: bool = False
    neo4j_uri: str | None = None
    neo4j_user: str = 'neo4j'
    neo4j_password: str | None = None
    neo4j_database: str = 'neo4j'
    gfw_api_key: str | None = None
    iucn_api_key: str | None = None
    copernicusmarine_service_username: str | None = None
    copernicusmarine_service_password: str | None = None

settings = Settings()
