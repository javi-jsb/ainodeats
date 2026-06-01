import { and, asc, ilike, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
	IngredientNameConflict,
	IngredientNotFound,
} from '../domain/errors.js';
import type {
	Ingredient,
	PartialIngredientFields,
} from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';
import { ingredients } from './ingredient-table.js';

type Row = typeof ingredients.$inferSelect;

function rowToIngredient(row: Row): Ingredient {
	return {
		id: row.id,
		name: row.name,
		unit: row.unit,
		category: row.category,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

function hasCode23505(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code: string }).code === '23505'
	);
}

function isUniqueViolation(err: unknown): boolean {
	if (hasCode23505(err)) return true;
	if (typeof err === 'object' && err !== null && 'cause' in err) {
		return hasCode23505((err as { cause: unknown }).cause);
	}
	return false;
}

export class DrizzleIngredientRepository implements IngredientRepository {
	constructor(private readonly db: NodePgDatabase) {}

	async insert(ingredient: Ingredient): Promise<Ingredient> {
		try {
			const [row] = await this.db
				.insert(ingredients)
				.values({
					id: ingredient.id,
					name: ingredient.name,
					unit: ingredient.unit,
					category: ingredient.category,
				})
				.returning();
			return rowToIngredient(row);
		} catch (err) {
			if (isUniqueViolation(err)) {
				throw new IngredientNameConflict(ingredient.name);
			}
			throw err;
		}
	}

	async findById(id: string): Promise<Ingredient | null> {
		const [row] = await this.db
			.select()
			.from(ingredients)
			.where(sql`${ingredients.id} = ${id}::uuid`);
		return row ? rowToIngredient(row) : null;
	}

	async findMany(filter: {
		category?: string;
		name?: string;
	}): Promise<Ingredient[]> {
		const conditions = [];
		if (filter.category) {
			conditions.push(
				sql`lower(${ingredients.category}) = lower(${filter.category})`,
			);
		}
		if (filter.name) {
			conditions.push(ilike(ingredients.name, `%${filter.name}%`));
		}
		const rows = await this.db
			.select()
			.from(ingredients)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(asc(sql`lower(${ingredients.name})`));
		return rows.map(rowToIngredient);
	}

	async update(
		id: string,
		patch: PartialIngredientFields,
	): Promise<Ingredient> {
		const updateValues: Partial<typeof ingredients.$inferInsert> = {};
		if (patch.name !== undefined) updateValues.name = patch.name;
		if (patch.unit !== undefined) updateValues.unit = patch.unit;
		if (patch.category !== undefined) updateValues.category = patch.category;

		try {
			const [row] = await this.db
				.update(ingredients)
				.set({ ...updateValues, updatedAt: new Date() })
				.where(sql`${ingredients.id} = ${id}::uuid`)
				.returning();
			if (!row) throw new IngredientNotFound(id);
			return rowToIngredient(row);
		} catch (err) {
			if (isUniqueViolation(err)) {
				throw new IngredientNameConflict(patch.name ?? '');
			}
			throw err;
		}
	}

	async delete(id: string): Promise<void> {
		const result = await this.db
			.delete(ingredients)
			.where(sql`${ingredients.id} = ${id}::uuid`)
			.returning({ id: ingredients.id });
		if (result.length === 0) throw new IngredientNotFound(id);
	}
}
