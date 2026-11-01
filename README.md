# Mahum.lk — Tailoring, Fashion Accessories & Inventory Management

A full-stack Next.js rebuild of the Mahum.lk web-based tailoring and inventory
management system (see `../Interim Report E300090.docx` and `../instructions.txt`
for the original requirements and build plan).

Stack: **Next.js 16 (App Router, frontend + backend)**, **Neon (Postgres)**
via **Prisma 7**, **JWT** authentication, **Google Gemini** chatbot,
**Cloudinary** image storage. Every service used has a free tier.

## 1. Prerequisites

- Node.js 20+ and npm
- Free accounts (no credit card required for the free tiers used here):
  - [Neon](https://neon.tech) — Postgres database
  - [Cloudinary](https://cloudinary.com) — image storage/CDN
  - [Google AI Studio](https://aistudio.google.com/app/apikey) — Gemini API key

## 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Open `.env` and replace every `<PLACEHOLDER>`:

| Variable | Where to get it |
| --- | --- |
| `DATABASE_URL` | Neon dashboard → your project → "Pooled connection" string |
| `DIRECT_URL` | Neon dashboard → your project → "Direct connection" string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` (run twice, once per secret) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary dashboard → Account Details |
| `GEMINI_API_KEY` | Google AI Studio → "Get API key" |

`NEXT_PUBLIC_APP_URL` can stay as `http://localhost:3000` for local development.

## 3. Install dependencies

```bash
npm install
```

(This also runs `prisma generate` automatically via the `postinstall` script.)

## 4. Set up the database

```bash
npm run db:migrate   # creates all tables in your Neon database
npm run db:seed       # adds demo categories, products, services and one
                      # account per role (Admin / Service Provider / Customer)
```

Demo logins created by the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@mahum.lk` | `Admin@12345` |
| Service Provider | `provider@mahum.lk` | `Provider@12345` |
| Customer | `customer@mahum.lk` | `Customer@12345` |

**Change or remove these before deploying publicly.**

## 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## 6. Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build (type-checks the whole project) |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:deploy` | Apply Prisma migrations (production) |
| `npm run db:seed` | Re-run the seed script |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

## 7. Project structure

See `instructions.txt` in the parent folder for the full architecture
write-up (data model, auth design, API route list, build phases). In short:

```
src/
  app/            Pages (public shop, /account, /provider, /admin) + API routes
  components/     UI primitives, layout, product/cart/order/chat/admin widgets
  lib/             Prisma client, auth (JWT/RBAC), Cloudinary, Gemini, validators
  store/           Zustand stores (cart, client-side auth state)
  types/           Shared literal types (roles, statuses)
  proxy.ts         Edge request interceptor — enforces role-based access to
                   /admin, /provider and /account (Next.js 16 renamed the
                   "middleware" file convention to "proxy")
prisma/
  schema.prisma    Data model (Users, Products, Orders, Measurements, ...)
  seed.ts          Demo data
```

## 8. Deploying (free tier)

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com) (free Hobby plan).
3. Add every variable from `.env` to the Vercel project's Environment Variables,
   using your production Neon/Cloudinary/Gemini credentials and
   `NEXT_PUBLIC_APP_URL` set to your Vercel URL.
4. Run `npm run db:deploy` once against your production database (locally,
   with the production `DIRECT_URL`) before the first deploy.
5. Deploy. `postinstall` runs `prisma generate` automatically during the
   Vercel build.

## Notes

- `npm audit` may report a handful of moderate-severity advisories inside
  the ESLint toolchain's dependency tree (`minimatch` ReDoS). These are
  development-only dependencies (not part of the shipped app) with no
  non-breaking fix published yet upstream; they do not affect the running
  application.
