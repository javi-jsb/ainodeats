# Research: Project Bootstrap

**Branch**: `001-project-bootstrap` | **Date**: 2026-05-26

Decisions debated and confirmed with the team before plan generation. All decisions below feed directly into `plan.md`.

---

## Decision 1: Test Framework → Vitest

**Decision**: Vitest

**Rationale**:
- ESM-native — no extra transpilation config for a `"type": "module"` project
- TypeScript via esbuild internally — no ts-jest or Babel layer needed
- Fastify's `inject()` API works naturally inside async Vitest tests
- Native coverage integration via `@vitest/coverage-v8`

**Alternatives considered**:
- Jest + ts-jest: requires explicit ESM mode config (`--experimental-vm-modules`), slower, more setup friction on Node 24
- Node.js built-in `node:test`: zero dependencies but immature coverage support and limited DX compared to Vitest

---

## Decision 2: Coverage Provider → @vitest/coverage-v8

**Decision**: `@vitest/coverage-v8`

**Rationale**: Uses V8's built-in coverage engine — no source transformation, accurate branch detection for TypeScript, integrates with Vitest's `--coverage` flag. Threshold enforcement (100% lines/branches/functions/statements) is a native Vitest config option.

**Alternatives considered**:
- `@vitest/coverage-istanbul`: requires instrumentation at transform time; slower; legacy choice

---

## Decision 3: Git Hooks Manager → Lefthook

**Decision**: Lefthook

**Rationale**:
- pnpm-compatible without workarounds — no `prepare` script conflict
- Go binary: fast execution, no Node.js runtime on the hook critical path
- Single YAML config (`lefthook.yml`), cleaner than shell scripts per hook
- Hooks registered via `lefthook install`, not tied to pnpm lifecycle

**Alternatives considered**:
- Husky v9: requires `prepare` script, which pnpm skips in some environments (CI with `NODE_ENV=production`)
- simple-git-hooks: too minimal, no parallel execution

---

## Decision 4: Module Format → ESM

**Decision**: ESM (`"type": "module"` in `package.json`)

**Rationale**: Node.js 24 has full, stable ESM support. Fastify, Vitest, and Biome are all ESM-compatible. TypeScript with `"module": "NodeNext"` generates correct ESM output. No library publishing needed so no dual-package complexity.

**Known friction accepted**:
- `.js` extensions required in TypeScript import paths (e.g., `import './routes/health.js'`)
- `__dirname` / `__filename` not available natively — use `fileURLToPath(import.meta.url)` if needed

**Alternatives considered**:
- CommonJS: no advantage for a new project on Node 24; introduces technical debt

---

## Decision 5: Schema Approach → TypeBox Deferred

**Decision**: Inline JSON Schema for `/health`; TypeBox introduced with the first domain feature

**Rationale**: The health route has no input validation and a single-field response. TypeBox's value is proportional to schema complexity — it's a YAGNI addition here. Deferring also allows the team to understand Fastify's native JSON Schema before adding an abstraction layer.

**Alternatives considered**:
- TypeBox from day one: adds `@sinclair/typebox` + `@fastify/type-provider-typebox` with no present benefit for a single trivial route

---

## Decision 6: Exact Dependency Pinning → `.npmrc save-exact=true`

**Decision**: `.npmrc` with `save-exact=true`

**Rationale**: pnpm respects this flag on every `pnpm add`. Enforced at tooling level — no per-command flag, no room for human error.

**Alternatives considered**:
- `pnpm add --save-exact` per install: requires discipline, easy to forget

---

## Decision 7: TypeScript Configuration

**Decision**: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"target": "ES2023"`, `"strict": true`

**Rationale**: `NodeNext` is the correct TypeScript resolution mode for ESM + Node.js. `ES2023` targets the feature set native to Node 24 without downlevelling. `strict` is mandated by the constitution.

---

## Decision 8: Project Architecture → Hexagonal + Vertical Slicing

**Decision**: Hexagonal Architecture (Ports and Adapters) with Vertical Slicing, flat-first rule within layers

**Rationale**:
- Domain code isolated from framework and infrastructure — testable without Fastify or PostgreSQL
- Organized by domain concept (slice), not by technical layer — features are self-contained and easier to navigate as the codebase grows
- Flat-first: no premature subdirectories within `application/` or `infrastructure/`; add grouping only when a layer has more than two or three files of the same type

**Structure**:
```
src/
├── shared/infrastructure/    ← cross-cutting infrastructure (HTTP server factory)
└── <slice>/
    ├── domain/               ← entities, value objects, port interfaces
    ├── application/          ← use cases (flat, no use-cases/ subfolder)
    └── infrastructure/       ← HTTP routes, DB repositories (flat initially)
```

**Bootstrap note**: The `health` slice has no domain or application layer — the health check is pure infrastructure (fixed response, no business logic).

**Alternatives considered**:
- Layer-first structure (`controllers/`, `services/`, `repositories/`): poor locality, unrelated code in the same folder, doesn't scale well
- Full DDD (aggregates, domain events, sagas): premature for this project stage

---

## Summary

| Topic | Decision |
|---|---|
| Test framework | Vitest |
| Coverage | @vitest/coverage-v8 (100% threshold) |
| Git hooks manager | Lefthook |
| Module format | ESM (`"type": "module"`) |
| Schema provider | Inline JSON Schema (TypeBox deferred to first domain feature) |
| Exact pinning | `.npmrc` `save-exact=true` |
| TypeScript target | NodeNext / ES2023 / strict |
| Linting + formatting | Biome (decided during spec phase) |
| Architecture | Hexagonal + Vertical Slicing, flat-first within layers |
