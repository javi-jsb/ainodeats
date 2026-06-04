import type { FastifyInstance } from 'fastify';
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

describe('PATCH /ingredient-categories/:id', () => {
	test('200 — valid rename returns updated { id, name }', async () => {
		const cat = await createCategory(app, 'Grain');

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredient-categories/${cat.id}`,
			payload: { name: 'Cereal' },
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{ id: string; name: string }>();
		expect(body.id).toBe(cat.id);
		expect(body.name).toBe('Cereal');
	});

	test('409 — rename to existing name (case-insensitive)', async () => {
		const cat1 = await createCategory(app, 'Dairy');
		const cat2 = await createCategory(app, 'Grain');

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredient-categories/${cat2.id}`,
			payload: { name: 'DAIRY' },
		});
		expect(res.statusCode).toBe(409);
		void cat1;
	});

	test('404 — unknown id', async () => {
		const res = await app.inject({
			method: 'PATCH',
			url: '/ingredient-categories/01907f00-0000-7000-8000-000000000000',
			payload: { name: 'Something' },
		});
		expect(res.statusCode).toBe(404);
	});

	test('400 — empty name', async () => {
		const cat = await createCategory(app, 'Dairy');

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredient-categories/${cat.id}`,
			payload: { name: '' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — unknown field is rejected (additionalProperties: false)', async () => {
		const cat = await createCategory(app, 'Dairy');

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredient-categories/${cat.id}`,
			payload: { name: 'Cereal', color: 'red' },
		});
		expect(res.statusCode).toBe(400);
	});
});
