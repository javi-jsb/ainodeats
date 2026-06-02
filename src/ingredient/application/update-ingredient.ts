import { normalizePartialFields } from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';

export interface UpdateIngredientCommand {
	name?: string;
	unit?: string;
	category?: string;
}

export async function updateIngredient(
	repo: IngredientRepository,
	id: string,
	command: UpdateIngredientCommand,
) {
	const normalized = normalizePartialFields(command);
	return repo.update(id, normalized);
}
