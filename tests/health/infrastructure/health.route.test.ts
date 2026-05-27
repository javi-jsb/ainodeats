import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { buildApp } from '../../../src/shared/infrastructure/app.js';

let app: FastifyInstance;

beforeEach(async () => {
	app = await buildApp();
});

afterEach(async () => {
	await app.close();
});

test("GET /health returns 200 with {status:'ok'}", async () => {
	const response = await app.inject({ method: 'GET', url: '/health' });
	expect(response.statusCode).toBe(200);
	expect(response.json()).toEqual({ status: 'ok' });
});
