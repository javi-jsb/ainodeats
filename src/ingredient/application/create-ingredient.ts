import { uuidv7 } from 'uuidv7';
import { normalizeIngredientFields } from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';

export interface CreateIngredientCommand {
	name: string;
	unit: string;
	categoryId: string;
}

export async function createIngredient(
	repo: IngredientRepository,
	command: CreateIngredientCommand,
) {
	const normalized = normalizeIngredientFields(command);
	return repo.insert({
		id: uuidv7(),
		name: normalized.name,
		unit: normalized.unit,
		category: { id: normalized.categoryId, name: '' },
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}
