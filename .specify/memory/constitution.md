<!--
  Sync Impact Report
  ==================
  Version change: [TEMPLATE] → 1.0.0 (initial ratification) → 1.0.1 (add Fastify to stack)

  Modified principles:
  - All sections: template placeholders → concrete content (initial authoring)

  Added sections:
  - Core Principles (I–IV)
  - Technology Stack
  - Development Workflow
  - Governance

  Removed sections:
  - [SECTION_2_NAME] / [SECTION_3_NAME] generic placeholders replaced

  Templates status:
  - .specify/templates/plan-template.md  ✅ updated — Constitution Check section aligned
  - .specify/templates/spec-template.md  ✅ no changes required (template-agnostic)
  - .specify/templates/tasks-template.md ✅ no changes required (template-agnostic)

  Deferred TODOs:
  - None
-->

# ainodeats Constitution

## Core Principles

### I. API-First Design

Every feature MUST be defined as an API contract — endpoints, request/response schemas, and
HTTP status codes — before any implementation begins. Implementation follows the contract,
never the reverse. Contracts live in `specs/[feature]/contracts/` and MUST be approved before
coding starts. Any deviation from a ratified contract requires explicit re-approval.

### II. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written and confirmed failing before any production code is written.
The Red-Green-Refactor cycle is strictly enforced. Integration tests MUST target a real
PostgreSQL database — mocked database tests are prohibited (mocks mask schema divergence).
No feature is considered complete until all its tests pass.

### III. AI-Augmented, Human-Approved

AI generates, suggests, and drafts. Humans review and explicitly approve every architectural
decision, spec, plan, and significant code change before it is executed. The AI MUST raise
concerns, inconsistencies, or improvements before proceeding — blind execution is a violation
of this principle. The collaboration model is: debate first, execute second.

### IV. Simplicity / YAGNI

Implement the simplest solution that satisfies the current, concrete requirement. Speculative
abstractions, premature optimizations, and future-proofing without a present need are
prohibited. Three similar lines are better than a premature abstraction. Whenever complexity
is genuinely required, it MUST be justified explicitly in the plan's Complexity Tracking table.

## Technology Stack

- **Runtime**: Node.js with TypeScript (strict mode enabled)
- **Framework**: Fastify — schema-first validation via JSON Schema / TypeBox aligns with
  Principle I; TypeScript-first codebase (types are not a separate community package)
- **Database**: PostgreSQL — integration tests MUST use a real instance (see Principle II)
- **API style**: REST
- **Testing**: framework TBD per feature plan; contract + integration tests are mandatory

Stack changes require an explicit constitution amendment and version bump.

## Development Workflow

- **Branch naming**: `<type>/<issue-number>-<short-description>`
  (e.g., `feat/5-add-recipe-endpoint`, `fix/12-null-ingredient-crash`)
- **Commits**: Conventional Commits with emoji prefix
  (`✨ feat`, `🐛 fix`, `🔧 chore`, `♻️ refactor`, `📝 docs`, `✅ test`)
- **Co-authorship**: `Co-Authored-By:` trailers are NOT added; commits are signed by the human
  author only
- **PR body**: MUST contain `Closes #N` to trigger issue close on squash merge
- **Merge strategy**: squash merge — keeps `main` history linear
- **Language**: all public-facing content (issues, PRs, commits, code, comments, docs) MUST be
  in English

## Governance

This constitution supersedes all other practices. When a conflict arises between this document
and any other guide, this document wins; the other guide MUST be updated.

Amendment procedure:
1. Document the rationale for the change
2. Update this file with the amended content
3. Increment the version number (MAJOR for removals/redefinitions, MINOR for additions,
   PATCH for clarifications)
4. Propagate changes to all dependent templates and `CLAUDE.md` in the same PR
5. All open feature branches MUST be reviewed for compliance after a MAJOR amendment

All PRs and reviews MUST verify compliance with the four Core Principles.
Complexity deviations from Principle IV MUST be documented in the plan's Complexity Tracking
table before implementation begins.

`CLAUDE.md` is the authoritative runtime development guide and MUST remain in sync with this
constitution.

**Version**: 1.0.1 | **Ratified**: 2026-05-26 | **Last Amended**: 2026-05-26
