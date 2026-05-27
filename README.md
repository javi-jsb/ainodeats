# ainodeats

<!-- TODO: CI badge (CI setup is out of scope for this phase) -->
<!-- TODO: Coverage badge (CI setup is out of scope for this phase) -->

*Built entirely with AI assistance as a personal learning and training project.*

A REST API for restaurant discovery and food ordering — currently at foundation phase.

## Quick start

### Prerequisites

- [Node.js 24](https://nodejs.org/) (`node --version` should print `v24.x.x`)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker](https://www.docker.com/) (for the local database service)

### Setup

```sh
pnpm install
```

Installs all dependencies with exact versions from the lockfile. Git hooks (pre-commit format check, pre-push test run) are registered automatically via the `prepare` script.

### Run

```sh
pnpm dev
```

Starts the API in watch mode. The service listens on `http://localhost:3000`.

Verify it is running:

```sh
curl http://localhost:3000/health
# → {"status":"ok"}
```

### Tests and linting

```sh
# Full test suite with 100% coverage enforcement
pnpm test

# TypeScript type checking (no emit)
pnpm typecheck

# Check formatting and linting violations (no modifications)
pnpm check

# Auto-fix all fixable violations
pnpm fix
```

## Architecture

The project follows **Hexagonal Architecture** (Ports and Adapters) with **Vertical Slicing**:

```
src/
├── shared/          ← cross-cutting infrastructure (HTTP server factory)
└── <slice>/         ← one directory per domain concept
    ├── domain/      ← entities, value objects, port interfaces (no framework imports)
    ├── application/ ← use cases (no framework imports)
    └── infrastructure/ ← HTTP routes, DB repositories
```

Code is organized by domain concept (slice), not by technical layer. The `health` slice has no domain or application layer — it is pure infrastructure (fixed response, no business logic).

**Flat-first rule**: subdirectories within a layer are added only when there are more than two or three files of the same adapter type.

Tests mirror `src/` structure under `tests/`.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — development conventions, commit format, branch naming, PR rules
- [`specs/`](specs/) — feature specifications, implementation plans, and task lists
