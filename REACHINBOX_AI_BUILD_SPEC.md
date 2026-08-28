# ReachInbox Email Scheduler — Master AI Build Specification

## 0. PURPOSE

You are the coding agent working inside an existing local repository.

Build the ReachInbox Hiring Assignment as a production-oriented full-stack email scheduler.

IMPORTANT:
- Implement the project LEVEL BY LEVEL.
- Do not build everything in one pass.
- After each level, test the implementation, update `PROJECT_STATUS.md`, and stop.
- Do not continue to the next level until the current level is working.
- If the current level is already complete, inspect the repository and `PROJECT_STATUS.md`, then continue from the next incomplete level.
- Preserve working code.
- Never rewrite the whole project unnecessarily.
- Never use cron.

This file is the single source of truth for the project requirements and implementation order.

---

# 1. ASSIGNMENT REQUIREMENTS

## Product

ReachInbox is an AI-powered cold email outreach platform.

This assignment is to build a small production-oriented slice of ReachInbox:

> A reliable email scheduling service + dashboard that accepts email scheduling requests, stores them, schedules persistent BullMQ jobs, sends emails through Ethereal SMTP, enforces concurrency/delay/hourly rate limits, indexes emails in Elasticsearch, provides Slack notifications when rate limits are reached, and exposes a React dashboard.

## Submission

Submission is tomorrow.

Therefore:
- Prioritize working mandatory functionality.
- Prefer simple and reliable implementations.
- Avoid unnecessary architecture and dependencies.
- Do not spend excessive time on pixel-perfect UI before backend reliability is working.
- Every feature must be demonstrable.

---

# 2. NON-NEGOTIABLE TECHNOLOGY

## Backend

- Node.js
- TypeScript
- Express.js
- BullMQ
- Redis
- PostgreSQL
- Prisma ORM
- Nodemailer
- Ethereal Email SMTP
- Elasticsearch

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router if needed

## Authentication

- Real Google OAuth

## Notifications

- Real Slack OAuth
- Real Slack API notification

## Infrastructure

- Docker Compose
- PostgreSQL
- Redis
- Elasticsearch

## Queue Monitoring

- Bull Board or another official/reliable BullMQ-compatible dashboard

---

# 3. HARD CONSTRAINTS

These rules must NEVER be violated.

## No cron

Do NOT use:
- cron
- node-cron
- agenda
- OS crontab
- setInterval-based scheduling
- polling loops pretending to be a scheduler

Scheduling MUST use BullMQ delayed jobs and Redis persistence.

## Persistent scheduling

If the Node.js backend stops and starts again:
- future jobs must remain in Redis
- jobs must not be recreated from scratch
- scheduled times must remain correct
- already-sent emails must not be sent again

## Idempotency

An email must not intentionally be sent more than once.

Use:
- persistent database status
- stable email/job ID
- BullMQ jobId
- safe worker checks
- database updates/transactions where appropriate

## Configuration

Never hardcode:
- worker concurrency
- minimum delay
- hourly email limit
- credentials
- OAuth secrets
- database credentials
- Redis credentials
- SMTP credentials

Use `.env`.

Never commit secrets.

---

# 4. TARGET ARCHITECTURE

Use this architecture:

React Dashboard
        |
        v
Express REST API
        |
        +--------------------+
        |                    |
        v                    v
PostgreSQL              Redis / BullMQ
        |                    |
        |                    v
        |               Email Worker
        |                    |
        |                    v
        |               Ethereal SMTP
        |
        v
Elasticsearch

Google OAuth -> Express -> PostgreSQL

Slack OAuth -> Express -> PostgreSQL/token storage
                              |
                              v
                         Slack API

Bull Board -> BullMQ/Redis

PostgreSQL is the source of truth for application data.

Redis is the source of truth for BullMQ queue state and distributed rate limiting.

Elasticsearch is a search index, not the source of truth.

---

# 5. CORE EMAIL FLOW

The final scheduling flow must be approximately:

Frontend
  |
  | POST /api/emails/schedule
  v
Express API
  |
  +--> Validate request
  |
  +--> Parse recipients
  |
  +--> Create Email records in PostgreSQL
  |
  +--> Create BullMQ delayed jobs
  |
  v
Redis / BullMQ
  |
  | At scheduled time
  v
Worker
  |
  +--> Load Email from PostgreSQL
  |
  +--> Check idempotency/status
  |
  +--> Apply minimum delay/rate-limit logic
  |
  +--> Send through Ethereal
  |
  +--> Update PostgreSQL
  |
  +--> Index/update Elasticsearch
  |
  +--> Notify Slack when hourly limit is hit

---

# 6. PROJECT STRUCTURE

Target structure:

reachinbox-scheduler/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── queues/
│   │   ├── workers/
│   │   ├── utils/
│   │   ├── types/
│   │   └── app.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── PROJECT_STATUS.md
├── README.md
└── .gitignore

The exact structure may be adjusted if there is a strong reason, but keep the project modular and understandable.

---

# 7. DATABASE MODEL

Use PostgreSQL + Prisma.

## User

Fields:

- id
- googleId
- name
- email
- avatar
- slackAccessToken or appropriate Slack credential representation
- createdAt
- updatedAt

## Email

Fields:

- id
- userId
- recipient
- subject
- body
- scheduledAt
- sentAt
- status
- jobId
- error
- sender identifier if multiple senders are implemented
- createdAt
- updatedAt

Status enum:

- SCHEDULED
- PROCESSING
- SENT
- FAILED

Add appropriate indexes.

`jobId` must be unique where appropriate for idempotency.

If the implementation introduces a Sender model, keep it simple and document why.

---

# 8. ENVIRONMENT VARIABLES

Create `.env.example`.

Expected variables include:

# Backend
PORT=
NODE_ENV=

# Database
DATABASE_URL=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

# Worker
WORKER_CONCURRENCY=
MIN_EMAIL_DELAY_MS=
MAX_EMAILS_PER_HOUR=

# Ethereal
ETHEREAL_HOST=
ETHEREAL_PORT=
ETHEREAL_USER=
ETHEREAL_PASSWORD=
EMAIL_FROM=

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
JWT_SECRET=

# Elasticsearch
ELASTICSEARCH_URL=

# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=

Frontend variables should use the appropriate Vite prefix.

Do not expose server secrets to the frontend.

---

# 9. LEVEL-BY-LEVEL IMPLEMENTATION PLAN

The coding agent MUST follow these levels in order.

---

# LEVEL 0 — Repository Inspection and Planning

Before changing code:

1. Inspect the repository.
2. Identify whether a project already exists.
3. Read:
   - README.md
   - PROJECT_STATUS.md if present
   - package.json
   - backend package.json
   - frontend package.json
   - docker-compose.yml
   - Prisma schema if present
4. Determine which levels are already complete.
5. Do not rebuild completed work.
6. Create `PROJECT_STATUS.md` if it does not exist.

At the end of Level 0:
- explain the current state
- identify the next incomplete level
- do not implement unrelated features

---

# LEVEL 1 — Initial Project Setup

Create/configure:

Backend:
- Express
- TypeScript
- dotenv
- cors
- development scripts
- production build scripts

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS

Create:
- backend/
- frontend/
- `.gitignore`
- `.env.example`

Implement:

GET /api/health

Expected:

{
  "status": "ok"
}

Do not implement business logic.

Verification:
- backend starts
- frontend starts
- health endpoint works

---

# LEVEL 2 — Docker Infrastructure

Create `docker-compose.yml`.

Services:
- PostgreSQL
- Redis
- Elasticsearch

Requirements:
- persistent volumes
- sensible ports
- health checks where practical
- development configuration
- environment variables

Elasticsearch can use single-node development mode.

Do not add cron.

Verify all services start.

---

# LEVEL 3 — PostgreSQL + Prisma

Implement Prisma.

Create:
- User
- Email
- status enum
- indexes
- jobId idempotency support

Run migrations.

Create database configuration.

Verify:
- Prisma connects
- migration succeeds
- basic DB query succeeds

Do not implement email sending yet.

---

# LEVEL 4 — Express Architecture

Create modular structure:

- config
- controllers
- routes
- services
- middleware
- queues
- workers
- utils
- types

Implement:
- centralized error handling
- async error handling
- CORS
- JSON parsing
- health route
- environment validation where practical

Keep it simple.

---

# LEVEL 5 — Redis + BullMQ

Create:

`src/queues/email.queue.ts`

`src/workers/email.worker.ts`

Requirements:
- Redis connection
- queue named `email-queue`
- configurable worker concurrency
- graceful shutdown
- logging for:
  - added
  - active
  - completed
  - failed

Worker may initially log the emailId.

DO NOT implement cron.

Verification:
- add a test job
- worker receives it
- Redis contains queue state

---

# LEVEL 6 — Email Scheduling API

Create:

POST `/api/emails/schedule`

Request example:

{
  "subject": "Hello",
  "body": "Test email",
  "startTime": "2026-08-29T10:00:00.000Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 100,
  "recipients": [
    "a@example.com",
    "b@example.com"
  ]
}

For each recipient:

1. validate email
2. create Email record
3. calculate scheduled time
4. create BullMQ delayed job
5. store jobId

Scheduling:

recipient 1 = startTime

recipient 2 = startTime + delay

recipient 3 = startTime + 2 * delay

etc.

Return:
- number scheduled
- email IDs
- scheduled times

No cron.

---

# LEVEL 7 — Ethereal SMTP

Create:

`src/services/email.service.ts`

Implement Nodemailer + Ethereal.

Function:

sendEmail({
  to,
  subject,
  body
})

Return:
- message metadata
- preview URL if available

Handle SMTP errors.

Do not fake the SMTP integration.

---

# LEVEL 8 — Worker + Idempotency

Connect worker to the real email service.

Worker flow:

BullMQ job
  |
  v
Load Email
  |
  v
If SENT -> skip safely
  |
  v
Set PROCESSING
  |
  v
Send Ethereal email
  |
  v
Set SENT + sentAt
  |
  v
Index Elasticsearch later

On failure:
- set FAILED
- store error
- allow controlled retry where appropriate

IMPORTANT:

If the job is retried and DB status is already SENT:
- do not send again

Use safe database state transitions.

Test:
1. schedule email
2. send email
3. restart worker
4. verify no duplicate send

---

# LEVEL 9 — Minimum Delay

Implement:

`MIN_EMAIL_DELAY_MS`

Default example:

2000

The value must come from configuration.

The implementation must ensure that email sends do not happen faster than the configured minimum where the design requires global/per-sender throttling.

Use BullMQ limiter or Redis-backed logic where appropriate.

Do not use in-memory-only throttling.

Document the exact behavior.

---

# LEVEL 10 — Distributed Hourly Rate Limiting

Implement:

`MAX_EMAILS_PER_HOUR`

Example:

100

Use Redis-backed counters.

Suggested key:

`email-rate:{sender}:{YYYY-MM-DD-HH}`

Requirements:

- atomic Redis operations
- safe across multiple workers
- no in-memory-only counters
- no dropped jobs
- no permanent failure when limit is reached

When limit is reached:

1. calculate next available hour window
2. reschedule/delay the job
3. preserve job payload and identity
4. preserve ordering as much as reasonably possible
5. do not duplicate the email

If rescheduling the existing BullMQ job is not safe/practical, implement a carefully documented remove-and-recreate strategy with the same stable email identity/job ID and database state.

Do not use cron.

---

# LEVEL 11 — Slack Rate-Limit Notification

Implement real Slack OAuth.

Dashboard:
- Connect Slack
- Disconnect Slack
- Show connected state

OAuth flow:

Frontend
 -> Backend
 -> Slack authorize
 -> Callback
 -> Store credential
 -> Connected

When a sender hits the hourly limit:

If Slack connected:
- call Slack API
- send a real notification

Example:

"ReachInbox rate limit reached for sender X. Emails have been rescheduled to the next available hour."

If Slack is not connected:
- do nothing
- do not throw an application error

If Slack is connected later:
- notifications must work without redeploying

Never fake the Slack call.

---

# LEVEL 12 — Elasticsearch

Create email index.

Index fields:

- id
- userId
- recipient
- subject
- body
- status
- scheduledAt
- sentAt

Index when:
- email is created
- status changes

Create:

GET `/api/emails/search?q=...`

Search:
- recipient
- subject
- body

PostgreSQL remains source of truth.

If Elasticsearch temporarily fails:
- do not lose the PostgreSQL record
- log the indexing error
- make indexing recoverable where practical

---

# LEVEL 13 — Scheduled and Sent APIs

Implement:

GET `/api/emails/scheduled`

GET `/api/emails/sent`

GET `/api/emails/:id`

Support:
- pagination
- sorting
- authenticated user filtering
- clean response shape
- loading-friendly frontend responses

Scheduled response:
- recipient
- subject
- scheduledAt
- status

Sent response:
- recipient
- subject
- sentAt
- status

---

# LEVEL 14 — CSV/Text Upload

Implement recipient upload.

Input:
- CSV
- text file

Requirements:
- parse email addresses
- validate
- remove duplicates
- report invalid addresses
- file size limit
- do not execute file contents
- do not permanently store uploaded file unless necessary

Return:

{
  "detected": 25,
  "valid": 23,
  "invalid": 2,
  "unique": 22,
  "emails": [...]
}

---

# LEVEL 15 — Google OAuth

Implement real Google OAuth.

Flow:

Frontend login
 -> Google
 -> Backend callback
 -> User create/update
 -> Auth session
 -> Dashboard

Store:
- googleId
- name
- email
- avatar

Implement:
- current user endpoint
- logout
- protected APIs

Do not use fake login.

Use secure HTTP-only cookies or another appropriate session approach.

---

# LEVEL 16 — React Dashboard

Build the main dashboard according to the provided Figma as closely as practical.

Required:

Header:
- ReachInbox branding
- user name
- email
- avatar
- logout

Sections/tabs:
- Scheduled Emails
- Sent Emails

Primary action:
- Compose New Email

Scheduled table:
- Email
- Subject
- Scheduled time
- Status

Sent table:
- Email
- Subject
- Sent time
- Status

Include:
- loading state
- empty state
- error state
- responsive layout
- reusable components
- TypeScript types

Do not sacrifice backend correctness for visual polish.

---

# LEVEL 17 — Compose New Email

Create modal or page.

Fields:

- Subject
- Body
- CSV/Text upload
- Start time
- Delay between emails
- Hourly limit

After upload:
- show number detected
- show valid/invalid information

Schedule button:
- validate
- call backend API
- show loading
- show success/error
- refresh scheduled list
- reset form

Use reusable components.

---

# LEVEL 18 — BullMQ Dashboard

Implement Bull Board or another reliable BullMQ dashboard.

Expose protected route such as:

`/admin/queues`

Show:
- waiting
- delayed
- active
- completed
- failed

Do not build a fake queue dashboard.

---

# LEVEL 19 — Final Integration and Reliability Testing

Test all mandatory scenarios.

## Test A — Normal scheduling

Schedule email:
 -> PostgreSQL
 -> delayed BullMQ job
 -> Redis
 -> worker
 -> Ethereal
 -> SENT

## Test B — Restart persistence

1. schedule email 2-5 minutes in future
2. stop backend
3. keep Redis running
4. start backend again
5. verify job remains
6. verify email sends at correct time

## Test C — Idempotency

Attempt worker retry / duplicate processing.

Verify:
- email sent once
- duplicate worker processing does not send twice

## Test D — Concurrency

Set:

WORKER_CONCURRENCY=5

Schedule 20+ emails.

Verify multiple jobs can process concurrently.

## Test E — Minimum delay

Set:

MIN_EMAIL_DELAY_MS=2000

Verify the configured throttling behavior.

## Test F — Hourly rate limit

Set:

MAX_EMAILS_PER_HOUR=3

Schedule 10 emails.

Verify:
- first available window processes only allowed count
- remaining jobs are delayed
- no jobs are dropped
- jobs eventually become available

## Test G — Slack

Connect Slack.

Trigger rate limit.

Verify real Slack message.

Disconnect Slack.

Trigger rate limit.

Verify application does not crash.

## Test H — Elasticsearch

Search:
- recipient
- subject
- body

Verify indexed records are returned.

## Test I — CSV

Upload:
- valid addresses
- invalid addresses
- duplicates

Verify correct parsing.

---

# LEVEL 20 — Production Review

Before submission, review:

## Backend

- TypeScript correctness
- API validation
- error handling
- database indexes
- Redis connections
- BullMQ configuration
- worker shutdown
- idempotency
- rate limiting
- race conditions
- retry behavior
- security

## Frontend

- reusable components
- TypeScript
- loading states
- empty states
- error states
- API error handling
- responsive UI

## Security

Check:
- secrets not committed
- `.env` ignored
- OAuth secrets backend-only
- file upload limits
- basic request validation
- protected APIs
- safe error responses

Do not make unnecessary rewrites.

---

# LEVEL 21 — PROJECT_STATUS.md

Maintain this file throughout development.

Format:

# ReachInbox Scheduler — Project Status

## Current Level
LEVEL X

## Completed

- [x] Level 1
- [x] Level 2
- [ ] Level 3

## Working Features

List working features.

## Files Added/Modified

List important files.

## Environment Variables

List variable names only.
Never store values/secrets.

## Database Changes

Describe schema/migrations.

## APIs Implemented

List routes.

## Known Issues

List real issues.

## Next Step

State exactly what should be implemented next.

## Verification

List commands/tests that currently pass.

After every level, update this file.

---

# LEVEL 22 — Git Checkpoints

After every successful level:

Run tests.

Then:

git add .
git commit -m "level-X-description"

Examples:

git commit -m "level-1-project-setup"
git commit -m "level-5-bullmq-redis"
git commit -m "level-8-worker-idempotency"
git commit -m "level-10-rate-limiting"
git commit -m "level-16-dashboard"

Do not commit:
- `.env`
- passwords
- OAuth secrets
- API keys
- private credentials

---

# LEVEL 23 — README

Create a professional README.

Include:

1. Project overview
2. Features
3. Tech stack
4. Architecture diagram
5. Project structure
6. Prerequisites
7. Docker setup
8. Environment variables
9. PostgreSQL setup
10. Redis setup
11. Elasticsearch setup
12. Ethereal setup
13. Google OAuth setup
14. Slack OAuth setup
15. Backend setup
16. Frontend setup
17. Running the worker
18. BullMQ dashboard
19. API documentation
20. Scheduling behavior
21. Restart persistence
22. Idempotency
23. Concurrency
24. Minimum delay
25. Hourly rate limiting
26. Elasticsearch search
27. Testing
28. Assumptions
29. Trade-offs
30. Demo instructions

Never claim a feature that is not actually implemented.

---

# LEVEL 24 — FINAL DEMO PREPARATION

Maximum video length: 5 minutes.

Recommended sequence:

## 0:00-0:30
Google login.

## 0:30-1:15
Compose email:
- subject
- body
- CSV
- detected recipients
- schedule settings

## 1:15-1:45
Scheduled emails table.

## 1:45-2:20
BullMQ dashboard.

Show:
- delayed
- waiting
- active

## 2:20-3:00
Ethereal email sending.

Show:
- sent status
- Ethereal preview

## 3:00-3:45
Restart persistence.

Show:
- schedule future job
- stop server
- restart server
- job still exists
- email sends

## 3:45-4:30
Rate limiting.

Show small configured hourly limit.

Show jobs being delayed/rescheduled.

Show Slack notification if connected.

## 4:30-5:00
Explain architecture:

React
 -> Express
 -> PostgreSQL
 -> BullMQ + Redis
 -> Worker
 -> Ethereal

Mention Elasticsearch and Slack.

---

# 10. CODING AGENT RULES

These rules apply at every level.

## Rule 1 — Inspect first

Before editing:
- inspect existing files
- inspect status
- inspect package.json
- inspect configuration

## Rule 2 — Work only on current level

Do not jump ahead unless a dependency requires it.

## Rule 3 — Preserve existing work

Do not replace working code with a completely new architecture.

## Rule 4 — Test before declaring completion

Every level must have a verification step.

## Rule 5 — Update status

Always update `PROJECT_STATUS.md`.

## Rule 6 — No fake functionality

Do not create:
- fake Google login
- fake Slack notification
- fake BullMQ dashboard
- fake Elasticsearch search
- fake Ethereal sending

## Rule 7 — No cron

Absolutely no cron.

## Rule 8 — No unnecessary dependencies

Before adding a package, determine whether it is actually required.

## Rule 9 — Explain important decisions

When a non-obvious implementation is used, document it.

## Rule 10 — Keep secrets safe

Never print or commit credentials.

---

# 11. HANDLING AI PLATFORM LIMITS

This project may be implemented across multiple AI coding platforms.

If the current AI platform reaches its usage limit:

1. Do not restart the project.
2. Do not delete the repository.
3. Open the same repository in another AI coding platform.
4. Tell the new AI to read:
   - this master specification file
   - `PROJECT_STATUS.md`
   - `README.md`
   - existing source files
5. Ask it to inspect the repository.
6. Continue from the next incomplete level.

Use this handoff prompt:

---

## AI HANDOFF PROMPT

I am continuing an existing ReachInbox Email Scheduler project.

Do NOT rebuild it.

First read:
- `REACHINBOX_AI_BUILD_SPEC.md`
- `PROJECT_STATUS.md`
- `README.md`

Then inspect the repository and determine:
1. What levels are completed?
2. What is partially completed?
3. What is the next incomplete level?
4. Are there existing bugs that block the next level?

Continue only from the correct point.

Rules:
- preserve working code
- do not duplicate features
- do not use cron
- do not invent fake integrations
- test changes
- update PROJECT_STATUS.md
- keep the implementation simple because submission is tomorrow

Before making major changes, briefly state what you found and what you will implement.

---

# 12. COMPLETION CHECKLIST

Before submission, all mandatory items should be checked:

## Backend

- [ ] Express + TypeScript
- [ ] PostgreSQL
- [ ] Prisma
- [ ] Redis
- [ ] BullMQ
- [ ] Delayed jobs
- [ ] Worker
- [ ] Configurable concurrency
- [ ] Minimum delay
- [ ] Hourly rate limit
- [ ] Redis-backed distributed rate limit
- [ ] Rescheduling after limit
- [ ] Idempotency
- [ ] Ethereal SMTP
- [ ] Elasticsearch
- [ ] Search API
- [ ] Google OAuth
- [ ] Slack OAuth
- [ ] Real Slack notification
- [ ] BullMQ dashboard
- [ ] Restart persistence
- [ ] No cron

## Frontend

- [ ] React
- [ ] TypeScript
- [ ] Tailwind
- [ ] Google login
- [ ] User profile
- [ ] Logout
- [ ] Scheduled emails
- [ ] Sent emails
- [ ] Compose email
- [ ] CSV upload
- [ ] Recipient count
- [ ] Start time
- [ ] Delay
- [ ] Hourly limit
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling
- [ ] Figma-inspired UI

## Submission

- [ ] Private GitHub repository
- [ ] Access granted to required reviewers
- [ ] README complete
- [ ] `.env.example`
- [ ] Docker Compose works
- [ ] Demo video <= 5 minutes
- [ ] Restart demo tested
- [ ] Rate-limit demo tested
- [ ] Slack demo tested
- [ ] No secrets committed
- [ ] Git history clean enough to review

---

# 13. FINAL INSTRUCTION TO THE AI CODING AGENT

You are not expected to implement the entire project in one response.

WORK LEVEL BY LEVEL.

At the beginning of each session:

1. Read this file.
2. Read `PROJECT_STATUS.md`.
3. Inspect the existing code.
4. Identify the current level.
5. Implement only that level.
6. Test it.
7. Fix errors.
8. Update `PROJECT_STATUS.md`.
9. Stop.

When the user says "continue", proceed to the next incomplete level.

When the user switches AI platforms, continue from the repository state instead of rebuilding.

The final goal is a working, demonstrable, reliable ReachInbox email scheduler—not a large amount of generated code.

Prioritize:

RELIABILITY > CORRECTNESS > REQUIRED FEATURES > DEMO QUALITY > UI POLISH > OPTIONAL FEATURES.
