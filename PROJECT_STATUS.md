# ReachInbox Scheduler — Project Status

## Current Level
LEVEL 3 ✅ Complete

## Completed

- [x] Level 0 — Repository inspection and planning
- [x] Level 1 — Initial project setup
- [x] Level 2 — Docker Infrastructure
- [x] Level 3 — PostgreSQL + Prisma
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
- Prisma ORM configured with PostgreSQL
- `User` model (with Google OAuth and Slack token fields)
- `Email` model (with `jobId` unique constraint for BullMQ idempotency, enum status: SCHEDULED, PROCESSING, SENT, FAILED, indexed queries)
- Initial migration `20260828114849_init` created and applied
- Verified DB connection & Prisma queries

## Files Added/Modified

```
backend/
  prisma/
    schema.prisma      — User, Email models, EmailStatus enum, indexes, relations
    migrations/        — Migration 20260828114849_init
  src/
    config/
      database.ts      — Prisma Client singleton instance
    utils/
      test-db.ts       — DB connectivity test script
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

- Created table `users`: `id`, `googleId` (unique), `name`, `email` (unique), `avatar`, `slackAccessToken`, `createdAt`, `updatedAt`
- Created enum `EmailStatus`: `SCHEDULED`, `PROCESSING`, `SENT`, `FAILED`
- Created table `emails`: `id`, `userId` (FK to users), `recipient`, `subject`, `body`, `scheduledAt`, `sentAt`, `status`, `jobId` (unique), `error`, `senderEmail`, `createdAt`, `updatedAt`
- Added indexes on `userId`, `status`, `scheduledAt`, `recipient`, `jobId`

## APIs Implemented

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/health | Returns { "status": "ok" } |

## Known Issues

None.

## Next Step

**Level 4 — Express Architecture**

Create modular structure (config, controllers, routes, services, middleware, utils, types) with centralized error handling, async wrapper, environment validation, and cleaner health routing.

## Verification

Commands that pass:

```powershell
# Prisma migration & DB test
npx ts-node src/utils/test-db.ts
# [DB Test] Success! User count: 0, Email count: 0

# Backend health
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
# { status: 'ok' }

# Docker containers
docker compose ps
# All 3 containers Up and healthy
```

