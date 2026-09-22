"""Small read-only public source checks. Never prints configured credentials."""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app.services.integrations import gbif_occurrences,nasa_collections,noaa_catalog
from app.services.sources import get_obis,get_taxonomy


async def main():
    tasks={'GBIF':gbif_occurrences((60,5,75,25),'Thunnus albacares',limit=2),
        'NASA CMR':nasa_collections('sea surface temperature',limit=2),
        'NOAA NCEI catalog':noaa_catalog('temperature',2),
        'OBIS':get_obis((60,5,75,25),2,'Thunnus albacares'),
        'WoRMS':get_taxonomy('Thunnus albacares')}
    outcomes=await asyncio.gather(*tasks.values(),return_exceptions=True)
    failed=False
    for name,result in zip(tasks,outcomes):
        if isinstance(result,Exception):
            print(name,'FAILED',getattr(result,'status_code',type(result).__name__))
            failed=True
        else:
            print(name,result['status'],'records:',len(result['results']))
    if failed:
        raise SystemExit(1)


if __name__=='__main__':
    asyncio.run(main())
