import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { buildApp } from '../../src/shared/infrastructure/app.js';

export async function buildTestApp(): Promise<FastifyInstance> {
	return buildApp();
}

export async function truncateAll(): Promise<void> {
	const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
	try {
		const db = drizzle(pool);
		await db.execute(
			sql`TRUNCATE TABLE ingredients, ingredient_categories RESTART IDENTITY CASCADE`,
		);
	} finally {
		await pool.end();
	}
}
