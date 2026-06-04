# Tasks: Ingredient Category CRUD

**Input**: Design documents from `specs/003-ingredient-category-crud/`

**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, research.md ✅, quickstart.md ✅

**Tests**: Included — TDD with real DB is a constitution MUST (Principle II). Tests are written before implementation within each story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1–US7)
- Exact file paths are included in each task description

## Path Conventions

- Source code: `src/`
- Tests: `tests/`
- Migrations: `drizzle/`

---

## Phase 1: Setup (DB Migration & Shared Infrastructure)

**Purpose**: Establish the database schema, migration, and shared infrastructure changes that all subsequent phases depend on.

**⚠️ CRITICAL**: Migration must be generated and applied before any tests can run against the DB.

- [X] T001 Update `drizzle.config.ts` schema array to include both `src/ingredient-category/infrastructure/ingredient-category-table.ts` and `src/ingredient/infrastructure/ingredient-table.ts`
- [X] T002 Create `src/ingredient-category/infrastructure/ingredient-category-table.ts` — Drizzle `pgTable` for `ingredient_categories` (`id uuid PK`, `name varchar(100) NOT NULL`) with `uniqueIndex` on `lower(name)` (must exist before T003 imports it)
- [X] T003 Update `src/ingredient/infrastructure/ingredient-table.ts` — remove `category varchar(50)` column; add `categoryId uuid NOT NULL` FK referencing `ingredientCategories.id`; import `ingredient-category-table.ts` from sibling slice
- [X] T004 Run `pnpm db:generate` to produce `drizzle/0001_*.sql`; review that SQL creates `ingredient_categories` table, drops `ingredients.category`, and adds `ingredients.category_id` FK
- [X] T005 Update `tests/helpers/db.ts` — add `ingredient_categories` to `truncateAll()`; ensure `ingredients` is truncated before `ingredient_categories` to respect the FK constraint (or use `TRUNCATE … CASCADE`)
- [X] T006 Update `src/shared/infrastructure/app.ts` — register the `ingredient-category-routes` Fastify plugin; add `statusCode === 422` branch to `handleError` returning `{ statusCode: 422, error: 'Unprocessable Entity', message }`

**Checkpoint**: `drizzle/0001_*.sql` reviewed and committed; `pnpm db:migrate` runs clean on dev DB.

---

## Phase 2: Foundational (ingredient-category Domain & Infrastructure Skeleton)

**Purpose**: Core building blocks shared by all five category CRUD operations. Must be complete before any category user story begins.

**⚠️ CRITICAL**: No category user story work can begin until this phase is complete.

- [X] T007 [P] Create `src/ingredient-category/domain/ingredient-category.ts` — `IngredientCategory` entity type, `IngredientCategoryFields` type, `normalizeCategoryFields` (trim + validate non-empty, max 100 chars), `ValidationError`
- [X] T008 [P] Create `src/ingredient-category/domain/ingredient-category-repository.ts` — repository port interface with operations: `insert`, `findById`, `findMany`, `update`, `delete`
- [X] T009 [P] Create `src/ingredient-category/domain/errors.ts` — `CategoryNotFound(id)` → 404, `CategoryNameConflict(name)` → 409, `CategoryInUse(id)` → 409
- [X] T010 Create `src/ingredient-category/infrastructure/ingredient-category-schemas.ts` — TypeBox schemas: `IngredientCategorySchema`, `NewIngredientCategorySchema`, `UpdateIngredientCategorySchema`, mirroring `contracts/ingredient-category.yaml`
- [X] T011 Create `src/ingredient-category/infrastructure/drizzle-ingredient-category-repository.ts` — full Drizzle implementation: `insert` (uuidv7 id), `findById`, `findMany` (ORDER BY `lower(name)` ASC), `update`, `delete`; map PG error 23505 → `CategoryNameConflict`, 23503 → `CategoryInUse`
- [X] T012 Create `src/ingredient-category/infrastructure/ingredient-category-routes.ts` — empty Fastify plugin shell with `withTypeProvider<TypeBoxTypeProvider>()`, no route handlers yet

**Checkpoint**: `pnpm build` compiles without errors; domain types and infrastructure are well-typed.

---

## Phase 3: User Story 1 — Create an Ingredient Category (Priority: P1) 🎯 MVP

**Goal**: `POST /ingredient-categories` → 201 `{ id, name }` or 400/409.

**Independent Test**: Submit a valid unique name → verify response has a UUID `id` and the submitted `name`.

### Tests for User Story 1 ⚠️ Write FIRST — confirm they FAIL before implementation

- [X] T013 [US1] Write `tests/ingredient-category/infrastructure/create-ingredient-category.test.ts` — scenarios: (a) valid unique name → 201 + `{ id, name }`; (b) duplicate name (case-insensitive) → 409; (c) empty string name → 400; (d) missing `name` field → 400

### Implementation for User Story 1

- [X] T014 [US1] Create `src/ingredient-category/application/create-ingredient-category.ts` — `CreateIngredientCategoryCommand` + use case: call `normalizeCategoryFields`, call `repo.insert`, return created entity
- [X] T015 [US1] Add `POST /ingredient-categories` route handler to `src/ingredient-category/infrastructure/ingredient-category-routes.ts` — parse `NewIngredientCategorySchema` body, call `createIngredientCategory` use case, reply 201

**Checkpoint**: T013 tests pass; `POST /ingredient-categories` returns 201 with `{ id, name }`.

---

## Phase 4: User Story 2 — List All Ingredient Categories (Priority: P1)

**Goal**: `GET /ingredient-categories` → 200 with full array ordered A→Z, or empty array.

**Independent Test**: Create "Grain" and "Dairy" → GET list → verify `[{…"dairy"…}, {…"grain"…}]` in alphabetical order.

### Tests for User Story 2 ⚠️ Write FIRST — confirm they FAIL before implementation

- [X] T016 [US2] Write `tests/ingredient-category/infrastructure/list-ingredient-categories.test.ts` — scenarios: (a) no categories → 200 + `[]`; (b) multiple categories → 200 + array ordered A→Z case-insensitively

### Implementation for User Story 2

- [X] T017 [US2] Create `src/ingredient-category/application/list-ingredient-categories.ts` — use case: call `repo.findMany()` and return result (already ordered by DB query)
- [X] T018 [US2] Add `GET /ingredient-categories` route handler to `src/ingredient-category/infrastructure/ingredient-category-routes.ts` — call `listIngredientCategories`, reply 200

**Checkpoint**: T016 tests pass; US1 + US2 both green.

---

## Phase 5: User Story 3 — Retrieve a Single Category (Priority: P2)

**Goal**: `GET /ingredient-categories/:id` → 200 `{ id, name }` or 400/404.

**Independent Test**: Create a category → GET by its ID → verify same `{ id, name }` returned.

### Tests for User Story 3 ⚠️ Write FIRST — confirm they FAIL before implementation

- [X] T019 [US3] Write `tests/ingredient-category/infrastructure/get-ingredient-category.test.ts` — scenarios: (a) known valid ID → 200 + correct `{ id, name }`; (b) unknown valid UUID → 404; (c) malformed UUID in path → 400

### Implementation for User Story 3

- [X] T020 [US3] Create `src/ingredient-category/application/get-ingredient-category.ts` — use case: `repo.findById(id)`; throw `CategoryNotFound(id)` if null; return entity
- [X] T021 [US3] Add `GET /ingredient-categories/:id` route handler to `src/ingredient-category/infrastructure/ingredient-category-routes.ts` — call `getIngredientCategory`, reply 200

**Checkpoint**: T019 tests pass; full category read path (list + single) is covered.

---

## Phase 6: User Story 4 — Update a Category Name (Priority: P2)

**Goal**: `PATCH /ingredient-categories/:id` → 200 updated `{ id, name }` or 400/404/409.

**Independent Test**: Create a category → PATCH with new unique name → GET by ID → verify new name is reflected.

### Tests for User Story 4 ⚠️ Write FIRST — confirm they FAIL before implementation

- [X] T022 [US4] Write `tests/ingredient-category/infrastructure/update-ingredient-category.test.ts` — scenarios: (a) valid rename → 200 + updated `{ id, name }`; (b) rename to a name matching another category (case-insensitive) → 409; (c) unknown ID → 404; (d) empty name → 400

### Implementation for User Story 4

- [X] T023 [US4] Create `src/ingredient-category/application/update-ingredient-category.ts` — use case: `repo.findById`, throw `CategoryNotFound` if null; `normalizeCategoryFields`; call `repo.update`; catch 23505 → `CategoryNameConflict`
- [X] T024 [US4] Add `PATCH /ingredient-categories/:id` route handler to `src/ingredient-category/infrastructure/ingredient-category-routes.ts` — parse `UpdateIngredientCategorySchema` body, call `updateIngredientCategory`, reply 200

**Checkpoint**: T022 tests pass; full category lifecycle (create / read / list / update) is working.

---

## Phase 7: User Story 5 — Delete a Category (Priority: P3)

**Goal**: `DELETE /ingredient-categories/:id` → 204 or 404/409.

**Independent Test**: Create an unreferenced category → DELETE → 204. Create an ingredient that references a category (via direct DB insert for the fixture) → DELETE that category → 409.

### Tests for User Story 5 ⚠️ Write FIRST — confirm they FAIL before implementation

- [X] T025 [US5] Write `tests/ingredient-category/infrastructure/delete-ingredient-category.test.ts` — scenarios: (a) unreferenced category → 204; (b) category referenced by an ingredient row (inserted directly into DB as a fixture) → 409; (c) unknown ID → 404

Note: Scenario (b) fixture — insert an ingredient row directly via the Drizzle client (`db.insert(ingredients).values({ id: uuidv7(), name: 'test', unit: 'g', categoryId: <created-category-id> })`) without going through the application layer. The schema is already migrated in Phase 1, so the insert is valid. No deferral to Phase 8 needed.

### Implementation for User Story 5

- [X] T026 [US5] Create `src/ingredient-category/application/delete-ingredient-category.ts` — use case: `repo.findById`, throw `CategoryNotFound` if null; call `repo.delete`; catch PG 23503 → `CategoryInUse`
- [X] T027 [US5] Add `DELETE /ingredient-categories/:id` route handler to `src/ingredient-category/infrastructure/ingredient-category-routes.ts` — call `deleteIngredientCategory`, reply 204

**Checkpoint**: T025 tests pass; complete `ingredient-category` CRUD is fully operational and tested.

---

## Phase 8: User Story 6 — Create an Ingredient with a Category Reference (Priority: P1)

**Goal**: `POST /ingredients` with `categoryId` → 201 with embedded `category: { id, name }` or 400/409/422.

**Independent Test**: Create a category → POST ingredient with that `categoryId` → verify response body has `category: { id, name }` embedded (not a flat string).

### Tests for User Story 6 ⚠️ Write FIRST — confirm they FAIL before implementation

- [X] T028 [US6] Update `tests/ingredient/infrastructure/create-ingredient.test.ts` — replace `category: string` with `categoryId: uuid` in all fixtures; add scenario: valid `categoryId` → 201 + embedded `category: { id, name }`; non-existent `categoryId` → 422; missing `categoryId` → 400
- [X] T029 [P] [US6] Update `tests/ingredient/infrastructure/get-ingredient.test.ts` — update fixtures to use `categoryId`; assert response embeds `category: { id, name }` instead of a flat string
- [X] T030 [P] [US6] Update `tests/ingredient/infrastructure/list-ingredients.test.ts` — update fixtures to use `categoryId`; assert embedded category in each response item; verify `?category=<name>` filter returns only matching ingredients (JOIN-based)
- [X] T031 [P] [US6] Update `tests/ingredient/infrastructure/delete-ingredient.test.ts` — update fixtures to use `categoryId` (structural change only; assertions on delete behaviour unchanged)
- [X] T032 [US6] Update `tests/shared/infrastructure/app.smoke.test.ts` — add assertions that `/ingredient-categories` routes (POST + GET) are present

### Implementation for User Story 6

- [X] T033 [US6] Update `src/ingredient/domain/ingredient.ts` — change `category: string` → `category: { id: string; name: string }`; rename `IngredientFields.category` → `IngredientFields.categoryId`; remove category string validation from `normalizeIngredientFields`
- [X] T034 [US6] Update `src/ingredient/domain/ingredient-repository.ts` — update port interface to reflect the new `Ingredient` read shape (embedded category object)
- [X] T035 [US6] Update `src/ingredient/domain/errors.ts` — add `CategoryReferenceNotFound(categoryId)` error → 422
- [X] T036 [US6] Update `src/ingredient/application/create-ingredient.ts` — rename `CreateIngredientCommand.category` → `categoryId`; remove category string normalization from the command
- [X] T037 [US6] Update `src/ingredient/infrastructure/ingredient-schemas.ts` — define `CategorySchema`; embed it in `IngredientSchema.category`; replace `category` with `categoryId` in `NewIngredientSchema`
- [X] T038 [US6] Update `src/ingredient/infrastructure/ingredient-routes.ts` — update `NewIngredientSchema` reference; update `toDto` to embed `category: { id, name }` from the JOIN result
- [X] T039 [US6] Update `src/ingredient/infrastructure/drizzle-ingredient-repository.ts` — add `LEFT JOIN ingredient_categories` on all queries; map joined rows to embedded `category` object; catch PG 23503 on **insert and update** → `CategoryReferenceNotFound` (covers both `POST /ingredients` and `PATCH /ingredients/:id`)

**Checkpoint**: T028–T032 tests pass; `POST /ingredients` accepts `categoryId` and returns embedded category; `?category` filter works.

---

## Phase 9: User Story 7 — Update an Ingredient's Category Reference (Priority: P2)

**Goal**: `PATCH /ingredients/:id` with `categoryId` → 200 with updated embedded category or 422 for invalid `categoryId`.

**Independent Test**: Create two categories + one ingredient in category-1 → PATCH ingredient with category-2 ID → verify response embeds category-2 `{ id, name }`.

### Tests for User Story 7 ⚠️ Write FIRST — confirm they FAIL before implementation

- [X] T040 [US7] Update `tests/ingredient/infrastructure/update-ingredient.test.ts` — replace `category` field with `categoryId` in fixtures; add scenarios: (a) valid `categoryId` → 200 + updated embedded category; (b) non-existent `categoryId` → 422; (c) `categoryId` omitted → category reference unchanged

### Implementation for User Story 7

- [X] T041 [US7] Update `src/ingredient/application/update-ingredient.ts` — add `categoryId` to `UpdateIngredientCommand`; pass it through to the repository update call (23503 catch in `drizzle-ingredient-repository.ts` from T039 already handles the error)

**Checkpoint**: T040 tests pass; complete ingredient lifecycle with category references works end-to-end.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final integration validation across the full feature.

- [X] T042 [P] Apply migration to dev DB (`pnpm db:migrate`); start the app (`pnpm dev`); verify it boots without errors and Swagger UI at `/docs` lists all `/ingredient-categories` endpoints
- [X] T043 [P] Execute all curl examples from `specs/003-ingredient-category-crud/quickstart.md` against the running local server; verify each returns the documented status and response shape
- [X] T044 Run full test suite (`pnpm test`) and confirm 100% coverage (lines/branches/functions/statements) with no regressions in existing tests

**Checkpoint**: All 44 tasks complete, tests green, 100% coverage, quickstart validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T002 must exist before T003 imports it) — BLOCKS all user stories
- **US1–US5 (Phases 3–7)**: All depend on Phase 2 completing; can proceed sequentially in priority order
- **US6 (Phase 8)**: Depends on Phase 1 + Phase 2 + US1 working (needs a functioning category endpoint to create ingredient fixtures)
- **US7 (Phase 9)**: Depends on US6 (shares updated ingredient infrastructure)
- **Polish (Phase 10)**: Depends on all preceding phases

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no story dependencies
- **US2 (P1)**: After Phase 2 — no story dependencies
- **US3 (P2)**: After Phase 2 — no story dependencies
- **US4 (P2)**: After Phase 2 — no story dependencies
- **US5 (P3)**: After Phase 2 — no story dependencies (fixture for FK scenario uses direct DB insert)
- **US6 (P1)**: After Phase 2 + US1 (category must be creatable to build ingredient test fixtures via API)
- **US7 (P2)**: After US6 (inherits updated ingredient infrastructure)

### Within Each User Story

- Tests MUST be written first and confirmed failing before implementation begins
- Domain updates → application use case → infrastructure route handler
- Route handler added last (after use case exists)

### Parallel Opportunities

- Phase 2: T007, T008, T009 [P] — different files
- Phase 8: T029, T030, T031 [P] — different test files
- Phase 10: T042, T043 [P] — independent validation steps

---

## Parallel Example: Phase 2 (Foundational Domain)

```bash
# Launch all domain-layer tasks in parallel:
Task T007: "Create src/ingredient-category/domain/ingredient-category.ts"
Task T008: "Create src/ingredient-category/domain/ingredient-category-repository.ts"
Task T009: "Create src/ingredient-category/domain/errors.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (migration)
2. Complete Phase 2: Foundational (domain + infrastructure skeleton)
3. Complete Phase 3: US1 — Create category
4. **STOP and VALIDATE**: `POST /ingredient-categories` returns 201 with `{ id, name }`
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → DB migrated, ingredient-category slice compiles
2. US1 → Create category → independently verified → demo
3. US2 → List categories → independently verified
4. US3, US4 → Get + Update → complete read/write category lifecycle
5. US5 → Delete with FK protection → full category CRUD done
6. US6 → Ingredient slice updated → end-to-end integration works
7. US7 → Ingredient PATCH with category change → complete

---

## Notes

- [P] tasks operate on different files and have no intra-phase dependencies
- [Story] label maps each task to a specific user story for traceability
- Tests are written before implementation within each phase (TDD — Constitution Principle II)
- T002 must be created before T003 (cross-slice infra import: `ingredient-table.ts` → `ingredient-category-table.ts`)
- `truncateAll()` must truncate `ingredients` before `ingredient_categories` due to the FK dependency
- The `?category` list filter on `/ingredients` now works via a JOIN — no API surface change, just implementation change in the repository
- Total: 44 tasks across 10 phases
