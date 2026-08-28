# ReachInbox Scheduler — Project Status

## Current Level
LEVEL 2 ✅ Complete

## Completed

- [x] Level 0 — Repository inspection and planning
- [x] Level 1 — Initial project setup
- [x] Level 2 — Docker Infrastructure
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
- PostgreSQL running in Docker on port 5432 (healthy)
- Redis running in Docker on port 6379 (healthy, AOF persistence enabled)
- Elasticsearch 8 running in Docker on port 9200 (status: green, single-node dev mode)
- Frontend proxies `/api/*` to backend via Vite config
- Tailwind CSS configured and working

## Files Added/Modified

```
docker-compose.yml   — PostgreSQL 16, Redis 7, Elasticsearch 8.14.3
                       Named volumes for all three (data persists across restarts)
                       Health checks on all services
```

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

**Level 3 — PostgreSQL + Prisma**

Create Prisma schema with User and Email models, run migrations, verify DB connection.

## Verification

Commands that pass:

```powershell
# Backend health
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
# { status: 'ok' }

# PostgreSQL
docker exec reachinbox_postgres pg_isready -U reachinbox -d reachinbox
# /var/run/postgresql:5432 - accepting connections

# Redis
docker exec reachinbox_redis redis-cli ping
# PONG

# Elasticsearch
Invoke-RestMethod -Uri "http://localhost:9200/_cluster/health"
# { status: 'green', number_of_nodes: 1 }

# Docker containers
docker compose ps
# All 3 containers Up and healthy
```
