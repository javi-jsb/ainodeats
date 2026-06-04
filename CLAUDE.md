# ainodeats

## Development Conventions

### Commits — Conventional Commits

```
<emoji> <type>(<optional scope>): <short description>
```

The emoji prefix is cosmetic and aids visual scanning in the linear squash-merge history. It does not affect Conventional Commits parsers, which read from `<type>:` onward.

| Emoji | Type | When |
|---|---|---|
| ✨ | `feat` | New feature |
| 🐛 | `fix` | Bug fix |
| 🔧 | `chore` | Maintenance (deps, config, tooling) |
| ♻️ | `refactor` | Code restructuring without behavior change |
| 📝 | `docs` | Documentation only |
| ✅ | `test` | Tests only |

### Branch naming

Spec Kit-driven features create branches automatically via `/speckit-specify`, using sequential numbering:

```
<NNN>-<short-description>
```

Examples: `001-project-bootstrap`, `002-ingredient-crud`

Manual branches (hotfixes, chores, or anything outside the Spec Kit flow) follow Conventional-Commits-style naming, with the related issue number:

```
<type>/<issue-number>-<short-description>
```

Examples: `feat/5-add-recipe-endpoint`, `fix/12-null-ingredient-crash`, `chore/1-create-claude-md`

### Co-authorship

Do **not** add `Co-Authored-By:` trailers to any commit message. Commits are signed only by the human author.

### Commit granularity

Commits within a PR must be grouped by logical section, not bundled into a single monolithic commit. Each commit should represent a cohesive unit of work (e.g., dependencies, domain layer, infrastructure, tests). This makes the PR easier to review commit-by-commit.

### Pull Requests

- Every PR must reference its issue with `Closes #N` **in the PR body**, not in individual commits — the close trigger fires on squash merge via the PR description
- PR title follows the same Conventional Commits format as the branch
- Merge strategy: **squash merge** — keeps `main` history linear; the resulting commit title must be `<emoji> <pr-title> (#N)` where `N` is the PR number. GitHub's UI appends `(#N)` automatically; when merging via API (e.g. MCP tools) it must be set explicitly
- After merging, always pull `main` locally and delete the merged branch:
  ```bash
  git checkout main && git pull origin main && git branch -D <branch>
  ```

## Language

All public-facing content must be written in **English**: issues, PR titles and descriptions, commit messages, code, comments, and documentation.

## AI Collaboration Rules

**Debate before executing.** If something seems wrong, missing, inconsistent, or improvable, raise it and discuss options before proceeding. Do not execute blindly.

**Derive design decisions from the product.** This is a learning project with no real client, so design questions can easily turn into abstract debates. Before reaching for a pattern, consult [`PRODUCT.md`](PRODUCT.md) — it defines a single committed fictional client and decision heuristics. If that client doesn't need it, it's YAGNI.

**Keep this file up to date.** If during development a decision is made, a convention is added, or anything worth documenting changes, update `CLAUDE.md` accordingly in the same PR where the change happens.

## Technology Stack

- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: Fastify — schema-first validation (JSON Schema / TypeBox), TypeScript-native
- **Database**: PostgreSQL via `drizzle-orm` (infrastructure layer only) + `drizzle-kit` migrations
- **API style**: REST
- **API docs**: Swagger UI served at `/docs` (generated from route TypeBox schemas)

Stack decisions are governed by the project constitution at `.specify/memory/constitution.md`.
Changes require a constitution amendment.

## Database & Migrations

Connection is read from `DATABASE_URL` (required env var). Local dev:

```bash
export DATABASE_URL="postgres://ainodeats:ainodeats@localhost:5432/ainodeats"
docker compose up -d postgres
pnpm db:migrate      # apply migrations
pnpm dev             # start app → http://localhost:3000, docs at /docs
```

To generate a new migration after changing a Drizzle schema file:

```bash
pnpm db:generate     # writes drizzle/<version>_<name>.sql
# review the SQL, then commit it
pnpm db:migrate      # apply to dev DB
```

Tests use a dedicated database `ainodeats_test` (created automatically by Vitest `globalSetup`).

## Testing

```bash
docker compose up -d postgres
pnpm test            # vitest run --coverage (100% threshold enforced)
```

Integration tests hit the real `ainodeats_test` database via Fastify `inject()`. Test files run
sequentially (`fileParallelism: false`) to prevent `truncateAll()` race conditions across files.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/003-ingredient-category-crud/plan.md`.
<!-- SPECKIT END -->
