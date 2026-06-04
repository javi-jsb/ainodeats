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
	IngredientView,
	PartialIngredientFields,
} from '../domain/ingredient.js';
import type { IngredientRepository } from '../domain/ingredient-repository.js';
import { ingredients } from './ingredient-table.js';

function rowToView(row: {
	id: string;
	name: string;
	unit: string;
	categoryId: string;
	categoryName: string;
	createdAt: Date;
	updatedAt: Date;
}): IngredientView {
	return {
		id: row.id,
		name: row.name,
		unit: row.unit,
		category: { id: row.categoryId, name: row.categoryName },
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

const viewColumns = {
	id: ingredients.id,
	name: ingredients.name,
	unit: ingredients.unit,
	categoryId: ingredients.categoryId,
	categoryName: ingredientCategories.name,
	createdAt: ingredients.createdAt,
	updatedAt: ingredients.updatedAt,
};

export class DrizzleIngredientRepository implements IngredientRepository {
	constructor(private readonly db: NodePgDatabase) {}

	async insert(ingredient: Ingredient): Promise<IngredientView> {
		try {
			const [row] = await this.db
				.insert(ingredients)
				.values({
					id: ingredient.id,
					name: ingredient.name,
					unit: ingredient.unit,
					categoryId: ingredient.categoryId,
				})
				.returning();

			const view = await this.findById(row.id);
			if (!view) {
				throw new Error(
					`Ingredient ${row.id} could not be read back after insert`,
				);
			}
			return view;
		} catch (err) {
			if (hasPgCode(err, '23505')) {
				throw new IngredientNameConflict(ingredient.name);
			}
			if (hasPgCode(err, '23503')) {
				throw new CategoryReferenceNotFound(ingredient.categoryId);
			}
			throw err;
		}
	}

	async findById(id: string): Promise<IngredientView | null> {
		const rows = await this.db
			.select(viewColumns)
			.from(ingredients)
			.innerJoin(
				ingredientCategories,
				eq(ingredients.categoryId, ingredientCategories.id),
			)
			.where(sql`${ingredients.id} = ${id}::uuid`);

		if (!rows[0]) return null;
		return rowToView(rows[0]);
	}

	async findMany(filter: {
		categoryId?: string;
		name?: string;
	}): Promise<IngredientView[]> {
		const conditions = [];
		if (filter.categoryId) {
			conditions.push(
				sql`${ingredients.categoryId} = ${filter.categoryId}::uuid`,
			);
		}
		if (filter.name) {
			conditions.push(ilike(ingredients.name, `%${filter.name}%`));
		}
		const rows = await this.db
			.select(viewColumns)
			.from(ingredients)
			.innerJoin(
				ingredientCategories,
				eq(ingredients.categoryId, ingredientCategories.id),
			)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(asc(sql`lower(${ingredients.name})`));

		return rows.map(rowToView);
	}

	async update(
		id: string,
		patch: PartialIngredientFields,
	): Promise<IngredientView> {
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

			const view = await this.findById(row.id);
			if (!view) {
				throw new Error(
					`Ingredient ${row.id} could not be read back after update`,
				);
			}
			return view;
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
