from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.config import settings
from app.database import engine
from app.middleware import RateLimitMiddleware
from app.api import argo, fisheries, biodiversity, oceanography, erddap, taxonomy, protected_areas, search, cache, datasets, ai
from app.api import integrations, source_status, science

app = FastAPI(title='Project Atlas API', description='Grounded ocean intelligence and scientific retrieval', version='0.3.0')
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
    with engine.connect() as connection:
        connection.execute(text('SELECT 1 FROM argo_observations LIMIT 1'))
        connection.execute(text('SELECT 1 FROM fisheries_landings LIMIT 1'))
        connection.execute(text('SELECT 1 FROM research_chunks LIMIT 1'))
    return {'status': 'ready', 'database': 'connected'}
