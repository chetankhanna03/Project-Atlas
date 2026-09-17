from fastapi import APIRouter, Query, HTTPException
import httpx
from app.database import SessionLocal
from app.models import TaxonomyCache
from datetime import datetime

router = APIRouter(prefix="/api/taxonomy", tags=["taxonomy"])

@router.get("/resolve")
async def resolve_species(
    name: str = Query(..., description="Scientific or common name"),
    force_refresh: bool = Query(False, description="Force refresh from WoRMS")
):
    db = SessionLocal()
    if not force_refresh:
        cached = db.query(TaxonomyCache).filter(
            TaxonomyCache.scientific_name.ilike(name)
        ).first()
        if cached:
            return {
                "source": "cache",
                "scientific_name": cached.scientific_name,
                "aphia_id": cached.aphia_id,
                "rank": cached.rank,
                "parent_aphia_id": cached.parent_aphia_id,
                "kingdom": cached.kingdom,
                "phylum": cached.phylum,
                "class_name": cached.class_name,
                "order_name": cached.order_name,
                "family": cached.family,
                "genus": cached.genus,
                "last_updated": cached.last_updated
            }
    url = "https://www.marinespecies.org/rest/AphiaRecordsByName"
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(url, params={"scientificname": name, "like": "true"})
            resp.raise_for_status()
            data = resp.json()
            if not data:
                return {"error": f"Species '{name}' not found in WoRMS"}
            match = data[0]
            cached = TaxonomyCache(
                scientific_name=match.get("scientificname"),
                aphia_id=match.get("AphiaID"),
                rank=match.get("rank"),
                parent_aphia_id=match.get("parent", {}).get("AphiaID") if match.get("parent") else None,
                kingdom=match.get("kingdom"),
                phylum=match.get("phylum"),
                class_name=match.get("class"),
                order_name=match.get("order"),
                family=match.get("family"),
                genus=match.get("genus"),
                last_updated=datetime.utcnow()
            )
            db.add(cached)
            db.commit()
            return {
                "source": "worms",
                "scientific_name": match.get("scientificname"),
                "aphia_id": match.get("AphiaID"),
                "rank": match.get("rank"),
                "parent_aphia_id": match.get("parent", {}).get("AphiaID") if match.get("parent") else None,
                "kingdom": match.get("kingdom"),
                "phylum": match.get("phylum"),
                "class_name": match.get("class"),
                "order_name": match.get("order"),
                "family": match.get("family"),
                "genus": match.get("genus"),
                "authority": match.get("authority"),
                "status": match.get("status")
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()