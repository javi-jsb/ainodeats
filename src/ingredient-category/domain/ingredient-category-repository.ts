import type {
	IngredientCategory,
	NormalizedCategoryFields,
} from './ingredient-category.js';

export interface IngredientCategoryRepository {
	insert(category: IngredientCategory): Promise<IngredientCategory>;
	findById(id: string): Promise<IngredientCategory | null>;
	findMany(): Promise<IngredientCategory[]>;
	update(
		id: string,
		fields: NormalizedCategoryFields,
	): Promise<IngredientCategory>;
	delete(id: string): Promise<void>;
}
