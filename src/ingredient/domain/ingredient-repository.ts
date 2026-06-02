import type { Ingredient, PartialIngredientFields } from './ingredient.js';

export interface IngredientRepository {
	insert(ingredient: Ingredient): Promise<Ingredient>;
	findById(id: string): Promise<Ingredient | null>;
	findMany(filter: { category?: string; name?: string }): Promise<Ingredient[]>;
	update(id: string, patch: PartialIngredientFields): Promise<Ingredient>;
	delete(id: string): Promise<void>;
}
