# Phase 1 Data Model: Ingredient Resource

## Entity: Ingredient

A single named component of the recipe domain. Single shared catalog (no per-user ownership at this phase).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID v7 | Primary key | Minted app-side on creation (`uuidv7`); time-ordered for index locality |
| `name` | text | NOT NULL; trimmed; 1–100 chars; unique case-insensitively | Unique index on `lower(name)` |
| `unit` | text | NOT NULL; trimmed; 1–50 chars | Free-text (no enum at this phase) |
| `category` | text | NOT NULL; trimmed; 1–50 chars | Free-text; filtered case-insensitively |
| `created_at` | timestamptz | NOT NULL; default `now()` | Set on insert |
| `updated_at` | timestamptz | NOT NULL; default `now()` | Advances on every update (Drizzle `$onUpdate`) |

### Validation rules (from spec Requirements)

- **Required** (FR-001, FR-005): `name`, `unit`, `category` must be present on create.
- **Trimming** (FR-017): leading/trailing whitespace stripped from all text fields *before* validation and storage. Length bounds are measured **after** trimming.
- **Length bounds** (FR-019): `name ≤ 100`, `unit ≤ 50`, `category ≤ 50`. Each must be non-empty after trimming. Over-length → 400 (no truncation).
- **Name uniqueness** (FR-003, FR-004): unique across the catalog, compared after trim + lowercase. Violations on create or rename → 409, existing data unchanged.
- **Identifier** (FR-002): server-assigned UUID v7, returned in responses. A path id that is not a valid UUID → 400 (FR-018), never 404.

### Lifecycle / state transitions

```
(none) --create--> Active --update(partial)--> Active --delete--> (gone, hard delete)
```

- **Create**: validate → check name availability → assign id → persist → return full entity.
- **Update** (PATCH, partial): entity must exist (else 404); supplied fields validated; if `name` changes, re-check uniqueness (else 409); `updated_at` advances.
- **Delete**: hard delete (FR-014); subsequent reads of that id → 404. No soft-delete/audit/recovery.

No FK constraints to recipes at this phase (recipes do not exist yet).

## Persistence schema (Drizzle — `infrastructure/ingredient-table.ts`)

Conceptual shape (informative; the committed migration SQL under `drizzle/` is authoritative):

```ts
export const ingredients = pgTable(
  'ingredients',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('ingredients_name_lower_uniq').on(sql`lower(${t.name})`)],
);
```

### Indexes

- **`ingredients_name_lower_uniq`**: unique on `lower(name)` — enforces case-insensitive uniqueness (FR-003) and backs name lookups.
- Primary key on `id`.
- **Deferred (YAGNI)**: `pg_trgm` GIN index on `name` to accelerate `ILIKE '%term%'`. Not needed at ≤10k rows; add only if SC-002 is measured to fail.

## Query mapping (repository port → SQL behavior)

| Port method | Behavior |
|-------------|----------|
| `insert(ingredient)` | INSERT; unique-violation on `lower(name)` → throw `IngredientNameConflict` |
| `findById(id)` | SELECT by pk; `null` if absent |
| `findMany(filter)` | SELECT with optional `lower(category) = lower($cat)` and `name ILIKE '%'||$q||'%'`; both combine with AND; ORDER BY `lower(name)` ASC (FR-012) |
| `update(id, patch)` | UPDATE supplied columns; unique-violation → `IngredientNameConflict`; affected-rows 0 → caller raises `IngredientNotFound` |
| `delete(id)` | DELETE by pk; affected-rows 0 → `IngredientNotFound` |

**Filter normalization** (FR-009, FR-010, edge cases): empty or whitespace-only `category`/`name` query params are treated as "no filter" — they are dropped before building the query.

## Domain representation (`domain/ingredient.ts`)

A plain, framework-free type — no `pg`/`drizzle`/`fastify` imports:

```ts
export interface Ingredient {
  id: string;          // UUID v7
  name: string;        // trimmed, ≤100
  unit: string;        // trimmed, ≤50
  category: string;    // trimmed, ≤50
  createdAt: Date;
  updatedAt: Date;
}
```

Creation/normalization invariants (trim, non-empty, length) live in the domain; the repository adapter maps DB rows ↔ this type.
