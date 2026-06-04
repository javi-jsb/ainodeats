import { uuidv7 } from 'uuidv7';
import type { CategoryExistenceChecker } from '../domain/category-existence-checker.js';
import { CategoryReferenceNotFound } from '../domain/errors.js';
import { normalizeIngredientFields } from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';

export interface CreateIngredientCommand {
	name: string;
	unit: string;
	categoryId: string;
}

export async function createIngredient(
	repo: IngredientRepository,
	categories: CategoryExistenceChecker,
	command: CreateIngredientCommand,
) {
	const normalized = normalizeIngredientFields(command);
	if (!(await categories.exists(normalized.categoryId))) {
		throw new CategoryReferenceNotFound(normalized.categoryId);
	}
	return repo.insert({
		id: uuidv7(),
		name: normalized.name,
		unit: normalized.unit,
		categoryId: normalized.categoryId,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}
