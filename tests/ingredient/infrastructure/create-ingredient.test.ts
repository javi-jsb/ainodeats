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

describe('POST /ingredients', () => {
	test('201 — creates ingredient and returns full entity', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units', category: 'vegetable' },
		});
		expect(res.statusCode).toBe(201);
		const body = res.json<{
			id: string;
			name: string;
			unit: string;
			category: string;
			createdAt: string;
			updatedAt: string;
		}>();
		expect(body.name).toBe('Tomato');
		expect(body.unit).toBe('units');
		expect(body.category).toBe('vegetable');
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

	test('400 — empty name after trimming', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: '   ', unit: 'units', category: 'vegetable' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — whitespace-only unit', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: '  ', category: 'vegetable' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — name exceeds max length', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'a'.repeat(101), unit: 'units', category: 'vegetable' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — name contains line break', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tom\nato', unit: 'units', category: 'vegetable' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('400 — name contains control character', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tom\x00ato', unit: 'units', category: 'vegetable' },
		});
		expect(res.statusCode).toBe(400);
	});

	test('409 — duplicate name (case-insensitive)', async () => {
		await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units', category: 'vegetable' },
		});
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'TOMATO', unit: 'kg', category: 'fruit' },
		});
		expect(res.statusCode).toBe(409);
	});

	test('409 — duplicate name after trim', async () => {
		await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Tomato', unit: 'units', category: 'vegetable' },
		});
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: '  tomato  ', unit: 'kg', category: 'fruit' },
		});
		expect(res.statusCode).toBe(409);
	});

	test('leading/trailing whitespace is trimmed', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: '  Olive Oil  ', unit: '  ml  ', category: '  fat  ' },
		});
		expect(res.statusCode).toBe(201);
		const body = res.json<{ name: string; unit: string; category: string }>();
		expect(body.name).toBe('Olive Oil');
		expect(body.unit).toBe('ml');
		expect(body.category).toBe('fat');
	});

	test('names differing only by internal whitespace are distinct (FR-017)', async () => {
		const res1 = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Olive Oil', unit: 'ml', category: 'fat' },
		});
		expect(res1.statusCode).toBe(201);
		const res2 = await app.inject({
			method: 'POST',
			url: '/ingredients',
			payload: { name: 'Olive  Oil', unit: 'ml', category: 'fat' },
		});
		expect(res2.statusCode).toBe(201);
	});
});
