import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/ingredient/infrastructure/ingredient-table.ts',
	out: './drizzle',
	dbCredentials: {
		url: process.env['DATABASE_URL'] ?? '',
	},
});
