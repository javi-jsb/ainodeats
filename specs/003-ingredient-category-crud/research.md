# Research: Ingredient Category CRUD

**Phase 0 — Decisions and Rationale**

All decisions below were debated and approved before artifact generation (Constitution Principle III).

---

## Decision 1: URL path for category endpoints

**Decision**: `/ingredient-categories`

**Rationale**: Explicit and scoped to the ingredient domain. If other entity types ever acquire
their own category concepts, `/categories` would collide or require disambiguation. The longer
path is worth the forward safety.

**Alternatives considered**: `/categories` — shorter but domain-ambiguous.

---

## Decision 2: `drizzle.config.ts` schema path strategy

**Decision**: Explicit array:
```typescript
schema: [
  './src/ingredient/infrastructure/ingredient-table.ts',
  './src/ingredient-category/infrastructure/ingredient-category-table.ts',
],
```

**Rationale**: YAGNI. A glob like `src/**/infrastructure/*-table.ts` would auto-discover tables,
but it hides what is included. Explicit paths make it clear which tables are under drizzle-kit
management and avoid accidentally picking up test fixtures or future tables before they are
intentionally added.

**Alternatives considered**: Glob pattern — auto-discovers future tables but trades explicitness
for convenience; rejected per Constitution Principle IV.

---

## Decision 3: `GET /ingredients?category` filter after FK migration

**Decision**: Keep the `?category=<name>` query parameter as a case-insensitive name filter.
Internally, the `DrizzleIngredientRepository.findMany` performs a JOIN on `ingredient_categories`
and applies `lower(ingredient_categories.name) = lower(?)`.

**Rationale**: Preserves the existing API contract for callers. Callers do not need to first
fetch a category ID to filter ingredients by category name. The JOIN is cheap given the expected
small category set.

**Alternatives considered**:
- `?categoryId=<uuid>` — avoids JOIN but breaks existing callers and forces a two-step lookup
  in clients.
- Drop the filter from scope — would leave the API incomplete; the filter already exists.

---

## Decision 4: Ingredient domain model change

**Decision**: `Ingredient.category: string` → `Ingredient.category: { id: string; name: string }`.
Input fields change from `category: string` (free-text) to `categoryId: string` (UUID reference).
The Drizzle repository does a JOIN on every read (findById, findMany) and validates FK existence
on write (insert, update) by catching PG error 23503, mapped to `CategoryReferenceNotFound`.

**Rationale**: The domain entity must reflect the actual data model. Embedding the full category
object in reads is a spec requirement (FR-009). A JOIN in the repository keeps the application
and domain layers agnostic of the persistence join strategy.

**Implementation note on insert/update**: The repository performs two queries on write — the
`INSERT`/`UPDATE RETURNING` followed by a `findById` to resolve the JOIN. This is acceptable
for the current scale (small catalog). The FK constraint on the DB is the authoritative guard;
the 23503 catch is the mapping layer.

**Alternatives considered**: Resolve the category in the application layer (fetch category, then
insert ingredient separately). Rejected because it splits a single persistence concern across
two layers and leaks the JOIN strategy into the application.

---

## Decision 5: PATCH /ingredients accepts `categoryId`

**Decision**: `PATCH /ingredients/:id` body includes `categoryId?: string` (optional UUID). If
provided, the system validates the category exists (same path as POST) and updates
`ingredients.category_id`.

**Rationale**: The spec assumption marked this out of scope, but the user correctly identified
that the validation logic is identical to create and leaving it out produces an inconsistent API
(you could not fix a wrong category without deleting and recreating the ingredient). Added to
scope.

**Alternatives considered**: Omit from PATCH (per original assumption). Rejected — incomplete
API surface for no real complexity saving.

---

## Decision 6: `ValidationError` per-slice (not shared)

**Decision**: Each slice (`ingredient`, `ingredient-category`) defines its own `ValidationError`
class with `statusCode = 400`. No shared domain error module is introduced.

**Rationale**: YAGNI. Two slices with identical-shaped errors do not justify a shared module.
If a third slice (or a future refactor) shows the duplication is genuinely painful, extract then.
Three similar lines are better than a premature abstraction.

**Alternatives considered**: `src/shared/domain/errors.ts` with a shared `ValidationError` —
rejected per Constitution Principle IV.

---

## Decision 7: `CategoryReferenceNotFound` status 422

**Decision**: When creating or updating an ingredient with a `categoryId` that does not exist,
the system returns HTTP 422 Unprocessable Entity with a message identifying the unknown category.
A 422 handler branch is added to `app.ts` `handleError`.

**Rationale**: 422 is the correct semantic: the request payload is syntactically valid (well-formed
UUID) but semantically invalid (references a non-existent entity). 404 would be confusing because
the resource being requested (the ingredient) is not what is missing. 400 conflates format errors
with semantic errors.

**Alternatives considered**: 404 — semantically ambiguous; 400 — conflates format/schema errors.
