# Tasks: Project Bootstrap

**Input**: Design documents from `specs/001-project-bootstrap/`

**Branch**: `001-project-bootstrap`

**Constitution**: TDD is non-negotiable — tests MUST be written and confirmed failing before implementation. Coverage threshold is 100%.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 1: Setup (Project Skeleton)

**Purpose**: All configuration files and directory structure. No production code yet.

- [x] T001 Create directory structure: `src/shared/infrastructure/`, `src/health/infrastructure/`, `tests/health/infrastructure/`
- [x] T002 Create `package.json` — name: ainodeats, type: module, engines: {node: ">=24.0.0"}, scripts: {dev: "node --watch src/main.ts", test: "vitest run --coverage", check: "biome check .", fix: "biome check --write .", prepare: "lefthook install"}, list all dependencies (fastify as dep; typescript, @types/node, vitest, @vitest/coverage-v8, @biomejs/biome, lefthook as devDeps)
- [x] T003 [P] Create `tsconfig.json` — compilerOptions: strict true, module NodeNext, moduleResolution NodeNext, target ES2023, outDir dist, rootDir src, declaration true; include: ["src/**/*", "tests/**/*"]
- [x] T004 [P] Create `.nvmrc` — single line: `24`
- [x] T005 [P] Create `.npmrc` — single line: `save-exact=true`
- [x] T006 [P] [US2] Create `biome.json` — extends recommended; linter enabled with recommended rules and TypeScript-specific rules; formatter enabled with indentStyle: space, indentWidth: 2, quoteStyle: double; include ["src/**", "tests/**"]; ignore ["dist", "node_modules", "coverage"]
- [x] T007 [P] [US3] Create `vitest.config.ts` — import defineConfig from vitest/config; test.coverage.provider: v8; test.coverage.include: ["src/**/*.ts"]; test.coverage.exclude: ["src/main.ts"]; test.coverage.thresholds: {lines: 100, branches: 100, functions: 100, statements: 100}; test.include: ["tests/**/*.test.ts"]

**Checkpoint**: Run `pnpm install` — all dependencies installed with exact pinned versions. No source files yet.

---

## Phase 2: Foundational (Shared HTTP Infrastructure)

**Purpose**: Fastify app factory — required by all US1 tests via `inject()`. Must be complete before Phase 3.

**⚠️ CRITICAL**: Phase 3 tests import from this file. Complete before writing any test.

- [x] T008 Create `src/shared/infrastructure/app.ts` — export async function `buildApp()` that creates and returns a Fastify instance (import Fastify from 'fastify'; const app = Fastify({ logger: true }); return app); typed return type FastifyInstance; no routes registered yet

**Checkpoint**: TypeScript compiles without errors (`pnpm exec tsc --noEmit`).

---

## Phase 3: US1 — API Startup Verification (Priority: P1) 🎯 MVP

**Goal**: A running Fastify server that responds to `GET /health` with `{"status":"ok"}`.

**Independent Test**: `pnpm dev` → `curl http://localhost:3000/health` → `{"status":"ok"}`; `pnpm test` → all pass, 100% coverage.

### Tests for US1 (write FIRST — must FAIL before T010)

- [x] T009 [US1] Write `tests/health/infrastructure/health.route.test.ts` — import buildApp; beforeEach: const app = buildApp(); afterEach: app.close(); test 'GET /health returns 200 with {"status":"ok"}': const response = await app.inject({method:'GET', url:'/health'}); expect(response.statusCode).toBe(200); expect(response.json()).toEqual({status:'ok'}) — **RUN `pnpm test`: must FAIL (RED)**

### Implementation for US1

- [x] T010 [US1] Write `src/health/infrastructure/health.route.ts` — export const healthRoute: FastifyPluginAsync = async (app) => { app.get('/health', { schema: { response: { 200: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ok'] } } } } } }, async () => ({ status: 'ok' })) }
- [x] T011 [US1] Register health route in `src/shared/infrastructure/app.ts` — import healthRoute; add app.register(healthRoute) before return; **RUN `pnpm test`: must now PASS (GREEN)**
- [x] T012 [US1] Write `src/main.ts` — ESM entry point: import buildApp; const app = buildApp(); await app.listen({ port: 3000, host: '0.0.0.0' }); note: excluded from coverage (entry point not unit-testable)

**Checkpoint**: `pnpm dev` → `curl http://localhost:3000/health` → `{"status":"ok"}`; `pnpm test` → 1 test passes, coverage 100% on all tracked files.

---

## Phase 4: US4 — Local Database Environment (Priority: P2)

**Goal**: PostgreSQL service starts with a single command and is reachable on localhost:5432.

**Independent Test**: `docker compose up -d` → connect with `psql -h localhost -U ainodeats -d ainodeats` (password: ainodeats) → connection succeeds.

- [x] T013 [P] [US4] Create `docker-compose.yml` — service name: postgres; image: postgres:16-alpine; environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD all set to ainodeats; ports: 5432:5432; healthcheck: test: ["CMD-SHELL", "pg_isready -U ainodeats"], interval: 5s, timeout: 5s, retries: 5; volumes: ainodeats_data:/var/lib/postgresql/data; restart: unless-stopped; define volume ainodeats_data at bottom

**Checkpoint**: `docker compose up -d` → `docker compose ps` shows postgres service healthy.

---

## Phase 5: US5 — Automated Git Quality Gates (Priority: P2)

**Goal**: Pre-commit rejects formatting violations; pre-push rejects failing tests. Both activate automatically on `pnpm install`.

**Independent Test**: Stage a file with a formatting violation → `git commit` → rejected with violation output. Stage all, tests passing → `git commit && git push` → both succeed.

- [x] T014 [US5] Create `lefthook.yml` — pre-commit: commands: format-check: run: pnpm check; glob: "*.{ts,json}"; pre-push: commands: test: run: pnpm test
- [x] T015 [US5] Verify `prepare` script in `package.json` triggers `lefthook install` — run `pnpm install` from scratch; confirm `.git/hooks/pre-commit` and `.git/hooks/pre-push` exist and are executable

**Checkpoint**: Introduce a formatting error in any `.ts` file → `git add . && git commit -m "test"` → commit is rejected with Biome output.

---

## Phase 6: US6 — Reproducible Dependency Installation (Priority: P3)

**Goal**: Any developer gets identical dependency versions on install.

**Independent Test**: Delete `node_modules`, run `pnpm install`, confirm no version drift against lockfile.

- [x] T016 [US6] Verify exact pinning — run `pnpm install`; open `package.json` and confirm all dependency versions have no `^` or `~` prefix; delete `node_modules` and run `pnpm install` again; confirm `pnpm-lock.yaml` is unchanged

**Checkpoint**: `git diff pnpm-lock.yaml` shows no changes after reinstall.

---

## Polish: Cross-Cutting Concerns

**Purpose**: README, quickstart validation, final quality checks.

- [x] T017 [P] Write `README.md` — follow structure from plan.md: (1) `# ainodeats` title; (2) CI and coverage badge placeholders (commented TODO); (3) `*Built entirely with AI assistance as a personal learning and training project.*`; (4) one-line description of the project; (5) `## Quick start` with Prerequisites (Node 24, pnpm, Docker), Setup (`pnpm install` — hooks auto-registered), Run (`pnpm dev` + curl health check), Tests and linting (`pnpm test`, `pnpm check`, `pnpm fix`); (6) `## Architecture` summarising hexagonal + vertical slicing and flat-first rule; (7) `## Documentation` pointing to `CLAUDE.md` and `specs/`
- [x] T018 Validate quickstart — follow `specs/001-project-bootstrap/quickstart.md` step by step from a clean state: install, dev + health check, test, check, docker compose up, DB connection; confirm every step works as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T003–T007 are parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — blocks Phase 3 tests
- **Phase 3 (US1)**: Depends on Phase 2; T009 must run and FAIL before T010; T010 before T011; T011 before T012
- **Phase 4 (US4)**: Independent of Phases 2–3 — can run in parallel with Phase 3 after Phase 1
- **Phase 5 (US5)**: Depends on Phase 1 (package.json scripts); can run after Phase 1
- **Phase 6 (US6)**: Depends on Phase 1 (package.json, .npmrc); verify after Phase 1
- **Polish**: Depends on all phases complete

### Parallel Opportunities

Within Phase 1: T003, T004, T005, T006, T007 all touch different files — run in parallel.

After Phase 1: Phases 4, 5, and 6 are independent of the health route — can proceed in parallel with Phase 3.

### TDD Order (Non-negotiable — Constitution Principle II)

```
T009 (write test, confirm RED)
  ↓
T010 (implement route)
  ↓
T011 (register route, confirm GREEN)
  ↓
T012 (entry point)
```

---

## Parallel Example: Phase 1

```bash
# These five tasks touch different files — run together:
Task T003: create tsconfig.json
Task T004: create .nvmrc
Task T005: create .npmrc
Task T006: create biome.json
Task T007: create vitest.config.ts
```

---

## Implementation Strategy

### MVP (US1 only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US1 — health endpoint
4. **STOP**: `pnpm test` passes, `curl /health` works — foundation proven

### Full Bootstrap

1. MVP above
2. Phase 4: local database
3. Phase 5: git gates
4. Phase 6: pinning verification
5. Polish: README + quickstart validation

---

## Notes

- `src/main.ts` is excluded from coverage — it is the entry point and contains no testable logic
- The `prepare` script in `package.json` installs Lefthook hooks automatically on `pnpm install` — no manual step required per developer
- Docker Compose credentials (ainodeats/ainodeats/ainodeats) are for local development only — documented in quickstart.md
- TypeBox is intentionally absent — deferred to the first domain feature per research.md Decision 5
