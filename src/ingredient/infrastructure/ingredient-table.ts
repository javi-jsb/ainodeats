import { sql } from 'drizzle-orm';
import {
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

export const ingredients = pgTable(
	'ingredients',
	{
		id: uuid('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
		unit: varchar('unit', { length: 50 }).notNull(),
		category: varchar('category', { length: 50 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => sql`now()`),
	},
	(t) => [uniqueIndex('ingredients_name_lower_uniq').on(sql`lower(${t.name})`)],
);
