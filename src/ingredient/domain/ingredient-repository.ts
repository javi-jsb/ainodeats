import type {
	Ingredient,
	IngredientView,
	PartialIngredientFields,
} from './ingredient.js';

export interface IngredientRepository {
	insert(ingredient: Ingredient): Promise<IngredientView>;
	findById(id: string): Promise<IngredientView | null>;
	findMany(filter: {
		categoryId?: string;
		name?: string;
	}): Promise<IngredientView[]>;
	update(id: string, patch: PartialIngredientFields): Promise<IngredientView>;
	delete(id: string): Promise<void>;
}
