# LegacyLoop — AI-Powered Estate & Garage Sale Platform

Snap a photo, get an instant AI price, and sell to real buyers. Built for estate cleanouts, garage sales, and everyday resellers.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, CSS custom properties (light/dark theme)
- **Database:** Prisma 6 with SQLite (dev) / PostgreSQL (prod)
- **Payments:** Square (sandbox + production)
- **AI:** OpenAI Vision + Claude Haiku + Gemini 1.5 Flash (MegaBot consensus)
- **Shipping:** Shippo API integration
- **Email:** SendGrid transactional emails

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.example .env

# 3. Add your API keys to .env
#    Required: OPENAI_API_KEY, JWT_SECRET
#    Optional: ANTHROPIC_API_KEY, GEMINI_API_KEY, SQUARE_ACCESS_TOKEN, SHIPPO_API_KEY, SENDGRID_API_KEY

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

Vercel is recommended. Set all env vars from `.env.example` in the Vercel dashboard. Switch `DATABASE_URL` to a PostgreSQL connection string for production.

## Contact

- Email: ryan@legacy-loop.com
- Phone: (207) 555-0127
