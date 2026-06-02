import { uuidv7 } from 'uuidv7';
import { normalizeIngredientFields } from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';

export interface CreateIngredientCommand {
	name: string;
	unit: string;
	category: string;
}

export async function createIngredient(
	repo: IngredientRepository,
	command: CreateIngredientCommand,
) {
	const normalized = normalizeIngredientFields(command);
	return repo.insert({
		id: uuidv7(),
		...normalized,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}
