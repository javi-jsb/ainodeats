import { CategoryNotFound } from '../domain/errors.js';
import { normalizeCategoryFields } from '../domain/ingredient-category.js';
import type { IngredientCategoryRepository } from '../domain/ingredient-category-repository.js';

export interface UpdateIngredientCategoryCommand {
	name: string;
}

export async function updateIngredientCategory(
	repo: IngredientCategoryRepository,
	id: string,
	command: UpdateIngredientCategoryCommand,
) {
	const existing = await repo.findById(id);
	if (!existing) throw new CategoryNotFound(id);
	const normalized = normalizeCategoryFields(command);
	return repo.update(id, normalized);
}
