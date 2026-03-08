"""
Provider-agnostic image generation.
Supports: OpenAI DALL-E, Stability AI, fal.ai, Google Imagen.
Switch via IMAGE_PROVIDER env var or pass provider/model per-request.
"""
from __future__ import annotations
import os
import base64
from abc import ABC, abstractmethod
from typing import Literal
from models.brand import BrandProfile

DEFAULT_PROVIDER = os.getenv("IMAGE_PROVIDER", "openai")
DEFAULT_MODEL = os.getenv("IMAGE_MODEL", "dall-e-3")

# Registry of available models per provider
PROVIDER_MODELS: dict[str, list[dict]] = {
    "openai": [
        {"id": "dall-e-3", "label": "DALL-E 3", "default": True},
        {"id": "dall-e-2", "label": "DALL-E 2"},
    ],
    "stability": [
        {"id": "stable-image-ultra", "label": "Stable Image Ultra", "default": True},
        {"id": "stable-diffusion-3-large", "label": "SD3 Large"},
        {"id": "stable-diffusion-3-medium", "label": "SD3 Medium"},
        {"id": "sd3-turbo", "label": "SD3 Turbo (fast)"},
    ],
    "fal": [
        {"id": "fal-ai/flux-pro/v1.1-ultra", "label": "Flux Pro 1.1 Ultra", "default": True},
        {"id": "fal-ai/flux-pro", "label": "Flux Pro"},
        {"id": "fal-ai/ideogram/v2", "label": "Ideogram v2"},
        {"id": "fal-ai/recraft-v3", "label": "Recraft v3"},
        {"id": "fal-ai/aura-flow", "label": "AuraFlow"},
    ],
    "google": [
        {"id": "imagen-3.0-generate-002", "label": "Imagen 3", "default": True},
        {"id": "imagen-3.0-fast-generate-001", "label": "Imagen 3 Fast"},
    ],
}


def build_brand_prompt(user_description: str, brand: BrandProfile, style: str = "") -> str:
    """Build a brand-aware image generation prompt."""
    parts = [user_description]
    if brand.design_principles:
        parts.append(f"{', '.join(brand.design_principles)} style")
    if brand.colors.primary and brand.colors.primary != "#000000":
        parts.append(f"featuring the brand color {brand.colors.primary}")
    if brand.tone_of_voice.personality:
        parts.append(f"{', '.join(brand.tone_of_voice.personality[:2])} aesthetic")
    if brand.industry:
        parts.append(f"for {brand.industry} industry")
    if style:
        parts.append(style)
    parts.append("high quality, professional, digital design")
    return ", ".join(parts)


class ImageProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, model: str, size: str = "1024x1024") -> str:
        """Returns a URL or data URI of the generated image."""
        ...


class OpenAIProvider(ImageProvider):
    async def generate(self, prompt: str, model: str = "dall-e-3", size: str = "1024x1024") -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
        # DALL-E 3 supports 1024x1024, 1792x1024, 1024x1792
        valid_sizes = {"dall-e-3": ["1024x1024", "1792x1024", "1024x1792"],
                       "dall-e-2": ["256x256", "512x512", "1024x1024"]}
        allowed = valid_sizes.get(model, ["1024x1024"])
        if size not in allowed:
            size = allowed[0]
        response = await client.images.generate(
            model=model,
            prompt=prompt,
            n=1,
            size=size,
            quality="hd" if model == "dall-e-3" else "standard",
            response_format="url",
        )
        return response.data[0].url


class StabilityProvider(ImageProvider):
    async def generate(self, prompt: str, model: str = "stable-image-ultra", size: str = "1024x1024") -> str:
        import httpx
        api_key = os.environ["STABILITY_API_KEY"]
        width, height = map(int, size.split("x"))
        # Stability AI REST API
        url = f"https://api.stability.ai/v2beta/stable-image/generate/core"
        if "ultra" in model:
            url = "https://api.stability.ai/v2beta/stable-image/generate/ultra"
        elif "sd3" in model or "stable-diffusion-3" in model:
            url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                url,
                headers={"authorization": f"Bearer {api_key}", "accept": "application/json"},
                data={"prompt": prompt, "output_format": "png"},
            )
            response.raise_for_status()
            data = response.json()
            # Returns base64 image
            img_b64 = data.get("image", "")
            return f"data:image/png;base64,{img_b64}"


class FalProvider(ImageProvider):
    async def generate(self, prompt: str, model: str = "fal-ai/flux-pro/v1.1-ultra", size: str = "1024x1024") -> str:
        import fal_client
        width, height = map(int, size.split("x"))
        result = await fal_client.run_async(
            model,
            arguments={
                "prompt": prompt,
                "image_size": {"width": width, "height": height},
                "num_images": 1,
            },
        )
        images = result.get("images", [])
        if images:
            return images[0].get("url", "")
        raise ValueError("No image returned from fal.ai")


class GoogleImagenProvider(ImageProvider):
    async def generate(self, prompt: str, model: str = "imagen-3.0-generate-002", size: str = "1024x1024") -> str:
        from google import genai
        from google.genai import types as genai_types
        client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
        response = await client.aio.models.generate_images(
            model=model,
            prompt=prompt,
            config=genai_types.GenerateImagesConfig(number_of_images=1),
        )
        img = response.generated_images[0].image
        img_b64 = base64.b64encode(img.image_bytes).decode()
        return f"data:image/png;base64,{img_b64}"


_PROVIDERS: dict[str, ImageProvider] = {
    "openai": OpenAIProvider(),
    "stability": StabilityProvider(),
    "fal": FalProvider(),
    "google": GoogleImagenProvider(),
}


async def generate_image(
    description: str,
    brand: BrandProfile,
    style: str = "",
    size: str = "1024x1024",
    provider: str | None = None,
    model: str | None = None,
) -> dict:
    """
    Generate a brand-aware image.
    Returns {"url": str, "provider": str, "model": str, "prompt": str}
    """
    provider = provider or DEFAULT_PROVIDER
    model = model or DEFAULT_MODEL

    if provider not in _PROVIDERS:
        raise ValueError(f"Unknown provider '{provider}'. Choose from: {list(_PROVIDERS)}")

    prompt = build_brand_prompt(description, brand, style)
    adapter = _PROVIDERS[provider]
    url = await adapter.generate(prompt, model, size)
    return {"url": url, "provider": provider, "model": model, "prompt": prompt}


def get_providers_config() -> dict:
    """Returns the provider/model registry for the frontend selector."""
    return PROVIDER_MODELS
