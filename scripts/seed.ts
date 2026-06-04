/**
 * Development seed: populates a local database with a small, representative
 * dataset (a few ingredient categories and ingredients referencing them by id).
 *
 * - Goes through the application use cases, so domain invariants run for real.
 * - Non-destructive: it only inserts. It expects a fresh (migrated, empty)
 *   database and aborts if categories already exist, rather than failing midway
 *   on a name conflict. Re-seed against a clean DB.
 *
 * Run with: pnpm db:seed
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { createIngredient } from '../src/ingredient/application/create-ingredient.js';
import { DrizzleCategoryExistenceChecker } from '../src/ingredient/infrastructure/drizzle-category-existence-checker.js';
import { DrizzleIngredientRepository } from '../src/ingredient/infrastructure/drizzle-ingredient-repository.js';
import { createIngredientCategory } from '../src/ingredient-category/application/create-ingredient-category.js';
import { DrizzleIngredientCategoryRepository } from '../src/ingredient-category/infrastructure/drizzle-ingredient-category-repository.js';
import { getDatabaseUrl } from '../src/shared/infrastructure/config.js';

const CATEGORIES = ['Vegetable', 'Fruit', 'Dairy', 'Spice', 'Grain'];

const INGREDIENTS: { name: string; unit: string; category: string }[] = [
	{ name: 'Tomato', unit: 'units', category: 'Vegetable' },
	{ name: 'Carrot', unit: 'units', category: 'Vegetable' },
	{ name: 'Apple', unit: 'units', category: 'Fruit' },
	{ name: 'Banana', unit: 'units', category: 'Fruit' },
	{ name: 'Milk', unit: 'ml', category: 'Dairy' },
	{ name: 'Cheese', unit: 'g', category: 'Dairy' },
	{ name: 'Black Pepper', unit: 'g', category: 'Spice' },
	{ name: 'Rice', unit: 'g', category: 'Grain' },
];

async function main(): Promise<void> {
	const pool = new pg.Pool({ connectionString: getDatabaseUrl() });
	try {
		const db = drizzle(pool);
		const categoryRepo = new DrizzleIngredientCategoryRepository(db);
		const ingredientRepo = new DrizzleIngredientRepository(db);
		const categoryChecker = new DrizzleCategoryExistenceChecker(db);

		const existing = await categoryRepo.findMany();
		if (existing.length > 0) {
			console.error(
				'Database already contains ingredient categories. The seed expects a ' +
					'fresh (migrated, empty) database — aborting to avoid name conflicts.',
			);
			process.exitCode = 1;
			return;
		}

		const categoryIdByName = new Map<string, string>();
		for (const name of CATEGORIES) {
			const created = await createIngredientCategory(categoryRepo, { name });
			categoryIdByName.set(name, created.id);
		}

		for (const item of INGREDIENTS) {
			const categoryId = categoryIdByName.get(item.category);
			if (!categoryId) {
				throw new Error(
					`Ingredient "${item.name}" references unknown category "${item.category}"`,
				);
			}
			await createIngredient(ingredientRepo, categoryChecker, {
				name: item.name,
				unit: item.unit,
				categoryId,
			});
		}

		console.log(
			`Seeded ${CATEGORIES.length} categories and ${INGREDIENTS.length} ingredients.`,
		);
	} finally {
		await pool.end();
	}
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exitCode = 1;
});
