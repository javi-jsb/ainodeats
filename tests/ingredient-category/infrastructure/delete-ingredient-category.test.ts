import type { FastifyInstance } from 'fastify';
import { uuidv7 } from 'uuidv7';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;

async function createCategory(app: FastifyInstance, name: string) {
	const res = await app.inject({
		method: 'POST',
		url: '/ingredient-categories',
		payload: { name },
	});
	return res.json<{ id: string; name: string }>();
}

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();
});

afterEach(async () => {
	await app.close();
});

describe('DELETE /ingredient-categories/:id', () => {
	test('204 — unreferenced category deleted', async () => {
		const cat = await createCategory(app, 'Spice');

		const res = await app.inject({
			method: 'DELETE',
			url: `/ingredient-categories/${cat.id}`,
		});
		expect(res.statusCode).toBe(204);
	});

	test('409 — category referenced by an ingredient cannot be deleted', async () => {
		const cat = await createCategory(app, 'Herb');

		const { sql } = await import('drizzle-orm');
		await app.db.execute(
			sql`INSERT INTO ingredients (id, name, unit, category_id)
				VALUES (${uuidv7()}::uuid, 'Basil', 'g', ${cat.id}::uuid)`,
		);

		const res = await app.inject({
			method: 'DELETE',
			url: `/ingredient-categories/${cat.id}`,
		});
		expect(res.statusCode).toBe(409);
	});

	test('404 — unknown id', async () => {
		const res = await app.inject({
			method: 'DELETE',
			url: '/ingredient-categories/01907f00-0000-7000-8000-000000000000',
		});
		expect(res.statusCode).toBe(404);
	});
});
