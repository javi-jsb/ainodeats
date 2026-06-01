import { afterEach, describe, expect, test } from 'vitest';
import { getDatabaseUrl } from '../../../src/shared/infrastructure/config.js';

describe('getDatabaseUrl', () => {
	const original = process.env['DATABASE_URL'];

	afterEach(() => {
		if (original === undefined) {
			delete process.env['DATABASE_URL'];
		} else {
			process.env['DATABASE_URL'] = original;
		}
	});

	test('returns DATABASE_URL when set', () => {
		process.env['DATABASE_URL'] = 'postgres://user:pass@localhost:5432/db';
		expect(getDatabaseUrl()).toBe('postgres://user:pass@localhost:5432/db');
	});

	test('throws when DATABASE_URL is not set', () => {
		delete process.env['DATABASE_URL'];
		expect(() => getDatabaseUrl()).toThrow(
			'DATABASE_URL environment variable is required but not set',
		);
	});
});
