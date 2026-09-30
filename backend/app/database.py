from sqlalchemy import create_engine, text, inspect, select, func
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

class Base(DeclarativeBase):
    pass

connect_args = ({'check_same_thread': False} if settings.effective_database_url.startswith('sqlite')
                else {'connect_timeout': 5})
engine = create_engine(settings.effective_database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False)

def get_db():
    with SessionLocal() as db:
        try:
            yield db
        except Exception:
            db.rollback()
            raise

def init_db(target=None):
    target = target if target is not None else engine
    from app import models
    from app.ai import models as ai_models
    from app.api import science
    if target.dialect.name == 'postgresql':
        with target.begin() as connection:
            connection.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
    Base.metadata.create_all(target)
    report = database_health(target)
    if report['schema_status'] != 'ready':
        raise RuntimeError('Atlas database schema mismatch: ' + str(report['missing']))


def database_health(target=None):
    target = target if target is not None else engine
    inspector = inspect(target)
    existing = set(inspector.get_table_names())
    missing = {}
    for name, table in Base.metadata.tables.items():
        columns = {c['name'] for c in inspector.get_columns(name)} if name in existing else set()
        absent = set(table.columns.keys()) - columns
        if absent:
            missing[name] = sorted(absent)
    counts = {}
    if not missing:
        with target.connect() as connection:
            for name in ('research_documents', 'research_chunks', 'argo_observations', 'fisheries_landings', 'science_records'):
                counts[name] = connection.scalar(select(func.count()).select_from(Base.metadata.tables[name]))
    return {'database_type': target.dialect.name, 'mode': settings.database_mode,
            'database_name': 'atlas-local.db' if settings.database_mode == 'demo' else 'configured database',
            'schema_status': 'mismatch' if missing else 'ready', 'missing': missing, 'counts': counts}
