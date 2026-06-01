# API Requirements Quality Checklist: Ingredient Resource

**Purpose**: Validate the quality (completeness, clarity, consistency, measurability) of the Ingredient requirements before implementation — covering the API contract, error/edge-case coverage, data model, and acceptance criteria.
**Created**: 2026-05-28
**Feature**: [spec.md](../spec.md)
**Audience / Timing**: Author self-check, pre-implementation
**Depth**: Standard
**Status**: Reviewed & resolved 2026-05-28 (see Resolution Log)

**Note**: This is a "unit test for the requirements." Each item asks whether something is *well specified* — not whether the code works.

## API Contract Requirements

- [x] CHK001 Are success HTTP status codes specified for every operation (create/get/list/update/delete)? [Completeness, Spec §FR-001–FR-014 ↔ Contract]
- [x] CHK002 Is the list response structure (bare array vs wrapped envelope) explicitly defined? [Clarity, Contract §/ingredients GET]
- [x] CHK003 Is the delete success response (204 no-content vs returned body) specified and consistent with the other operations? [Consistency, Contract §/ingredients/{id} DELETE]
- [x] CHK004 Are the query-parameter names and semantics for category filter and name search documented in the requirements, not only in the contract? [Completeness, Spec §FR-009–FR-011]
- [x] CHK005 Is the structured validation-error body shape (which fields, what format) defined for 400 responses? [Clarity, Spec §FR-005/FR-018]
- [x] CHK006 Does the spec define whether the 409 conflict response identifies the conflicting name/field? [Clarity, Spec §FR-004]

## Requirement Completeness

- [x] CHK007 Is the minimum length (non-empty after trimming) specified for `name`, `unit`, and `category`, or does FR-019 bound only the maximum? [Completeness, Spec §FR-019]
- [x] CHK008 Are timestamp representation requirements (format, timezone) specified for `created_at`/`updated_at` in responses? [Completeness, Spec §FR-020]
- [x] CHK009 Are allowed character-set/encoding constraints for text fields defined (e.g., newlines, control characters, emoji in `name`)? [Gap]
- [x] CHK010 Is the "public API documentation" referenced by SC-004 defined as a concrete deliverable that actually exists? [Completeness, Spec §SC-004]

## Requirement Clarity & Ambiguity

- [x] CHK011 Is internal/repeated whitespace normalization within `name` specified, or is only leading/trailing trim defined? [Ambiguity, Spec §FR-017]
- [x] CHK012 Is case-insensitive comparison behavior defined for non-ASCII names (locale / Unicode case-folding)? [Ambiguity, Spec §FR-003]
- [x] CHK013 Is the distinction between exact case-insensitive category match (FR-009) and substring case-insensitive name search (FR-010) stated explicitly? [Clarity, Spec §FR-009/FR-010]
- [x] CHK014 Is mandating UUID v7 specifically a stated requirement, or an implementation detail that has leaked into Key Entities? [Ambiguity, Spec §Key Entities]
- [x] CHK015 Is "consistent across concurrent requests" (FR-016) defined precisely enough to be objectively verifiable? [Measurability, Spec §FR-016]

## Edge Case & Error Coverage

- [x] CHK016 Are requirements defined for a `name` that becomes empty after trimming (whitespace-only input)? [Edge Case, Spec §FR-017/FR-005]
- [x] CHK017 Is the behavior for an update request containing no fields specified (rejected vs no-op)? [Edge Case, Spec §FR-013]
- [x] CHK018 Are requirements for concurrent create/rename racing on the uniqueness rule defined (which request wins, what the loser receives)? [Coverage, Spec §SC-003/FR-016]
- [x] CHK019 Is the not-found signal required to be consistent across get, update, and delete? [Consistency, Spec §FR-007/FR-015]
- [x] CHK020 Is the "malformed identifier → validation error, not not-found" rule stated for all id-targeting operations, not just get? [Coverage, Spec §Edge Cases]

## Data Model & Persistence

- [x] CHK021 Do the field length bounds in the contract match FR-019 exactly (name 100 / unit 50 / category 50)? [Consistency, Spec §FR-019 ↔ Contract]
- [x] CHK022 Are durability requirements (survive process restart) stated in an objectively testable way? [Measurability, Spec §FR-016]
- [x] CHK023 Given names are unique, is a secondary/tiebreak ordering for list results ever needed beyond name-ascending — and is that decision recorded? [Coverage, Spec §FR-012]

## Acceptance Criteria Quality

- [x] CHK024 Do SC-001/SC-002/SC-005 specify the measurement conditions (load, dataset size, hardware) required to verify them objectively? [Measurability, Spec §SC-001/SC-002/SC-005]
- [x] CHK025 Are all functional requirements (FR-001..FR-020) traceable to at least one acceptance scenario or success criterion? [Traceability, Spec §Requirements]

## Dependencies, Assumptions & Conflicts

- [x] CHK026 Is the assumption "catalog well below 10,000" reconciled with SC-002 measuring at 10,000 — are these consistent? [Conflict, Spec §Assumptions ↔ §SC-002]
- [x] CHK027 Are the stated assumptions (no auth, single shared catalog, hard delete, no pagination, free-text unit/category) explicitly owned, with revisit triggers noted? [Assumption, Spec §Assumptions]
- [x] CHK028 Is the external dependency on a configured PostgreSQL connection (`DATABASE_URL`) captured as a documented prerequisite? [Dependency, plan.md/quickstart.md]

## Notes

- Check items off as completed: `[x]`. Add findings inline.
- An *unchecked* item flags a requirement-quality gap to resolve (or consciously accept) before/while implementing — not a code bug.

## Resolution Log (2026-05-28)

**Fixed via spec edits:**

- **CHK004** → FR-009–FR-011 describe the filter/search semantics; parameter names live in the contract (`category`, `name`).
- **CHK006** → FR-004 now states the 409 conflict identifies the offending name.
- **CHK007** → FR-019 now requires non-empty (≥ 1 char) **and** max bounds.
- **CHK008** → FR-020 now states timestamps are UTC ISO-8601 / RFC 3339.
- **CHK009** → new edge case: text fields are single-line; line breaks / control characters are rejected.
- **CHK010** → new Assumption: the OpenAPI contract is the public API doc, served as Swagger UI at `/docs` (wired in plan.md / quickstart.md).
- **CHK011** → FR-017 now states only leading/trailing trim; internal whitespace is significant.
- **CHK012** → Assumption: standard Unicode lowercasing under UTF-8; locale folding (Turkish `ı`) out of scope.
- **CHK014** → Key Entities reworded to "globally unique, server-assigned identifier"; UUID v7 lives only in plan.md / data-model.md.
- **CHK016** → new edge case: whitespace-only required field → empty after trim → rejected.
- **CHK017** → FR-013 now rejects an update with no fields.
- **CHK026** → "No pagination" assumption reworded: low thousands expected, but MUST handle up to 10,000 (SC-002 target) without pagination — conflict removed.

**Verified, already well-specified (no change):**

- **CHK001/002/003** → contract defines status codes (201/200/204), bare-array list, 204 delete.
- **CHK005** → FR-005 enumerates invalid fields; FR-018 mandates a structured error; shape in contract.
- **CHK013** → FR-009 (exact) vs FR-010 (substring) already distinct and explicit.
- **CHK015 / CHK018** → SC-003 + FR-016 cover concurrent uniqueness (one succeeds, the loser gets 409 via the unique index); recorded as a concurrency note.
- **CHK019** → FR-007 + FR-015 give a consistent not-found signal across get/update/delete.
- **CHK020** → the "Invalid identifier format" edge case is stated generally for any id-targeting request.
- **CHK021** → contract bounds (100/50/50) match FR-019.
- **CHK022** → US1 Independent Test exercises persistence across restarts.
- **CHK023** → names are unique → no tiebreak needed; decision recorded here.
- **CHK024** → SC-002 (10k) and SC-005 (developer laptop) state their conditions; accepted as adequate for this phase.
- **CHK025** → FR-001..FR-020 each trace to a US acceptance scenario and/or SC.
- **CHK027** → Assumptions section owns each item with a revisit trigger.
- **CHK028** → `DATABASE_URL` documented in plan.md (db plugin) and quickstart.md.
