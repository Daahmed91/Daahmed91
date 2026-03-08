"""
BrandMind AI Designer Agent.
Claude claude-sonnet-4-6 with 6 tools that generate on-brand design outputs.
"""
from __future__ import annotations
import json
from typing import AsyncGenerator

import anthropic
from models.brand import BrandProfile
from services import brand_store
from services.generators.image_generator import generate_image
from services.generators.token_generator import generate_tokens

SYSTEM_PROMPT = """You are BrandMind — a world-class AI designer with mastery of:
- Digital design principles: typography, color theory, visual hierarchy, layout, whitespace
- Brand identity: consistency, brand voice, visual language
- Frontend development: React, Next.js, Tailwind CSS, CSS-in-JS, design systems
- Marketing & UX copywriting: headlines, CTAs, microcopy, taglines
- Design tokens and style systems: CSS custom properties, Tailwind config, JSON tokens

You have access to the user's brand profile. You ALWAYS:
1. Call get_brand_profile() at the start of each conversation to load brand guidelines
2. Apply the exact brand colors, fonts, and design principles to every output
3. Reference specific brand values in your explanations ("Using your primary color #FF5733...")
4. Generate production-ready, accessible outputs
5. Think like a senior designer at a top agency — consider business context, hierarchy, and how design choices communicate brand values

When generating design assets, use your tools. When asked for code, generate complete, working code.
When users haven't set up a brand yet, gently guide them to /brand to set up their brand profile first."""

TOOLS = [
    {
        "name": "get_brand_profile",
        "description": "Retrieve the user's brand profile including colors, typography, tone of voice, and design principles. Always call this at the start of a conversation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "brand_id": {
                    "type": "string",
                    "description": "Optional specific brand ID. Omit to get the default brand."
                }
            },
            "required": []
        }
    },
    {
        "name": "update_brand_profile",
        "description": "Update the brand profile with new information learned from the conversation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "brand_id": {"type": "string"},
                "updates": {
                    "type": "object",
                    "description": "Partial updates to the brand profile (e.g. colors, tone_of_voice)"
                }
            },
            "required": ["updates"]
        }
    },
    {
        "name": "generate_design_code",
        "description": "Generate a React/HTML/CSS component that follows the brand guidelines exactly.",
        "input_schema": {
            "type": "object",
            "properties": {
                "component_type": {
                    "type": "string",
                    "description": "e.g. 'hero section', 'navigation bar', 'pricing card', 'button', 'footer'"
                },
                "requirements": {
                    "type": "string",
                    "description": "Specific requirements, content, layout notes"
                },
                "framework": {
                    "type": "string",
                    "enum": ["react-tailwind", "react-css", "html-css"],
                    "description": "Output framework. Default: react-tailwind"
                },
                "brand_context": {
                    "type": "string",
                    "description": "Brand profile context to inject"
                }
            },
            "required": ["component_type", "requirements"]
        }
    },
    {
        "name": "generate_image",
        "description": "Generate a brand-aligned image (logo, banner, illustration, mockup, etc.) using AI image generation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "description": {
                    "type": "string",
                    "description": "Detailed description of the image to generate"
                },
                "style": {
                    "type": "string",
                    "description": "Additional style guidance (e.g. 'flat illustration', 'photography', 'isometric')"
                },
                "size": {
                    "type": "string",
                    "enum": ["1024x1024", "1792x1024", "1024x1792"],
                    "description": "Image dimensions"
                },
                "provider": {
                    "type": "string",
                    "description": "Image generation provider override (openai/stability/fal/google)"
                },
                "model": {
                    "type": "string",
                    "description": "Specific model override"
                }
            },
            "required": ["description"]
        }
    },
    {
        "name": "generate_design_tokens",
        "description": "Generate design tokens from the brand profile in the requested format.",
        "input_schema": {
            "type": "object",
            "properties": {
                "format": {
                    "type": "string",
                    "enum": ["json", "css", "tailwind", "all"],
                    "description": "Token format to generate"
                }
            },
            "required": ["format"]
        }
    },
    {
        "name": "generate_copy",
        "description": "Generate on-brand copy: headlines, taglines, CTAs, product descriptions, UX microcopy, etc.",
        "input_schema": {
            "type": "object",
            "properties": {
                "content_type": {
                    "type": "string",
                    "description": "e.g. 'hero headline', 'CTA button', 'email subject', 'product description', 'error message', 'onboarding step'"
                },
                "context": {
                    "type": "string",
                    "description": "Context about the feature/page/product this copy is for"
                },
                "variations": {
                    "type": "integer",
                    "description": "Number of copy variations to generate (1-5)",
                    "default": 3
                },
                "tone_adjustment": {
                    "type": "string",
                    "description": "Optional tone modifier (e.g. 'more formal', 'more playful', 'shorter')"
                }
            },
            "required": ["content_type", "context"]
        }
    }
]


async def handle_tool_call(
    tool_name: str,
    tool_input: dict,
    brand: BrandProfile | None,
    keys: dict,
) -> tuple[str, dict]:
    """Execute a tool call and return (result_text, metadata)."""
    client = anthropic.AsyncAnthropic(api_key=keys["anthropic"])
    claude_model = keys["claude_model"]

    if tool_name == "get_brand_profile":
        brand_id = tool_input.get("brand_id")
        if brand_id:
            profile = brand_store.get_brand(brand_id)
        else:
            profile = brand_store.get_default_brand()
        if not profile:
            return "No brand profile found. Ask the user to set up their brand at /brand.", {}
        return profile.to_designer_context(), {"type": "brand_profile", "brand_id": profile.id}

    elif tool_name == "update_brand_profile":
        brand_id = tool_input.get("brand_id")
        updates = tool_input.get("updates", {})
        if brand_id:
            brand_store.update_brand(brand_id, updates)
        elif brand:
            brand_store.update_brand(brand.id, updates)
        else:
            return "No brand to update.", {}
        return "Brand profile updated successfully.", {"type": "brand_updated"}

    elif tool_name == "generate_design_code":
        component_type = tool_input.get("component_type", "component")
        requirements = tool_input.get("requirements", "")
        framework = tool_input.get("framework", "react-tailwind")
        brand_context = tool_input.get("brand_context", "")

        if not brand_context and brand:
            brand_context = brand.to_designer_context()

        code = await _generate_code_with_claude(
            component_type, requirements, framework, brand_context, client, claude_model
        )
        return code, {"type": "code", "framework": framework, "component": component_type}

    elif tool_name == "generate_image":
        description = tool_input.get("description", "")
        style = tool_input.get("style", "")
        size = tool_input.get("size", "1024x1024")
        provider = tool_input.get("provider") or keys["image_provider"]
        model = tool_input.get("model") or keys["image_model"]

        if not brand:
            brand = brand_store.get_default_brand() or BrandProfile()

        result = await generate_image(
            description=description,
            brand=brand,
            style=style,
            size=size,
            provider=provider,
            model=model,
            keys=keys,
        )
        return json.dumps(result), {"type": "image", **result}

    elif tool_name == "generate_design_tokens":
        fmt = tool_input.get("format", "all")
        if not brand:
            brand = brand_store.get_default_brand() or BrandProfile()
        tokens = generate_tokens(brand, fmt)
        return json.dumps(tokens), {"type": "tokens", "format": fmt, "tokens": tokens}

    elif tool_name == "generate_copy":
        content_type = tool_input.get("content_type", "")
        context = tool_input.get("context", "")
        variations = min(tool_input.get("variations", 3), 5)
        tone_adjustment = tool_input.get("tone_adjustment", "")

        brand_context = brand.to_designer_context() if brand else ""
        copy_result = await _generate_copy_with_claude(
            content_type, context, variations, tone_adjustment, brand_context, client, claude_model
        )
        return copy_result, {"type": "copy", "content_type": content_type}

    return f"Unknown tool: {tool_name}", {}


async def _generate_code_with_claude(
    component_type: str,
    requirements: str,
    framework: str,
    brand_context: str,
    client: anthropic.AsyncAnthropic,
    model: str,
) -> str:
    framework_instructions = {
        "react-tailwind": "React functional component using Tailwind CSS classes. Use exact brand colors as Tailwind arbitrary values (e.g. bg-[#FF5733]). Export as default.",
        "react-css": "React functional component with a CSS module or styled inline. Use exact brand hex colors.",
        "html-css": "Plain HTML + CSS. Use CSS custom properties from the brand. No frameworks.",
    }
    instructions = framework_instructions.get(framework, framework_instructions["react-tailwind"])

    prompt = f"""Generate a {component_type} ({framework}).

BRAND GUIDELINES:
{brand_context}

REQUIREMENTS:
{requirements}

INSTRUCTIONS:
- {instructions}
- Use EXACT brand colors, fonts, and spacing from the guidelines
- Make it fully responsive
- Include realistic placeholder content that matches the brand's tone
- Add accessibility attributes (aria-label, role, alt text)
- Return ONLY the complete code, no explanation before or after"""

    response = await client.messages.create(
        model=model,
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


async def _generate_copy_with_claude(
    content_type: str,
    context: str,
    variations: int,
    tone_adjustment: str,
    brand_context: str,
    client: anthropic.AsyncAnthropic,
    model: str,
) -> str:
    tone_note = f"\nTone adjustment: {tone_adjustment}" if tone_adjustment else ""

    prompt = f"""Generate {variations} variations of {content_type} copy.

BRAND GUIDELINES:
{brand_context}

CONTEXT:
{context}
{tone_note}

Requirements:
- Strictly follow the brand's tone of voice and personality traits
- Avoid the brand's listed "avoid" words/phrases
- Match the style of the example copy if provided
- Each variation should feel distinct but on-brand
- Format as numbered list

Return ONLY the copy variations, no preamble."""

    response = await client.messages.create(
        model=model,
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


async def run_designer_agent(
    messages: list[dict],
    brand_id: str | None = None,
    keys: dict | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Run the BrandMind agent with streaming.
    Yields server-sent event dicts.
    """
    if keys is None:
        import os
        keys = {
            "anthropic": os.environ.get("ANTHROPIC_API_KEY", ""),
            "claude_model": "claude-sonnet-4-6",
            "openai": os.environ.get("OPENAI_API_KEY", ""),
            "stability": os.environ.get("STABILITY_API_KEY", ""),
            "fal": os.environ.get("FAL_KEY", ""),
            "google": os.environ.get("GOOGLE_API_KEY", ""),
            "image_provider": os.environ.get("IMAGE_PROVIDER", "openai"),
            "image_model": os.environ.get("IMAGE_MODEL", "dall-e-3"),
        }

    client = anthropic.AsyncAnthropic(api_key=keys["anthropic"])
    claude_model = keys["claude_model"]

    brand = None
    if brand_id:
        brand = brand_store.get_brand(brand_id)
    if not brand:
        brand = brand_store.get_default_brand()

    current_messages = list(messages)

    while True:
        async with client.messages.stream(
            model=claude_model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=current_messages,
        ) as stream:
            tool_calls = []
            full_text = ""

            async for event in stream:
                event_type = event.type

                if event_type == "content_block_start":
                    if hasattr(event, "content_block"):
                        if event.content_block.type == "tool_use":
                            tool_calls.append({
                                "id": event.content_block.id,
                                "name": event.content_block.name,
                                "input": "",
                            })

                elif event_type == "content_block_delta":
                    delta = event.delta
                    if delta.type == "text_delta":
                        full_text += delta.text
                        yield {"type": "text", "text": delta.text}
                    elif delta.type == "input_json_delta":
                        if tool_calls:
                            tool_calls[-1]["input"] += delta.partial_json

                elif event_type == "message_stop":
                    pass

            # Get the final message to check stop reason
            final_message = await stream.get_final_message()
            stop_reason = final_message.stop_reason

            if stop_reason == "tool_use":
                # Process all tool calls
                tool_results = []
                for tc in tool_calls:
                    try:
                        tool_input = json.loads(tc["input"]) if tc["input"] else {}
                    except json.JSONDecodeError:
                        tool_input = {}

                    yield {"type": "tool_start", "tool": tc["name"], "input": tool_input}

                    result_text, metadata = await handle_tool_call(
                        tc["name"], tool_input, brand, keys
                    )

                    yield {"type": "tool_result", "tool": tc["name"],
                           "result": result_text, "metadata": metadata}

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tc["id"],
                        "content": result_text,
                    })

                # Add assistant turn + tool results to messages and continue
                current_messages.append({
                    "role": "assistant",
                    "content": final_message.content,
                })
                current_messages.append({
                    "role": "user",
                    "content": tool_results,
                })
                # Continue the loop for the next model response

            else:
                # end_turn or max_tokens — done
                yield {"type": "done"}
                break
