import type { CategoryExistenceChecker } from '../domain/category-existence-checker.js';
import { CategoryReferenceNotFound } from '../domain/errors.js';
import { normalizePartialFields } from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';

export interface UpdateIngredientCommand {
	name?: string;
	unit?: string;
	categoryId?: string;
}

export async function updateIngredient(
	repo: IngredientRepository,
	categories: CategoryExistenceChecker,
	id: string,
	command: UpdateIngredientCommand,
) {
	const normalized = normalizePartialFields(command);
	if (
		normalized.categoryId !== undefined &&
		!(await categories.exists(normalized.categoryId))
	) {
		throw new CategoryReferenceNotFound(normalized.categoryId);
	}
	return repo.update(id, normalized);
}
