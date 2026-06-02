import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;

async function createIngredient(
	app: FastifyInstance,
	data: { name: string; unit: string; category: string },
) {
	const res = await app.inject({
		method: 'POST',
		url: '/ingredients',
		payload: data,
	});
	return res.json<{ id: string }>();
}

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();
});

afterEach(async () => {
	await app.close();
});

describe('DELETE /ingredients/:id', () => {
	test('204 — deletes ingredient successfully', async () => {
		const { id } = await createIngredient(app, {
			name: 'Thyme',
			unit: 'g',
			category: 'herb',
		});

		const res = await app.inject({
			method: 'DELETE',
			url: `/ingredients/${id}`,
		});
		expect(res.statusCode).toBe(204);
		expect(res.body).toBe('');
	});

	test('404 — subsequent GET after delete returns 404', async () => {
		const { id } = await createIngredient(app, {
			name: 'Sage',
			unit: 'g',
			category: 'herb',
		});

		await app.inject({ method: 'DELETE', url: `/ingredients/${id}` });

		const res = await app.inject({ method: 'GET', url: `/ingredients/${id}` });
		expect(res.statusCode).toBe(404);
	});

	test('404 — delete unknown id', async () => {
		const res = await app.inject({
			method: 'DELETE',
			url: '/ingredients/01907f00-0000-7000-8000-000000000000',
		});
		expect(res.statusCode).toBe(404);
	});

	test('400 — malformed UUID', async () => {
		const res = await app.inject({
			method: 'DELETE',
			url: '/ingredients/not-a-uuid',
		});
		expect(res.statusCode).toBe(400);
	});
});
