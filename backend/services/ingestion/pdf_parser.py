"""
Extract brand guidelines from a PDF file.
Uses PyMuPDF to extract text, then Claude to parse structured brand info.
"""
from __future__ import annotations
import json
import os
import re
import anthropic
from models.brand import BrandProfile
from services.brand_store import save_brand


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    import fitz  # PyMuPDF
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text())
    doc.close()
    return "\n\n".join(pages)


async def parse_pdf_brand(pdf_bytes: bytes, brand_name: str = "") -> BrandProfile:
    """Extract a BrandProfile from PDF bytes using Claude."""
    text = extract_text_from_pdf(pdf_bytes)
    # Truncate to avoid token limits (keep most relevant content)
    text_excerpt = text[:12000]

    client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    prompt = f"""You are a brand expert. Analyze this brand guidelines document and extract structured brand information.

BRAND GUIDELINES DOCUMENT:
{text_excerpt}

Extract and return a JSON object with exactly this structure (use null for unknown fields):
{{
  "brand_name": "string",
  "primary_color": "#hex",
  "secondary_color": "#hex",
  "accent_color": "#hex",
  "background_color": "#hex",
  "text_color": "#hex",
  "palette": ["#hex", ...],
  "heading_font": "Font Name",
  "body_font": "Font Name",
  "personality": ["trait1", "trait2"],
  "avoid": ["thing to avoid"],
  "example_copy": ["example sentence 1"],
  "design_principles": ["principle1", "principle2"],
  "industry": "industry name",
  "target_audience": "description",
  "logo_description": "text description of the logo",
  "logo_rules": ["usage rule 1"]
}}

Return ONLY the JSON object, no explanation."""

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    extracted = json.loads(raw)
    if brand_name:
        extracted["brand_name"] = brand_name

    from services.ingestion.form_processor import process_form
    profile = process_form(extracted)
    profile.raw_guidelines_text = text[:4000]
    profile.source = "pdf"
    return save_brand(profile)
