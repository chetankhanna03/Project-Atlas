from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.config import settings
from app.database import engine
from app.database import init_db, database_health
from contextlib import asynccontextmanager
from starlette.concurrency import run_in_threadpool
from app.middleware import RateLimitMiddleware
from app.api import argo, fisheries, biodiversity, oceanography, erddap, taxonomy, protected_areas, search, cache, datasets, ai
from app.api import integrations, source_status, science

@asynccontextmanager
async def lifespan(app):
    try:
        await run_in_threadpool(init_db, engine)
    except SQLAlchemyError:
        raise RuntimeError('Atlas database initialization failed. Check database mode, connectivity and schema; no alternate database was selected.') from None
    yield


app = FastAPI(title='Project Atlas API', description='Grounded ocean intelligence and scientific retrieval', version='0.3.0', lifespan=lifespan)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                   allow_methods=['GET', 'POST', 'PUT', 'DELETE'],
                   allow_headers=['Content-Type', 'X-API-Key'])
for module in (argo, fisheries, biodiversity, oceanography, erddap, taxonomy, protected_areas, search, cache, datasets, ai, integrations, source_status, science):
    app.include_router(module.router)

@app.exception_handler(SQLAlchemyError)
async def database_error(request, exc):
    return JSONResponse(status_code=503, content={'detail': 'Database unavailable or schema not initialized.'})

@app.get('/')
def root():
    return {'project': 'Project Atlas', 'status': 'running', 'docs': '/docs'}

@app.get('/health')
def health():
    return {'status': 'healthy', 'scope': 'process'}

@app.get('/ready')
@app.get('/db-test', include_in_schema=False)
def ready():
    report = database_health(engine)
    return JSONResponse(status_code=200 if report['schema_status'] == 'ready' else 503,
                        content={'status': report['schema_status'], **report})
