# Expense Tracker — AI Expense Tracker with CSV Import

## Product

A web-based expense tracker with AI-powered categorization.
Target users: people who track expenses in Excel/Google Sheets manually,
want something smarter but don't want to connect bank accounts directly.

Key differentiators:
- Privacy-first: works by CSV upload, not bank API integrations
- AI categorization via Claude API
- Weekly AI insights (patterns, unused subscriptions, spending anomalies)
- Works as both web app and PWA on mobile
- Target markets: English-speaking global + Russian-speaking

## Tech Stack

- Next.js 15 with App Router
- TypeScript (strict mode)
- Tailwind CSS for styling
- Supabase for database + auth (Postgres)
- Stripe for subscription payments
- Claude API (Anthropic) for AI categorization and insights
- Deployed on Vercel

## Code Style

- Prefer functional components with hooks, no class components
- Server components by default, client components only when needed
- Use `async/await`, avoid `.then()` chains
- Tailwind classes inline, no separate CSS files except globals
- Keep components small (under 150 lines ideally)
- Extract reusable logic into `src/lib/` utilities
- Database queries go in `src/lib/db/`
- Types go in `src/types/` or colocated with usage

## File Structure

- `src/app/` — routes (Next.js App Router)
- `src/components/` — reusable UI components
- `src/lib/` — utilities, API clients, database helpers
- `src/types/` — shared TypeScript types

## Working Principles

- Ship working vertical slices, not half-built horizontal layers
- Every feature should be usable end-to-end before moving on
- Add loading and error states from the start, not as afterthought
- Use Supabase Row Level Security (RLS) for all user data
- Never commit .env files or secrets
- Write self-documenting code, minimal comments

## Commands

- `npm run dev` — start dev server on localhost:3000
- `npm run build` — build production bundle
- `npm run lint` — run ESLint