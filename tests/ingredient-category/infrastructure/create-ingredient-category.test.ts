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

describe('POST /ingredient-categories', () => {
	test('201 — creates category and returns { id, name }', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredient-categories',
			payload: { name: 'Dairy' },
		});
		expect(res.statusCode).toBe(201);
		const body = res.json<{ id: string; name: string }>();
		expect(body.name).toBe('Dairy');
		expect(body.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
	});

	test('409 — duplicate name (case-insensitive)', async () => {
		await app.inject({
			method: 'POST',
			url: '/ingredient-categories',
			payload: { name: 'Dairy' },
		});
		const res = await app.inject({
			method: 'POST',
			url: '/ingredient-categories',
			payload: { name: 'DAIRY' },
		});
		expect(res.statusCode).toBe(409);
	});

	test('400 — empty string name', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredient-categories',
			payload: { name: '' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — missing name field', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredient-categories',
			payload: {},
		});
		expect(res.statusCode).toBe(400);
	});
});
