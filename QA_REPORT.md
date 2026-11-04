# QA Report: Login redesign, Google auth, IST

Date of run: 2026-11-04 (IST). Environment: Windows 11, Node 26, better-sqlite3.

## Features implemented
1. **Login redesign**: demo accounts, quick-login buttons and demo credentials removed from the UI (and from `src/data/seed.js`); branded right panel with heading, description, three highlights and CSS dashboard visual; responsive. Seeded users remain in SQLite.
2. **Google sign-up / login**: `POST /api/auth/google` (google-auth-library), `google_sub` + nullable `password_hash` migration, Google button on Login and Register (Google Identity Services), role selection for new accounts, no email-based auto-linking, admin role rejected.
3. **IST standardisation**: `src/utils/datetime.js` (+ `backend/utils/time.js`), UTC timestamps vs date-only calendar dates, IST month buckets, live IST clock, server-generated timestamps.

## Files modified / added
Backend: `config/database.js`, `database/schema.sql`, `database/migrate.js` (new), `database/seed.js`, `services/authService.js`, `services/googleAuthService.js` (new), `services/proposalService.js`, `services/adminService.js`, `controllers/authController.js`, `routes/authRoutes.js`, `middleware/errorMiddleware.js`, `utils/apiResponse.js`, `utils/mappers.js`, `utils/time.js` (new), `.env.example`, `tests/{api,google,migrate,time}.test.js`.
Frontend: `pages/public/{Login,Register}.jsx`, `components/ui/GoogleButton.jsx` (new), `services/{authService.js,api/httpClient.js}`, `context/AppContext.jsx`, `utils/{datetime.js (new),format.js}`, `hooks/useISTClock.js` (new), `components/layout/DashboardLayout.jsx`, `components/shared/Charts.jsx`, `pages/shared/{MyProjects,PaymentTracking,Profile}.jsx`, `pages/admin/PaymentManagement.jsx`, `pages/freelancer/MyProposals.jsx`, `pages/client/ReceivedProposals.jsx`, `data/seed.js`, `tests/datetime.test.mjs` (new), `.env.example`, `.gitignore`, `README.md`, `QA_REPORT.md`.

## Automated tests (executed)
| Suite | Result |
|---|---|
| Backend `npm test` (4 files) | **37 passed, 0 failed** |
| Frontend `npm test` (datetime) | **7 passed, 0 failed** |
| `npm run build` | **succeeds** |
| Frontend services run against a live API on a throwaway seeded DB (Vite SSR loader, not a browser) | **all checks passed** |
| Server-side render of Login / Register / Landing | renders, no demo-account text, no exceptions |

Covered: existing workflow and authorization tests (unchanged logic, still passing); Google: new client, new freelancer, returning user (no duplicate), unknown account without role (`ROLE_REQUIRED`), invalid/`admin` roles, bad signature, wrong audience, wrong issuer, expired token, garbage token, unverified email, no auto-link to a password account, Google-only accounts blocked from password login/change, suspended Google user, unique `google_sub`, 503 when unconfigured; migration: data/ids/hashes preserved, FK enforcement/CASCADE/RESTRICT intact, NULL passwords, uniqueness, idempotence; time: UTC/IST midnight boundaries, year rollover, date-only stability, machine-timezone independence, live timestamps within seconds of now, due date = IST today + delivery days.

**Real database migration**: the existing `freelancehub.sqlite` (8 users incl. 2 non-seed accounts, 11 jobs, 11 proposals, 4 projects, 8 payments) was migrated in place: 8/8 user rows identical to the pre-migration backup, 0 foreign-key violations, all table counts unchanged, email/password login still works.

## NOT tested / limitations (be aware)
- **Real Google login has NOT been tested.** No Google Client ID is configured. The Google tests sign tokens with a local RSA key and point only the *certificate lookup* at it; this exercises the real `verifyIdToken` checks but does not prove the Google popup, consent screen, or origin configuration work. Verify manually after setup (see README).
- **No browser testing was done.** Responsive layout, the Google button rendering, the IST clock, and visual appearance were not viewed in a browser; only server-side rendering and service-level checks ran. Please check the login page at desktop/tablet/mobile widths.
- Unauthorised-session redirect and token restoration were tested at the service level, not by clicking through the UI.
- The Google button is Google's own rendered button (official logo/white/border) because an ID token requires it; hover/focus styling comes from Google, and our loading overlay covers the request.
- Legacy rows created before this change were stored as UTC timestamps at 09:00Z (seed) or real times; they display correctly in IST. Displayed "Today/Yesterday" uses IST calendar days.

## Configuration still required from you
1. Create a Google OAuth Web Client ID with origin `http://localhost:5173` and add yourself as a test user (README steps).
2. Put it in `backend/.env` (`GOOGLE_CLIENT_ID`) and root `.env` (`VITE_GOOGLE_CLIENT_ID`), then restart both servers.
3. Replace `JWT_SECRET` in `backend/.env.example`-derived files for any non-local environment.
