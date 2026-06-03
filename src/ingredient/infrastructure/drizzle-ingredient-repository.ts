import { and, asc, eq, ilike, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ingredientCategories } from '../../ingredient-category/infrastructure/ingredient-category-table.js';
import { hasPgCode } from '../../shared/infrastructure/pg-errors.js';
import {
	CategoryReferenceNotFound,
	IngredientNameConflict,
	IngredientNotFound,
} from '../domain/errors.js';
import type {
	Ingredient,
	PartialIngredientFields,
} from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';
import { ingredients } from './ingredient-table.js';

function joinRowToIngredient(row: {
	id: string;
	name: string;
	unit: string;
	categoryId: string;
	categoryName: string | null;
	createdAt: Date;
	updatedAt: Date;
}): Ingredient {
	return {
		id: row.id,
		name: row.name,
		unit: row.unit,
		category: { id: row.categoryId, name: row.categoryName! },
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
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
					categoryId: ingredient.category.id,
				})
				.returning();

			// FK guarantees the row still exists immediately after insert
			return (await this.findById(row.id))!;
		} catch (err) {
			if (hasPgCode(err, '23505')) {
				throw new IngredientNameConflict(ingredient.name);
			}
			if (hasPgCode(err, '23503')) {
				throw new CategoryReferenceNotFound(ingredient.category.id);
			}
			throw err;
		}
	}

	async findById(id: string): Promise<Ingredient | null> {
		const rows = await this.db
			.select({
				id: ingredients.id,
				name: ingredients.name,
				unit: ingredients.unit,
				categoryId: ingredients.categoryId,
				categoryName: ingredientCategories.name,
				createdAt: ingredients.createdAt,
				updatedAt: ingredients.updatedAt,
			})
			.from(ingredients)
			.leftJoin(
				ingredientCategories,
				eq(ingredients.categoryId, ingredientCategories.id),
			)
			.where(sql`${ingredients.id} = ${id}::uuid`);

		if (!rows[0]) return null;
		return joinRowToIngredient(rows[0]);
	}

	async findMany(filter: {
		category?: string;
		name?: string;
	}): Promise<Ingredient[]> {
		const conditions = [];
		if (filter.category) {
			conditions.push(
				sql`lower(${ingredientCategories.name}) = lower(${filter.category})`,
			);
		}
		if (filter.name) {
			conditions.push(ilike(ingredients.name, `%${filter.name}%`));
		}
		const rows = await this.db
			.select({
				id: ingredients.id,
				name: ingredients.name,
				unit: ingredients.unit,
				categoryId: ingredients.categoryId,
				categoryName: ingredientCategories.name,
				createdAt: ingredients.createdAt,
				updatedAt: ingredients.updatedAt,
			})
			.from(ingredients)
			.leftJoin(
				ingredientCategories,
				eq(ingredients.categoryId, ingredientCategories.id),
			)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(asc(sql`lower(${ingredients.name})`));

		return rows.map(joinRowToIngredient);
	}

	async update(
		id: string,
		patch: PartialIngredientFields,
	): Promise<Ingredient> {
		const updateValues: Partial<typeof ingredients.$inferInsert> = {};
		if (patch.name !== undefined) updateValues.name = patch.name;
		if (patch.unit !== undefined) updateValues.unit = patch.unit;
		if (patch.categoryId !== undefined)
			updateValues.categoryId = patch.categoryId;

		try {
			const [row] = await this.db
				.update(ingredients)
				.set(updateValues)
				.where(sql`${ingredients.id} = ${id}::uuid`)
				.returning();
			if (!row) throw new IngredientNotFound(id);

			// Row exists since we just updated it
			return (await this.findById(row.id))!;
		} catch (err) {
			if (hasPgCode(err, '23505')) {
				throw new IngredientNameConflict(patch.name as string);
			}
			if (hasPgCode(err, '23503')) {
				throw new CategoryReferenceNotFound(patch.categoryId as string);
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
