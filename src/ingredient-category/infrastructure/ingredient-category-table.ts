import { sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const ingredientCategories = pgTable(
	'ingredient_categories',
	{
		id: uuid('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
	},
	(t) => [
		uniqueIndex('ingredient_categories_name_lower_uniq').on(
			sql`lower(${t.name})`,
		),
	],
);
