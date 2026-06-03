import { CategoryNotFound } from '../domain/errors.js';
import type { IngredientCategoryRepository } from '../domain/ingredient-category-repository.js';

export async function deleteIngredientCategory(
	repo: IngredientCategoryRepository,
	id: string,
) {
	const existing = await repo.findById(id);
	if (!existing) throw new CategoryNotFound(id);
	return repo.delete(id);
}
