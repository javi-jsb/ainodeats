import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
	IngredientNameConflict,
	IngredientNotFound,
} from '../../../src/ingredient/domain/errors.js';
import { ValidationError } from '../../../src/ingredient/domain/ingredient.js';
import { handleError } from '../../../src/shared/infrastructure/app.js';
import { buildTestApp, truncateAll } from '../../helpers/db.js';

let app: FastifyInstance;

beforeEach(async () => {
	app = await buildTestApp();
	await truncateAll();
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

test('GET /docs/json returns OpenAPI document with all ingredient paths', async () => {
	const res = await app.inject({ method: 'GET', url: '/docs/json' });
	expect(res.statusCode).toBe(200);
	const doc = res.json<{
		openapi: string;
		info: { title: string };
		paths: Record<string, unknown>;
	}>();
	expect(doc.openapi).toMatch(/^3\./);
	expect(doc.info.title).toBe('ainodeats');
	expect(doc.paths['/ingredients']).toBeTruthy();
	expect(doc.paths['/ingredients/{id}']).toBeTruthy();
});

describe('handleError — unit coverage for error handler branches', () => {
	function makeReply() {
		const sent: { status: number; body: unknown } = { status: 0, body: null };
		const reply = {
			log: { error: () => {} },
			status(code: number) {
				sent.status = code;
				return {
					send: (body: unknown) => {
						sent.body = body;
					},
				};
			},
		};
		return { reply, sent };
	}

	function makeRequest() {
		return {} as Parameters<typeof handleError>[1];
	}

	test('schema validation error (validation array) → 400', () => {
		const { reply, sent } = makeReply();
		const err = Object.assign(new Error('bad'), {
			validation: [{ message: 'bad' }],
		});
		handleError(
			err as Parameters<typeof handleError>[0],
			makeRequest(),
			reply as unknown as Parameters<typeof handleError>[2],
		);
		expect(sent.status).toBe(400);
	});

	test('ValidationError (statusCode 400) → 400', () => {
		const { reply, sent } = makeReply();
		handleError(
			new ValidationError('empty'),
			makeRequest(),
			reply as unknown as Parameters<typeof handleError>[2],
		);
		expect(sent.status).toBe(400);
	});

	test('IngredientNotFound (statusCode 404) → 404', () => {
		const { reply, sent } = makeReply();
		handleError(
			new IngredientNotFound('abc'),
			makeRequest(),
			reply as unknown as Parameters<typeof handleError>[2],
		);
		expect(sent.status).toBe(404);
	});

	test('IngredientNameConflict (statusCode 409) → 409', () => {
		const { reply, sent } = makeReply();
		handleError(
			new IngredientNameConflict('foo'),
			makeRequest(),
			reply as unknown as Parameters<typeof handleError>[2],
		);
		expect(sent.status).toBe(409);
	});

	test('unexpected error → 500', () => {
		const { reply, sent } = makeReply();
		handleError(
			new Error('boom'),
			makeRequest(),
			reply as unknown as Parameters<typeof handleError>[2],
		);
		expect(sent.status).toBe(500);
	});
});
