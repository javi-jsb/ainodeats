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
	return res.json<{
		id: string;
		name: string;
		unit: string;
		category: string;
		createdAt: string;
		updatedAt: string;
	}>();
}

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();
});

afterEach(async () => {
	await app.close();
});

describe('PATCH /ingredients/:id', () => {
	test('200 — partial update changes only supplied fields', async () => {
		const created = await createIngredient(app, {
			name: 'Tomato',
			unit: 'units',
			category: 'vegetable',
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
			category: string;
			updatedAt: string;
		}>();
		expect(body.id).toBe(created.id);
		expect(body.name).toBe('Tomato');
		expect(body.unit).toBe('kg');
		expect(body.category).toBe('vegetable');
	});

	test('200 — updatedAt advances after update', async () => {
		const created = await createIngredient(app, {
			name: 'Basil',
			unit: 'g',
			category: 'herb',
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

	test('200 — category updated, other fields unchanged', async () => {
		const created = await createIngredient(app, {
			name: 'Basil',
			unit: 'g',
			category: 'herb',
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { category: 'spice' },
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{ name: string; unit: string; category: string }>();
		expect(body.category).toBe('spice');
		expect(body.name).toBe('Basil');
		expect(body.unit).toBe('g');
	});

	test('200 — only name updated, unit and category unchanged', async () => {
		const created = await createIngredient(app, {
			name: 'Basil',
			unit: 'g',
			category: 'herb',
		});

		const res = await app.inject({
			method: 'PATCH',
			url: `/ingredients/${created.id}`,
			payload: { name: 'Sweet Basil' },
		});
		expect(res.statusCode).toBe(200);
		const body = res.json<{ unit: string; category: string }>();
		expect(body.unit).toBe('g');
		expect(body.category).toBe('herb');
	});

	test('404 — unknown id', async () => {
		const res = await app.inject({
			method: 'PATCH',
			url: '/ingredients/01907f00-0000-7000-8000-000000000000',
			payload: { unit: 'kg' },
		});
		expect(res.statusCode).toBe(404);
	});

	test('409 — rename to existing name (case-insensitive)', async () => {
		await createIngredient(app, {
			name: 'Tomato',
			unit: 'units',
			category: 'vegetable',
		});
		const second = await createIngredient(app, {
			name: 'Potato',
			unit: 'units',
			category: 'vegetable',
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
			category: 'vegetable',
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
			category: 'vegetable',
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
