# ⛳ Golf Heroes

> Golf. Charity. Prizes.

A subscription-based platform where golfers enter their Stableford scores, get entered into monthly prize draws, and automatically donate a portion of their subscription to a charity of their choice.

---

## Live Demo

**Deployed on Vercel:** [https://golf-heros.vercel.app](https://golf-heros.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/rathodkiran02/golf-heros.git
cd golf-heroes
npm install
```

### 2. Set environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### For Subscribers
- Sign up / Sign in
- Choose monthly (£10/mo) or yearly (£100/yr) subscription
- Submit up to 5 Stableford golf scores (rolling — oldest replaced when full)
- Edit or delete individual scores
- Select a charity to support (min 10% of subscription)
- View draw participation history
- See winner status and prize amounts on dashboard

### For Admins
- Run monthly prize draws (random number generation against user scores)
- Publish draw results
- Manage charities — add, edit, delete, toggle featured/active
- Verify winner claims — approve or reject with proof URL
- View analytics — total users, draws, winners, prize pools
- View all users and their roles

### Public
- Homepage with how-it-works, prize structure, charity showcase
- Public charity listing page with search and filter (`/charites`)

---

## Project Structure

```
src/
├── app/
│   ├── page.js              # Homepage
│   ├── login/page.js        # Sign in / Sign up
│   ├── subscribe/page.js    # Subscription selection
│   ├── dashboard/page.js    # User dashboard
│   ├── charites/page.js     # Public charity listing
│   ├── admin/page.js        # Admin panel
│   └── api/
│       ├── auth/
│       │   ├── login/       # POST - sign in
│       │   └── signup/      # POST - create account
│       ├── scores/          # GET, POST, PATCH, DELETE
│       ├── subscriptions/   # GET, POST
│       ├── charities/
│       │   ├── route.js     # GET - public list
│       │   └── select/      # GET, POST - user charity selection
│       ├── draws/
│       │   ├── route.js     # GET - published draws
│       │   ├── run/         # POST - run draw (admin)
│       │   └── publish/     # POST - publish draw (admin)
│       ├── winners/         # GET, PATCH - user winners
│       └── admin/
│           ├── charities/   # GET, POST, PATCH, DELETE
│           ├── userlist/    # GET - all users
│           └── winners/     # GET, PATCH - all winners
└── lib/
    ├── supabase.js          # Supabase client + token client
    └── AuthContext.js       # React auth context (session state)
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK to auth.users |
| email | text | |
| full_name | text | |
| role | text | `subscriber` or `admin` |
| created_at | timestamp | |

### `scores`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK to users |
| score | int | 1–45 (Stableford) |
| score_date | date | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK to users |
| plan_type | text | `monthly` or `yearly` |
| status | text | `active` / `cancelled` |
| start_date | date | |
| end_date | date | |
| stripe_subscription_id | text | mocked |

### `charities`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| description | text | |
| is_active | boolean | |
| is_featured | boolean | |

### `charity_selections`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK to users |
| charity_id | uuid | FK to charities |
| contribution_percent | int | default 10 |

### `draws`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| draw_month | text | e.g. `2026-07` |
| winning_numbers | int[] | 5 numbers, 1–45 |
| total_prize_pool | numeric | |
| jackpot_amount | numeric | 40% of pool |
| status | text | `simulated` / `published` |

### `draw_entries`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| draw_id | uuid | FK to draws |
| user_id | uuid | FK to users |
| scores_snapshot | int[] | scores at time of draw |
| match_count | int | how many matched |

### `winners`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| draw_id | uuid | FK to draws |
| user_id | uuid | FK to users |
| match_type | text | `5_match`, `4_match`, `3_match` |
| prize_amount | numeric | |
| verification_status | text | `pending` / `approved` / `rejected` |
| payment_status | text | `pending` / `paid` |
| proof_url | text | winner uploads proof |

---

## Draw Engine Logic

1. Admin picks a draw month and clicks **Run Draw**
2. System generates 5 unique random numbers (1–45)
3. All users with exactly 5 scores are eligible
4. Each user's scores are compared against the winning numbers
5. Match count determines prize tier:
   - 5 match → Jackpot (40% of prize pool, split if multiple)
   - 4 match → Major Prize (35% of pool)
   - 3 match → Prize (25% of pool)
6. Prize pool = number of eligible users × subscription fee
7. Draw saved as `simulated` — admin reviews then clicks **Publish**
8. Winners notified on their dashboard, must upload proof to claim

---

## Auth Flow

- Supabase handles email/password auth
- On login, JWT access token stored in session
- Every API route extracts `Authorization: Bearer <token>` header
- Token passed to `supabaseWithToken()` so Row Level Security (RLS) applies
- Admin routes additionally check `users.role === 'admin'` before proceeding

---

## Deployment

Deployed on **Vercel** with automatic deploys from the `main` branch on GitHub.

Environment variables set in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
