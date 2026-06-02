# Implementation Plan: Ingredient Resource

**Branch**: `002-ingredient-crud` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-ingredient-crud/spec.md`

## Summary

Deliver the first domain resource — **Ingredient** — as a REST CRUD surface (`POST/GET/PATCH/DELETE /ingredients`, plus list with case-insensitive category filter and partial-name search). Beyond the feature itself, this slice establishes four reusable patterns for the whole codebase: **TypeBox request/response validation**, the **first PostgreSQL migration**, the **repository-over-real-database pattern**, and **integration tests against a real Postgres instance**.

Persistence uses **Drizzle ORM** (driver `pg`) with **drizzle-kit** migrations, confined strictly to the `infrastructure` layer; the domain `Ingredient` stays a plain object with no ORM/framework imports, preserving hexagonal boundaries.

The OpenAPI contract is additionally **served as interactive Swagger UI at `/docs`** via `@fastify/swagger` + `@fastify/swagger-ui`, generated from the route TypeBox schemas — making SC-004's "public API documentation" a concrete, always-in-sync artifact and establishing the docs pattern for future slices.

## Technical Context

**Language/Version**: TypeScript 6 (strict, NodeNext, ESM), Node.js 24

**Primary Dependencies**:
- `fastify` 5 — web framework (existing)
- `@sinclair/typebox` + `@fastify/type-provider-typebox` — schema-first request/response validation (introduced here; TypeBox was deferred at bootstrap)
- `@fastify/swagger` + `@fastify/swagger-ui` — generate the OpenAPI document from the route TypeBox schemas and serve it as interactive Swagger UI at `/docs` (single source of truth: the code schemas)
- `drizzle-orm` 0.45.2 (stable) — query layer / schema, infrastructure-only
- `drizzle-kit` 0.31.x — migration generation/apply (dev dependency)
- `pg` — PostgreSQL driver underneath Drizzle
- `uuidv7` — app-side UUID v7 generation (Node's `crypto.randomUUID` is v4-only)

**Storage**: PostgreSQL 17 (existing docker-compose service). App gains its first real DB connection: a pooled `pg.Pool` + Drizzle instance registered as a `shared/infrastructure` Fastify plugin, reading `DATABASE_URL`, closed on `onClose`.

**Testing**: Vitest at 100% coverage. Integration tests run against a **real, dedicated** Postgres database `ainodeats_test` (separate from the dev DB `ainodeats`) on the same compose instance. A Vitest `globalSetup` creates the test DB if absent and applies migrations once; each test truncates tables in `beforeEach`. Tests exercise the HTTP layer via Fastify `inject()`, hitting the real repository and database.

**Target Platform**: Linux server; local development via Docker Compose

**Project Type**: web-service (REST API)

**Performance Goals**: create→read round-trip < 2s (SC-001); partial-name search < 1s at 10k ingredients (SC-002); full suite < 30s (SC-005)

**Constraints**:
- Hexagonal + vertical slice: `src/ingredient/{domain,application,infrastructure}`; ORM imports allowed **only** in `infrastructure`
- Flat-first: no `use-cases/`, `http/`, `persistence/` subfolders yet
- 100% coverage enforced (lines/branches/functions/statements)
- Exact-pinned dependency versions (`.npmrc` `save-exact=true`)
- No auth, no pagination, hard delete, single shared catalog (per spec Assumptions)

**Scale/Scope**: ≤ 10,000 ingredients; list returns the full set in one response

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-First | ✅ PASS | `contracts/ingredient.yaml` (OpenAPI 3.1) defines all five endpoints before implementation; TypeBox schemas mirror the contract |
| II. TDD (real DB) | ✅ PASS | Integration tests written first against real `ainodeats_test`; no mocked DB (mocks prohibited) |
| III. AI-Augmented, Human-Approved | ✅ PASS | Technical Context + four architectural forks (persistence, migrations, test isolation, URL) debated and approved before artifact generation |
| IV. Simplicity / YAGNI | ✅ PASS | No pagination/auth/soft-delete; flat-first respected; trigram search index deferred. ORM adoption documented in Complexity Tracking |
| Architecture (hexagonal + vertical slice) | ✅ PASS | Single `ingredient` slice; domain entity is a framework-free POJO; Drizzle confined to infrastructure adapter |

## Project Structure

### Documentation (this feature)

```text
specs/002-ingredient-crud/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — Ingredient entity, constraints, Drizzle schema
├── quickstart.md        # Phase 1 — run migrations, start app, curl endpoints, run tests
├── contracts/
│   └── ingredient.yaml  # Phase 1 — OpenAPI 3.1 contract for /ingredients
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── infrastructure/
│       ├── app.ts            # existing — extended to register swagger + swagger-ui (/docs), db plugin, ingredient routes
│       ├── config.ts         # new — reads/validates DATABASE_URL from env
│       └── db.ts             # new — pg Pool + Drizzle instance as a Fastify plugin (decorates app.db; closes on onClose)
│
└── ingredient/               # vertical slice
    ├── domain/
    │   ├── ingredient.ts             # entity (plain type) + creation/normalization invariants; no imports of pg/drizzle/fastify
    │   ├── ingredient-repository.ts  # port interface (insert, findById, findMany, update, delete)
    │   └── errors.ts                 # IngredientNotFound, IngredientNameConflict (domain errors)
    ├── application/
    │   ├── create-ingredient.ts
    │   ├── get-ingredient.ts
    │   ├── list-ingredients.ts
    │   ├── update-ingredient.ts
    │   └── delete-ingredient.ts
    └── infrastructure/
        ├── ingredient-routes.ts          # Fastify route registration (the API adapter)
        ├── ingredient-schemas.ts         # TypeBox request/response schemas (mirror the contract)
        ├── ingredient-table.ts           # Drizzle table definition (schema)
        └── drizzle-ingredient-repository.ts  # adapter implementing the port; maps row <-> domain entity

drizzle/                      # drizzle-kit migration output (first migration: ingredient table)
└── 0000_<name>.sql
drizzle.config.ts             # drizzle-kit config (schema path, out dir, DATABASE_URL)

tests/
├── setup/
│   └── global-setup.ts       # create ainodeats_test if absent + apply migrations once
├── helpers/
│   └── db.ts                 # truncate helper + test app builder
├── shared/
│   └── infrastructure/
│       ├── app.smoke.test.ts   # app boots; /health, /docs + OpenAPI served
│       └── config.test.ts      # DATABASE_URL present/absent branches
└── ingredient/
    └── infrastructure/
        ├── create-ingredient.test.ts   # US1
        ├── get-ingredient.test.ts      # US1
        ├── list-ingredients.test.ts    # US2
        ├── update-ingredient.test.ts   # US3
        └── delete-ingredient.test.ts   # US3
```

**Structure Decision**: Hexagonal architecture + vertical slicing per constitution §Architecture. The `ingredient` slice carries all three layers (unlike the infrastructure-only `health` slice). The domain defines the `IngredientRepository` **port** and domain errors; the application holds one use case per operation; the infrastructure provides the Fastify routes (the API adapter) and the Drizzle repository (the persistence adapter). **Drizzle/pg are imported only under `infrastructure/`** — the domain and application layers remain framework- and DB-agnostic, so the ORM can be swapped without touching business logic. Flat-first is respected: use cases sit directly in `application/`, adapters directly in `infrastructure/`, no premature subfolders. The pooled connection lives in `shared/infrastructure/db.ts` as a Fastify plugin, mirroring the existing `app.ts` factory pattern so tests can `inject()` without binding a port.

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Drizzle ORM instead of hand-written SQL | Bundles type-safe queries + migrations (drizzle-kit) with full TS inference; explicit user decision after debate. Kept in `infrastructure` only, so it does not leak into domain/application | Raw `pg` + hand-written SQL + a custom migration runner was rejected by the maintainer ("no manual SQL at this point"); it would also mean owning migration state-tracking ourselves |
| Introduce `pg`, `drizzle-orm`, `drizzle-kit`, `uuidv7`, TypeBox deps | First domain feature needs real persistence, migrations, UUID v7, and schema validation — all deferred at bootstrap by design | N/A — these are the minimum to satisfy the spec; no extra abstraction added on top |

> Note: trigram (`pg_trgm`) GIN index for `ILIKE` search is **deferred** (YAGNI). A sequential scan over ≤10k rows comfortably meets SC-002's <1s target; the index is added only if a real measurement shows it is needed.
