export interface Ingredient {
	id: string;
	name: string;
	unit: string;
	category: { id: string; name: string };
	createdAt: Date;
	updatedAt: Date;
}

const CONTROL_CHAR_RE = /\p{Cc}/u;

export interface IngredientFields {
	name: string;
	unit: string;
	categoryId: string;
}

export interface NormalizedFields {
	name: string;
	unit: string;
	categoryId: string;
}

export function normalizeIngredientFields(
	fields: IngredientFields,
): NormalizedFields {
	return {
		name: validateField(fields.name, 'name', 100),
		unit: validateField(fields.unit, 'unit', 50),
		categoryId: fields.categoryId,
	};
}

export interface PartialIngredientFields {
	name?: string;
	unit?: string;
	categoryId?: string;
}

export function normalizePartialFields(
	fields: PartialIngredientFields,
): PartialIngredientFields {
	const result: PartialIngredientFields = {};
	if (fields.name !== undefined)
		result.name = validateField(fields.name, 'name', 100);
	if (fields.unit !== undefined)
		result.unit = validateField(fields.unit, 'unit', 50);
	if (fields.categoryId !== undefined) result.categoryId = fields.categoryId;
	return result;
}

function validateField(
	value: string,
	field: string,
	maxLength: number,
): string {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		throw new ValidationError(`${field} must not be empty after trimming`);
	}
	if (trimmed.length > maxLength) {
		throw new ValidationError(
			`${field} must be at most ${maxLength} characters`,
		);
	}
	if (CONTROL_CHAR_RE.test(trimmed)) {
		throw new ValidationError(
			`${field} must not contain line breaks or control characters`,
		);
	}
	return trimmed;
}

export class ValidationError extends Error {
	readonly statusCode = 400;

	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}
