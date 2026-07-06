# Klaaro — Intelligent IT Service Management

> Intelligent IT Service Management, Simplified.

**Live demo:** [klaaro-ashy.vercel.app](https://klaaro-ashy.vercel.app)

Klaaro is a web and mobile-first IT Service Management platform that unifies service requests, incident management, change control, and problem management into a single intelligent workspace — enhanced by an AI layer that moves organisations from reactive to predictive.

Built for the INFRATEL / UNZA iHub Hackathon 2026 — Challenge 4: Information Technology Service Management.

---

## Features

- **Self-service portal** — end users submit, track, and manage requests across IT, HR, Finance, and Facilities
- **AI auto-triage** — every ticket is automatically classified by category and priority at submission using the Groq API and LLaMA 3.3 70B
- **Agent dashboard** — prioritised ticket queue sorted by severity and SLA time remaining
- **Incident management** — P1–P4 severity classification with visual flagging and escalation support
- **SLA tracking** — configurable response and resolution targets with live breach indicators
- **Operations dashboard** — real-time metrics for open tickets, resolved today, SLA compliance, and average resolution time
- **Role-based access control** — enforced at the database level via Supabase row-level security
- **Progressive Web App** — installable on any Android or iOS device directly from the browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Next.js 16, TypeScript, Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL, Auth, Row-Level Security) |
| AI | Groq API — LLaMA 3.3 70B Versatile |
| Hosting | Vercel |
| Mobile | Progressive Web App (PWA) |
| Version control | GitHub |

---

## Getting Started

### Prerequisites

- Node.js (LTS version)
- A Supabase account and project
- A Groq API key
- A Vercel account (for deployment)

### Local setup

1. Clone the repository:

```bash
git clone https://github.com/Abdul-alt-tech/Klaaro.git
cd Klaaro
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

4. Set up the Supabase database by running the SQL schema in `docs/schema.sql` in your Supabase SQL editor.

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| End user | mwansa@klaaro.com | demo123456 |
| Agent | agent@klaaro.com | agent123456 |

---

## Project Structure

```
klaaro/
├── app/
│   ├── api/triage/        # Groq AI triage API route
│   ├── agent/             # Agent dashboard and ticket management
│   ├── portal/            # End user self-service portal
│   ├── login/             # Authentication pages
│   ├── signup/
│   └── layout.tsx
├── lib/
│   └── supabase/          # Supabase client configuration
├── public/                # PWA icons and static assets
└── middleware.ts           # Auth protection for all routes
```

---

## Roadmap

- Phase 1 — Hackathon prototype (complete)
- Phase 2 — Pilot launch with 1–2 organisations (months 1–3)
- Phase 3 — Change and problem management modules (months 3–6)
- Phase 4 — Local market launch with paid tiers (months 6–12)
- Phase 5 — Regional SADC expansion (months 12–18)

---

## Built by

[Cradlaxis](https://cradlaxis.com) — IT and marketing solutions.

Abdul Rahman — founder and developer.
