import { CategoryNotFound } from '../domain/errors.js';
import type { IngredientCategoryRepository } from '../domain/ingredient-category-repository.js';

export async function getIngredientCategory(
	repo: IngredientCategoryRepository,
	id: string,
) {
	const category = await repo.findById(id);
	if (!category) throw new CategoryNotFound(id);
	return category;
}
