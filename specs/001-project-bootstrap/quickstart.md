# Quickstart: Project Bootstrap

**Branch**: `001-project-bootstrap`

Prerequisites: Node.js 24, pnpm, Docker (for the database service).

---

## Install

```sh
pnpm install
```

Installs all dependencies with exact versions from the lockfile. Git hooks (pre-commit format check, pre-push test run) are registered automatically.

---

## Run the API

```sh
pnpm dev
```

Starts the server in watch mode. The service listens on `http://localhost:3000` by default.

Verify it is running:

```sh
curl http://localhost:3000/health
# → {"status":"ok"}
```

Source entry point: `src/main.ts` (app factory: `src/shared/infrastructure/app.ts`)

---

## Run Tests

```sh
pnpm test
```

Runs the full test suite with coverage. The run fails if any test fails or if coverage drops below 100%.

---

## Lint & Format

```sh
# Check — reports violations without modifying files
pnpm check

# Fix — auto-corrects all fixable violations
pnpm fix
```

---

## Start the Database

```sh
docker compose up -d
```

Starts the PostgreSQL service in the background. The service is isolated from the application at this phase — no connection is made by the API.

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `ainodeats` |
| User | `ainodeats` |
| Password | `ainodeats` |

Stop the service:

```sh
docker compose down
```

---

## Git Quality Gates

These run automatically — no manual invocation needed.

| Gate | Trigger | Action |
|---|---|---|
| Format check | `git commit` | Rejects commit if formatting violations exist |
| Test suite | `git push` | Rejects push if any test fails |
