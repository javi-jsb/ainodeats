import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: [
		'./src/ingredient-category/infrastructure/ingredient-category-table.ts',
		'./src/ingredient/infrastructure/ingredient-table.ts',
	],
	out: './drizzle',
	dbCredentials: {
		url: process.env['DATABASE_URL'] ?? '',
	},
});
