export interface IngredientCategory {
	id: string;
	name: string;
}

export interface IngredientCategoryFields {
	name: string;
}

export interface NormalizedCategoryFields {
	name: string;
}

const CONTROL_CHAR_RE = /\p{Cc}/u;

export function normalizeCategoryFields(
	fields: IngredientCategoryFields,
): NormalizedCategoryFields {
	const name = fields.name.trim();
	if (name.length === 0) {
		throw new ValidationError('name must not be empty after trimming');
	}
	if (name.length > 100) {
		throw new ValidationError('name must be at most 100 characters');
	}
	if (CONTROL_CHAR_RE.test(name)) {
		throw new ValidationError(
			'name must not contain line breaks or control characters',
		);
	}
	return { name };
}

export class ValidationError extends Error {
	readonly statusCode = 400;

	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}
