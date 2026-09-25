from fastapi import APIRouter
from app.config import settings
from app.api.datasets import CATALOG
from app.services import copernicus, argo_gdac

router=APIRouter(prefix='/api/sources',tags=['catalog'])


@router.get('')
def sources():
    configuration={
        'gfw':(bool(settings.gfw_api_key),['GFW_API_KEY']),
        'iucn':(bool(settings.iucn_api_key),['IUCN_API_KEY']),
        'copernicus':(copernicus.configured(),['COPERNICUSMARINE_SERVICE_USERNAME','COPERNICUSMARINE_SERVICE_PASSWORD']),
        'openalex':(bool(settings.openalex_enabled and settings.openalex_api_key),['OPENALEX_ENABLED','OPENALEX_API_KEY']),
    }
    entries=[]
    for item in CATALOG:
        configured,required=configuration.get(item['id'],(True,[]))
        status='configured' if required and configured else 'needs_credentials' if required else 'public_access'
        if item['id']=='argo':
            status='index_available' if argo_gdac.INDEX_PATH.exists() else 'needs_index'
        elif item['access']=='local-import':
            status='requires_import'
        entries.append({**item,'status':status,'required_settings':required})
    for identifier,name in [('edna','eDNA sample register'),('otolith','Otolith specimen register')]:
        entries.append({'id':identifier,'name':name,'domain':'molecular' if identifier=='edna' else 'morphology',
                        'source':'User-supplied validated metadata','access':'local-import', 'status':'requires_import',
                        'required_settings':['ADMIN_API_KEY'], 'endpoint':f'/api/science/records/{identifier}',
                        'limitations':'Validated storage and reported annotations only. No automated species matching or classification.'})
    for identifier,name in [('incois','INCOIS'),('fishbase','FishBase'),('wdpa','Protected Planet / WDPA')]:
        entries.append({'id':identifier,'name':name,'domain':'pending','source':name,'access':'not_connected',
                        'status':'needs_product_selection','required_settings':[],
                        'limitations':'Choose a specific dataset/service and confirm its access contract. No generic connector is active.'})
    return {'sources':entries,'count':len(entries),'note':'Configuration and implemented capabilities only; not a live provider health check.'}
