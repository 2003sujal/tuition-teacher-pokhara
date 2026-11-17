# Tuition Teacher Pokhara — Tutor Database

A private tutor registration and CV management system for Tuition Teacher Pokhara.
Tutors submit a four-field form (name, mobile, location, CV); the administrator
manages everything from a protected dashboard.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui-style components (Radix) ·
React Hook Form + Zod · MongoDB Atlas + Mongoose · Cloudinary · Recharts · Vercel

---

## How it works

1. Admin clicks **Copy Registration Link** and shares `/apply` with tutors.
2. Tutor fills in name, mobile number, location and uploads a CV (PDF/DOC/DOCX, max 4 MB).
3. The CV is uploaded to Cloudinary as a **private (authenticated) asset**; the record is saved
   in MongoDB with an application ID like `TTP-2026-00042` and status **New**.
4. Admin logs in at `/admin/login`, reviews new applications, opens CVs via short-lived
   signed links, searches by name/mobile/location, calls or WhatsApps tutors, updates
   status, keeps private notes, and exports CSV reports.

## Routes

| Public | Admin (protected) |
| --- | --- |
| `/` — landing | `/admin/dashboard` — stats, charts, recent registrations |
| `/apply` — 4-field registration form | `/admin/tutors` — search, filter, sort, paginate (`?status=Available` etc.) |
| `/application-success` — confirmation + reference | `/admin/tutors/[id]` — profile, CV, notes, status history |
| | `/admin/applications` — tutors with status New |
| | `/admin/reports` — date-range analytics + CSV export |
| | `/admin/settings` — agency info, logo, form text, profile, password |

## Local setup

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run seed:admin               # creates the first administrator
npm run dev                      # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string (include the DB name) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | CV + logo storage |
| `AUTH_SECRET` | Signs admin session cookies — 32+ random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `NEXT_PUBLIC_APP_URL` | Public base URL, e.g. `https://tuition-teacher-pokhara.vercel.app` (used for the registration link) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` | Only read by `npm run seed:admin` |

Only `NEXT_PUBLIC_APP_URL` is exposed to the browser. Never commit `.env*` files (except `.env.example`).

### Admin account

- `npm run seed:admin` creates the admin from `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` (min 10 chars).
- `npm run seed:admin -- --reset` resets that admin's password (and signs out all sessions).
- After the first login, change the password under **Settings** and remove `ADMIN_INITIAL_PASSWORD`
  from wherever you stored it.

## Deploying to Vercel

1. **MongoDB Atlas:** create a cluster and database user. Under *Network Access*, allow
   `0.0.0.0/0` (Vercel uses dynamic IPs) — the strong user password protects access.
2. **Cloudinary:** copy the cloud name, API key and secret from the dashboard. No upload preset is
   needed; uploads are signed server-side.
3. **Vercel:** import the repository, set every variable above in *Project → Settings →
   Environment Variables* (Production + Preview), with `NEXT_PUBLIC_APP_URL` set to your real domain.
4. Deploy, then run the seed once from your machine against the production database:
   `MONGODB_URI=<prod uri> ADMIN_EMAIL=... ADMIN_INITIAL_PASSWORD=... npm run seed:admin`
   (or put those values in `.env.local` temporarily).
5. Visit `/admin/login`, sign in, change the password, and set the agency details in **Settings**.

## Security notes

- Passwords hashed with bcrypt (cost 12). Sessions are HS256-signed JWTs in an `HttpOnly`,
  `SameSite=Lax`, `Secure` (production) cookie, valid for 8 hours.
- Each request re-checks the admin in MongoDB; changing the password bumps a session version,
  which revokes every other session.
- `src/proxy.ts` redirects logged-out visitors away from `/admin/*`; every admin page and API
  route also verifies the session server-side.
- Mutating admin APIs require a same-origin `Origin` header (CSRF protection).
- Public form: Zod validation on client and server, Nepali mobile validation (96/97/98 + 8 digits,
  optional +977), extension + MIME + magic-byte checks on CVs, 4 MB limit, honeypot field,
  minimum fill time, and MongoDB-backed rate limiting (5 submissions/hour/IP; login 8 attempts/15 min/email).
- CVs are private Cloudinary assets. The browser only ever receives a signed download URL that
  expires after 5 minutes, issued to a logged-in admin via `/api/tutors/[id]/cv`.
- User search input is regex-escaped; CSV export guards against formula injection.

## Project structure

```
src/
  app/
    (public)/apply, application-success      public pages
    (auth)/admin/login                        login
    (dashboard)/admin/...                     protected admin pages (layout checks session)
    api/
      applications/        POST public submission
      auth/                login, logout, profile, password
      tutors/              list, [id] (GET/PATCH/DELETE), [id]/status, [id]/notes, [id]/cv, export
      analytics/           report data
      settings/            agency settings
      uploads/logo/        agency logo upload
  components/  ui, layout, dashboard, tutors, forms, charts
  lib/         mongodb, cloudinary, auth, session-token, validations, phone, rate-limit, data/*
  models/      Admin, Tutor, ActivityLog, Settings, Counter, RateLimit
  proxy.ts     optimistic auth redirect for /admin/*
scripts/seed-admin.ts
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types + `tsc --noEmit` |
| `npm run seed:admin` | Create (or `-- --reset`) the administrator |
