# BrandMind — AI Designer System

An AI designer that's an expert on everything digital and follows brand guidelines to the letter.

## What It Does

BrandMind is a conversational AI designer powered by Claude. You load your brand guidelines once (via PDF, guided form, or URL scraping), and then chat to get:

- **Design code** — React/HTML/CSS components that match your exact brand colors, fonts, and principles
- **Image assets** — AI-generated images (hero images, banners, illustrations) with brand-aware prompts
- **Design tokens** — Your brand as JSON, CSS custom properties, or Tailwind config
- **On-brand copy** — Headlines, CTAs, taglines, and UX microcopy that match your tone of voice

## Architecture

```
frontend/   Next.js 14 (TypeScript + Tailwind) — chat UI, brand setup, output previews
backend/    Python FastAPI — AI Designer Agent, brand storage, ingestion pipeline
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
playwright install chromium   # for URL scraping

cp .env.example .env
# Add your API keys to .env

uvicorn main:app --reload --port 8000
```

**Required API keys** (in `backend/.env`):
- `ANTHROPIC_API_KEY` — Required for the AI designer agent
- `OPENAI_API_KEY` — For DALL-E image generation (or use another provider)
- `STABILITY_API_KEY` — Optional: Stability AI image generation
- `FAL_KEY` — Optional: fal.ai (Flux Pro, Ideogram, Recraft)
- `GOOGLE_API_KEY` — Optional: Google Imagen

### Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Brand Setup

Three ways to load your brand:

| Method | How |
|---|---|
| **PDF Upload** | Upload your brand guide PDF — Claude extracts colors, fonts, tone |
| **Setup Wizard** | Fill in a guided multi-step form with live color preview |
| **URL Scraping** | Enter your website URL — we reverse-engineer your brand from CSS |

## Image Generation

Switch between providers from the UI (top bar) — no code changes needed:

| Provider | Top Models |
|---|---|
| OpenAI | DALL-E 3 |
| Stability AI | Stable Image Ultra, SD3 |
| fal.ai | Flux Pro 1.1 Ultra, Ideogram v2, Recraft v3 |
| Google | Imagen 3 |

## Project Structure

```
backend/
├── agents/designer.py          # Claude agent with 6 design tools
├── services/
│   ├── brand_store.py          # JSON-file brand profile storage
│   ├── ingestion/              # PDF parser, URL scraper, form processor
│   └── generators/             # Image, token, copy generators
├── models/brand.py             # Pydantic brand profile model
├── routers/                    # chat, brand, ingest API routes
└── main.py

frontend/src/
├── app/
│   ├── page.tsx                # Main chat interface
│   └── brand/page.tsx          # Brand setup (wizard / upload / URL)
├── components/
│   ├── chat/                   # ChatInterface, MessageBubble, ChatInput
│   ├── brand/                  # BrandWizard, BrandUpload, BrandURLInput
│   ├── outputs/                # CodePreview, ImagePreview, TokensPreview, CopyPreview
│   └── settings/               # ImageModelSelector
└── lib/api.ts                  # API client + SSE stream handler
```
