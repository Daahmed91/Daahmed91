"""Process brand profile from guided setup form."""
from __future__ import annotations
from models.brand import (
    BrandProfile, BrandColors, BrandTypography,
    BrandSpacing, ToneOfVoice, LogoInfo
)
from services.brand_store import save_brand


def process_form(data: dict) -> BrandProfile:
    """
    Accepts a flat or nested dict from the wizard form and returns a saved BrandProfile.
    """
    colors = BrandColors(
        primary=data.get("primary_color", "#000000"),
        secondary=data.get("secondary_color", "#ffffff"),
        accent=data.get("accent_color", "#0066cc"),
        background=data.get("background_color", "#ffffff"),
        text=data.get("text_color", "#111111"),
        palette=data.get("palette", []),
    )
    typography = BrandTypography(
        heading_font=data.get("heading_font", "Inter"),
        body_font=data.get("body_font", "Inter"),
    )
    spacing = BrandSpacing(
        base=data.get("spacing_base", "8px"),
    )
    tone = ToneOfVoice(
        personality=data.get("personality", []),
        avoid=data.get("avoid", []),
        example_copy=data.get("example_copy", []),
    )
    logo = LogoInfo(
        description=data.get("logo_description", ""),
        usage_rules=data.get("logo_rules", []),
    )
    profile = BrandProfile(
        name=data.get("brand_name", "My Brand"),
        colors=colors,
        typography=typography,
        spacing=spacing,
        tone_of_voice=tone,
        logo=logo,
        design_principles=data.get("design_principles", []),
        industry=data.get("industry", ""),
        target_audience=data.get("target_audience", ""),
        source="form",
    )
    return save_brand(profile)
