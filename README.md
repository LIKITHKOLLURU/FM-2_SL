# FreelanceHub

A full-stack freelance marketplace where **clients** post jobs, **freelancers** send proposals, and **admins** oversee the platform. Accepting a proposal automatically creates a project and a 50/50 payment schedule; progress and payments are tracked in role-specific dashboards.

## Technology stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React, React Context
- **Backend:** Node.js (ES modules), Express 4, SQLite via better-sqlite3, JWT (jsonwebtoken), bcryptjs, express-validator, google-auth-library, dotenv, cors
- **Time:** all dates shown in Indian Standard Time (Asia/Kolkata)

## Features
- Email/password registration and login, plus optional Google sign-in; JWT sessions with role-based access (client / freelancer / admin)
- Jobs: create, edit, delete, search and filter; public job browsing
- Proposals: submit, withdraw, accept, reject; accepting is one atomic transaction (rejects rivals, creates project and payments)
- Projects: status and progress updates with validated transitions
- Payments: payment tracking, "Pay now", admin refunds and totals
- Admin: dashboard statistics, user suspension/deletion, job/project/payment management
- Responsive UI with dashboards, charts, a premium footer and a live IST clock

## Project layout
```
src/       React frontend (pages, components, services, context, utils)
backend/   Express API (routes -> controllers -> services -> SQLite)
  database/schema.sql, migrate.js, seed.js   (the database itself is NOT committed)
tests/, backend/tests/   frontend and backend test suites
```

> The SQLite database file is created automatically on first backend start from `schema.sql` and filled with development demo data by `seed.js` (only when empty). `npm run seed` in `backend/` runs the seed manually.

## Run

```bash
# Backend (http://localhost:5000). Creates, migrates and (if empty) seeds backend/database/freelancehub.sqlite
cd backend
npm install
cp .env.example .env        # set JWT_SECRET (and GOOGLE_CLIENT_ID, see below)
npm start

# Frontend (http://localhost:5173)
cd ..
npm install
cp .env.example .env        # set VITE_GOOGLE_CLIENT_ID (optional)
npm run dev
```

Restart commands after changing any `.env`: stop the process (Ctrl+C) and run `npm start` (backend) / `npm run dev` (frontend) again. Vite only reads `.env` at startup.

## Tests

```bash
cd backend && npm test      # API workflow, authorization, Google verification, DB migration, IST utilities (37 tests)
cd .. && npm test           # frontend IST date/time formatting (7 tests)
npm run build               # production build
```

## Seeded development accounts (development only, never use in production)
Created only when the database is empty (admin `admin@freelancehub.com` / `Admin123`; clients `sarah@northwind.com`, `david@brightpath.io`; freelancers `priya@dev.com`, `marcus@design.com`, `elena@words.com`, all `Password123`). They are **no longer shown anywhere in the UI**; the login page has no demo cards or quick-login buttons.

## Login page
Split-screen layout kept. The right panel is now a branded section ("Your next opportunity starts here."), three highlights (Discover Opportunities / Connect with Talent / Manage Projects), and a dashboard-style CSS visual (hidden on small phones). On mobile the form comes first and the panel stacks below. Email/password login, validation and errors are unchanged.

## Google sign-up / sign-in

Uses Google Identity Services in the browser and `google-auth-library` on the server. **No client secret is needed**, only the public Client ID.

### Google Cloud setup
1. Open <https://console.cloud.google.com/> and create/select a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill app name and support email. While the app is in **Testing** status, only the Google accounts listed under **Test users** can sign in; add yours. (Publishing to Production removes that limit and may require Google verification.)
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. Add **Authorized JavaScript origin**: `http://localhost:5173` (no redirect URI needed for this flow). Add production origins later.
5. Copy the Client ID into:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `.env` (project root) → `VITE_GOOGLE_CLIENT_ID=...` (same value)
6. Restart backend and frontend.

Until configured, the Google button shows a disabled state with an explanation and `POST /api/auth/google` returns 503.

### Flow
- **Register**: pick Client/Freelancer → *Sign up with Google* → Google account chooser → the browser receives an ID token → `POST /api/auth/google { credential, role }`.
- **Login**: *Sign in with Google*. Returning Google users are matched by Google subject id (`google_sub`), so no duplicates. An unknown Google account on the login page is sent to Register to choose a role.
- The server verifies signature, audience (= `GOOGLE_CLIENT_ID`), issuer, expiry and `email_verified`; name/email come only from the verified claims. It then issues the app's normal JWT, so sessions, roles and redirects work as before.
- **Security rules**: roles limited to client/freelancer (admin is rejected). A Google sign-in is **never auto-linked** to an existing password account with the same email (409, "sign in with your email and password"). Google-only accounts have no password and cannot use password login.

## Database migration
`backend/database/migrate.js` runs at every start and is idempotent. It upgrades an existing `users` table: `password_hash` becomes nullable and `google_sub` (unique where not NULL) is added, via SQLite's table-rebuild procedure inside a transaction with foreign keys temporarily off, a row-count check and `PRAGMA foreign_key_check`. All rows, ids and hashes are preserved. Before rebuilding it copies the database to `freelancehub.sqlite.pre-google-migration.bak`.

## Time convention (IST)
- Timezone: `Asia/Kolkata`, UTC+05:30, used everywhere regardless of the browser's or server's timezone.
- **Timestamps** (created/submitted/paid) are generated by the server, stored and sent as UTC ISO-8601 (`2026-11-04T11:00:00.000Z`) and displayed in IST by `src/utils/datetime.js`: `formatDate` (`04 Nov 2026`), `formatDateTime` (`04 Nov 2026, 04:30 PM IST`), `formatTime`, `getCurrentISTDate`, `getCurrentISTTime`.
- **Date-only values** (job deadline, project due date, pending-payment due date) are calendar dates `YYYY-MM-DD` in IST and are displayed as-is, never converted, so they cannot shift a day. Server-side `due date = IST today + delivery days`.
- Monthly chart buckets (frontend and `/api/admin/dashboard`) group by IST month. Dashboards show a live IST clock in the top bar.
- Existing records are untouched; legacy deadline timestamps are converted to their IST calendar date when served.

## API
`/api/auth` (register, login, google, me, password) · `/api/jobs` · `/api/proposals` · `/api/projects` · `/api/payments` · `/api/admin` · `/api/health`. Responses: `{ success, data, meta? }` or `{ success: false, message, errors?, code? }`.
