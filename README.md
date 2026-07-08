# Ghost Mode 👻

**A ruthless execution engine by Digital Winch.**
One goal. A hidden roadmap. Three missions a day — no more. Nothing completes without proof. No excuses.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma + PostgreSQL**, **NextAuth.js**, and **Abacus.AI** for roadmap generation, mission generation, and proof validation.

---

## ✨ Features

- **Authentication** — email/password via NextAuth (Credentials + Prisma adapter).
- **Goal + Interview flow** — single goal, then an 8-question intake (income, skills, hours, commitments, distractions, deadline, reason, definition of success).
- **Hidden roadmap** — AI builds a phased plan that is stored but **never shown** to the user.
- **Daily missions** — AI issues a **maximum of 3** primary tasks per day, each with objective, priority (1–3), estimated duration, expected outcome, and required proof type.
- **Proof-gated completion** — no task completes without proof. AI returns one of three verdicts: **Complete / Needs Revision / Rejected** with a specific reason.
- **Focus screen** — distraction-free full-screen view with a timer for the active task.
- **Progress dashboard** — Days Remaining, Mission Progress %, Current Streak, Focus Hours.
- **Ruthless Decision Filter** — run any temptation/off-mission request through the AI to get proceed / redirect / reject.
- **Full brand system** — Ghost Mode colors (Void, Signal Green, Deep Green, Bone, Steel, Slate), Sora typeface, dark theme, ghost logo with Signal Green glow.

> If no `ABACUS_API_KEY` is provided, the app automatically falls back to a deterministic local engine so every flow works end-to-end in development.

---

## 🎨 Brand System (PRD Section 2)

| Token         | Hex       | Usage                          |
| ------------- | --------- | ------------------------------ |
| Void          | `#040404` | Background                     |
| Signal Green  | `#04BA63` | Primary accent, glow, CTAs     |
| Deep Green    | `#045F30` | Success surfaces               |
| Bone          | `#EBEAEB` | Primary text                   |
| Steel         | `#606060` | Muted text                     |
| Slate         | `#7C7C84` | Secondary text                 |

Typeface: **Sora** (weights 300–700), loaded via `next/font/google`.

---

## 🧱 Tech Stack

- Next.js 14 (App Router, Server Components + Route Handlers)
- TypeScript (strict)
- Tailwind CSS (custom theme in `tailwind.config.ts`)
- Prisma ORM + PostgreSQL
- NextAuth.js (JWT sessions, Credentials provider)
- Abacus.AI via an OpenAI-compatible endpoint (RouteLLM)

---

## 🚀 Local Setup

### 1. Prerequisites

- Node.js 18.18+ (Node 20/22 recommended)
- PostgreSQL 13+ running locally (or a hosted URL)

### 2. Install dependencies

```bash
cd ghost_mode
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ghost_mode?schema=public"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Optional — enables real AI. Without it, a local fallback engine is used.
ABACUS_API_KEY="your-abacus-api-key"
ABACUS_LLM_BASE_URL="https://routellm.abacus.ai/v1"
ABACUS_LLM_MODEL="route-llm"
```

### 4. Create the database

Create an empty database (if it does not exist):

```bash
createdb ghost_mode   # or use psql / your GUI
```

### 5. Push the Prisma schema

```bash
npm run db:push        # creates all tables from prisma/schema.prisma
npm run db:seed        # (optional) creates a demo user
```

Demo login after seeding:

- **Email:** `demo@ghostmode.app`
- **Password:** `ghostmode123`

### 6. Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000**.

---

## 📜 Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server                         |
| `npm run build`     | Generate Prisma client + production build    |
| `npm run start`     | Start the production server                  |
| `npm run db:push`   | Push schema to the database                  |
| `npm run db:migrate`| Create/apply a dev migration                 |
| `npm run db:studio` | Open Prisma Studio                           |
| `npm run db:seed`   | Seed a demo user                             |

---

## 🗂️ Project Structure

```
ghost_mode/
├── prisma/
│   ├── schema.prisma        # User, Goal, InterviewResponse, Roadmap, Mission, Task, Proof, Streak
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing / auth
│   │   ├── goal/                    # Goal creation + interview flow
│   │   ├── today/                   # Today's Mission (focus screen)
│   │   ├── dashboard/               # Progress dashboard
│   │   ├── filter/                  # Ruthless Decision Filter
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # NextAuth
│   │       ├── register/            # Sign up
│   │       ├── goals/               # Create goal + hidden roadmap
│   │       ├── missions/today/      # Generate / read daily missions
│   │       ├── proof/               # Submit + validate proof
│   │       ├── decision/            # Ruthless Decision Filter
│   │       └── dashboard/           # Metrics
│   ├── components/                  # UI components
│   └── lib/
│       ├── ai.ts                    # Abacus.AI integration + fallbacks
│       ├── prompts.ts               # Ghost Mode system prompts (PRD 7 + 14)
│       ├── auth.ts                  # NextAuth config
│       ├── prisma.ts                # Prisma client
│       ├── session.ts               # Session helpers
│       ├── streak.ts                # Streak / focus tracking
│       └── types.ts                 # Shared types
└── ...config files
```

---

## 🧠 AI Integration

All AI calls live in `src/lib/ai.ts` and route through an OpenAI-compatible endpoint using `ABACUS_API_KEY`:

1. **`generateRoadmap`** — goal + interview → hidden phased roadmap (JSON).
2. **`generateMissions`** — current phase + prior progress → up to 3 daily tasks.
3. **`validateProof`** — task + submitted proof → `complete` / `needs_revision` / `rejected` + reason.
4. **`decisionFilter`** — off-mission request → `proceed` / `redirect` / `reject`.

The Ghost Mode personality and execution rules (PRD Sections 7 & 14) are defined in `src/lib/prompts.ts`.

If `ABACUS_API_KEY` is unset or a call fails, deterministic local fallbacks keep every flow functional.

---

## 🌍 Deployment

Deployable to any Node host (Vercel, Railway, Render, Fly.io, a VM, etc.):

1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your public URL), and Abacus.AI vars.
3. Run `npm run build` then `npm run start`.
4. Ensure `prisma migrate deploy` (or `db:push`) has been run against the production DB.

---

© Digital Winch — Ghost Mode. Execute in silence.
# Ghost-Mode-Pro
