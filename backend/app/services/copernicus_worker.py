"""One subprocess per bounded request so network/loading can be cancelled."""
import contextlib
import json
import os
import sys


def retrieve(query):
    import copernicusmarine
    import numpy as np
    # Read only a nearest spatial/depth cell; re-check time after selection.
    with copernicusmarine.open_dataset(dataset_id=query['dataset_id'],variables=query['variables'],
        username=query['username'],password=query['password'],
        minimum_longitude=query['longitude'],maximum_longitude=query['longitude'],
        minimum_latitude=query['latitude'],maximum_latitude=query['latitude'],
        minimum_depth=query['depth'],maximum_depth=query['depth'],
        start_datetime=query['start']+'T00:00:00',end_datetime=query['end']+'T23:59:59',
        coordinates_selection_method='nearest') as dataset:
        selected=dataset.sel(time=slice(query['start'],query['end']))
        if sum(selected[v].size for v in query['variables']) > 1000:
            raise ValueError('Subset too large')
        selected.load()
        rows=[]
        for stamp in selected.time.values:
            record={'time':np.datetime_as_string(stamp,unit='s')+'Z',
                'latitude':float(selected.latitude.values.reshape(-1)[0]),
                'longitude':float(selected.longitude.values.reshape(-1)[0]),
                'depth_m':float(selected.depth.values.reshape(-1)[0]) if 'depth' in selected.coords else None}
            for variable in query['variables']:
                value=float(selected[variable].sel(time=stamp).values.reshape(-1)[0])
                record[variable]=value if np.isfinite(value) else None
            if any(record[v] is not None for v in query['variables']):
                rows.append(record)
        return {'status':'ok' if rows else 'no_data','results':rows,
                'units':{v:selected[v].attrs.get('units') for v in query['variables']}}


if __name__ == '__main__':
    request=json.loads(sys.stdin.read())
    # Third-party logs and exception strings must never reveal credentials.
    try:
        with open(os.devnull,'w') as sink, contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
            response=retrieve(request)
    except Exception:
        response={'error':'Copernicus retrieval unavailable. Check credentials and requested product/date coverage.'}
    print(json.dumps(response,allow_nan=False))
