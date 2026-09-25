import os
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['ADMIN_API_KEY'] = 'test-private-key'

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app.api import search
from app.utils.cache import clear_cache

@pytest.fixture
def client(monkeypatch, tmp_path):
    from app.services import argo_gdac
    monkeypatch.setattr(argo_gdac, 'INDEX_PATH', tmp_path / 'argo-index.db')
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    def override_db():
        with sessions() as db:
            yield db
    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr(search, 'SessionLocal', sessions)
    from app.ai import rag, agents
    from app.api import ai
    for module in (rag, agents, ai):
        monkeypatch.setattr(module, 'SessionLocal', sessions)
    from app.config import settings
    monkeypatch.setattr(settings, 'llm_provider', 'disabled')
    monkeypatch.setattr(settings, 'knowledge_retrieval', 'hybrid')
    monkeypatch.setattr(settings, 'development_mode', False)
    from app.ai import rerank
    # Deterministic semantic service stub; dedicated reranker tests exercise selection.
    monkeypatch.setattr(rerank, 'semantic_scores', lambda query, items: [(0.9,0.9) for item in items])
    monkeypatch.setattr(settings,'embedding_provider','auto')
    monkeypatch.setattr(settings,'openrouter_api_key',None)
    for key in ('gfw_api_key','iucn_api_key','copernicusmarine_service_username','copernicusmarine_service_password','openalex_api_key'):
        monkeypatch.setattr(settings,key,None)
    monkeypatch.setattr(settings,'openalex_enabled',False)
    import app.main as main
    monkeypatch.setattr(main, 'engine', engine)
    clear_cache()
    # Each test gets an independent request budget, like an independent client.
    from app.middleware import RateLimitMiddleware
    middleware = app.middleware_stack
    while middleware is not None:
        if isinstance(middleware, RateLimitMiddleware):
            middleware.clients.clear()
        middleware = getattr(middleware, 'app', None)
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()
    clear_cache()
