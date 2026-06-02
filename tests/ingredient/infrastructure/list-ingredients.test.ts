import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;

async function create(
	app: FastifyInstance,
	data: { name: string; unit: string; category: string },
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
});

afterEach(async () => {
	await app.close();
});

describe('GET /ingredients', () => {
	test('returns all ingredients ordered by name ascending (case-insensitive)', async () => {
		await create(app, {
			name: 'Zucchini',
			unit: 'units',
			category: 'vegetable',
		});
		await create(app, { name: 'apple', unit: 'units', category: 'fruit' });
		await create(app, { name: 'Banana', unit: 'units', category: 'fruit' });

		const res = await app.inject({ method: 'GET', url: '/ingredients' });
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items.map((i) => i.name)).toEqual(['apple', 'Banana', 'Zucchini']);
	});

	test('category filter — exact match, case-insensitive', async () => {
		await create(app, { name: 'Carrot', unit: 'units', category: 'vegetable' });
		await create(app, { name: 'Orange', unit: 'units', category: 'Fruit' });
		await create(app, {
			name: 'Broccoli',
			unit: 'units',
			category: 'vegetable',
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

	test('name search — case-insensitive substring', async () => {
		await create(app, { name: 'Tomato', unit: 'units', category: 'vegetable' });
		await create(app, {
			name: 'Cherry Tomato',
			unit: 'units',
			category: 'vegetable',
		});
		await create(app, { name: 'Potato', unit: 'units', category: 'vegetable' });

		const res = await app.inject({
			method: 'GET',
			url: '/ingredients?name=tomat',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items.map((i) => i.name)).toEqual(['Cherry Tomato', 'Tomato']);
	});

	test('combined category + name filters (AND)', async () => {
		await create(app, { name: 'Tomato', unit: 'units', category: 'vegetable' });
		await create(app, {
			name: 'Tomato Sauce',
			unit: 'ml',
			category: 'condiment',
		});
		await create(app, { name: 'Potato', unit: 'units', category: 'vegetable' });

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
		await create(app, { name: 'Apple', unit: 'units', category: 'fruit' });
		await create(app, { name: 'Carrot', unit: 'units', category: 'vegetable' });

		const res = await app.inject({
			method: 'GET',
			url: '/ingredients?category=   ',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items).toHaveLength(2);
	});

	test('empty/whitespace-only name param = no filter', async () => {
		await create(app, { name: 'Apple', unit: 'units', category: 'fruit' });
		await create(app, { name: 'Carrot', unit: 'units', category: 'vegetable' });

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
			url: `/ingredients?category=${'x'.repeat(51)}`,
		});
		expect(res.statusCode).toBe(400);
	});
});
