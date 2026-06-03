import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;
let fruitId: string;
let vegetableId: string;

async function create(
	app: FastifyInstance,
	data: { name: string; unit: string; categoryId: string },
) {
	return app.inject({
		method: 'POST',
		url: '/ingredients',
		payload: data,
	});
}

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();

	const fruit = await app.inject({
		method: 'POST',
		url: '/ingredient-categories',
		payload: { name: 'Fruit' },
	});
	fruitId = fruit.json<{ id: string }>().id;

	const vegetable = await app.inject({
		method: 'POST',
		url: '/ingredient-categories',
		payload: { name: 'Vegetable' },
	});
	vegetableId = vegetable.json<{ id: string }>().id;
});

afterEach(async () => {
	await app.close();
});

describe('GET /ingredients', () => {
	test('returns all ingredients ordered by name ascending (case-insensitive)', async () => {
		await create(app, {
			name: 'Zucchini',
			unit: 'units',
			categoryId: vegetableId,
		});
		await create(app, { name: 'apple', unit: 'units', categoryId: fruitId });
		await create(app, { name: 'Banana', unit: 'units', categoryId: fruitId });

		const res = await app.inject({ method: 'GET', url: '/ingredients' });
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items.map((i) => i.name)).toEqual(['apple', 'Banana', 'Zucchini']);
	});

	test('category filter — exact match by category name, case-insensitive (JOIN-based)', async () => {
		await create(app, {
			name: 'Carrot',
			unit: 'units',
			categoryId: vegetableId,
		});
		await create(app, { name: 'Orange', unit: 'units', categoryId: fruitId });
		await create(app, {
			name: 'Broccoli',
			unit: 'units',
			categoryId: vegetableId,
		});

		const res = await app.inject({
			method: 'GET',
			url: '/ingredients?category=VEGETABLE',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items).toHaveLength(2);
		expect(items.map((i) => i.name)).toEqual(['Broccoli', 'Carrot']);
	});

	test('each ingredient response embeds category { id, name }', async () => {
		await create(app, { name: 'Apple', unit: 'units', categoryId: fruitId });

		const res = await app.inject({ method: 'GET', url: '/ingredients' });
		expect(res.statusCode).toBe(200);
		const items = res.json<{ category: { id: string; name: string } }[]>();
		expect(items[0].category.id).toBe(fruitId);
		expect(items[0].category.name).toBe('Fruit');
	});

	test('name search — case-insensitive substring', async () => {
		await create(app, {
			name: 'Tomato',
			unit: 'units',
			categoryId: vegetableId,
		});
		await create(app, {
			name: 'Cherry Tomato',
			unit: 'units',
			categoryId: vegetableId,
		});
		await create(app, {
			name: 'Potato',
			unit: 'units',
			categoryId: vegetableId,
		});

		const res = await app.inject({
			method: 'GET',
			url: '/ingredients?name=tomat',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items.map((i) => i.name)).toEqual(['Cherry Tomato', 'Tomato']);
	});

	test('combined category + name filters (AND)', async () => {
		await create(app, {
			name: 'Tomato',
			unit: 'units',
			categoryId: vegetableId,
		});
		const condimentRes = await app.inject({
			method: 'POST',
			url: '/ingredient-categories',
			payload: { name: 'Condiment' },
		});
		const condimentId = condimentRes.json<{ id: string }>().id;
		await create(app, {
			name: 'Tomato Sauce',
			unit: 'ml',
			categoryId: condimentId,
		});
		await create(app, {
			name: 'Potato',
			unit: 'units',
			categoryId: vegetableId,
		});

		const res = await app.inject({
			method: 'GET',
			url: '/ingredients?category=vegetable&name=to',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items.map((i) => i.name)).toEqual(['Potato', 'Tomato']);
	});

	test('empty catalog returns empty array', async () => {
		const res = await app.inject({ method: 'GET', url: '/ingredients' });
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual([]);
	});

	test('empty/whitespace-only category param = no filter', async () => {
		await create(app, { name: 'Apple', unit: 'units', categoryId: fruitId });
		await create(app, {
			name: 'Carrot',
			unit: 'units',
			categoryId: vegetableId,
		});

		const res = await app.inject({
			method: 'GET',
			url: '/ingredients?category=   ',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items).toHaveLength(2);
	});

	test('empty/whitespace-only name param = no filter', async () => {
		await create(app, { name: 'Apple', unit: 'units', categoryId: fruitId });
		await create(app, {
			name: 'Carrot',
			unit: 'units',
			categoryId: vegetableId,
		});

		const res = await app.inject({
			method: 'GET',
			url: '/ingredients?name=   ',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items).toHaveLength(2);
	});

	test('400 — category param exceeds maxLength', async () => {
		const res = await app.inject({
			method: 'GET',
			url: `/ingredients?category=${'x'.repeat(101)}`,
		});
		expect(res.statusCode).toBe(400);
	});
});
