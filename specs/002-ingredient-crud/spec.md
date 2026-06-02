# Feature Specification: Ingredient Resource

**Feature Branch**: `002-ingredient-crud`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Ingredient resource: foundational CRUD for the recipe domain. An ingredient has a name (unique), a unit of measure (e.g. grams, ml, units), and a category (dairy, vegetable, protein, ...). Endpoints: create, list (with filter by category and free-text name search by partial match), get by id, update, delete. No authentication at this phase. Foreign-key constraints with recipes are out of scope (there are no recipes yet) — they will be added with the RecipeIngredient feature. As the first domain feature, this also serves as the vehicle to establish: TypeBox-based schema validation, the first PostgreSQL migration, the repository pattern over the real database, and the first integration tests against a real PostgreSQL instance."

## Clarifications

### Session 2026-05-28

- Q: Maximum lengths for the name, unit, and category text fields? → A: name ≤ 100, unit ≤ 50, category ≤ 50 characters
- Q: Update semantics — which HTTP verb / payload contract does "update one or more fields" imply? → A: Partial update (PATCH) — only supplied fields change; omitted fields retain their current values
- Q: Should the Ingredient carry audit timestamps? → A: Yes — `created_at` and `updated_at`, returned in responses

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register ingredients into the catalog (Priority: P1)

A user managing the recipe catalog adds new ingredients so they can later be referenced by recipes. Once registered, the user can retrieve any ingredient's full information at any time.

**Why this priority**: This is the foundation of the entire recipe domain. Without a way to register ingredients, no recipe can be built. Create + read is the minimum viable surface to verify the data is captured correctly and persistently — every other capability builds on top of it.

**Independent Test**: Create one or more ingredients via the API and retrieve them individually by identifier. The system must accept valid input, reject invalid input, persist the data across process restarts, and return it on demand.

**Acceptance Scenarios**:

1. **Given** the catalog is empty, **When** a user submits a new ingredient with a name, unit of measure, and category, **Then** the system stores it, assigns a unique identifier, and returns the created ingredient.
2. **Given** an ingredient already exists with a given name, **When** the user submits a new ingredient with the same name (regardless of letter case or surrounding whitespace), **Then** the system rejects the request and signals the conflict explicitly.
3. **Given** an ingredient with a known identifier exists, **When** the user requests it by id, **Then** the system returns the ingredient with the same data that was submitted.
4. **Given** no ingredient with a given identifier exists, **When** the user requests it by id, **Then** the system signals that the resource was not found.
5. **Given** the user submits an ingredient missing a required field, **When** the request is sent, **Then** the system rejects it and reports which field is missing or invalid.

---

### User Story 2 - Browse and find ingredients (Priority: P2)

A user exploring the catalog needs to list all registered ingredients and narrow the list by category or by a partial-name search to locate what they need.

**Why this priority**: Discovery is essential once the catalog has more than a handful of entries. Without it, users cannot efficiently find existing ingredients, which leads to accidental duplicates and breaks the eventual recipe-building workflow. Important, but the catalog must exist first (P1).

**Independent Test**: After creating a small set of ingredients in different categories and with varied names, list all of them, filter by category, and search by partial name. Each query must return exactly the correct subset.

**Acceptance Scenarios**:

1. **Given** multiple ingredients exist in the catalog, **When** the user lists ingredients without any filter, **Then** the system returns all of them in a stable, deterministic order.
2. **Given** ingredients exist in different categories, **When** the user lists ingredients filtered by a specific category, **Then** only ingredients in that category are returned (matched case-insensitively).
3. **Given** ingredients with similar names exist (e.g., "Tomato", "Cherry tomato"), **When** the user lists ingredients searching by a substring of the name (e.g., "tomat"), **Then** all ingredients whose name contains that substring (case-insensitively) are returned.
4. **Given** the catalog is empty, **When** the user lists ingredients, **Then** the system returns an empty result without error.
5. **Given** the user combines a category filter and a name search, **When** the request is sent, **Then** only ingredients matching both conditions are returned.

---

### User Story 3 - Maintain the catalog (Priority: P3)

A user keeps the catalog clean over time by updating ingredient information when it changes and removing ingredients that are no longer needed.

**Why this priority**: Long-term catalog hygiene. Updates and deletions are essential for ongoing maintenance but do not block the initial create/read/discover workflow. They land last because they presuppose both registration (P1) and discovery (P2).

**Independent Test**: Create an ingredient, modify one of its fields, verify the change is reflected on subsequent reads, then delete it and verify it no longer appears in any read or list response.

**Acceptance Scenarios**:

1. **Given** an ingredient exists, **When** the user updates one or more of its fields with valid values, **Then** the system persists the change and returns the updated ingredient.
2. **Given** an ingredient with name "X" exists, **When** the user tries to rename another ingredient to "X" (regardless of letter case), **Then** the system rejects the request and signals the conflict explicitly.
3. **Given** the user attempts to update an ingredient that does not exist, **When** the request is sent, **Then** the system signals that the resource was not found.
4. **Given** an ingredient exists, **When** the user deletes it, **Then** the system removes it from the catalog and any subsequent read of that identifier returns not found.
5. **Given** the user attempts to delete an ingredient that does not exist, **When** the request is sent, **Then** the system signals that the resource was not found.

---

### Edge Cases

- **Whitespace in names**: leading and trailing whitespace is trimmed before validation and storage, so `"  Sugar  "` and `"Sugar"` are treated as the same name.
- **Whitespace-only required field**: a name, unit, or category consisting only of whitespace becomes empty after trimming and is rejected as missing/invalid (FR-005, FR-019).
- **Line breaks / control characters**: text fields must be single-line; values containing line breaks or other control characters are rejected as invalid.
- **Overly long names**: text fields are bounded by a maximum length (name ≤ 100, unit ≤ 50, category ≤ 50 characters, measured after trimming); values exceeding the bound are rejected with a validation error rather than silently truncated.
- **Empty filter / search parameters**: an empty value for the category filter or the name-search query is treated as "no filter" — it does not narrow the result set.
- **Whitespace-only search query**: a name-search query consisting only of whitespace is treated as no search.
- **Invalid identifier format**: a request targeting an identifier that does not match the expected format is rejected with a validation error, not reported as not found.
- **Empty catalog list**: returning an empty list is the correct response when no ingredients exist; it is not an error condition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to register a new ingredient by supplying a name, a unit of measure, and a category.
- **FR-002**: System MUST assign each ingredient a globally unique identifier upon creation and return it in the response.
- **FR-003**: System MUST enforce that ingredient names are unique across the catalog, compared case-insensitively and after whitespace trimming.
- **FR-004**: System MUST reject creation or rename requests that would violate name uniqueness, signalling the conflict explicitly (identifying the offending name) and without altering existing data.
- **FR-005**: System MUST reject creation requests missing any required field (name, unit, category) or containing values that fail validation, reporting which fields are invalid.
- **FR-006**: System MUST allow a user to retrieve a single ingredient by its identifier.
- **FR-007**: System MUST signal explicitly when an ingredient with a requested identifier does not exist.
- **FR-008**: System MUST allow a user to list all ingredients in the catalog.
- **FR-009**: System MUST support narrowing the list by an exact, case-insensitive category match.
- **FR-010**: System MUST support narrowing the list by a partial, case-insensitive substring search against the ingredient name.
- **FR-011**: System MUST allow combining the category filter and the name-search query; results MUST satisfy both criteria simultaneously.
- **FR-012**: System MUST return list results in a stable, deterministic order (default: ingredient name, ascending, case-insensitive).
- **FR-013**: System MUST allow a user to partially update an existing ingredient: only the fields supplied in the request are modified, and omitted fields retain their current values. Supplied values MUST pass the same validation as on creation. An update request supplying no fields is rejected with a validation error.
- **FR-014**: System MUST allow a user to delete an existing ingredient, removing it permanently from the catalog.
- **FR-015**: System MUST signal explicitly when a delete or update request targets an ingredient that does not exist.
- **FR-016**: System MUST persist all ingredients durably so they survive process restarts and remain consistent across concurrent requests.
- **FR-017**: System MUST trim leading and trailing whitespace from text fields before validation and storage. Only leading/trailing whitespace is trimmed; internal whitespace is preserved and significant (a name differing only in internal spacing is a distinct name).
- **FR-018**: System MUST reject requests whose payloads violate the documented contract (missing fields, wrong types, values out of range) with a structured validation error.
- **FR-019**: System MUST enforce length bounds on text fields, measured after trimming — each of name, unit, and category MUST be non-empty (≥ 1 character) and within its maximum (name ≤ 100, unit ≤ 50, category ≤ 50 characters) — rejecting empty or over-length values with a validation error.
- **FR-020**: System MUST record a `created_at` timestamp when an ingredient is created and advance an `updated_at` timestamp on every modification, returning both in ingredient responses. Timestamps are represented in UTC using ISO-8601 / RFC 3339.

### Key Entities

- **Ingredient**: A single named component that can later be referenced by a recipe. Holds a globally unique, server-assigned identifier, a unique name (case-insensitive, ≤ 100 chars), a unit of measure (≤ 50 chars), and a category (≤ 50 chars), plus `created_at` and `updated_at` timestamps (`created_at` set on creation; `updated_at` advances on every modification). Belongs to no user at this phase — there is a single shared catalog.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can register a new ingredient and immediately retrieve it by identifier with the same data they submitted in a single round-trip workflow that completes in under 2 seconds end-to-end.
- **SC-002**: A user searching for an ingredient by a partial-name substring locates the matching ingredient in the result set in under 1 second when the catalog holds up to 10,000 ingredients.
- **SC-003**: 100% of requests violating the name-uniqueness rule are rejected and reported as conflicts; no duplicate names ever appear in the catalog, even under concurrent creation attempts.
- **SC-004**: A new contributor can complete the full create-list-update-delete cycle for an ingredient using only the public API documentation, with no prior knowledge of the implementation.
- **SC-005**: All five operations (create, get, list, update, delete) are individually covered by automated acceptance tests against a real persistence layer; the full suite runs in under 30 seconds on a developer laptop.

## Assumptions

- **No authentication or authorization** at this phase. All endpoints are open; any caller can perform any operation. Authentication will be addressed in a later feature, before resources scoped to a user (e.g., `MealPlan`) are introduced.
- **Single shared catalog**. There is no concept of per-user ownership of ingredients; all users share one global catalog.
- **No foreign-key enforcement against recipes**. Recipes do not exist yet, so deleting an ingredient that would be referenced is not a concern at this phase. That constraint will be added with the `RecipeIngredient` feature.
- **Free-text values for unit and category**. Both fields accept any non-empty trimmed string within length bounds. They are not constrained to a predefined enumeration at this phase; if duplication or inconsistency becomes problematic, an enumeration can be introduced later.
- **Hard delete**. Deletion physically removes the ingredient from the catalog. There is no soft-delete, audit trail, or recovery mechanism at this phase.
- **No pagination** on the list endpoint at this phase. The catalog is expected to stay in the low thousands, but the system MUST still handle up to 10,000 entries (the SC-002 target) without pagination, returning the full list in a single response. Pagination will be revisited only if the catalog is expected to exceed that bound.
- **Case-insensitive name uniqueness and search**. Standard user expectation: `Sugar`, `sugar`, and `SUGAR` are treated as the same ingredient name. Case-insensitivity uses standard Unicode lowercasing under UTF-8; locale-specific folding edge cases (e.g., the Turkish dotless `ı`) are out of scope at this phase.
- **Default sort by name, ascending, case-insensitive**. The simplest deterministic order for a small catalog.
- **JSON over HTTP**. The feature exposes its operations via a JSON REST API, consistent with the project's API style decision in the constitution.
- **API documentation via OpenAPI**. The endpoint contract is documented as an OpenAPI 3.1 specification (`contracts/ingredient.yaml`). This is the public API documentation referenced by SC-004 and is served interactively at runtime as Swagger UI (see plan).
