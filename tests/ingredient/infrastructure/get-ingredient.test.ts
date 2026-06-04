import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;
let categoryId: string;

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();
	const res = await app.inject({
		method: 'POST',
		url: '/ingredient-categories',
		payload: { name: 'Spice' },
	});
	categoryId = res.json<{ id: string }>().id;
});

afterEach(async () => {
	await app.close();
});

describe('GET /ingredients/:id', () => {
	test('200 — returns ingredient with embedded category', async () => {
		const created = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Garlic', unit: 'cloves', categoryId },
		});
		const { id } = created.json<{ id: string }>();

		const res = await app.inject({ method: 'GET', url: `/ingredients/${id}` });
		expect(res.statusCode).toBe(200);
		const body = res.json<{
			id: string;
			name: string;
			unit: string;
			category: { id: string; name: string };
			createdAt: string;
			updatedAt: string;
		}>();
		expect(body.id).toBe(id);
		expect(body.name).toBe('Garlic');
		expect(body.unit).toBe('cloves');
		expect(body.category.id).toBe(categoryId);
		expect(body.category.name).toBe('Spice');
		expect(body.createdAt).toBeTruthy();
		expect(body.updatedAt).toBeTruthy();
	});

	test('200 — createdAt and updatedAt match submitted data', async () => {
		const created = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Salt', unit: 'g', categoryId },
		});
		const createdBody = created.json<{
			id: string;
			createdAt: string;
			updatedAt: string;
		}>();

		const res = await app.inject({
			method: 'GET',
			url: `/ingredients/${createdBody.id}`,
		});
		const fetchedBody = res.json<{ createdAt: string; updatedAt: string }>();
		expect(fetchedBody.createdAt).toBe(createdBody.createdAt);
		expect(fetchedBody.updatedAt).toBe(createdBody.updatedAt);
	});

	test('404 — unknown id', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/ingredients/01907f00-0000-7000-8000-000000000000',
		});
		expect(res.statusCode).toBe(404);
	});

	test('400 — malformed UUID', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/ingredients/not-a-uuid',
		});
		expect(res.statusCode).toBe(400);
	});
});
