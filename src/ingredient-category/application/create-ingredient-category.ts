import { uuidv7 } from 'uuidv7';
import { normalizeCategoryFields } from '../domain/ingredient-category.js';
import type { IngredientCategoryRepository } from '../domain/ingredient-category-repository.js';

export interface CreateIngredientCategoryCommand {
	name: string;
}

export async function createIngredientCategory(
	repo: IngredientCategoryRepository,
	command: CreateIngredientCategoryCommand,
) {
	const normalized = normalizeCategoryFields(command);
	return repo.insert({ id: uuidv7(), name: normalized.name });
}
