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
    for key in ('gfw_api_key','iucn_api_key','copernicusmarine_service_username','copernicusmarine_service_password','openalex_api_key'):
        monkeypatch.setattr(settings,key,None)
    monkeypatch.setattr(settings,'openalex_enabled',False)
    import app.main as main
    monkeypatch.setattr(main, 'engine', engine)
    clear_cache()
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()
    clear_cache()
