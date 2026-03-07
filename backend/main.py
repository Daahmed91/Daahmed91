import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, brand, ingest

app = FastAPI(title="BrandMind API", version="1.0.0")

# ALLOWED_ORIGINS env var: comma-separated list of allowed frontend URLs
# e.g. "https://yourdomain.com,https://www.yourdomain.com"
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(brand.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "BrandMind API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
