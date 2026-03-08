"""
FastAPI dependency for extracting API keys from request headers.
Keys in headers take priority over environment variables, enabling
the frontend to supply keys without requiring a server-side .env file.
"""
import os
from fastapi import Request


def get_api_keys(request: Request) -> dict:
    """Extract API keys from request headers, falling back to environment variables."""
    return {
        "anthropic": request.headers.get("X-Anthropic-Key") or os.environ.get("ANTHROPIC_API_KEY", ""),
        "claude_model": request.headers.get("X-Claude-Model") or "claude-sonnet-4-6",
        "openai": request.headers.get("X-OpenAI-Key") or os.environ.get("OPENAI_API_KEY", ""),
        "stability": request.headers.get("X-Stability-Key") or os.environ.get("STABILITY_API_KEY", ""),
        "fal": request.headers.get("X-Fal-Key") or os.environ.get("FAL_KEY", ""),
        "google": request.headers.get("X-Google-Key") or os.environ.get("GOOGLE_API_KEY", ""),
        "image_provider": request.headers.get("X-Image-Provider") or os.environ.get("IMAGE_PROVIDER", "openai"),
        "image_model": request.headers.get("X-Image-Model") or os.environ.get("IMAGE_MODEL", "dall-e-3"),
    }
