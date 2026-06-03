import { sql } from 'drizzle-orm';
import {
	index,
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';
import { ingredientCategories } from '../../ingredient-category/infrastructure/ingredient-category-table.js';

export const ingredients = pgTable(
	'ingredients',
	{
		id: uuid('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
		unit: varchar('unit', { length: 50 }).notNull(),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => ingredientCategories.id),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => sql`now()`),
	},
	(t) => [
		uniqueIndex('ingredients_name_lower_uniq').on(sql`lower(${t.name})`),
		index('ingredients_category_id_idx').on(t.categoryId),
	],
);
