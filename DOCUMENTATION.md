# Golf Heroes — Full Project Documentation

---

## 1. Problem Statement

Golf clubs and golfers have no easy way to combine their sport with charitable giving and competitive prize draws. Existing platforms either focus purely on golf scoring, or purely on charity fundraising — none combine both with a gamified monthly draw mechanic.

**Golf Heroes** solves this by creating a subscription platform where:
- Golfers submit their real Stableford scores each month
- Those scores become their lottery numbers in a monthly prize draw
- A portion of every subscription automatically funds a charity the user chooses
- Winners are verified and paid out by an admin team

The result is a platform that makes golf more engaging, raises money for good causes, and gives players a real financial incentive to keep playing and recording scores.

---

## 2. What Was Built

A full-stack web application with:

- Public-facing homepage and charity listing
- User authentication (sign up, sign in, session management)
- Subscription management (monthly and yearly plans)
- Score submission, editing, and deletion (rolling 5-score system)
- Charity selection per user
- Monthly draw engine (admin-run, score-matching algorithm)
- Winner verification workflow (proof upload, admin approve/reject)
- Admin panel with draws, winners, charities CRUD, analytics
- Fully deployed on Vercel with Supabase as the backend

---

## 3. Tech Stack and Why

### Next.js 16 (App Router)
Chosen because it gives both the frontend UI and the backend API in one codebase. The App Router allows each page to be a React Server Component or Client Component as needed. API routes live alongside pages — no separate Express server needed.

### Supabase
Supabase provides three things in one:
- **PostgreSQL database** — relational, supports foreign keys, joins, and complex queries
- **Auth** — email/password authentication with JWT tokens out of the box
- **Row Level Security (RLS)** — database-level access control so users can only read/write their own data

This removed the need to build auth from scratch or manage a separate auth service.

### Tailwind CSS v4
Utility-first CSS. Every component is styled inline with class names — no separate CSS files, no naming conflicts, fast to build with.

### Vercel
Zero-config deployment for Next.js. Connects directly to GitHub — every push to `main` triggers an automatic deploy. Handles serverless functions (the API routes) automatically.

---

## 4. Architecture — How Everything Connects

```
Browser (React)
      │
      │  HTTP requests with JWT token in Authorization header
      ▼
Next.js API Routes (/api/*)
      │
      │  supabaseWithToken(token) — passes JWT so RLS applies
      ▼
Supabase PostgreSQL
      │
      │  Row Level Security policies enforce per-user data access
      ▼
Database Tables
(users, scores, subscriptions, charities, draws, draw_entries, winners)
```

### The Auth Layer

When a user logs in, Supabase returns a JWT access token. This token is stored in the browser session via `AuthContext`. Every API call from the frontend includes this token in the `Authorization: Bearer <token>` header.

On the server side, each API route calls `supabase.auth.getUser(token)` to verify the token and get the user's ID. It then creates a `supabaseWithToken(token)` client — this is a Supabase client that passes the JWT in every database query, which activates Row Level Security. RLS policies on each table ensure users can only access their own rows.

Admin routes do an extra check: after verifying the token, they query `users.role` and reject the request with 403 if the role is not `admin`.

### The Score System

Users submit Stableford scores (1–45) with a date. The system keeps a rolling window of 5 scores — when a 6th is submitted, the oldest is automatically deleted. These 5 scores are the user's "lottery numbers" for the next draw.

Users can also edit or delete individual scores at any time from the dashboard.

### The Draw Engine

The draw engine is a single API route (`/api/draws/run`) that:

1. Generates 5 unique random numbers between 1 and 45
2. Fetches all scores from the database and groups them by user
3. Filters to only users with exactly 5 scores (eligible entrants)
4. Calculates the prize pool: `eligible users × subscription fee`
5. For each eligible user, counts how many of their 5 scores appear in the 5 winning numbers
6. Users with 3, 4, or 5 matches become winners
7. Prize pool is split: 40% jackpot (5 match), 35% major (4 match), 25% prize (3 match)
8. If multiple users share a tier, the prize is split equally
9. All entries and winners are saved to the database
10. Draw is saved as `simulated` — admin reviews and clicks Publish to make it live

### The Charity System

Charities are managed by admins (add, edit, delete, toggle active/featured). Users pick one charity from the active list. Their selection is stored in `charity_selections` with a `contribution_percent` (default 10%). This is currently tracked in the database — actual payment processing would connect to Stripe in a production version.

---

## 5. Database Design

The database has 8 tables with clear relationships:

```
auth.users (Supabase managed)
    │
    └── users (app profile: name, email, role)
            │
            ├── scores (up to 5 per user, rolling)
            ├── subscriptions (plan, status, dates)
            ├── charity_selections (which charity + percent)
            ├── draw_entries (snapshot of scores at draw time)
            └── winners (match type, prize, verification status)

charities
    └── charity_selections (linked to users)
    └── draw_entries (via draws)

draws
    ├── draw_entries (one per eligible user per draw)
    └── winners (users who matched 3, 4, or 5 numbers)
```

Key design decisions:
- `draw_entries` stores a `scores_snapshot` (array of the user's 5 scores at the time of the draw). This means even if a user edits their scores later, the historical draw record is accurate.
- `winners` has both `verification_status` and `payment_status` as separate fields — a winner can be approved but not yet paid, which reflects the real workflow.
- `subscriptions` has a `stripe_subscription_id` field — currently mocked with a timestamp string, ready to be replaced with real Stripe integration.

---

## 6. Page-by-Page Breakdown

### `/` — Homepage
Public. Shows the value proposition, how it works (3 steps), prize structure breakdown, live charity list fetched from the database, and CTAs to sign up. Navigation shows "My Dashboard" if already logged in.

### `/login` — Auth Page
Handles both sign up and sign in in one form (toggle between modes). On sign up, calls `/api/auth/signup` to create the user record in the `users` table, then immediately signs them in. After login, checks if the user has an active subscription — if yes, goes to dashboard; if no, goes to subscribe page.

### `/subscribe` — Subscription Page
Lets new users pick monthly (£10) or yearly (£100). Calls `/api/subscriptions` POST. After subscribing, redirects to dashboard.

### `/dashboard` — User Dashboard
The main user interface. Shows:
- Active subscription status
- Score entry form + list of current scores with edit/delete
- Draw participation history (all published draws, whether they won)
- Winner banner if they have any approved wins
- Charity selection grid
- Admin Panel button (only visible if `role === admin`)

### `/charites` — Public Charity Listing
No login required. Shows all active charities with search (by name/description) and filter (all vs featured). Fully client-side filtering.

### `/admin` — Admin Panel
Protected — redirects non-admins to dashboard. Five tabs:
- **Draw Engine** — pick a month, run the draw, see results, publish
- **Winners** — pending verification queue + resolved winners list
- **Charities** — add new charities, edit existing, delete, toggle active/featured
- **Analytics** — stat cards (users, draws, winners, charities) + prize pool history + winner type breakdown
- **Users** — full user list with roles

---

## 7. Security Design

- All API routes verify the JWT token before doing anything
- `supabaseWithToken()` ensures RLS policies apply at the database level — even if an API route had a bug, the database would still reject unauthorised access
- Admin routes have a double check: JWT verification + role check in the `users` table
- Score edit/delete routes use `.eq('user_id', user.id)` to ensure users can only modify their own scores
- No sensitive keys are in the codebase — all via environment variables

---

## 8. Deployment

### Vercel
- Connected to GitHub repo (`rathodkiran02/golf-heros`)
- Auto-deploys on every push to `main`
- Next.js API routes are deployed as Vercel Serverless Functions automatically
- Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) set in Vercel project settings

### Supabase
- PostgreSQL database hosted on Supabase cloud
- Auth handled by Supabase Auth service
- RLS policies enabled on all tables
- Anon key used on the client — safe to expose because RLS restricts what it can access

---

## 9. What's Mocked vs Production-Ready

| Feature | Status | Notes |
|---|---|---|
| Auth | Production-ready | Real Supabase JWT auth |
| Scores | Production-ready | Full CRUD with RLS |
| Draw engine | Production-ready | Real algorithm, real DB |
| Charity selection | Production-ready | Stored in DB |
| Subscriptions | Mocked | No real payment — Stripe ID is `mock_<timestamp>` |
| Winner payments | Mocked | Status tracked, no real payout |
| Email notifications | Not built | Would use Resend or SendGrid |
| Proof upload | Partial | URL field exists, no file upload UI |

---

## 10. How to Set Up Admin Access

After deploying, to make a user an admin:

1. Go to your Supabase project → Table Editor → `users` table
2. Find the user row by email
3. Set the `role` column to `admin`
4. That user will now see the Admin Panel button on their dashboard

---

## 11. Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Environment variables needed in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
