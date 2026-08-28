# ReachInbox Email Scheduler — Full-Stack Production System

A high-throughput, reliable email scheduling service and dashboard designed for cold email outreach. Built with Node.js, TypeScript, Express, BullMQ, Redis, PostgreSQL (Prisma), Elasticsearch 8, Ethereal SMTP, and a modern React + Tailwind CSS frontend.

---

## ⚡ Key Highlights & Architecture

- **Persistent Queue Engine (BullMQ + Redis)**: Zero cron jobs. All scheduling uses persistent BullMQ delayed jobs with Redis AOF persistence.
- **Strict Idempotency**: PostgreSQL state transitions (`SCHEDULED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SENT`/`FAILED`) backed by unique `jobId` constraints and worker idempotency checks to prevent duplicate emails across worker restarts.
- **Distributed Throttling & Rate Limiting**:
  - **Minimum Delay Throttling**: Atomic Redis Lua script enforces `MIN_EMAIL_DELAY_MS` between consecutive email dispatches.
  - **Hourly Limit**: Atomic Redis counters (`email-rate:{sender}:{YYYY-MM-DD-HH}`) automatically delay and reschedule excess emails to the next available hour window.
- **Real SMTP Integration**: Nodemailer connected to Ethereal SMTP with dynamic test account creation and live preview URLs.
- **Full-Text Search (Elasticsearch 8)**: Indexes recipient, subject, and body with fuzzy matching and instant query response.
- **Multi-Channel Alerts**: Real Slack OAuth flow with automated rate-limit alert notifications sent to Slack.
- **Authentication**: Google OAuth 2.0 with JWT session tokens and protected API middleware.
- **Recipient Parsing**: In-memory CSV and raw text file parsing with email syntax validation, duplicate removal, and statistics.
- **Queue Monitoring**: Official Bull Board mounted at `/admin/queues`.
- **Modern React Dashboard**: Real-time polling, dark mode, metric overviews, and modal composer.

---

## 🛠️ Tech Stack

| Component | Technologies |
|---|---|
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, CORS, Dotenv, JWT |
| **Queues & Worker** | BullMQ, Redis (ioredis), Bull Board |
| **Database** | PostgreSQL 16 (Docker) |
| **Search Engine** | Elasticsearch 8.14.3 (Docker) |
| **SMTP Delivery** | Nodemailer, Ethereal Email |
| **OAuth & Alerts** | Google OAuth 2.0, Slack OAuth & Slack Web API |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/)
- [Node.js (v18+)](https://nodejs.org/)

### 2. Start Infrastructure
Start PostgreSQL, Redis, and Elasticsearch containers via Docker Compose:
```bash
docker compose up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```
Backend runs at `http://localhost:3000`.

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend dashboard opens at `http://localhost:5173`.

---

## 🔍 Verification & Testing

Run the automated test suites inside the `backend/` directory:

```bash
# Full Master End-to-End Suite (All 20 Levels)
npx ts-node src/utils/test-e2e-all.ts

# Database Connectivity
npx ts-node src/utils/test-db.ts

# BullMQ Queue & Worker
npx ts-node src/utils/test-queue.ts

# Scheduling API
npx ts-node src/utils/test-schedule-api.ts

# Real Ethereal SMTP
npx ts-node src/utils/test-smtp.ts

# Worker Idempotency & Replay Protection
npx ts-node src/utils/test-worker-idempotency.ts

# Redis Rate Limiting & Throttling
npx ts-node src/utils/test-rate-limiting.ts

# Slack OAuth & Notifications
npx ts-node src/utils/test-slack-integration.ts

# Elasticsearch 8 & Queries
npx ts-node src/utils/test-es-and-queries.ts

# CSV / Text Parser
npx ts-node src/utils/test-csv-upload.ts

# Google OAuth & JWT
npx ts-node src/utils/test-auth.ts
```

---

## 📡 REST API Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status & uptime |
| `POST` | `/api/emails/schedule` | Schedule emails with staggered delay |
| `GET` | `/api/emails/scheduled` | Paginated list of scheduled emails |
| `GET` | `/api/emails/sent` | Paginated list of sent emails |
| `GET` | `/api/emails/search?q=...` | Full-text search via Elasticsearch |
| `GET` | `/api/emails/:id` | Get email by ID |
| `POST` | `/api/emails/upload` | Parse & validate CSV / text recipients |
| `GET` | `/api/auth/google` | Initiate Google OAuth login |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/slack/auth` | Initiate Slack OAuth |
| `GET` | `/api/slack/status` | Check Slack connection status |
| `POST` | `/api/slack/disconnect` | Disconnect Slack integration |
| `GET` | `/admin/queues` | Bull Board queue monitoring dashboard |
