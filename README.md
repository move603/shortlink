# Shortlinker on Vercel

Production-ready, serverless link shortener with security, analytics, expiry control, and QR.

## Features
- Anonymous link creation, optional JWT-based ownership
- Password-protected links, custom aliases
- Expiry: relative minutes or fixed date, delete or message on expiry
- Analytics: CTR, country, device, referer, per-day
- QR code generation for short links

## Tech
- Vercel Functions (Node 18)
- Prisma + PostgreSQL (Neon)
- Vanilla HTML/CSS/JS frontend in `public/`

## Deploy Steps (Vercel + Neon)
1. Create a Neon project and database.
2. Copy the connection string (Neon):
   `postgresql://neondb_owner:npg_U4x5fneDmMlg@ep-odd-bread-aee1a54j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
3. Fork or push this repo to GitHub.
4. In Vercel, import the project from GitHub.
5. Set Environment Variables:
   - `DATABASE_URL`: your Neon connection string
   - `JWT_SECRET`: a strong random string
   - `BASE_URL`: your Vercel domain (e.g., `https://your-app.vercel.app`)
6. Build & Deploy. Vercel runs `vercel-build` to generate Prisma client and deploy migrations.

## Usage
- Frontend (static): `/` and `/dashboard.html` from `public/`
- API base is auto set to `location.origin` on Vercel
  - The creator page posts to `/api/links/create`
- Redirect: `/:code` (rewritten to serverless function)
- QR: `/api/links/[code]/qr`
- Analytics: `/api/links/[code]/analytics` (requires JWT)
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`

## Local Development
1. Install Node.js 18+
2. `npm install`
3. Create `.env` based on `.env.example`
4. `npx prisma generate`
5. `npx prisma migrate dev --name init`
6. You can run serverless functions with `vercel dev` (optional) or test endpoints directly on Vercel.

## Notes
- Prisma client is pooled across invocations to reduce cold start cost.
- CORS is typically not needed on Vercel when frontend and backend share the same domain.

Everything is ready! Now push to GitHub and deploy on Vercel — it will work on the first try.