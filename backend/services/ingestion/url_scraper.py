"""
Reverse-engineer a brand from a website URL.
Uses Playwright to render the page, extracts CSS custom properties, fonts,
colors, and text content, then Claude interprets as a brand profile.
"""
from __future__ import annotations
import json
import os
import re
import anthropic
from models.brand import BrandProfile
from services.brand_store import save_brand


async def scrape_brand_from_url(url: str, anthropic_key: str = "") -> BrandProfile:
    """Scrape a URL and extract brand profile using Claude."""
    page_data = await _scrape_page(url)
    return await _extract_brand_from_page_data(page_data, url, anthropic_key)


async def _scrape_page(url: str) -> dict:
    """Render the page with Playwright and extract design data."""
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle", timeout=30000)

        # Extract CSS custom properties (design tokens)
        css_vars = await page.evaluate("""() => {
            const styles = getComputedStyle(document.documentElement);
            const vars = {};
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.style) {
                            for (const prop of rule.style) {
                                if (prop.startsWith('--')) {
                                    vars[prop] = rule.style.getPropertyValue(prop).trim();
                                }
                            }
                        }
                    }
                } catch(e) {}
            }
            return vars;
        }""")

        # Extract computed colors from key elements
        colors = await page.evaluate("""() => {
            const els = ['body', 'h1', 'h2', 'a', 'button', 'nav', 'header', 'footer'];
            const result = {};
            for (const sel of els) {
                const el = document.querySelector(sel);
                if (el) {
                    const s = getComputedStyle(el);
                    result[sel] = {
                        color: s.color,
                        backgroundColor: s.backgroundColor,
                        fontFamily: s.fontFamily,
                        fontSize: s.fontSize,
                    };
                }
            }
            return result;
        }""")

        # Extract fonts in use
        fonts = await page.evaluate("""async () => {
            const fonts = [];
            for (const font of document.fonts) {
                fonts.push(font.family);
            }
            return [...new Set(fonts)];
        }""")

        # Extract visible text for tone analysis (limited)
        text_content = await page.evaluate("""() => {
            const els = document.querySelectorAll('h1,h2,h3,p,li,button,a[href]');
            return Array.from(els).slice(0, 50).map(el => el.innerText).join('\\n');
        }""")

        # Extract page title and meta description
        meta = await page.evaluate("""() => ({
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
        })""")

        await browser.close()

    return {
        "url": url,
        "css_vars": css_vars,
        "colors": colors,
        "fonts": fonts[:20],
        "text_content": text_content[:3000],
        "meta": meta,
    }


async def _extract_brand_from_page_data(page_data: dict, url: str, anthropic_key: str = "") -> BrandProfile:
    """Use Claude to interpret scraped page data as a brand profile."""
    key = anthropic_key or os.environ.get("ANTHROPIC_API_KEY", "")
    client = anthropic.AsyncAnthropic(api_key=key)

    prompt = f"""You are a brand expert. Analyze this website data scraped from {url} and extract a brand profile.

CSS CUSTOM PROPERTIES:
{json.dumps(page_data['css_vars'], indent=2)[:2000]}

COMPUTED ELEMENT STYLES:
{json.dumps(page_data['colors'], indent=2)}

FONTS IN USE:
{json.dumps(page_data['fonts'])}

PAGE META:
{json.dumps(page_data['meta'])}

VISIBLE TEXT (for tone analysis):
{page_data['text_content'][:1500]}

Extract and return a JSON object with exactly this structure:
{{
  "brand_name": "string (from page title/meta)",
  "primary_color": "#hex (most prominent brand color)",
  "secondary_color": "#hex",
  "accent_color": "#hex (CTA/link color)",
  "background_color": "#hex",
  "text_color": "#hex",
  "palette": ["#hex", ...],
  "heading_font": "Font Name",
  "body_font": "Font Name",
  "personality": ["trait1", "trait2"],
  "avoid": [],
  "example_copy": ["headline or tagline from the page"],
  "design_principles": ["principle1"],
  "industry": "inferred industry",
  "target_audience": "inferred audience",
  "logo_description": "",
  "logo_rules": []
}}

Convert rgb() colors to hex. Return ONLY the JSON object."""

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    extracted = json.loads(raw)
    from services.ingestion.form_processor import process_form
    profile = process_form(extracted)
    profile.raw_guidelines_text = page_data["text_content"]
    profile.source = "url"
    profile.source_url = url
    return save_brand(profile)
