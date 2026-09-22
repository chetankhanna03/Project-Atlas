"""Import a small, user-supplied landings CSV after verifying its source and license."""
import argparse
import csv
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field
from app.database import SessionLocal
from app.models import FisheriesLanding, LandingType

class Landing(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False, str_strip_whitespace=True)
    region: str = Field(min_length=1, max_length=200)
    category: str | None = None
    species: str | None = None
    year: int = Field(ge=1900, le=2100)
    landings: float = Field(ge=0)
    type: LandingType

def ingest(path):
    path = Path(path)
    if path.stat().st_size > 1_000_000:
        raise ValueError('CSV must be at most 1 MB.')
    with path.open(encoding='utf-8-sig', newline='') as stream:
        rows = list(csv.DictReader(stream))
    if len(rows) > 1000:
        raise ValueError('At most 1000 records per import.')
    validated = [Landing.model_validate({k: None if v == '' else v for k,v in row.items()}) for row in rows]
    created = 0
    with SessionLocal.begin() as db:
        for row in validated:
            values = row.model_dump()
            if db.query(FisheriesLanding).filter_by(**values).first() is None:
                db.add(FisheriesLanding(**values))
                db.flush()
                created += 1
    return created

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    args = parser.parse_args()
    print(f'Imported {ingest(args.csv)} landings; exact duplicate rows skipped.')

if __name__ == '__main__':
    main()
