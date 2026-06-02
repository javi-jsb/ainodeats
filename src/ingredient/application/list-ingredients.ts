import type { IngredientRepository } from '../domain/ingredient-repository.js';

export interface ListIngredientsFilter {
	category?: string;
	name?: string;
}

export async function listIngredients(
	repo: IngredientRepository,
	filter: ListIngredientsFilter,
) {
	const cleanedFilter: { category?: string; name?: string } = {};
	if (filter.category && filter.category.trim().length > 0) {
		cleanedFilter.category = filter.category.trim();
	}
	if (filter.name && filter.name.trim().length > 0) {
		cleanedFilter.name = filter.name.trim();
	}
	return repo.findMany(cleanedFilter);
}
