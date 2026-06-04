import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();
});

afterEach(async () => {
	await app.close();
});

describe('GET /ingredient-categories/:id', () => {
	test('200 — returns correct { id, name }', async () => {
		const created = await app.inject({
			method: 'POST',
			url: '/ingredient-categories',
			payload: { name: 'Vegetable' },
		});
		const { id } = created.json<{ id: string }>();

		const res = await app.inject({
			method: 'GET',
			url: `/ingredient-categories/${id}`,
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{ id: string; name: string }>();
		expect(body.id).toBe(id);
		expect(body.name).toBe('Vegetable');
	});

	test('404 — unknown valid UUID', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/ingredient-categories/01907f00-0000-7000-8000-000000000000',
		});
		expect(res.statusCode).toBe(404);
	});

	test('400 — malformed UUID in path', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/ingredient-categories/not-a-uuid',
		});
		expect(res.statusCode).toBe(400);
	});
});
