# LegacyLoop — AI-Powered Estate & Garage Sale Platform

Snap a photo, get an instant AI price, and sell to real buyers. Built for estate cleanouts, garage sales, and everyday resellers.

> **Current scale (May 2026):** 51 Prisma models · 278 API routes · 14 AI systems · ~198 skill packs · zero TypeScript errors · PWA-installable · LIVE at `app.legacy-loop.com`.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router), React 19, TypeScript 5
- **Styling:** Inline `style={{}}` discipline + CSS custom properties for theme tokens (light/dark) in `app/globals.css`. Tailwind CSS 4 is a dev-dependency for build infrastructure only — not the app styling system.
- **Database:** Prisma 6 with SQLite (`file:./dev.db`) for dev / Turso (LibSQL edge) for production via `@prisma/adapter-libsql`. `lib/db.ts` enforces a 3-rail DEV/PROD isolation guard (post-R2 doctrine).
- **Payments:** Stripe (sandbox + production). LegacyLoop Tech LLC formed April 10 2026.
- **AI (MegaBot 4-AI consensus):** OpenAI · Anthropic Claude · Google Gemini · xAI Grok — all routed via LiteLLM Gateway (`localhost:8000` in DEV) for telemetry lock. 3 Ollama local aliases (`llama-3.2-local` · `qwen-coder-2.5-local` · `deepseek-r1-local`) + 4 Sonar aliases via the same Gateway. ~198 skill packs across 13 specialist bots.
- **Shipping:** Multi-carrier — Shippo + ShipEngine + EasyPost + FedEx + ARTA (white-glove fine art / freight).
- **Comps:** eBay API + Rainforest API.
- **Automation:** n8n droplet at `n8n.legacy-loop.com` (DigitalOcean · self-healing per AUTORESTART + HEALTHCHECK-CRON).
- **Email · SMS · Photos:** SendGrid · Twilio · Cloudinary.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.example .env

# 3. Add your API keys to .env
#    Required: OPENAI_API_KEY, JWT_SECRET
#    Optional: ANTHROPIC_API_KEY, GEMINI_API_KEY, XAI_API_KEY, STRIPE_SECRET_KEY, SHIPPO_API_KEY, SENDGRID_API_KEY, CLOUDINARY_API_KEY

# 4. Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Demo Data

1. Start the dev server (`npm run dev`)
2. Visit `localhost:3000` and create an account
3. Click the "Load Demo Data" button on the dashboard, or `POST /api/demo/seed`
4. Explore: 10 items, 2 estate projects, conversations, bots, shipping labels, and more

## Project Structure

```
app/              → Next.js App Router pages and API routes
  api/            → REST API endpoints
  components/     → Shared React components
  dashboard/      → Main dashboard
  items/          → Item detail, edit, create pages
  store/          → Public storefront
lib/              → Business logic and adapters
  adapters/       → AI, eBay, pricing, auth, Shippo
  email/          → Email templates and send logic
  pricing/        → Pricing constants and market data
  services/       → Recon bot, payment ledger
  shipping/       → Package suggestions, metro estimates
prisma/           → Schema and migrations
public/           → Static assets, logos, manifest
```

## Deploy

Vercel is recommended (auto-deploy on push to `main`). Set all env vars from `.env.example` in the Vercel dashboard. Production database routes through Turso (LibSQL edge) via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars — `lib/db.ts` auto-detects the Vercel runtime and switches from local SQLite to Turso transparently.

## Contact

- Email: ryan@legacy-loop.com
- Phone: (207) 555-0127
