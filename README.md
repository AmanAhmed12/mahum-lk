# Mahum.lk — Tailoring, Fashion Accessories & Inventory Management

A full-stack Next.js rebuild of the Mahum.lk web-based tailoring and inventory
management system (see `../Interim Report E300090.docx` and `../instructions.txt`
for the original requirements and build plan).

Stack: **Next.js 16 (App Router, frontend + backend)**, **Neon (Postgres)**
via **Prisma 7**, **JWT** authentication, **Google Gemini** chatbot,
**Cloudinary** image storage, **PayHere** card payments (sandbox). Every
service used has a free tier.

## 1. Prerequisites

- Node.js 20+ and npm
- Free accounts (no credit card required for the free tiers used here):
  - [Neon](https://neon.tech) — Postgres database
  - [Cloudinary](https://cloudinary.com) — image storage/CDN
  - [Google AI Studio](https://aistudio.google.com/app/apikey) — Gemini API key
  - [PayHere](https://www.payhere.lk) — card payment gateway (free Sandbox mode)

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
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary dashboard → Account Details. **`CLOUDINARY_CLOUD_NAME` is the "Cloud name" field, not the API Key.** |
| `GEMINI_API_KEY` | Google AI Studio → "Get API key" |
| `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` | PayHere dashboard → Settings → Domains & Credentials → "Sandbox" section (created automatically when you sign up, no approval needed) |

`NEXT_PUBLIC_APP_URL` can stay as `http://localhost:3000` for local development.

### About the PayHere card payment flow

When a customer chooses **"Card Payment"** at checkout (or for a tailoring
request), the order is created first (status `PENDING`, payment `PENDING`),
then the browser is redirected to PayHere's hosted Sandbox checkout page —
no card details ever touch our server. PayHere then:

- redirects the browser back to `/checkout/payhere/return` (success) or
  `/checkout/payhere/cancel` (user cancelled), and
- calls `POST /api/payments/payhere/notify` **server-to-server** with the
  final result — this webhook is the authoritative source of truth (it's
  signature-verified with your `PAYHERE_MERCHANT_SECRET`) and is what
  actually marks the `Payment` as `PAID` and bumps the `Order` to `CONFIRMED`.

**Important for local development**: PayHere's servers cannot reach
`http://localhost:3000`, so that `notify` webhook will never arrive while
you're testing locally — the order will show "still being confirmed" after
a sandbox test card payment. To test the full flow end-to-end before
deploying, expose your dev server with a tunnel (e.g.
[ngrok](https://ngrok.com): `ngrok http 3000`) and set
`NEXT_PUBLIC_APP_URL` to the `https://*.ngrok-free.app` URL it gives you.
Once deployed to a real domain (Vercel, etc.), this works automatically.

PayHere's sandbox checkout page shows its own test card numbers on-screen
(commonly `4916217501611292`, any future expiry, any 3-digit CVV) — use
whatever the sandbox page itself displays, since PayHere occasionally
rotates these; real card numbers never work in sandbox mode.

A customer can retry payment any time from their order page
(`/account/orders/[id]`) via the **"Pay Now"** button, shown whenever a
card-payment order isn't marked `PAID` yet.

#### Three ways payment confirmation can happen (in priority order)

1. **Webhook** (`POST /api/payments/payhere/notify`) — PayHere calls this
   directly, signature-verified. Works once your app is on a public URL.
2. **Active check** (`POST /api/payments/payhere/confirm`) — our server
   calls *out* to PayHere's "Retrieve Payment" API when the customer lands
   back on `/checkout/payhere/return`. Works from localhost too, but needs
   `PAYHERE_APP_ID`/`PAYHERE_APP_SECRET` (a separate "App" you create under
   PayHere Dashboard → Settings) **and** that App needs an authorized domain
   registered — PayHere will 401 with `"Access denied for the domain"`
   otherwise, and `localhost` generally isn't accepted as a domain by
   payment gateways, so this path is mainly useful after deploying.
3. **Trust-the-redirect fallback** (`PAYHERE_TRUST_RETURN_REDIRECT="true"`)
   — **academic/local-demo only.** If neither of the above confirms the
   payment, and this flag is on, the return page marks the order `PAID`
   simply because the browser was redirected there (PayHere only sends the
   browser to `return_url` on success; a cancelled/failed attempt goes to
   `cancel_url` instead). **This is not secure** — a signed-in customer
   could visit their own `/checkout/payhere/return?order_id=...` link
   directly and mark an unpaid order `PAID` without ever paying. Leave this
   `"false"` for any real deployment; it exists purely so the full order
   flow can be demonstrated on `localhost` without ngrok for coursework.

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
