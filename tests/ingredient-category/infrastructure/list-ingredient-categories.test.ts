import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;

async function createCategory(app: FastifyInstance, name: string) {
	return app.inject({
		method: 'POST',
		url: '/ingredient-categories',
		payload: { name },
	});
}

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();
});

afterEach(async () => {
	await app.close();
});

describe('GET /ingredient-categories', () => {
	test('200 — empty array when no categories exist', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/ingredient-categories',
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual([]);
	});

	test('200 — returns categories ordered A→Z case-insensitively', async () => {
		await createCategory(app, 'Grain');
		await createCategory(app, 'dairy');
		await createCategory(app, 'Fruit');

		const res = await app.inject({
			method: 'GET',
			url: '/ingredient-categories',
		});
		expect(res.statusCode).toBe(200);
		const items = res.json<{ name: string }[]>();
		expect(items.map((i) => i.name)).toEqual(['dairy', 'Fruit', 'Grain']);
	});
});
