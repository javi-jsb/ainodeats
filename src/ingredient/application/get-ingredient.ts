import { IngredientNotFound } from '../domain/errors.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';

export async function getIngredient(repo: IngredientRepository, id: string) {
	const ingredient = await repo.findById(id);
	if (!ingredient) throw new IngredientNotFound(id);
	return ingredient;
}
