"""Generate design tokens from a brand profile in multiple formats."""
from __future__ import annotations
import json
from models.brand import BrandProfile


def generate_tokens(brand: BrandProfile, format: str = "all") -> dict:
    """
    format: "json" | "css" | "tailwind" | "all"
    Returns dict with the requested formats.
    """
    tokens_json = _build_json_tokens(brand)
    result: dict[str, str] = {}

    if format in ("json", "all"):
        result["json"] = json.dumps(tokens_json, indent=2)

    if format in ("css", "all"):
        result["css"] = _to_css_variables(tokens_json)

    if format in ("tailwind", "all"):
        result["tailwind"] = _to_tailwind_config(brand)

    return result


def _build_json_tokens(brand: BrandProfile) -> dict:
    return {
        "color": {
            "primary": {"value": brand.colors.primary, "type": "color"},
            "secondary": {"value": brand.colors.secondary, "type": "color"},
            "accent": {"value": brand.colors.accent, "type": "color"},
            "background": {"value": brand.colors.background, "type": "color"},
            "text": {"value": brand.colors.text, "type": "color"},
            **{f"palette-{i}": {"value": c, "type": "color"}
               for i, c in enumerate(brand.colors.palette)},
        },
        "typography": {
            "heading-font": {"value": brand.typography.heading_font, "type": "fontFamily"},
            "body-font": {"value": brand.typography.body_font, "type": "fontFamily"},
            **{f"size-{k}": {"value": v, "type": "fontSize"}
               for k, v in brand.typography.font_sizes.items()},
            **{f"weight-{k}": {"value": str(v), "type": "fontWeight"}
               for k, v in brand.typography.font_weights.items()},
        },
        "spacing": {
            "base": {"value": brand.spacing.base, "type": "spacing"},
            **{f"scale-{i}": {"value": f"{v}px", "type": "spacing"}
               for i, v in enumerate(brand.spacing.scale)},
        },
        "brand": {
            "name": brand.name,
            "industry": brand.industry,
            "principles": brand.design_principles,
        },
    }


def _to_css_variables(tokens: dict) -> str:
    lines = [":root {"]
    # Colors
    for key, val in tokens.get("color", {}).items():
        if isinstance(val, dict) and "value" in val:
            lines.append(f"  --color-{key}: {val['value']};")
    # Typography
    for key, val in tokens.get("typography", {}).items():
        if isinstance(val, dict) and "value" in val:
            lines.append(f"  --{key}: {val['value']};")
    # Spacing
    for key, val in tokens.get("spacing", {}).items():
        if isinstance(val, dict) and "value" in val:
            lines.append(f"  --spacing-{key}: {val['value']};")
    lines.append("}")
    return "\n".join(lines)


def _to_tailwind_config(brand: BrandProfile) -> str:
    palette = {f"palette-{i}": c for i, c in enumerate(brand.colors.palette)}
    sizes = {k: v for k, v in brand.typography.font_sizes.items()}
    spacing_scale = {str(i): f"{v}px" for i, v in enumerate(brand.spacing.scale)}

    config = {
        "theme": {
            "extend": {
                "colors": {
                    "primary": brand.colors.primary,
                    "secondary": brand.colors.secondary,
                    "accent": brand.colors.accent,
                    "background": brand.colors.background,
                    "brand-text": brand.colors.text,
                    **palette,
                },
                "fontFamily": {
                    "heading": [brand.typography.heading_font, "sans-serif"],
                    "body": [brand.typography.body_font, "sans-serif"],
                },
                "fontSize": sizes,
                "spacing": spacing_scale,
            }
        }
    }

    return (
        "/** @type {import('tailwindcss').Config} */\n"
        "module.exports = " + json.dumps(config, indent=2)
    )
