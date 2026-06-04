import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;
let herbId: string;
let spiceId: string;

async function createIngredient(
	app: FastifyInstance,
	data: { name: string; unit: string; categoryId: string },
) {
	const res = await app.inject({
		method: 'POST',
		url: '/ingredients',
		payload: data,
	});
	return res.json<{
		id: string;
		name: string;
		unit: string;
		category: { id: string; name: string };
		createdAt: string;
		updatedAt: string;
	}>();
}

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();

	const herb = await app.inject({
		method: 'POST',
		url: '/ingredient-categories',
		payload: { name: 'Herb' },
	});
	herbId = herb.json<{ id: string }>().id;

	const spice = await app.inject({
		method: 'POST',
		url: '/ingredient-categories',
		payload: { name: 'Spice' },
	});
	spiceId = spice.json<{ id: string }>().id;
});

afterEach(async () => {
	await app.close();
});

describe('PATCH /ingredients/:id', () => {
	test('200 — partial update changes only supplied fields', async () => {
		const created = await createIngredient(app, {
			name: 'Tomato',
			unit: 'units',
			categoryId: herbId,
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { unit: 'kg' },
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{
			id: string;
			name: string;
			unit: string;
			category: { id: string; name: string };
		}>();
		expect(body.id).toBe(created.id);
		expect(body.name).toBe('Tomato');
		expect(body.unit).toBe('kg');
		expect(body.category.id).toBe(herbId);
	});

	test('200 — updatedAt advances after update', async () => {
		const created = await createIngredient(app, {
			name: 'Basil',
			unit: 'g',
			categoryId: herbId,
		});

		await new Promise((resolve) => setTimeout(resolve, 10));

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { name: 'Fresh Basil' },
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{ updatedAt: string }>();
		expect(new Date(body.updatedAt).getTime()).toBeGreaterThanOrEqual(
			new Date(created.updatedAt).getTime(),
		);
	});

	test('200 — categoryId updated, category embedded correctly', async () => {
		const created = await createIngredient(app, {
			name: 'Basil',
			unit: 'g',
			categoryId: herbId,
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { categoryId: spiceId },
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{ category: { id: string; name: string } }>();
		expect(body.category.id).toBe(spiceId);
		expect(body.category.name).toBe('Spice');
	});

	test('200 — categoryId omitted → category reference unchanged', async () => {
		const created = await createIngredient(app, {
			name: 'Basil',
			unit: 'g',
			categoryId: herbId,
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { name: 'Sweet Basil' },
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{ category: { id: string } }>();
		expect(body.category.id).toBe(herbId);
	});

	test('422 — non-existent categoryId', async () => {
		const created = await createIngredient(app, {
			name: 'Thyme',
			unit: 'g',
			categoryId: herbId,
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { categoryId: '01907f00-0000-7000-8000-000000000099' },
		});
		expect(res.statusCode).toBe(422);
	});

	test('404 — unknown id', async () => {
		const res = await app.inject({
			method: 'PATCH',
			url: '/ingredients/01907f00-0000-7000-8000-000000000000',
			payload: { unit: 'kg' },
		});
		expect(res.statusCode).toBe(404);
	});

	test('400 — unknown field is rejected (additionalProperties: false)', async () => {
		const created = await createIngredient(app, {
			name: 'Tomato',
			unit: 'units',
			categoryId: herbId,
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { unit: 'kg', foo: 123 },
		});
		expect(res.statusCode).toBe(400);
	});

	test('409 — rename to existing name (case-insensitive)', async () => {
		await createIngredient(app, {
			name: 'Tomato',
			unit: 'units',
			categoryId: herbId,
		});
		const second = await createIngredient(app, {
			name: 'Potato',
			unit: 'units',
			categoryId: herbId,
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${second.id}`,
			payload: { name: 'TOMATO' },
		});
		expect(res.statusCode).toBe(409);
	});

	test('400 — empty payload (no fields)', async () => {
		const created = await createIngredient(app, {
			name: 'Tomato',
			unit: 'units',
			categoryId: herbId,
		});
		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: {},
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — empty name after trim', async () => {
		const created = await createIngredient(app, {
			name: 'Tomato',
			unit: 'units',
			categoryId: herbId,
		});
		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { name: '   ' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — malformed UUID', async () => {
		const res = await app.inject({
			method: 'PATCH',
			url: '/ingredients/not-a-uuid',
			payload: { unit: 'kg' },
		});
		expect(res.statusCode).toBe(400);
	});
});
