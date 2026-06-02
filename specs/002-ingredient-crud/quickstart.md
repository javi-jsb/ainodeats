# Quickstart: Ingredient Resource

Developer guide for running and exercising the Ingredient feature locally.

## Prerequisites

- Node.js 24 (`.nvmrc`)
- pnpm
- Docker (for the PostgreSQL service)

## 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

This runs the `postgres:17-alpine` service with the dev database `ainodeats`
(user/pass `ainodeats`/`ainodeats`, port 5432). The test database
`ainodeats_test` is created automatically by the test setup — no manual step.

## 2. Configure the connection

The app reads `DATABASE_URL` from the environment. For local dev:

```bash
export DATABASE_URL="postgres://ainodeats:ainodeats@localhost:5432/ainodeats"
```

Tests use their own URL (database `ainodeats_test`), wired by the Vitest setup.

## 3. Apply migrations

```bash
pnpm db:migrate     # runs drizzle-kit migrate against DATABASE_URL
```

To regenerate a migration after changing the Drizzle schema:

```bash
pnpm db:generate    # drizzle-kit generate -> new file under drizzle/
```

## 4. Run the app

```bash
pnpm dev            # tsx watch src/main.ts -> http://localhost:3000
```

Interactive API documentation (Swagger UI, generated from the route schemas) is
available at <http://localhost:3000/docs>.

## 5. Exercise the endpoints

```bash
# Create
curl -s -X POST http://localhost:3000/ingredients \
  -H 'content-type: application/json' \
  -d '{"name":"Tomato","unit":"units","category":"vegetable"}'

# List (all)
curl -s http://localhost:3000/ingredients

# List filtered by category + partial name (case-insensitive)
curl -s 'http://localhost:3000/ingredients?category=vegetable&name=tomat'

# Get by id
curl -s http://localhost:3000/ingredients/<uuid>

# Partial update (PATCH) — only supplied fields change
curl -s -X PATCH http://localhost:3000/ingredients/<uuid> \
  -H 'content-type: application/json' \
  -d '{"unit":"grams"}'

# Delete (hard)
curl -s -X DELETE http://localhost:3000/ingredients/<uuid> -i
```

Expected status codes: create `201`, list/get/update `200`, delete `204`,
validation failure `400`, unknown id `404`, duplicate name `409`.

## 6. Run the test suite

```bash
docker compose up -d postgres   # tests need a running Postgres
pnpm test                       # vitest run --coverage (100% enforced)
```

The Vitest `globalSetup` creates `ainodeats_test` if missing and applies
migrations once; each test truncates tables before running. The suite drives
the real HTTP layer via Fastify `inject()` against the real database.

## Acceptance smoke (maps to spec Success Criteria)

- **SC-001**: create then immediately GET by id returns identical submitted data.
- **SC-002**: substring search returns matches (<1s at catalog scale).
- **SC-003**: a second create with a same-but-differently-cased name → `409`.
- **SC-005**: all five operations covered by the integration suite, < 30s.
