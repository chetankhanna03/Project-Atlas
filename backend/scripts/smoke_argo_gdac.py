"""One bounded public profile request using the local GDAC metadata index."""
import asyncio
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.argo_gdac import get_profiles


async def main():
    result = await get_profiles((50, 5, 78, 26), limit=1)
    print(json.dumps({key: result[key] for key in ('status','source','query','errors','index')}))
    for profile in result['profiles']:
        print(json.dumps({**{key: profile[key] for key in ('float_id','cycle','time','latitude','longitude','data_mode','variable','unit','url','matching_levels')},
                          'sample': profile['levels'][:3]}))
    if not result['profiles']:
        raise SystemExit('No QC-approved profile returned; inspect status/errors and index freshness.')


if __name__ == '__main__':
    asyncio.run(main())
