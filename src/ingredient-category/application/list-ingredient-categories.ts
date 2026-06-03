import type { IngredientCategoryRepository } from '../domain/ingredient-category-repository.js';

export async function listIngredientCategories(
	repo: IngredientCategoryRepository,
) {
	return repo.findMany();
}
