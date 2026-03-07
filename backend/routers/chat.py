"""
Streaming chat endpoint using Server-Sent Events (SSE).
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from agents.designer import run_designer_agent

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    messages: list[dict]
    brand_id: str | None = None
    image_provider: str | None = None
    image_model: str | None = None


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Streaming chat with the BrandMind AI designer.
    Returns Server-Sent Events (text/event-stream).
    """
    async def event_stream():
        try:
            async for event in run_designer_agent(
                messages=request.messages,
                brand_id=request.brand_id,
                image_provider=request.image_provider,
                image_model=request.image_model,
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
