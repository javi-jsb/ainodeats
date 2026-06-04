# Feature Specification: Ingredient Category CRUD

**Feature Branch**: `003-ingredient-category-crud`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "quiero cambiar el enfoque de la feature actual. En vez de que la categoría sea un enum, quiero que sea una entidad nueva, con su tabla en base de datos y el CRUD"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an ingredient category (Priority: P1)

A catalog manager creates a new ingredient category (e.g., "dairy") through the API. The system stores it and returns the created category with a system-assigned identifier, making it immediately available for use when creating ingredients.

**Why this priority**: All other operations depend on categories existing. This is the foundational operation — without it, no category can ever be referenced.

**Independent Test**: Can be fully tested by submitting a valid category name and verifying the response contains a unique ID and the provided name.

**Acceptance Scenarios**:

1. **Given** a valid, unique category name, **When** the create-category request is submitted, **Then** the system stores the category and returns it with a unique ID.
2. **Given** a category name that already exists, **When** the create-category request is submitted, **Then** the system rejects the request with a conflict error.
3. **Given** a missing or empty name, **When** the create-category request is submitted, **Then** the system rejects the request with a validation error identifying the missing field.

---

### User Story 2 - List all ingredient categories (Priority: P1)

A catalog manager or API consumer retrieves the full list of defined ingredient categories. This is the primary way to discover what categories are available before creating or filtering ingredients.

**Why this priority**: Any client creating ingredients must be able to discover valid category IDs. Without a list endpoint the system is opaque.

**Independent Test**: Can be tested independently by creating a few categories and verifying the list endpoint returns all of them.

**Acceptance Scenarios**:

1. **Given** no categories exist, **When** the list-categories request is submitted, **Then** the system returns an empty list.
2. **Given** one or more categories exist, **When** the list-categories request is submitted, **Then** the system returns all categories ordered alphabetically by name, each with its ID and name.

---

### User Story 3 - Retrieve a single category (Priority: P2)

A developer queries a specific category by its identifier to verify its details, typically when building integrations or debugging.

**Why this priority**: Useful but not blocking — clients can work with list results alone.

**Independent Test**: Can be tested by creating a category and immediately fetching it by its ID.

**Acceptance Scenarios**:

1. **Given** a category with a known ID exists, **When** the get-category request is submitted with that ID, **Then** the system returns the category details.
2. **Given** no category exists for the given ID, **When** the get-category request is submitted, **Then** the system returns a not-found error.

---

### User Story 4 - Update a category name (Priority: P2)

A catalog manager renames an existing category (e.g., correcting a typo or refining the label). Existing ingredient references are unaffected because they are stored by ID, not by name.

**Why this priority**: Supports catalog maintenance without requiring any re-linking of ingredients.

**Independent Test**: Can be tested by creating a category, renaming it, and verifying the new name is reflected in subsequent reads.

**Acceptance Scenarios**:

1. **Given** an existing category and a new unique name, **When** the update-category request is submitted, **Then** the system updates the name and returns the updated category.
2. **Given** an existing category and a name that matches another category (regardless of casing), **When** the update-category request is submitted, **Then** the system rejects the request with a conflict error.
3. **Given** a non-existent category ID, **When** the update-category request is submitted, **Then** the system returns a not-found error.

---

### User Story 5 - Delete a category (Priority: P3)

A catalog manager removes a category that is obsolete or was created in error. The system prevents deletion of any category still referenced by at least one ingredient, protecting data consistency.

**Why this priority**: Operational housekeeping; protected deletion is an acceptable safeguard.

**Independent Test**: Can be tested by creating and deleting an unreferenced category, and separately verifying that a category referenced by an ingredient is rejected.

**Acceptance Scenarios**:

1. **Given** a category not referenced by any ingredient, **When** the delete-category request is submitted, **Then** the system removes the category and returns a success response.
2. **Given** a category referenced by one or more ingredients, **When** the delete-category request is submitted, **Then** the system rejects the deletion with a descriptive error explaining the conflict.
3. **Given** a non-existent category ID, **When** the delete-category request is submitted, **Then** the system returns a not-found error.

---

### User Story 6 - Create an ingredient with a category reference (Priority: P1)

A catalog manager creates a new ingredient and specifies its category by the category's identifier. The system validates that the referenced category exists before persisting the ingredient. This replaces the previous free-text category field entirely.

**Why this priority**: The ingredient entity must be updated to use the new category entity — this is the integration point that makes the pivot complete.

**Independent Test**: Can be tested by creating a category, then creating an ingredient referencing that category ID, and verifying the ingredient is stored with the reference.

**Acceptance Scenarios**:

1. **Given** a valid ingredient payload with an existing category ID, **When** the create-ingredient request is submitted, **Then** the system stores the ingredient and returns it with the full category object (id and name) embedded in the response.
2. **Given** a valid ingredient payload with a non-existent category ID, **When** the create-ingredient request is submitted, **Then** the system rejects the request with an error identifying the invalid category.
3. **Given** an ingredient payload with no category field, **When** the create-ingredient request is submitted, **Then** the system rejects the request indicating that category is required.

---

### User Story 7 - Update an ingredient's category reference (Priority: P2)

A catalog manager updates an existing ingredient and changes its category by supplying a new category identifier. The system validates that the new category exists before applying the change.

**Why this priority**: Leaving the update endpoint unable to change the category would leave the API inconsistent — the same FK validation already runs on create, so the incremental cost is negligible and the API is complete.

**Independent Test**: Can be tested by creating two categories and an ingredient referencing the first, then patching the ingredient with the second category ID, and verifying the embedded category in the response reflects the new category.

**Acceptance Scenarios**:

1. **Given** an existing ingredient and a valid, existing new category ID, **When** the update-ingredient request is submitted with `categoryId`, **Then** the system updates the reference and returns the ingredient with the new category object embedded.
2. **Given** an existing ingredient and a non-existent category ID, **When** the update-ingredient request is submitted, **Then** the system rejects the request with an error identifying the invalid category.
3. **Given** an existing ingredient and no `categoryId` in the patch body (other fields only), **When** the update-ingredient request is submitted, **Then** the category reference is unchanged.

---

### Edge Cases

- What happens when two concurrent requests attempt to create categories with the same name (or names that differ only in casing)? The system must enforce case-insensitive uniqueness and one of the requests must fail with a conflict error.
- What happens when a category deletion is attempted while an ingredient creation referencing it is in flight? The system must reject the ingredient creation with a not-found or integrity error.
- What happens when the category name contains leading or trailing whitespace? The system trims it silently before uniqueness validation and storage. "  Dairy  " is stored as "Dairy" and compared case-insensitively against existing names.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an operation to create a new ingredient category with a name. The category shape is id (system-assigned) and name only; no additional fields are accepted or stored.
- **FR-002**: Category names MUST be unique in a case-insensitive manner; a request with a name that matches an existing category regardless of casing MUST be rejected with a conflict error.
- **FR-003**: Category names MUST NOT be empty or consist solely of whitespace.
- **FR-004**: The system MUST provide an operation to retrieve the complete list of defined ingredient categories, ordered alphabetically by name (A→Z).
- **FR-005**: The system MUST provide an operation to retrieve a single ingredient category by its identifier.
- **FR-006**: The system MUST provide an operation to update the name of an existing ingredient category.
- **FR-007**: The system MUST provide an operation to delete an ingredient category.
- **FR-008**: Deletion of a category referenced by one or more ingredients MUST be rejected with a descriptive error identifying the conflict.
- **FR-009**: The ingredient entity's `category` field MUST reference an ingredient category by its identifier; free-text and enum values are no longer accepted. All ingredient read responses (single and list) MUST embed the full category object (id and name) inline.
- **FR-010**: Ingredient creation MUST validate that the referenced category ID exists; requests with a non-existent category ID MUST be rejected.
- **FR-011**: The category field on ingredients MUST be required; ingredient creation without a category MUST be rejected.
- **FR-012**: The API documentation MUST reflect all category CRUD endpoints and the updated ingredient creation and update endpoints.
- **FR-013**: The ingredient update operation MUST accept an optional `categoryId` field; when supplied, it MUST validate that the referenced category exists, and requests with a non-existent category ID MUST be rejected.

### Key Entities

- **IngredientCategory**: A named grouping for ingredients (e.g., "dairy", "grain"). Identified by a system-assigned unique ID. Defined and managed by catalog managers, not hardcoded by the system. Complete shape: unique identifier and name (unique, case-insensitive). No additional fields.
- **Ingredient**: An item in the food catalog. Its `category` attribute changes from a free-text or enum string to a reference to an IngredientCategory. All ingredient read responses (single and list) embed the full category object (id and name) inline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of category creation requests with a valid, unique name succeed and return the created category including its ID.
- **SC-002**: 100% of category creation or update requests with a duplicate or empty name are rejected before any data is persisted.
- **SC-003**: 100% of ingredient creation and update requests with a valid category ID succeed; 100% of requests with a non-existent category ID are rejected.
- **SC-004**: 100% of deletion attempts on a category referenced by at least one ingredient are rejected with a descriptive error.
- **SC-005**: The API documentation lists all category CRUD endpoints and the updated ingredient endpoint without requiring any supplementary documentation source.

## Clarifications

### Session 2026-06-02

- Q: Should category name uniqueness be case-sensitive or case-insensitive? → A: Case-insensitive — "Dairy" and "dairy" are considered duplicates.
- Q: Should ingredient responses return only the category ID or embed the full category object? → A: Embed the full category object (id + name) inline in every ingredient response.
- Q: Should IngredientCategory have any fields beyond id and name (e.g., description)? → A: No — id and name are the complete shape; no additional fields in this feature.
- Q: In what order should the list-categories endpoint return results? → A: Alphabetical by name (A→Z).

## Assumptions

- Category name uniqueness is case-insensitive: "Dairy" and "dairy" are considered duplicates. Names are stored as provided but compared case-insensitively.
- The list-categories endpoint returns all categories without pagination; the category set is expected to remain small.
- Ingredient response payloads embed the full category object (id and name) inline in both single-resource and list responses.
- Both the create-ingredient and update-ingredient endpoints accept `categoryId` and apply the same FK existence check.
- The database is clean (no existing ingredient records), so no data migration strategy is needed for the schema change.
- Category names may have leading/trailing whitespace trimmed silently by the system before uniqueness validation.
