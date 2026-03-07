# BrandMind – Deployment Guide

BrandMind has two services:

| Service | Tech | Hosts |
|---------|------|-------|
| **Backend** | Python FastAPI + Playwright | Railway, Render, Fly.io, VPS, Docker |
| **Frontend** | Next.js 14 | Vercel, Netlify, Railway, Docker |

---

## Option A — Docker Compose (recommended for VPS / self-hosting)

Best if you want a single machine running both services (DigitalOcean Droplet,
AWS EC2, Hetzner, etc.).

### 1. Prerequisites

- A server with Docker and Docker Compose installed
- A domain name (optional but recommended)

### 2. Clone the repo and configure

```bash
git clone <your-repo-url> brandmind
cd brandmind
cp .env.example .env
```

Edit `.env` and fill in your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...          # or another image provider
NEXT_PUBLIC_API_URL=https://api.yourdomain.com   # backend public URL
ALLOWED_ORIGINS=https://yourdomain.com           # frontend public URL
```

### 3. Build and start

```bash
docker compose up -d --build
```

- Frontend → http://your-server-ip:3000
- Backend API → http://your-server-ip:8000
- API docs → http://your-server-ip:8000/docs

### 4. Add a reverse proxy (Nginx + HTTPS)

Use Nginx + Certbot to serve both on your domain with HTTPS:

```nginx
# /etc/nginx/sites-available/brandmind
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # SSE streaming — disable buffering
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
    }
}
```

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 5. Update your `.env` and rebuild the frontend

After pointing DNS and enabling HTTPS, update `.env`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Rebuild:

```bash
docker compose up -d --build frontend
docker compose restart backend
```

### Data persistence

Brand profiles are stored in a Docker volume (`brand_data`) at `/app/data`
inside the container. The volume survives container restarts. To back up:

```bash
docker run --rm -v brandmind_brand_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/brand_data_backup.tar.gz /data
```

---

## Option B — Vercel (frontend) + Railway (backend)

Best for fast managed deployment with minimal ops.

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, set **Root Directory** to `backend`
3. Railway auto-detects the `Dockerfile`
4. Add environment variables in Railway's dashboard (all keys from `.env.example`)
5. Add a **Volume** in Railway → mount at `/app/data` for brand persistence
6. Copy your Railway public URL (e.g. `https://brandmind-backend.up.railway.app`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy

### Link them via CORS

In Railway, add environment variable:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://yourdomain.com
```

Redeploy the backend.

---

## Option C — Vercel (frontend) + Render (backend)

Similar to Option B. Render has a free tier but cold starts on free plan.

### Backend → Render

1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Runtime: **Docker**
4. Add env vars from `.env.example`
5. Add a **Disk** under Advanced → mount at `/app/data`, 1 GB

### Frontend → Vercel

Same as Option B above.

---

## Option D — Fly.io (backend) + Vercel (frontend)

Good for low-latency global deployment.

```bash
cd backend
fly launch --name brandmind-backend --region ord
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly secrets set ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
fly volumes create brand_data --size 1
fly deploy
```

Add volume mount to `fly.toml`:
```toml
[mounts]
  source = "brand_data"
  destination = "/app/data"
```

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | **Yes** | Claude API key |
| `OPENAI_API_KEY` | Image gen | DALL-E image generation |
| `STABILITY_API_KEY` | Image gen | Stability AI image generation |
| `FAL_KEY` | Image gen | fal.ai image generation |
| `GOOGLE_API_KEY` | Image gen | Google Imagen generation |
| `IMAGE_PROVIDER` | No | Default: `openai` |
| `IMAGE_MODEL` | No | Default: `dall-e-3` |
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend URL (set at frontend build time) |
| `ALLOWED_ORIGINS` | **Yes** | Comma-separated frontend URLs for CORS |

---

## Important Notes

### SSE Streaming
The chat endpoint streams responses via Server-Sent Events. Make sure your
reverse proxy or load balancer does **not** buffer responses:
- Nginx: `proxy_buffering off;`
- AWS ALB: responses stream fine by default
- Cloudflare: disable "Rocket Loader" and set cache to "No Store" for `/api/*`

### No multi-tenancy
The current brand store (`brands.json`) is a single shared file. All users of
a deployed instance share the same brand profiles. For multi-tenant SaaS,
you would need to add user authentication and per-user brand storage.

### API Key costs
Each user request invokes Claude (Anthropic) and optionally an image generation
API. Monitor your API usage and consider adding rate limiting if deploying
publicly.
