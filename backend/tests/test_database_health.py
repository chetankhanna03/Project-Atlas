from sqlalchemy import create_engine, text
from app.database import init_db, database_health
from app.config import Settings
import pytest


def test_canonical_demo_ignores_legacy_url():
    config = Settings(_env_file=None, database_url='postgresql://unused')
    config.database_mode = 'demo'
    assert config.effective_database_url.endswith('/atlas-local.db')
    config.database_mode = 'configured'
    assert config.effective_database_url == 'postgresql://unused'


def test_complete_initialization_and_mismatch():
    engine = create_engine('sqlite://')
    init_db(engine)
    report = database_health(engine)
    assert report['schema_status'] == 'ready'
    assert set(report['counts']) == {'research_documents','research_chunks','argo_observations','fisheries_landings','science_records'}
    with engine.begin() as connection:
        connection.execute(text('ALTER TABLE research_documents RENAME COLUMN title TO wrong_title'))
    assert database_health(engine)['schema_status'] == 'mismatch'
    with pytest.raises(RuntimeError, match='schema mismatch'):
        init_db(engine)
