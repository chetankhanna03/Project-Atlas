import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import pandas as pd
from app.database import SessionLocal
from app.models import FisheriesLanding, LandingType

def ingest():
    db = SessionLocal()
    xlsx = pd.ExcelFile("Project_Atlas_Marine_Data.xlsx")
    
    # National (species-wise)
    df = xlsx.parse("Fisheries - National", skiprows=3)
    
    # Define year columns with exact names from Excel
    year_columns = {
        2023: '2023 (t)',
        2024: '2024 (t)',
        2025: '2025 (t)'
    }
    
    for _, row in df.iterrows():
        category = row["Category"] if pd.notna(row["Category"]) else None
        species = row["Resource / Species"] if pd.notna(row["Resource / Species"]) else None
        
        for year, col_name in year_columns.items():
            if col_name in row and pd.notna(row[col_name]) and row[col_name] > 0:
                db.add(FisheriesLanding(
                    region="India",
                    category=category,
                    species=species,
                    year=year,
                    landings=float(row[col_name]),
                    type=LandingType.SPECIES
                ))
    
    # State-wise
    df2 = xlsx.parse("Fisheries - Statewise", skiprows=3)
    
    for _, row in df2.iterrows():
        state = row["State / UT"]
        if pd.isna(state) or state == "TOTAL":
            continue
        
        for year, col_name in year_columns.items():
            if col_name in row and pd.notna(row[col_name]) and row[col_name] > 0:
                db.add(FisheriesLanding(
                    region=state,
                    category=None,
                    species=None,
                    year=year,
                    landings=float(row[col_name]),
                    type=LandingType.STATE
                ))
    
    db.commit()
    total = db.query(FisheriesLanding).count()
    print(f"✅ Ingested {total} fisheries records.")
    db.close()

if __name__ == "__main__":
    ingest()