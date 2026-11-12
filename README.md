# FeedbackHub

> **Multi-tenant B2B SaaS feedback management platform for customer and employee insights.**

FeedbackHub is a production-grade SaaS application designed to empower organizations to collect, triage, analyze, and act on feedback from both **customers** and **employees**. Each company gets an independent, branded portal on a dedicated subdomain (e.g. `abc.feedbackhub.com`), while sharing a unified, secure, multi-tenant cloud backend.

---

## 1. Architectural Highlights

- **Centralized Multi-Tenancy**: Single web SPA and backend infrastructure serving all companies with dynamic tenant resolution.
- **Hostname-Based Subdomain Routing**: Dynamic routing across marketing (`feedbackhub.com`), SaaS central console (`app.feedbackhub.com`), and company portals (`{company}.feedbackhub.com`).
- **Strict Data Isolation**: PostgreSQL Row-Level Security (RLS) combined with application-level discriminator column (`companyId`) scoping.
- **Dual Audience Architecture**: Dedicated, customized workflows for external customer feedback and internal employee surveys.
- **Guaranteed Anonymity & Privacy**: Cryptographically decoupled anonymous submissions with zero IP/fingerprint retention and $k$-anonymity thresholding ($k \ge 5$) on employee demographic reports.
- **Design System**: Original premium SaaS aesthetic inspired by clean, modern interfaces—featuring pill controls, soft shadows, subtle borders, and exact corner radius rules.

---

## 2. Technology Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide React, Framer Motion, React Router, TanStack Query, React Hook Form, Zod
- **Backend**: Node.js 20+, NestJS, TypeScript, REST API, Swagger / OpenAPI
- **Database**: PostgreSQL 16+, Prisma ORM, versioned SQL migrations
- **Authentication**: Secure server-side sessions, HttpOnly SameSite=Lax cookies, Argon2id password hashing, RBAC
- **Storage & Integrations**: S3-compatible private object storage, Resend (email), Razorpay (payments - stubbed in early phases)
- **Local Dev Infrastructure**: Docker Compose (PostgreSQL, Redis, MinIO)

---

## 3. Monorepo Structure

```
feedbackhub/
├── apps/
│   ├── web/                  # React Single Page Application (Marketing, Dashboard & Portals)
│   └── api/                  # NestJS REST API Gateway
├── packages/
│   ├── ui/                   # Shared design system components & design tokens
│   ├── types/                # Shared TypeScript models, contracts, and DTOs
│   ├── validation/           # Isomorphic Zod validation schemas
│   └── config/               # Shared TypeScript and tooling configs
├── database/
│   ├── prisma/               # Prisma schema definitions
│   ├── migrations/           # Versioned SQL migrations
│   └── seed/                 # Database seeders
├── docs/                     # Comprehensive architecture and engineering specifications
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ARCHITECTURE_DECISIONS.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── DESIGN_SYSTEM.md
│   └── ROADMAP.md
├── .env.example              # Environment variables template
├── docker-compose.yml        # Local development backing services
├── package.json              # Monorepo root scripts
├── pnpm-workspace.yaml       # pnpm workspace configuration
└── README.md
```

---

## 4. Documentation Index

Detailed architectural and engineering blueprints are available in the [`docs/`](./docs) directory:

1. [**Product Requirements Document (PRD)**](./docs/PRD.md) — Product vision, user personas, dual-audience strategy, functional requirements.
2. [**System Architecture**](./docs/ARCHITECTURE.md) — High-level topology, request lifecycle, tenant resolution pipeline, frontend/backend architecture.
3. [**Architectural Decisions (ADRs)**](./docs/ARCHITECTURE_DECISIONS.md) — Rationale for host routing, session auth, RLS, privacy guarantees.
4. [**Database Architecture**](./docs/DATABASE.md) — Conceptual ER model, Prisma schema, tenant-owned entities, indexing strategy, anonymity decoupling.
5. [**Security Architecture**](./docs/SECURITY.md) — Multi-tenant isolation layers, RBAC matrix, cookie security, anti-fingerprinting, vulnerability protections.
6. [**Design System**](./docs/DESIGN_SYSTEM.md) — Color tokens, strict rounded UI rules, typography, dynamic tenant branding, motion guidelines.
7. [**14-Phase Roadmap**](./docs/ROADMAP.md) — Phase-by-phase implementation plan, deliverables, and verification criteria.

---

## 5. Getting Started (Local Development)

### Prerequisites
- Node.js >= 20.0.0 (tested with v24.18.0)
- pnpm >= 9.0.0 (tested with v12.18.0)
- Docker Desktop (for PostgreSQL, Redis, MinIO)

### Installation & Quickstart

```bash
# 1. Clone repository
git clone https://github.com/HarshChaudhary-cyber/FeedbackHub.git
cd FeedbackHub

# 2. Copy environment variables
cp .env.example .env

# 3. Install dependencies across all workspace packages
pnpm install

# 4. (If prompted by pnpm v10+) Approve allowed build scripts
pnpm approve-builds --all

# 5. Start local backing services (PostgreSQL, Redis, MinIO)
docker compose up -d

# 6. Generate Prisma client
pnpm db:generate
```

### Running Applications

```bash
# Start both Frontend and Backend concurrently
pnpm dev

# Or start individually:
pnpm dev:web    # React 19 + Vite app on http://localhost:3000
pnpm dev:api    # NestJS REST API on http://localhost:4000/api/v1 (Swagger at /api/docs)
```

### Verification & Quality Scripts

```bash
# Type check all workspace packages
pnpm typecheck

# Lint entire workspace with ESLint
pnpm lint

# Run unit tests across workspace with Vitest
pnpm test

# Build all packages and applications for production
pnpm build

# Cross-platform cleanup of build outputs and node_modules
pnpm clean
```

---

## 6. Development Status & Current Phase

- **Current Status**: **Phase 1.1 — Runnable Monorepo Foundation** (Complete)
  - React + Vite SPA (`apps/web`) operational on port 3000 with hostname resolution.
  - NestJS API Gateway (`apps/api`) operational on port 4000 with `/api/v1/health` and Swagger documentation.
  - Multi-package pnpm workspace with genuine build, lint, test, and typecheck scripts.
  - PostgreSQL schema and Prisma client generation verified.
- **Next Phase**: **Phase 2 — Design System and UI Foundation**

---

## 7. License

Proprietary / All rights reserved.
