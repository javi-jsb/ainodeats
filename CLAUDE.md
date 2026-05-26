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

```
<type>/<issue-number>-<short-description>
```

Examples: `feat/5-add-order-endpoint`, `fix/12-null-item-crash`, `chore/1-create-claude-md`

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

**Keep this file up to date.** If during development a decision is made, a convention is added, or anything worth documenting changes, update `CLAUDE.md` accordingly in the same PR where the change happens.

## Technology Stack

- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: Fastify — schema-first validation (JSON Schema / TypeBox), TypeScript-native
- **Database**: PostgreSQL
- **API style**: REST

Stack decisions are governed by the project constitution at `.specify/memory/constitution.md`.
Changes require a constitution amendment.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
