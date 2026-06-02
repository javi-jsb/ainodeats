---

description: "Task list for Ingredient Resource implementation"
---

# Tasks: Ingredient Resource

**Input**: Design documents from `specs/002-ingredient-crud/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ingredient.yaml

**Tests**: INCLUDED and mandatory — the constitution (Principle II, NON-NEGOTIABLE) requires tests written and confirmed failing before production code, against a real PostgreSQL database. Each story writes its integration tests first.

**Organization**: Tasks are grouped by user story. Each story is an independently testable vertical increment (port method + repository method + use case + route + tests) that keeps the 100% coverage gate green at its checkpoint.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish carry no story label)
- Paths follow plan.md: `src/ingredient/{domain,application,infrastructure}`, `src/shared/infrastructure`, `tests/` mirrors `src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bring in dependencies and slice scaffolding deferred at bootstrap.

- [X] T001 Add dependencies at exact-pinned versions to `package.json` and install: runtime `pg`, `drizzle-orm`, `uuidv7`, `@sinclair/typebox`, `@fastify/type-provider-typebox`, `@fastify/swagger`, `@fastify/swagger-ui`; dev `drizzle-kit`, `@types/pg`. Add scripts `db:generate` (`drizzle-kit generate`) and `db:migrate` (`drizzle-kit migrate`).
- [X] T002 [P] Create `drizzle.config.ts` at repo root (dialect `postgresql`, schema `./src/ingredient/infrastructure/ingredient-table.ts`, out `./drizzle`, credentials from `DATABASE_URL`).
- [X] T003 [P] Create the vertical-slice and test directories: `src/ingredient/{domain,application,infrastructure}/`, `tests/ingredient/infrastructure/`, `tests/shared/infrastructure/`, `tests/setup/`, `tests/helpers/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistence, domain core, app wiring, and the real-Postgres test harness that ALL stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Create `src/shared/infrastructure/config.ts` — read and validate `DATABASE_URL` from env (throw a clear error when absent).
- [X] T005 [P] Create `src/ingredient/domain/ingredient.ts` — `Ingredient` type plus framework-free normalization/validation invariants (trim leading/trailing only, reject empty-after-trim, enforce max lengths name≤100/unit≤50/category≤50, reject line breaks/control characters). No `pg`/`drizzle`/`fastify` imports.
- [X] T006 [P] Create `src/ingredient/domain/errors.ts` — `IngredientNotFound` and `IngredientNameConflict` domain errors (each carrying the data needed for the HTTP mapping, e.g. the offending name).
- [X] T007 [P] Create `src/ingredient/infrastructure/ingredient-table.ts` — Drizzle `pgTable` (`id` uuid PK, `name` varchar(100), `unit` varchar(50), `category` varchar(50), `created_at`/`updated_at` timestamptz defaults, `updated_at.$onUpdate`); unique index on `lower(name)`.
- [X] T008 Create `src/shared/infrastructure/db.ts` — Fastify plugin building a `pg.Pool` + Drizzle instance from `config.ts`, decorating `app.db`, closing the pool on `onClose`. (depends on T004)
- [X] T009 Generate the first migration via `pnpm db:generate` → review the SQL under `drizzle/0000_*.sql` (table + unique index on `lower(name)`); commit it. (depends on T002, T007)
- [X] T010 Create `tests/setup/global-setup.ts` and update `vitest.config.ts` — point tests at database `ainodeats_test` via `DATABASE_URL`, create it if absent, apply migrations once; register as Vitest `globalSetup`. (depends on T009)
- [X] T011 [P] Create `tests/helpers/db.ts` — `buildTestApp()` (Fastify app via `buildApp`) and `truncateAll()` (TRUNCATE ingredient table) for use in `beforeEach`.
- [X] T012 [P] Create `tests/shared/infrastructure/config.test.ts` — unit test covering both branches of `config.ts` (present and missing `DATABASE_URL`) to keep the coverage gate green.
- [X] T013 Create `src/ingredient/infrastructure/ingredient-routes.ts` — empty registrable `FastifyPluginAsync` (routes added per story) so the app factory can register it.
- [X] T014 Wire `src/shared/infrastructure/app.ts` — apply `withTypeProvider<TypeBoxTypeProvider>()`, register `@fastify/swagger` + `@fastify/swagger-ui` (`/docs`, OpenAPI JSON), register the `db` plugin and the `ingredient-routes` plugin, and add `setErrorHandler` mapping schema validation→400, `IngredientNotFound`→404, `IngredientNameConflict`→409 (ensure every branch is exercised by later story tests). (depends on T006, T008, T013)
- [X] T015 Create `tests/shared/infrastructure/app.smoke.test.ts` — boot the app, assert `GET /health` 200, `GET /docs` 200, and the OpenAPI JSON endpoint responds. (depends on T014, T010, T011)

**Checkpoint**: App boots against the real test DB, `/docs` is served, harness ready — story implementation can begin.

---

## Phase 3: User Story 1 - Register ingredients into the catalog (Priority: P1) 🎯 MVP

**Goal**: Create an ingredient and retrieve it by id, with validation, uniqueness, and persistence.

**Independent Test**: `POST /ingredients` valid → 201; retrieve via `GET /ingredients/{id}` → identical data; invalid/duplicate/missing-id cases rejected with 400/409/404.

### Tests for User Story 1 (write first, MUST fail) ⚠️

- [X] T016 [P] [US1] Integration test `tests/ingredient/infrastructure/create-ingredient.test.ts` — 201 success + body shape; 400 on missing field, empty/whitespace-only, over-length, line-break; 409 on duplicate name (case-insensitive, after trim); edge-trimming applied; names differing only by internal whitespace are distinct (FR-017) (Acceptance 1,2,5; edge cases).
- [X] T017 [P] [US1] Integration test `tests/ingredient/infrastructure/get-ingredient.test.ts` — 200 returns submitted data incl. `created_at`/`updated_at`; 404 unknown id; 400 malformed UUID (Acceptance 3,4; invalid-id edge).

### Implementation for User Story 1

- [X] T018 [US1] Add `insert` and `findById` to the repository port `src/ingredient/domain/ingredient-repository.ts` (create the interface file).
- [X] T019 [US1] Implement `insert` + `findById` in `src/ingredient/infrastructure/drizzle-ingredient-repository.ts` — map row↔`Ingredient`; translate Postgres unique-violation on `lower(name)` into `IngredientNameConflict`. (depends on T018)
- [X] T020 [P] [US1] Add TypeBox schemas `NewIngredient`, `Ingredient`, and the `{id}` uuid param to `src/ingredient/infrastructure/ingredient-schemas.ts` (mirror `contracts/ingredient.yaml`).
- [X] T021 [P] [US1] Implement `create-ingredient` use case `src/ingredient/application/create-ingredient.ts` — normalize via domain, mint UUID v7 (`uuidv7`), insert, surface conflict. (depends on T018)
- [X] T022 [P] [US1] Implement `get-ingredient` use case `src/ingredient/application/get-ingredient.ts` — `findById`, throw `IngredientNotFound` when absent. (depends on T018)
- [X] T023 [US1] Register `POST /ingredients` and `GET /ingredients/{id}` in `ingredient-routes.ts` — attach schemas, instantiate the repository from `app.db`, invoke the use cases. (depends on T019, T020, T021, T022)

**Checkpoint**: Create + read work end-to-end; `pnpm test` green at 100% coverage. **MVP deliverable.**

---

## Phase 4: User Story 2 - Browse and find ingredients (Priority: P2)

**Goal**: List all ingredients with optional case-insensitive category filter and partial-name search.

**Independent Test**: Seed varied ingredients; list all (sorted), filter by category, search by substring, combine both, and confirm empty filters/empty catalog behave correctly.

### Tests for User Story 2 (write first, MUST fail) ⚠️

- [X] T024 [P] [US2] Integration test `tests/ingredient/infrastructure/list-ingredients.test.ts` — all results ordered by name asc (case-insensitive); category filter (ci exact); name substring search (ci); combined AND; empty/whitespace-only params = no filter; empty catalog → `[]` (Acceptance 1-5; edge cases).

### Implementation for User Story 2

- [X] T025 [US2] Add `findMany(filter)` to the port `src/ingredient/domain/ingredient-repository.ts`.
- [X] T026 [US2] Implement `findMany` in `src/ingredient/infrastructure/drizzle-ingredient-repository.ts` — optional `lower(category)=lower($)` and `name ILIKE '%'||$q||'%'` combined with AND, `ORDER BY lower(name) ASC`. (depends on T025)
- [X] T027 [P] [US2] Add the list query + array-response TypeBox schemas to `src/ingredient/infrastructure/ingredient-schemas.ts`.
- [X] T028 [P] [US2] Implement `list-ingredients` use case `src/ingredient/application/list-ingredients.ts` — drop empty/whitespace-only filters, call `findMany`. (depends on T025)
- [X] T029 [US2] Register `GET /ingredients` (with query schema) in `ingredient-routes.ts`. (depends on T026, T027, T028)

**Checkpoint**: List/filter/search work; US1 still green; coverage 100%.

---

## Phase 5: User Story 3 - Maintain the catalog (Priority: P3)

**Goal**: Partially update and hard-delete ingredients.

**Independent Test**: Create → PATCH one field (others unchanged, `updated_at` advances) → DELETE → subsequent reads 404; rename-conflict and unknown-id cases rejected.

### Tests for User Story 3 (write first, MUST fail) ⚠️

- [X] T030 [P] [US3] Integration test `tests/ingredient/infrastructure/update-ingredient.test.ts` — partial update changes only supplied fields, 200 returns updated entity with advanced `updated_at`; 404 unknown id; 409 rename to existing name (ci); 400 on empty payload / invalid value (Acceptance 1-3; edge cases).
- [X] T031 [P] [US3] Integration test `tests/ingredient/infrastructure/delete-ingredient.test.ts` — 204 then `GET` returns 404; delete unknown id → 404; malformed UUID → 400 (Acceptance 4,5).

### Implementation for User Story 3

- [X] T032 [US3] Add `update(id, patch)` and `delete(id)` to the port `src/ingredient/domain/ingredient-repository.ts`.
- [X] T033 [US3] Implement `update` + `delete` in `src/ingredient/infrastructure/drizzle-ingredient-repository.ts` — update supplied columns (unique-violation→`IngredientNameConflict`), 0 rows affected→`IngredientNotFound`; delete by id, 0 rows→`IngredientNotFound`. (depends on T032)
- [X] T034 [P] [US3] Add the `UpdateIngredient` TypeBox schema (`minProperties: 1`) to `src/ingredient/infrastructure/ingredient-schemas.ts`.
- [X] T035 [P] [US3] Implement `update-ingredient` use case `src/ingredient/application/update-ingredient.ts` — normalize supplied fields, apply partial update, surface conflict/not-found. (depends on T032)
- [X] T036 [P] [US3] Implement `delete-ingredient` use case `src/ingredient/application/delete-ingredient.ts`. (depends on T032)
- [X] T037 [US3] Register `PATCH /ingredients/{id}` and `DELETE /ingredients/{id}` in `ingredient-routes.ts`. (depends on T033, T034, T035, T036)

**Checkpoint**: All five operations functional and independently tested; coverage 100%.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T038 [P] Extend `tests/shared/infrastructure/app.smoke.test.ts` to assert the served OpenAPI JSON includes all five `/ingredients` paths.
- [X] T039 [P] Update `CLAUDE.md` (and `README.md` if needed) with the Drizzle/migrations and `DATABASE_URL`/`pnpm db:migrate` conventions and the `/docs` endpoint.
- [X] T040 Run full validation: `pnpm test` (100% coverage), `pnpm typecheck`, `pnpm check` (Biome), and walk `quickstart.md` curls against a running app.
- [X] T041 [P] Spot-check SC-002: measure partial-name search latency near 10,000 rows; only if it exceeds 1s, add a `pg_trgm` GIN index migration (otherwise leave deferred per plan).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all stories.
- **User Stories (Phase 3-5)**: each depends on Foundational. US1 is the MVP; US2 and US3 are independently testable but share the same slice files (port, repository, routes, schemas), so they are implemented sequentially in priority order within this single PR.
- **Polish (Phase 6)**: after the desired stories are complete.

### Within Each User Story

- Integration tests written first and confirmed failing (Principle II).
- Port method → repository method → use case → route registration.
- Story complete (tests green, coverage 100%) before the next priority.

### Parallel Opportunities

- Setup: T002, T003 in parallel (T001 first — it edits `package.json`).
- Foundational: T004, T005, T006, T007 in parallel; T011, T012 in parallel after their deps.
- Per story: the two test tasks run in parallel; use-case tasks marked [P] (different files) run in parallel once the port method exists.
- Note: `ingredient-routes.ts`, `drizzle-ingredient-repository.ts`, `ingredient-repository.ts`, and `ingredient-schemas.ts` are touched in multiple stories — those edits are sequential across phases (not cross-story [P]).

---

## Parallel Example: User Story 1

```bash
# Write both US1 tests together (they must fail first):
Task: "Integration test create in tests/ingredient/infrastructure/create-ingredient.test.ts"
Task: "Integration test get in tests/ingredient/infrastructure/get-ingredient.test.ts"

# After the port (T018) exists, build the two use cases in parallel:
Task: "create-ingredient use case in src/ingredient/application/create-ingredient.ts"
Task: "get-ingredient use case in src/ingredient/application/get-ingredient.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational (CRITICAL) → 3. Phase 3 US1 → **STOP & VALIDATE**: create + read work against real Postgres, `/docs` live, 100% coverage. Demo-able.

### Incremental Delivery

Foundation → US1 (MVP) → US2 (discovery) → US3 (maintenance). Each story keeps the suite green and adds user-visible value without breaking the prior ones.

---

## Notes

- [P] = different files, no incomplete dependency.
- TDD is mandatory: confirm each story's tests fail before implementing.
- Integration tests hit the real `ainodeats_test` database via Fastify `inject()`; truncate in `beforeEach`.
- Commit per logical group (deps, foundational, per story) per the repo's commit-granularity convention — not one monolith.
- The repository relies on the DB unique index (not a pre-check) for name uniqueness, so concurrent creates/renames resolve correctly (SC-003).
