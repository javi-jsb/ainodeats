# Implementation Plan: Ingredient Category CRUD

**Branch**: `003-ingredient-category-crud` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-ingredient-category-crud/spec.md`

## Summary

Introduce **IngredientCategory** as a first-class entity with a dedicated `ingredient_categories`
table and full CRUD endpoints at `/ingredient-categories`. Simultaneously migrate the `ingredients`
table from a free-text `category varchar(50)` column to a foreign-key reference
`category_id uuid → ingredient_categories.id`.

All ingredient read responses (single and list) are updated to embed the full category object
`{ id, name }` inline. The `?category` list filter is preserved but now filters by the category
name via a JOIN. The ingredient PATCH endpoint gains `categoryId` as an updatable field —
consistent with POST and necessary for a complete API.

The database is assumed clean (no existing ingredient records), so no data migration is needed.

## Technical Context

**Language/Version**: TypeScript 6 (strict, NodeNext, ESM), Node.js 24

**Primary Dependencies**:
- `fastify` 5, `@sinclair/typebox`, `@fastify/type-provider-typebox` — in place
- `@fastify/swagger` + `@fastify/swagger-ui` — in place
- `drizzle-orm` 0.45.2 — in place; extended with FK relations between slices at infra layer
- `drizzle-kit` 0.31.x — in place; generates migration 0001
- `pg`, `uuidv7` — in place; no new runtime deps needed

**Storage**: PostgreSQL 17. One new table (`ingredient_categories`), one migration that drops
`ingredients.category varchar` and adds `ingredients.category_id uuid FK`.

**Testing**: Vitest at 100% coverage. New test suite mirrors the existing ingredient test structure.
Existing ingredient tests must be updated to reflect the domain model change.

**Target Platform**: Linux server / Docker Compose (local dev)

**Project Type**: web-service (REST API)

**Performance Goals**: Same targets as feature 002 (create→read < 2s; list < 1s; suite < 30s).
The `?category` filter now uses a JOIN — acceptable; category set is small.

**Constraints**:
- Hexagonal + vertical slicing: new `ingredient-category` slice owns its domain/application/infrastructure
- Flat-first: use cases and adapters placed directly under their layer, no premature subfolders
- 100% coverage enforced (lines/branches/functions/statements)
- `drizzle.config.ts` schema updated to an explicit array of both table files
- DB clean: migration 0001 drops and adds columns without data migration
- Cross-slice infra import allowed: `ingredient-table.ts` imports `ingredient-category-table.ts`
  for the FK reference (infra→infra, not domain→infra)

**Scale/Scope**: Category set expected to remain small (no pagination needed for categories or list endpoints)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-First | ✅ PASS | `contracts/ingredient-category.yaml` and updated `contracts/ingredient.yaml` define all endpoints before implementation; TypeBox schemas mirror the contracts |
| II. TDD (real DB) | ✅ PASS | Integration tests written first against real `ainodeats_test`; no mocked DB |
| III. AI-Augmented, Human-Approved | ✅ PASS | All five open design decisions debated and approved before artifact generation |
| IV. Simplicity / YAGNI | ✅ PASS | No pagination; flat-first; no cross-slice domain dependency; ValidationError kept per-slice |
| Architecture (hexagonal + vertical slice) | ✅ PASS | New `ingredient-category` slice; domain entities are framework-free; Drizzle confined to infrastructure; cross-slice import only at infrastructure layer (table reference for FK) |

## Project Structure

### Documentation (this feature)

```text
specs/003-ingredient-category-crud/
├── plan.md              # This file
├── research.md          # Phase 0 — all design decisions and rationale
├── data-model.md        # Phase 1 — entity definitions, DB schema, migration plan
├── quickstart.md        # Phase 1 — run migrations, start app, curl, run tests
├── contracts/
│   ├── ingredient-category.yaml  # Phase 1 — OpenAPI 3.1 for /ingredient-categories
│   └── ingredient.yaml           # Phase 1 — updated OpenAPI 3.1 for /ingredients
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── infrastructure/
│       ├── app.ts        # extended: register ingredient-category routes; add 422 error handler branch
│       ├── config.ts     # unchanged
│       └── db.ts         # unchanged
│
├── ingredient/           # existing slice — partially updated
│   ├── domain/
│   │   ├── ingredient.ts             # UPDATED: category: string → category: { id, name };
│   │   │                             #   IngredientFields.category → categoryId;
│   │   │                             #   normalizeIngredientFields no longer validates categoryId
│   │   ├── ingredient-repository.ts  # UPDATED: port interface reflects new Ingredient shape
│   │   └── errors.ts                 # UPDATED: add CategoryReferenceNotFound (status 422)
│   ├── application/
│   │   ├── create-ingredient.ts      # UPDATED: CreateIngredientCommand.categoryId replaces category
│   │   ├── update-ingredient.ts      # UPDATED: UpdateIngredientCommand.categoryId added
│   │   ├── get-ingredient.ts         # unchanged
│   │   ├── list-ingredients.ts       # unchanged
│   │   └── delete-ingredient.ts      # unchanged
│   └── infrastructure/
│       ├── ingredient-routes.ts      # UPDATED: NewIngredientSchema/UpdateIngredientSchema + toDto
│       ├── ingredient-schemas.ts     # UPDATED: categoryId field; Ingredient embeds CategorySchema
│       ├── ingredient-table.ts       # UPDATED: drop category varchar, add category_id uuid FK
│       └── drizzle-ingredient-repository.ts  # UPDATED: JOIN on ingredient_categories; catch 23503
│
└── ingredient-category/              # NEW slice
    ├── domain/
    │   ├── ingredient-category.ts            # entity (IngredientCategory) + normalizeCategoryFields + ValidationError
    │   ├── ingredient-category-repository.ts # port interface (insert, findById, findMany, update, delete)
    │   └── errors.ts                         # CategoryNotFound (404), CategoryNameConflict (409), CategoryInUse (409)
    ├── application/
    │   ├── create-ingredient-category.ts
    │   ├── list-ingredient-categories.ts
    │   ├── get-ingredient-category.ts
    │   ├── update-ingredient-category.ts
    │   └── delete-ingredient-category.ts
    └── infrastructure/
        ├── ingredient-category-routes.ts
        ├── ingredient-category-schemas.ts
        ├── ingredient-category-table.ts
        └── drizzle-ingredient-category-repository.ts

drizzle/
├── 0000_dazzling_firelord.sql  # existing: ingredients table (category varchar)
└── 0001_<name>.sql             # NEW: create ingredient_categories; drop + add FK column on ingredients

drizzle.config.ts   # UPDATED: schema array includes both table files

tests/
├── setup/
│   └── global-setup.ts          # unchanged
├── helpers/
│   └── db.ts                    # UPDATED: truncate ingredient_categories too
├── shared/
│   └── infrastructure/
│       ├── app.smoke.test.ts    # UPDATED: /ingredient-categories routes present
│       └── config.test.ts       # unchanged
├── ingredient/
│   └── infrastructure/
│       ├── create-ingredient.test.ts          # UPDATED: uses categoryId, embedded category
│       ├── get-ingredient.test.ts             # UPDATED: embedded category in response
│       ├── list-ingredients.test.ts           # UPDATED: embedded category; category filter via JOIN
│       ├── update-ingredient.test.ts          # UPDATED: categoryId in patch; embedded category
│       └── delete-ingredient.test.ts          # unchanged structurally
└── ingredient-category/
    └── infrastructure/
        ├── create-ingredient-category.test.ts
        ├── list-ingredient-categories.test.ts
        ├── get-ingredient-category.test.ts
        ├── update-ingredient-category.test.ts
        └── delete-ingredient-category.test.ts
```

**Structure Decision**: New `ingredient-category` vertical slice follows the identical three-layer
pattern established by `ingredient`. The `drizzle-ingredient-repository.ts` imports
`ingredient-category-table.ts` from the sibling slice's infrastructure layer — this is the only
cross-slice dependency and it is intentionally scoped to the infrastructure adapters (Drizzle tables
are schema definitions, not domain concepts). Domain and application layers of each slice remain
fully isolated from each other.

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Cross-slice infra import (`ingredient-table.ts` → `ingredient-category-table.ts`) | Drizzle FK reference and JOIN queries need the table definition object at compile time | Duplicating the table definition or using raw SQL strings would lose type safety and drift from drizzle-kit's schema tracking |
| `CategoryReferenceNotFound` at 422 rather than 404 | 404 is ambiguous when the ingredient (the primary resource) doesn't exist yet; 422 signals the payload is semantically invalid (valid UUID, non-existent entity) | 400 would conflate format errors with semantic errors; 404 would confuse "ingredient not found" with "category not found" |
