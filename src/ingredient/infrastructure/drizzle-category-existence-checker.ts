import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleIngredientCategoryRepository } from '../../ingredient-category/infrastructure/drizzle-ingredient-category-repository.js';
import type { CategoryExistenceChecker } from '../domain/category-existence-checker.js';

/**
 * Adapter for the ingredient slice's CategoryExistenceChecker port. Delegates
 * to the category slice's own repository so existence is resolved through that
 * aggregate's read path, not by reaching into its table directly.
 */
export class DrizzleCategoryExistenceChecker
	implements CategoryExistenceChecker
{
	private readonly categories: DrizzleIngredientCategoryRepository;

	constructor(db: NodePgDatabase) {
		this.categories = new DrizzleIngredientCategoryRepository(db);
	}

	async exists(id: string): Promise<boolean> {
		return (await this.categories.findById(id)) !== null;
	}
}
