import type { IngredientRepository } from '../domain/ingredient-repository.js';

export interface ListIngredientsFilter {
	categoryId?: string;
	name?: string;
}

export async function listIngredients(
	repo: IngredientRepository,
	filter: ListIngredientsFilter,
) {
	const cleanedFilter: { categoryId?: string; name?: string } = {};
	// categoryId is uuid-validated by the route schema, so it never needs trimming.
	if (filter.categoryId) {
		cleanedFilter.categoryId = filter.categoryId;
	}
	if (filter.name && filter.name.trim().length > 0) {
		cleanedFilter.name = filter.name.trim();
	}
	return repo.findMany(cleanedFilter);
}
