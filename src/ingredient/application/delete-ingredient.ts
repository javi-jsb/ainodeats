import type { IngredientRepository } from '../domain/ingredient-repository.js';

export async function deleteIngredient(
	repo: IngredientRepository,
	id: string,
): Promise<void> {
	return repo.delete(id);
}
