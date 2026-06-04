# Quickstart: Ingredient Category CRUD

## Prerequisites

```bash
docker compose up -d postgres
export DATABASE_URL="postgres://ainodeats:ainodeats@localhost:5432/ainodeats"
```

## Apply migrations

```bash
pnpm db:generate   # generates drizzle/0001_<name>.sql after schema changes
pnpm db:migrate    # applies migration 0001 to dev DB
```

## Start the app

```bash
pnpm dev
# → http://localhost:3000
# → http://localhost:3000/docs  (Swagger UI)
```

## Run the tests

```bash
pnpm test          # vitest run --coverage (100% threshold enforced)
```

---

## Curl examples

### Create a category

```bash
curl -s -X POST http://localhost:3000/ingredient-categories \
  -H 'Content-Type: application/json' \
  -d '{"name":"dairy"}' | jq
# → { "id": "...", "name": "dairy" }
```

### List categories

```bash
curl -s http://localhost:3000/ingredient-categories | jq
# → [ { "id": "...", "name": "dairy" } ]
```

### Get a category

```bash
curl -s http://localhost:3000/ingredient-categories/<id> | jq
```

### Rename a category

```bash
curl -s -X PATCH http://localhost:3000/ingredient-categories/<id> \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dairy Products"}' | jq
```

### Delete a category (only if no ingredients reference it)

```bash
curl -s -X DELETE http://localhost:3000/ingredient-categories/<id>
# → 204 No Content
```

### Create an ingredient (with category reference)

```bash
curl -s -X POST http://localhost:3000/ingredients \
  -H 'Content-Type: application/json' \
  -d '{"name":"whole milk","unit":"L","categoryId":"<category-id>"}' | jq
# → { "id": "...", "name": "whole milk", "unit": "L",
#     "category": { "id": "...", "name": "dairy" },
#     "createdAt": "...", "updatedAt": "..." }
```

### List ingredients (filter by category name)

```bash
curl -s 'http://localhost:3000/ingredients?category=dairy' | jq
```

### Update an ingredient's category

```bash
curl -s -X PATCH http://localhost:3000/ingredients/<id> \
  -H 'Content-Type: application/json' \
  -d '{"categoryId":"<new-category-id>"}' | jq
```

---

## Error examples

### Duplicate category name (409)

```bash
curl -s -X POST http://localhost:3000/ingredient-categories \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dairy"}' | jq
# → { "statusCode": 409, "error": "Conflict", "message": "..." }
```

### Non-existent categoryId on ingredient create (422)

```bash
curl -s -X POST http://localhost:3000/ingredients \
  -H 'Content-Type: application/json' \
  -d '{"name":"butter","unit":"kg","categoryId":"00000000-0000-0000-0000-000000000000"}' | jq
# → { "statusCode": 422, "error": "Unprocessable Entity", "message": "..." }
```

### Delete a referenced category (409)

```bash
curl -s -X DELETE http://localhost:3000/ingredient-categories/<id-with-ingredients> | jq
# → { "statusCode": 409, "error": "Conflict", "message": "..." }
```
