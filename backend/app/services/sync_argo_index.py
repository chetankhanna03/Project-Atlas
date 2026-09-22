"""Explicit metadata-only refresh: python -m app.services.sync_argo_index."""
import csv
import gzip
import os
import sqlite3
import tempfile
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
import httpx
from app.services.argo_gdac import INDEX_PATH, INDEX_URL, PROFILE_PATH


def build_index(archive, destination, metadata):
    with closing(sqlite3.connect(destination)) as db, db:
        db.execute('CREATE TABLE profiles (file TEXT PRIMARY KEY, date TEXT, latitude REAL, longitude REAL, date_update TEXT)')
        db.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT)')
        count, total, batch = 0, 0, []
        with gzip.open(archive, 'rt', encoding='utf-8') as stream:
            def lines():
                nonlocal total
                for line in stream:
                    total += len(line)
                    if total > 1_000_000_000 or len(line) > 4096:
                        raise ValueError('Index exceeds parsing budget')
                    if not line.startswith('#'):
                        yield line
            reader = csv.DictReader(lines())
            if not {'file','date','latitude','longitude','date_update'} <= set(reader.fieldnames or []):
                raise ValueError('Unexpected ARGO index columns')
            for row in reader:
                if not PROFILE_PATH.fullmatch(row['file']):
                    continue
                try:
                    lat, lon = float(row['latitude']), float(row['longitude'])
                    datetime.strptime(row['date'], '%Y%m%d%H%M%S')
                    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                        continue
                except (ValueError, TypeError):
                    continue
                batch.append((row['file'], row['date'], lat, lon, row['date_update']))
                count += 1
                if count > 5_000_000:
                    raise ValueError('Index record budget exceeded')
                if len(batch) == 5000:
                    db.executemany('INSERT INTO profiles VALUES (?,?,?,?,?)', batch)
                    batch.clear()
            db.executemany('INSERT INTO profiles VALUES (?,?,?,?,?)', batch)
        if not count:
            raise ValueError('Refusing to replace index with an empty index')
        db.execute('CREATE INDEX profile_date ON profiles(date DESC)')
        db.execute('CREATE INDEX profile_location ON profiles(latitude,longitude,date)')
        db.executemany('INSERT INTO metadata VALUES (?,?)', {**metadata, 'profile_count': str(count)}.items())
    return count


def main():
    # Same filesystem permits atomic publication; failed refresh leaves old index intact.
    with tempfile.TemporaryDirectory(prefix='argo-sync-', dir=INDEX_PATH.parent) as temp:
        archive, candidate = Path(temp)/'index.gz', Path(temp)/'index.db'
        print('Downloading Coriolis profile metadata (no profile archive)...', flush=True)
        with httpx.stream('GET', INDEX_URL, timeout=60) as response:
            response.raise_for_status()
            size = 0
            with archive.open('wb') as output:
                for chunk in response.iter_bytes():
                    size += len(chunk)
                    if size > 100_000_000:
                        raise ValueError('Compressed index exceeds 100 MB')
                    output.write(chunk)
            metadata = {'url': INDEX_URL, 'retrieved_at': datetime.now(timezone.utc).isoformat(),
                        'source_last_updated': response.headers.get('last-modified','')}
        print(f'Index downloaded ({size:,} bytes); building geographic lookup...', flush=True)
        count = build_index(archive, candidate, metadata)
        os.replace(candidate, INDEX_PATH)
        print(f'Ready: {count:,} profile entries in {INDEX_PATH.name}', flush=True)


if __name__ == '__main__':
    main()
