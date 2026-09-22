"""Explicit, bounded import of user-supplied ARGO CSV; never invent missing values."""
import argparse
import csv
from pathlib import Path
from app.database import SessionLocal
from app.models import ArgoObservation
from app.schemas import ArgoObservationCreate

def ingest_argo(path):
    path = Path(path)
    if path.stat().st_size > 1_000_000:
        raise ValueError('CSV must be at most 1 MB.')
    with path.open(encoding='utf-8-sig', newline='') as stream:
        rows = list(csv.DictReader(stream))
    if len(rows) > 1000:
        raise ValueError('At most 1000 records per import.')
    validated = [ArgoObservationCreate.model_validate({k: None if v == '' else v for k,v in row.items()}) for row in rows]
    created = 0
    with SessionLocal.begin() as db:
        for record in validated:
            values = record.model_dump()
            existing = db.query(ArgoObservation).filter_by(**values).first()
            if existing is None:
                db.add(ArgoObservation(**values))
                db.flush()
                created += 1
    return created

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path, help='Validated observation CSV with timezone-aware observation_time')
    args = parser.parse_args()
    print(f'Imported {ingest_argo(args.csv)} observations; exact duplicate rows skipped.')

if __name__ == '__main__':
    main()
