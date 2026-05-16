# MeetFlow Server Service — V2

> AI-powered meeting platform backend. Multi-tenant SaaS architecture with schema-per-org PostgreSQL isolation.

---

## What this is

MeetFlow Server Service is the backend API for the MeetFlow platform — an AI-powered meeting assistant that handles real-time video, automated transcription, speaker diarization, action item extraction, and team collaboration in a single unified workspace.

This is V2 — a complete architectural rebuild from the V1 rapid-development codebase. V1 is preserved at the `release/v1` branch (tagged `v1.0.0`) for reference.

---

## Architecture decisions

| Decision | Choice | Reason |
|---|---|---|
| Runtime | Node.js ≥ 20 | LTS, native ESM, improved performance |
| Modules | ES Modules (`"type": "module"`) | No CommonJS — consistent across the codebase |
| Framework | Express 5 | Async error propagation, maintained |
| Architecture | Monolith (not microservices) | Correct scale for current stage, easier to reason about |
| Multi-tenancy | Schema-per-org (PostgreSQL schemas) | True isolation, no shared-table tenant leakage |
| Folder structure | Feature-modular (`src/modules/<domain>/<feature>/`) | Each module owns its repository + service + validator + controller + route |
| ORM | Sequelize 6 | Mature, schema-aware, raw query support |
| Validation | Zod (env) + custom validate() middleware (requests) | Typed config, request-level validation |
| Logging | Pino (structured JSON, auto-redact) | Production-grade, fast, no sensitive data leaks |
| Auth | JWT (access + refresh token rotation, single master table) | All tokens in master_tenant schema, differentiated by user_type |

---

## Tech stack

| Layer | Technology |
|---|---|
| Server | Node.js 20, Express 5 |
| Database | PostgreSQL 15+ via Sequelize |
| Auth | JWT (jsonwebtoken), bcrypt |
| Config validation | Zod |
| Logging | Pino + pino-pretty |
| Real-time | LiveKit (video), Server-Sent Events (AI status) |
| Messaging | Stream Chat |
| AI Pipeline | Custom AI service (internal HTTP) |
| Storage | Supabase S3-compatible (recordings) |
| Email | Nodemailer (Gmail SMTP) |
| Testing | Vitest + Supertest |
| Linting | ESLint |

---

## Repository structure (planned — built phase-by-phase)

```
src/
├── app.js                    ← Express app factory
├── config/                   ← env validation, database config, swagger config
├── constants/                ← role constants, plan limit keys, response codes
├── errors/                   ← AppError hierarchy, domain errors
├── middlewares/               ← auth, rate limiting, validation, requestId, errorHandler
├── migrations/               ← custom ESM migration runner + all schema DDL
│   ├── master/               ← master_tenant schema migrations
│   └── tenant/               ← per-org schema migrations
├── models/
│   ├── index.js              ← thin orchestrator
│   ├── masterDb.js           ← master model registration + associations
│   ├── tenantDb.js           ← tenant model factory + associations
│   ├── master/               ← Organization, Plan, MasterUser, etc.
│   ├── organization/         ← User, Role, Invitation, PlanLimitUsage
│   └── workspace/            ← Workspace, Channel, Meeting, etc.
├── modules/
│   ├── auth/                 ← login, logout, token rotation, password reset
│   ├── account/              ← profile, change password
│   ├── master/               ← organization, plan, role, user, feature, planFeature, planLimit
│   ├── organization/         ← invitation, member, role, settings
│   ├── workspace/            ← workspace, channel, workspace-member, channel-member, meeting
│   ├── ai/                   ← pipeline, voice enrollment, webhook, AI client
│   ├── chat/                 ← Stream Chat token generation
│   └── webhook/              ← LiveKit webhook receiver
├── routes/
│   └── index.js              ← top-level API router
├── scripts/                  ← migrate.js, seed.js, generate-migration.js
├── seeders/                  ← master role, user, and plan seeders
└── utils/                    ← logger, response, token, password, email, domain, livekit, stream, audio, pagination
index.js                      ← server entry point
```

---

## Setup

```bash
# 1. Clone and install
git clone https://github.com/MeetFlowAI/meetflow-server-service.git
cd meetflow-server-service
npm install

# 2. Configure environment
cp .env.example .env.development
# Fill in all required values in .env.development

# 3. Run database migrations (after configuring DATABASE_URL)
npm run migrate

# 4. Seed initial data (roles, admin user, plans)
npm run seed

# 5. Start development server
npm run dev
```

---

## Available scripts

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Start with nodemon (auto-restart) |
| Production | `npm run start` | Start without nodemon |
| Migrate | `npm run migrate` | Run all pending migrations |
| Seed | `npm run seed` | Seed master roles, admin user, and plans |
| Generate migration | `npm run generate-migration` | Interactive CLI to scaffold a new migration |
| Test | `npm test` | Run Vitest test suite |
| Coverage | `npm run coverage` | Run tests with coverage report |
| Lint | `npm run lint` | Run ESLint with zero-warnings policy |

---

## Environment variables

See [`.env.example`](.env.example) for the complete list of required environment variables with descriptions and generation instructions for secrets.

---

## Migration phases

This V2 codebase is being built phase-by-phase with a clean Git history. Each phase is an independent, reviewable unit:

| Phase | Name | Branch |
|---|---|---|
| 0 | Bootstrap | `main` (root commit) |
| 1 | Configuration & Env | `platform/phase-1-config` |
| 2 | Observability & Logging | `platform/phase-2-observability` |
| 3 | Security Middleware | `platform/phase-3-security` |
| 4 | Error Handling | `platform/phase-4-errors` |
| 5 | Database & ORM | `platform/phase-5-database` |
| 6 | Multi-Tenancy | `platform/phase-6-multitenancy` |
| 7 | Migration System | `platform/phase-7-migrations` |
| 8 | Seeding System | `platform/phase-8-seeders` |
| 9 | Authentication | `platform/phase-9-auth` |
| 10 | RBAC & Authorization | `platform/phase-10-rbac` |
| 11 | Validation Layer | `platform/phase-11-validation` |
| 12 | Master Domain | `platform/phase-12-master-domain` |
| 13 | Organization Domain | `platform/phase-13-org-domain` |
| 14 | Workspace Domain | `platform/phase-14-workspace-domain` |
| 15 | Real-time Infrastructure | `platform/phase-15-realtime` |
| 16 | AI Pipeline | `platform/phase-16-ai-pipeline` |
| 17 | Messaging Integration | `platform/phase-17-messaging` |
| 18 | File Storage | `platform/phase-18-storage` |
| 19 | Testing Foundation | `platform/phase-19-testing` |
| 20 | API Documentation | `platform/phase-20-docs` |
| 21 | CI/CD Pipeline | `platform/phase-21-cicd` |
| 22 | Dockerization | `platform/phase-22-docker` |
| 23 | Monitoring & Alerting | `platform/phase-23-monitoring` |
| 24 | Production Hardening | `platform/phase-24-hardening` |

---

## V1 reference

The V1 codebase is permanently preserved:
- Branch: `release/v1` (read-only)
- Tag: `v1.0.0`

Do not modify these. They exist for rollback reference and audit trail.

---

## Contributing

### Branch naming
- Infrastructure phases: `platform/phase-N-name`
- Features: `feature/description`
- Hotfixes: `hotfix/description`

### Commit format
Follows [Conventional Commits](https://www.conventionalcommits.org/):
```
type(scope): description

Types: feat | fix | refactor | perf | build | chore | ci | docs | test | platform
```

### PR process
- Platform phase PRs → `develop` (merge commit)
- Feature PRs → `develop` (squash merge)
- Release PRs: `develop` → `staging` → `main` (merge commit)
- All PRs require CI to pass before merge
