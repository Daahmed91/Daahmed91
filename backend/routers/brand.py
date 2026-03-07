from fastapi import APIRouter, HTTPException
from models.brand import BrandProfile
from services import brand_store
from services.generators.image_generator import get_providers_config

router = APIRouter(tags=["brand"])


@router.get("/brand", response_model=BrandProfile)
async def get_default_brand():
    profile = brand_store.get_default_brand()
    if not profile:
        # Return an empty default profile
        return BrandProfile()
    return profile


@router.get("/brands")
async def list_brands():
    return [p.model_dump() for p in brand_store.list_brands()]


@router.get("/brand/{brand_id}", response_model=BrandProfile)
async def get_brand(brand_id: str):
    profile = brand_store.get_brand(brand_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Brand not found")
    return profile


@router.put("/brand/{brand_id}", response_model=BrandProfile)
async def update_brand(brand_id: str, updates: dict):
    profile = brand_store.update_brand(brand_id, updates)
    if not profile:
        raise HTTPException(status_code=404, detail="Brand not found")
    return profile


@router.post("/brand/{brand_id}/set-default")
async def set_default(brand_id: str):
    if not brand_store.get_brand(brand_id):
        raise HTTPException(status_code=404, detail="Brand not found")
    brand_store.set_default_brand(brand_id)
    return {"status": "ok"}


@router.get("/image-providers")
async def get_image_providers():
    """Returns available image providers and their models for the frontend selector."""
    return get_providers_config()
