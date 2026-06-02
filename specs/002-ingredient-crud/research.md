# Phase 0 Research: Ingredient Resource

All entries resolved during the `/speckit-plan` debate (2026-05-28). No open NEEDS CLARIFICATION remain.

## 1. Persistence layer

**Decision**: Drizzle ORM (`drizzle-orm` 0.45.2, stable) over the `pg` driver, imported only in the `infrastructure` layer.

**Rationale**: TS-first with full type inference from the schema (no separate DSL, no decorators on domain entities). Bundles migrations via drizzle-kit. The Drizzle table definition and query code live in the persistence adapter; the domain `Ingredient` is a plain object, so hexagonal boundaries hold and the ORM is swappable.

**Alternatives considered**:
- **Raw `pg` / `postgres` + hand-written SQL**: rejected by the maintainer ("no manual SQL at this point"); also forces us to own a migration runner.
- **Prisma**: most mature migrations, but a separate `schema.prisma` DSL + generated client (codegen step) and a tendency for generated types to leak into the domain — weaker hexagonal fit, heavier.
- **MikroORM**: idiomatic Data-Mapper + repositories, but decorator-based entities pull the ORM into the domain unless models are duplicated. More concepts than needed.
- **Sequelize**: maintainer has prior experience but it is JS-first with weak TS inference (high friction). Explicitly avoided.

**Maturity note**: drizzle-orm is ~4.5 years old, heavily adopted, with first-class Postgres support, but `latest` is still pre-1.0 (1.0 in RC). Risk is low here: single entity, exact-pinned deps, every migration is human-reviewed, and a future ORM swap is contained to the infrastructure adapter. We start on the **stable 0.45.2**, not the RC.

## 2. Migrations

**Decision**: drizzle-kit. `drizzle-kit generate` produces the SQL migration from the schema diff; `drizzle-kit migrate` applies it. Migration files committed under `drizzle/`.

**Rationale**: Pairs natively with the chosen ORM; satisfies the "no hand-written SQL" preference; state tracking handled by the tool. Generated SQL is reviewed before commit (Principle I / III).

**Alternatives considered**: `node-pg-migrate` and a plain SQL-file runner — both viable for a raw-driver approach but redundant once Drizzle is chosen.

## 3. Integration test isolation

**Decision**: Dedicated database `ainodeats_test` on the existing docker-compose Postgres, separate from the dev DB `ainodeats`. A Vitest `globalSetup` creates `ainodeats_test` if it does not exist and applies migrations once. Each test runs `TRUNCATE` on the affected tables in `beforeEach`. Tests drive the HTTP layer via Fastify `inject()`.

**Rationale**: Reuses existing infra (no new dependency), keeps dev data safe, and is reliable with a connection pool. Truncate-between-tests is fast enough for the <30s target at this scale.

**Alternatives considered**:
- **Testcontainers**: cleanest isolation and self-contained for CI, but adds a dependency and container-startup latency. Reconsider when CI is introduced.
- **Transaction-rollback per test**: awkward with a pool — the app and test would need to share a single connection. More wiring and footguns than it is worth here.

**Why a separate test DB**: `TRUNCATE` against the dev database would destroy data the maintainer is working with. `ainodeats_test` is provisioned on the fly in `globalSetup` (not via a compose `initdb` script, because the data volume is already initialized and init scripts only run on an empty volume).

## 4. URL convention

**Decision**: `/ingredients` with no version or `/api` prefix.

**Rationale**: Consistent with the existing `/health` route; YAGNI. Versioning is cheap to add later when an actual breaking change forces it.

**Alternatives considered**: `/api/v1/ingredients`, `/v1/ingredients` — premature namespacing/versioning for the current need.

## 5. UUID v7 generation (app-side)

**Decision**: Generate UUID v7 in the application layer (the create use case mints the id) using the `uuidv7` package.

**Rationale**: Node's `crypto.randomUUID()` only emits v4. Postgres 17 has no native `uuidv7()` (that arrives in PG 18 / the `pg_uuidv7` extension). Generating in the app keeps id creation testable and DB-agnostic, and v7's time-ordering keeps the primary-key index insert-friendly. No `IdGenerator` port is introduced (YAGNI) — the function is called directly in the use case.

## 6. Case-insensitive name uniqueness & search

**Decision**: A unique index on `lower(name)` enforces case-insensitive uniqueness; partial-name search uses `name ILIKE '%' || $term || '%'`. Names are trimmed before validation and storage.

**Rationale**: Simplest reliable approach without a `citext` extension dependency. Uniqueness violations surface as a Postgres unique-violation, mapped to a domain `IngredientNameConflict` → HTTP 409.

**Deferred**: a `pg_trgm` GIN index to accelerate `ILIKE` — unnecessary at ≤10k rows (sequential scan meets SC-002). Add only if measured.

## 7. Validation & error mapping

**Decision**: TypeBox schemas on every route (via `@fastify/type-provider-typebox`) validate request bodies, params, and query, and serialize responses — these schemas *are* the contract. A Fastify `setErrorHandler` maps:
- TypeBox/schema validation failure → **400** (structured validation error, Fastify's native envelope)
- `IngredientNotFound` → **404**
- `IngredientNameConflict` → **409**
- malformed UUID in the path → **400** (caught by the param schema's `format: uuid`, not treated as 404)

**Rationale**: Schema-first satisfies Principle I and keeps validation declarative. Domain errors stay framework-free; the HTTP mapping lives in the infrastructure layer.

## 8. Update semantics

**Decision**: `PATCH /ingredients/{id}` with partial-update semantics — only supplied fields change; omitted fields are untouched. Supplied fields pass the same validation as on create. `updated_at` advances on every successful modification (Drizzle `$onUpdate`).

**Rationale**: Matches spec FR-013 ("update one or more fields") confirmed in clarification.
