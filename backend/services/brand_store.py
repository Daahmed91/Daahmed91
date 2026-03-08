"""
JSON-file-based brand profile store.
Stores all brand profiles in data/brands.json.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Optional

from models.brand import BrandProfile

DATA_DIR = Path(__file__).parent.parent / "data"
BRANDS_FILE = DATA_DIR / "brands.json"
DEFAULT_BRAND_ID_FILE = DATA_DIR / "default_brand.txt"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    if not BRANDS_FILE.exists():
        BRANDS_FILE.write_text("{}")
    if not DEFAULT_BRAND_ID_FILE.exists():
        DEFAULT_BRAND_ID_FILE.write_text("")


def _load_all() -> dict[str, dict]:
    _ensure_data_dir()
    return json.loads(BRANDS_FILE.read_text())


def _save_all(data: dict[str, dict]) -> None:
    _ensure_data_dir()
    BRANDS_FILE.write_text(json.dumps(data, indent=2))


def get_brand(brand_id: str) -> Optional[BrandProfile]:
    data = _load_all()
    raw = data.get(brand_id)
    if raw is None:
        return None
    return BrandProfile(**raw)


def get_default_brand() -> Optional[BrandProfile]:
    _ensure_data_dir()
    brand_id = DEFAULT_BRAND_ID_FILE.read_text().strip()
    if not brand_id:
        # Return first brand if any
        data = _load_all()
        if data:
            first_id = next(iter(data))
            return BrandProfile(**data[first_id])
        return None
    return get_brand(brand_id)


def save_brand(profile: BrandProfile) -> BrandProfile:
    data = _load_all()
    data[profile.id] = profile.model_dump()
    _save_all(data)
    # Set as default if first brand
    _ensure_data_dir()
    if not DEFAULT_BRAND_ID_FILE.read_text().strip():
        DEFAULT_BRAND_ID_FILE.write_text(profile.id)
    return profile


def set_default_brand(brand_id: str) -> None:
    _ensure_data_dir()
    DEFAULT_BRAND_ID_FILE.write_text(brand_id)


def update_brand(brand_id: str, updates: dict) -> Optional[BrandProfile]:
    data = _load_all()
    if brand_id not in data:
        return None
    existing = data[brand_id]
    # Deep merge for nested dicts
    _deep_merge(existing, updates)
    profile = BrandProfile(**existing)
    data[brand_id] = profile.model_dump()
    _save_all(data)
    return profile


def list_brands() -> list[BrandProfile]:
    data = _load_all()
    return [BrandProfile(**v) for v in data.values()]


def _deep_merge(base: dict, updates: dict) -> None:
    for key, value in updates.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value
