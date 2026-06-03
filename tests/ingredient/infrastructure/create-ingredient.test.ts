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
		payload: { name: 'Vegetable' },
	});
	categoryId = res.json<{ id: string }>().id;
});

afterEach(async () => {
	await app.close();
});

describe('POST /ingredients', () => {
	test('201 — creates ingredient and returns full entity with embedded category', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units', categoryId },
		});
		expect(res.statusCode).toBe(201);
		const body = res.json<{
			id: string;
			name: string;
			unit: string;
			category: { id: string; name: string };
			createdAt: string;
			updatedAt: string;
		}>();
		expect(body.name).toBe('Tomato');
		expect(body.unit).toBe('units');
		expect(body.category.id).toBe(categoryId);
		expect(body.category.name).toBe('Vegetable');
		expect(body.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(body.createdAt).toBeTruthy();
		expect(body.updatedAt).toBeTruthy();
	});

	test('400 — missing required field', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — missing categoryId', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('422 — non-existent categoryId', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: {
				name: 'Tomato',
				unit: 'units',
				categoryId: '01907f00-0000-7000-8000-000000000099',
			},
		});
		expect(res.statusCode).toBe(422);
	});

	test('400 — empty name after trimming', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: '   ', unit: 'units', categoryId },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — whitespace-only unit', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: '  ', categoryId },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — name exceeds max length', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'a'.repeat(101), unit: 'units', categoryId },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — name contains line break', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tom\nato', unit: 'units', categoryId },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — name contains control character', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tom\x00ato', unit: 'units', categoryId },
		});
		expect(res.statusCode).toBe(400);
	});

	test('409 — duplicate name (case-insensitive)', async () => {
		await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units', categoryId },
		});
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'TOMATO', unit: 'kg', categoryId },
		});
		expect(res.statusCode).toBe(409);
	});

	test('409 — duplicate name after trim', async () => {
		await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units', categoryId },
		});
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: '  tomato  ', unit: 'kg', categoryId },
		});
		expect(res.statusCode).toBe(409);
	});

	test('leading/trailing whitespace is trimmed', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: '  Olive Oil  ', unit: '  ml  ', categoryId },
		});
		expect(res.statusCode).toBe(201);
		const body = res.json<{ name: string; unit: string }>();
		expect(body.name).toBe('Olive Oil');
		expect(body.unit).toBe('ml');
	});

	test('names differing only by internal whitespace are distinct (FR-017)', async () => {
		const res1 = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Olive Oil', unit: 'ml', categoryId },
		});
		expect(res1.statusCode).toBe(201);
		const res2 = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Olive  Oil', unit: 'ml', categoryId },
		});
		expect(res2.statusCode).toBe(201);
	});
});
