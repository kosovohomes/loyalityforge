# LoyaltyForge

A focused SaaS platform that lets independent cafe owners create, manage, and
integrate loyalty programs — built to the MVP spec in

`LoyaltyForge – Cafe Loyalty Program Builder SaaS MVP v1.0`.

## What's included

- **Multi-tenant data model** — Organization, Membership (OWNER/MANAGER/STAFF),
  LoyaltyProgram, Customer, LoyaltyCard, Transaction, ApiKey (Prisma schema in
  `prisma/schema.prisma`).
- **Program builder** — 3 templates (Classic Stamp Card, Points-per-purchase,
  Tiered Membership), rules form, branding, live preview before publishing.
  See `/programs/new`.
- **Customer management** — searchable table, per-customer profile with
  balances + transaction history, manual point/stamp adjustment with a
  required audit reason. See `/customers`.
- **Dashboard & analytics** — total members, redemptions, an estimated revenue
  lift figure (methodology shown inline), per-program chart, and CSV export.
  See `/dashboard`.
- **Public REST API v1** — API-key authenticated endpoints for enroll, earn,
  redeem, and balance lookup, ready to integrate with a POS, website, or app.
  See `/settings/api-keys` in the app, or `docs/API.md` here.
- **Embeddable widget** — a single `public/widget.js` file that renders a
  "Join loyalty" form and balance display from one `<div>` + one `<script>`
  tag, talking only to public, unauthenticated endpoints (no API key is ever
  exposed in page source).

## Tech stack

Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + NextAuth
(credentials/JWT) + Tailwind CSS.

## Getting started (local development)

This project uses Postgres (required for Vercel deployment — see below). For
local development, point `DATABASE_URL` at any Postgres instance, e.g. a
free local Docker container:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

Then, this sandbox couldn't reach `binaries.prisma.sh` to generate the
Prisma client, so run these steps locally (with normal internet access):

```bash
npm install                # also runs `prisma generate` via postinstall
npx prisma db push         # creates tables from schema.prisma
npm run db:seed            # optional: seeds a demo cafe + customers
npm run dev
```

Then visit `http://localhost:3000`.

- Sign up a new cafe at `/register`, or
- Sign in with the seeded demo account: `owner@sunrisecoffee.test` /
  `password123`.

### Environment variables

Copy `.env.example` to `.env` and fill in real values:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="a long random string — generate with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

## Deploying to GitHub + Vercel

See **[DEPLOY.md](./DEPLOY.md)** for a full step-by-step guide, including
which environment variables to set in Vercel and how the included
`vercel-build` script keeps your database schema in sync on every deploy.

## Project structure

```
prisma/schema.prisma          Data model
prisma/seed.ts                Demo data
src/lib/                      Prisma client, auth, program-type helpers,
                               API-key hashing, server actions
src/app/(auth)/                Login / register
src/app/(dashboard)/           Dashboard, Programs, Customers, Settings
src/app/api/v1/programs/...    Public REST API (API-key auth)
src/app/api/public/orgs/...    Widget-facing endpoints (no API key)
src/app/api/register           Signup
src/app/api/reports/export     CSV export
public/widget.js               Embeddable widget
docs/API.md                    Full API reference
```

## Out of scope (per spec section 4)

Drag-and-drop builder UI, SMS/WhatsApp automation, multi-location support,
Stripe billing portal, Zapier, a full audit-log viewer UI, multi-language
support, and a Flutter/React Native SDK are intentionally not included in
this MVP.
