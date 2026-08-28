# ReachInbox Scheduler — Project Status

## Current Level
LEVEL 1 ✅ Complete

## Completed

- [x] Level 0 — Repository inspection and planning
- [x] Level 1 — Initial project setup
- [ ] Level 2 — Docker Infrastructure
- [ ] Level 3 — PostgreSQL + Prisma
- [ ] Level 4 — Express Architecture
- [ ] Level 5 — Redis + BullMQ
- [ ] Level 6 — Email Scheduling API
- [ ] Level 7 — Ethereal SMTP
- [ ] Level 8 — Worker + Idempotency
- [ ] Level 9 — Minimum Delay
- [ ] Level 10 — Distributed Hourly Rate Limiting
- [ ] Level 11 — Slack Rate-Limit Notification
- [ ] Level 12 — Elasticsearch
- [ ] Level 13 — Scheduled and Sent APIs
- [ ] Level 14 — CSV/Text Upload
- [ ] Level 15 — Google OAuth
- [ ] Level 16 — React Dashboard
- [ ] Level 17 — Compose New Email
- [ ] Level 18 — BullMQ Dashboard
- [ ] Level 19 — Final Integration and Reliability Testing
- [ ] Level 20 — Production Review

## Working Features

- Express backend starts on port 3000
- `GET /api/health` returns `{ "status": "ok" }`
- React + Vite frontend starts on port 5173
- Frontend proxies `/api/*` to backend via Vite config
- Tailwind CSS configured and working

## Files Added/Modified

```
backend/
  package.json       — Express, dotenv, cors, TypeScript
  tsconfig.json      — TypeScript config (ES2020, commonjs)
  .env.example       — All env variable names (no values)
  .env               — Local dev env (not committed)
  src/
    app.ts           — Express app with /api/health

frontend/
  package.json       — React, Vite, Tailwind, Axios, React Router
  tsconfig.json      — Frontend TypeScript config
  tsconfig.node.json — Vite config TS config
  vite.config.ts     — Vite config with proxy to :3000
  tailwind.config.js — Tailwind content paths
  postcss.config.js  — PostCSS for Tailwind
  .env.example       — VITE_API_BASE_URL
  index.html         — HTML entry point
  src/
    main.tsx         — React root mount
    index.css        — Tailwind directives + dark base
    App.tsx          — Health check UI component

.gitignore           — Root gitignore (node_modules, .env, dist, etc.)
PROJECT_STATUS.md    — This file
```

## Environment Variables

### Backend
- PORT
- NODE_ENV
- DATABASE_URL
- REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- WORKER_CONCURRENCY, MIN_EMAIL_DELAY_MS, MAX_EMAILS_PER_HOUR
- ETHEREAL_HOST, ETHEREAL_PORT, ETHEREAL_USER, ETHEREAL_PASSWORD, EMAIL_FROM
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, JWT_SECRET
- ELASTICSEARCH_URL
- SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI

### Frontend
- VITE_API_BASE_URL

## Database Changes

None yet — Prisma added in Level 3.

## APIs Implemented

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/health | Returns { "status": "ok" } |

## Known Issues

None.

## Next Step

Level 2 — Docker Infrastructure

Create docker-compose.yml with:
- PostgreSQL (port 5432, persistent volume)
- Redis (port 6379, persistent volume)
- Elasticsearch single-node dev mode (port 9200, persistent volume)

## Verification

Commands that pass:

```powershell
# Backend health check
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
# Returns: { status: 'ok' }

# Backend starts with:   cd backend && npm run dev
# Frontend starts with:  cd frontend && npm run dev
```
