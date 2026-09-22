"""Small opt-in live source check. No database reads/writes or bulk downloads."""
import asyncio
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.sources import get_sst, get_obis, get_taxonomy

async def main():
    names = ['erddap', 'obis', 'worms']
    results = await asyncio.gather(get_sst(15, 65, 2), get_obis((64, 14, 66, 16), 2),
                                   get_taxonomy('Thunnus albacares'), return_exceptions=True)
    failed = False
    for name, result in zip(names, results):
        if isinstance(result, Exception):
            failed = True
            print(json.dumps({'source': name, 'status': 'failed', 'detail': getattr(result, 'detail', type(result).__name__)}))
        else:
            print(json.dumps({'source': name, 'status': result['status'], 'count': result['count'], 'provenance': result['provenance']}))
    return int(failed)

if __name__ == '__main__':
    raise SystemExit(asyncio.run(main()))
