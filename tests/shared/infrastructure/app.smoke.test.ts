import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { buildTestApp } from '../../helpers/db.js';

let app: FastifyInstance;

beforeEach(async () => {
	app = await buildTestApp();
});

afterEach(async () => {
	await app.close();
});

test('GET /health returns 200', async () => {
	const res = await app.inject({ method: 'GET', url: '/health' });
	expect(res.statusCode).toBe(200);
	expect(res.json()).toEqual({ status: 'ok' });
});

test('GET /docs returns 200', async () => {
	const res = await app.inject({ method: 'GET', url: '/docs' });
	expect(res.statusCode).toBe(200);
});

test('GET /docs/json returns OpenAPI document', async () => {
	const res = await app.inject({ method: 'GET', url: '/docs/json' });
	expect(res.statusCode).toBe(200);
	const doc = res.json<{ openapi: string; info: { title: string } }>();
	expect(doc.openapi).toMatch(/^3\./);
	expect(doc.info.title).toBe('ainodeats');
});
