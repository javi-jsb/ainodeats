# Data Model: Ingredient Category CRUD

## Entities

### IngredientCategory (new)

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID v7 | PK, system-assigned |
| `name` | string | required; 1–100 chars after trimming; case-insensitive unique |

**Invariants**:
- `name` is trimmed of leading/trailing whitespace before storage and uniqueness check.
- Uniqueness is enforced case-insensitively: `lower(name)` unique index on the DB.
- `name` must not be empty after trimming.
- `name` must not contain Unicode control characters (category Cc).
- No additional fields; `id` and `name` are the complete shape.

---

### Ingredient (updated)

| Field | Type | Constraints | Change |
|-------|------|-------------|--------|
| `id` | UUID v7 | PK, system-assigned | unchanged |
| `name` | string | 1–100 chars after trimming; case-insensitive unique | unchanged |
| `unit` | string | 1–50 chars after trimming | unchanged |
| `categoryId` | UUID | FK → `ingredient_categories.id`; required | **replaces** `category varchar(50)` |
| `createdAt` | timestamp (TZ) | auto-set on insert | unchanged |
| `updatedAt` | timestamp (TZ) | auto-set on insert; auto-updated | unchanged |

**Read shape** (responses embed full category object):
```
{
  id:        string (uuid)
  name:      string
  unit:      string
  category:  { id: string (uuid), name: string }   ← embedded, not flat categoryId
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

**Write shape** (create / update requests):
- `categoryId: string (uuid)` — must reference an existing `IngredientCategory`.
- The `category` free-text field is removed entirely; `categoryId` is required on create.

---

## Database Schema

### New table: `ingredient_categories`

```sql
CREATE TABLE ingredient_categories (
  id   UUID         PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE UNIQUE INDEX ingredient_categories_name_lower_uniq
  ON ingredient_categories (lower(name));
```

### Migration 0001 changes to `ingredients`

```sql
-- Drop old free-text column
ALTER TABLE ingredients DROP COLUMN category;

-- Add FK column (DB is clean — no existing rows)
ALTER TABLE ingredients
  ADD COLUMN category_id UUID NOT NULL
    REFERENCES ingredient_categories(id);
```

---

## Drizzle Schema

### `ingredient-category-table.ts` (new)

```typescript
import { sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const ingredientCategories = pgTable(
  'ingredient_categories',
  {
    id:   uuid('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (t) => [
    uniqueIndex('ingredient_categories_name_lower_uniq').on(sql`lower(${t.name})`),
  ],
);
```

### `ingredient-table.ts` (updated)

```typescript
import { sql } from 'drizzle-orm';
import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { ingredientCategories } from '../../ingredient-category/infrastructure/ingredient-category-table.js';

export const ingredients = pgTable(
  'ingredients',
  {
    id:         uuid('id').primaryKey(),
    name:       varchar('name', { length: 100 }).notNull(),
    unit:       varchar('unit', { length: 50 }).notNull(),
    categoryId: uuid('category_id').notNull().references(() => ingredientCategories.id),
    createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
                  .$onUpdate(() => sql`now()`),
  },
  (t) => [uniqueIndex('ingredients_name_lower_uniq').on(sql`lower(${t.name})`)],
);
```

---

## Error Catalogue

### New — `ingredient-category/domain/errors.ts`

| Class | Status | Trigger |
|-------|--------|---------|
| `CategoryNotFound(id)` | 404 | GET/PATCH/DELETE `/ingredient-categories/:id` with unknown id |
| `CategoryNameConflict(name)` | 409 | POST/PATCH `/ingredient-categories` with a duplicate name |
| `CategoryInUse(id)` | 409 | DELETE `/ingredient-categories/:id` when ≥1 ingredient references it (PG 23503) |

### Updated — `ingredient/domain/errors.ts`

| Class | Status | Trigger |
|-------|--------|---------|
| `IngredientNotFound(id)` | 404 | unchanged |
| `IngredientNameConflict(name)` | 409 | unchanged |
| `CategoryReferenceNotFound(categoryId)` | 422 | POST/PATCH `/ingredients` with a `categoryId` that does not exist (PG 23503 on insert/update) |

### `shared/infrastructure/app.ts` — handler extension

A new branch must be added to `handleError` for `statusCode === 422`:
```typescript
if (status === 422) {
  reply.status(422).send({
    statusCode: 422,
    error: 'Unprocessable Entity',
    message: error.message,
  });
  return;
}
```

---

## FK Constraint Behaviour

| Operation | PG error | Mapped to |
|-----------|----------|-----------|
| `INSERT INTO ingredients` with unknown `category_id` | `23503` (FK violation) | `CategoryReferenceNotFound` → 422 |
| `UPDATE ingredients SET category_id` with unknown value | `23503` (FK violation) | `CategoryReferenceNotFound` → 422 |
| `DELETE FROM ingredient_categories` with referenced rows | `23503` (FK violation) | `CategoryInUse` → 409 |
| `INSERT/UPDATE ingredient_categories` with duplicate name | `23505` (unique violation) | `CategoryNameConflict` → 409 |
| `INSERT/UPDATE ingredients` with duplicate name | `23505` (unique violation) | `IngredientNameConflict` → 409 (existing) |
