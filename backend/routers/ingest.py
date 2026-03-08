from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from models.brand import BrandProfile
from services.ingestion.form_processor import process_form
from services.ingestion.pdf_parser import parse_pdf_brand
from services.ingestion.url_scraper import scrape_brand_from_url

router = APIRouter(tags=["ingest"])


@router.post("/ingest/form", response_model=BrandProfile)
async def ingest_form(data: dict):
    """Create a brand profile from a wizard form submission."""
    try:
        profile = process_form(data)
        return profile
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/ingest/pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    brand_name: str = Form(default=""),
):
    """Extract brand profile from an uploaded PDF."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    try:
        pdf_bytes = await file.read()
        profile = await parse_pdf_brand(pdf_bytes, brand_name)
        return profile.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")


@router.post("/ingest/url")
async def ingest_url(payload: dict):
    """Scrape a website and extract brand profile."""
    url = payload.get("url", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        profile = await scrape_brand_from_url(url)
        return profile.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL scraping failed: {str(e)}")
