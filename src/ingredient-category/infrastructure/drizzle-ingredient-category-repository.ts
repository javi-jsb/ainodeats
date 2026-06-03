import { asc, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
	CategoryInUse,
	CategoryNameConflict,
	CategoryNotFound,
} from '../domain/errors.js';
import type {
	IngredientCategory,
	NormalizedCategoryFields,
} from '../domain/ingredient-category.js';
import type { IngredientCategoryRepository } from '../domain/ingredient-category-repository.js';
import { ingredientCategories } from './ingredient-category-table.js';

type Row = typeof ingredientCategories.$inferSelect;

function rowToCategory(row: Row): IngredientCategory {
	return { id: row.id, name: row.name };
}

function hasCode(err: unknown, code: string): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code: string }).code === code
	);
}

function hasPgCode(err: unknown, code: string): boolean {
	if (hasCode(err, code)) return true;
	if (typeof err === 'object' && err !== null && 'cause' in err) {
		return hasCode((err as { cause: unknown }).cause, code);
	}
	return false;
}

export class DrizzleIngredientCategoryRepository
	implements IngredientCategoryRepository
{
	constructor(private readonly db: NodePgDatabase) {}

	async insert(category: IngredientCategory): Promise<IngredientCategory> {
		try {
			const [row] = await this.db
				.insert(ingredientCategories)
				.values({ id: category.id, name: category.name })
				.returning();
			return rowToCategory(row);
		} catch (err) {
			if (hasPgCode(err, '23505')) {
				throw new CategoryNameConflict(category.name);
			}
			throw err;
		}
	}

	async findById(id: string): Promise<IngredientCategory | null> {
		const [row] = await this.db
			.select()
			.from(ingredientCategories)
			.where(sql`${ingredientCategories.id} = ${id}::uuid`);
		return row ? rowToCategory(row) : null;
	}

	async findMany(): Promise<IngredientCategory[]> {
		const rows = await this.db
			.select()
			.from(ingredientCategories)
			.orderBy(asc(sql`lower(${ingredientCategories.name})`));
		return rows.map(rowToCategory);
	}

	async update(
		id: string,
		fields: NormalizedCategoryFields,
	): Promise<IngredientCategory> {
		try {
			const [row] = await this.db
				.update(ingredientCategories)
				.set({ name: fields.name })
				.where(sql`${ingredientCategories.id} = ${id}::uuid`)
				.returning();
			if (!row) throw new CategoryNotFound(id);
			return rowToCategory(row);
		} catch (err) {
			if (hasPgCode(err, '23505')) {
				throw new CategoryNameConflict(fields.name);
			}
			throw err;
		}
	}

	async delete(id: string): Promise<void> {
		try {
			const result = await this.db
				.delete(ingredientCategories)
				.where(sql`${ingredientCategories.id} = ${id}::uuid`)
				.returning({ id: ingredientCategories.id });
			if (result.length === 0) throw new CategoryNotFound(id);
		} catch (err) {
			if (hasPgCode(err, '23503')) {
				throw new CategoryInUse(id);
			}
			throw err;
		}
	}
}
