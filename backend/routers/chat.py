"""
Streaming chat endpoint using Server-Sent Events (SSE).
"""
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from agents.designer import run_designer_agent
from dependencies import get_api_keys

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    messages: list[dict]
    brand_id: str | None = None
    image_provider: str | None = None
    image_model: str | None = None


@router.post("/chat")
async def chat(request: Request, body: ChatRequest):
    """
    Streaming chat with the BrandMind AI designer.
    Returns Server-Sent Events (text/event-stream).
    """
    keys = get_api_keys(request)
    # Request-level overrides take priority over header defaults
    if body.image_provider:
        keys["image_provider"] = body.image_provider
    if body.image_model:
        keys["image_model"] = body.image_model

    async def event_stream():
        try:
            async for event in run_designer_agent(
                messages=body.messages,
                brand_id=body.brand_id,
                keys=keys,
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            error_event = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
